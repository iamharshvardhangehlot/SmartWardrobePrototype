import logging
import os
import random
from datetime import datetime

import requests
from django.conf import settings
from django.core.files import File
from django.core.files.base import ContentFile
from django.db import transaction
from django.db.models import F, Q
from django.utils import timezone

from .helpers import get_color_name, get_weather_context, reverse_geocode_city
from .models import Garment, Outfit, ScheduledOutfit, TryOnJob, UserProfile
from .async_jobs import submit_job
from .utils import analyze_garment, analyze_user_season, get_season_details, is_season_match
from .vton_service import generate_tryon

logger = logging.getLogger(__name__)


class ProfileService:
    """Profile lifecycle and AI season analysis."""

    @staticmethod
    def get_or_create(user):
        profile, _ = UserProfile.objects.get_or_create(user=user)
        return profile

    @staticmethod
    def update_from_form(form, profile):
        profile = form.save(commit=False)
        selfie_changed = "selfie" in form.changed_data and form.cleaned_data.get("selfie")
        undertone_changed = "skin_undertone" in form.changed_data

        profile.save()
        if profile.selfie and (selfie_changed or undertone_changed):
            analysis = analyze_user_season(profile.selfie.path, profile.skin_undertone)
            profile.season = analysis.get("season_type")
            profile.contrast_level = analysis.get("contrast_level")
            profile.save(update_fields=["season", "contrast_level"])
        return profile

    @staticmethod
    def update_location(profile, city=None, timezone_name=None):
        updated = False
        if city and city != profile.city:
            profile.city = city
            updated = True
        if timezone_name and timezone_name != profile.timezone:
            profile.timezone = timezone_name
            updated = True
        if updated:
            profile.save(update_fields=["city", "timezone"])
        return profile


class GarmentService:
    """Garment creation and AI enrichment."""

    @staticmethod
    def _remove_background(image_file):
        if os.getenv("DISABLE_REMBG", "").lower() in {"1", "true", "yes"}:
            logger.info("DISABLE_REMBG set; skipping background removal.")
            return None
        try:
            image_file.seek(0)
        except Exception:
            pass
        try:
            from rembg import remove
        except Exception:
            logger.warning("rembg is unavailable; skipping background removal.")
            return None
        try:
            input_bytes = image_file.read()
            output_bytes = remove(input_bytes)
            return output_bytes
        except Exception:
            logger.exception("Background removal failed.")
            return None

    FILTER_MAP = {
        "shorts": Q(category__icontains="short"),
        "pants": Q(category__icontains="pant") | Q(category__icontains="trouser"),
        "tops": Q(category__icontains="top")
        | Q(category__icontains="shirt")
        | Q(category__icontains="t-shirt")
        | Q(category__icontains="blazer")
        | Q(category__icontains="jacket")
        | Q(category__icontains="layer"),
        "graphic": Q(detected_material__icontains="graphic")
        | Q(detected_material__icontains="logo")
        | Q(name__icontains="graphic"),
        "jeans": Q(category__icontains="jean") | Q(name__icontains="jean"),
        "solids": Q(detected_material__icontains="solid") | Q(name__icontains="solid"),
    }

    TOP_KEYWORDS = ["top", "shirt", "t-shirt", "blazer", "jacket", "layer", "dress"]
    BOTTOM_KEYWORDS = ["bottom", "jean", "trouser", "pant", "short", "skirt"]

    CATEGORY_NORMALIZATION = [
        ("dress", "Dress"),
        ("skirt", "Bottom"),
        ("jean", "Bottom"),
        ("trouser", "Bottom"),
        ("pant", "Bottom"),
        ("short", "Bottom"),
        ("shirt", "Top"),
        ("t-shirt", "Top"),
        ("tee", "Top"),
        ("top", "Top"),
        ("blazer", "Layer"),
        ("jacket", "Layer"),
        ("coat", "Layer"),
        ("layer", "Layer"),
        ("hoodie", "Layer"),
        ("sweater", "Layer"),
        ("shoe", "Shoes"),
    ]

    @staticmethod
    def _normalize_category(raw_category):
        if not raw_category:
            return ""
        text = raw_category.strip().lower()
        for keyword, normalized in GarmentService.CATEGORY_NORMALIZATION:
            if keyword in text:
                return normalized
        return ""

    @staticmethod
    def _keyword_filter(keywords):
        query = Q()
        for keyword in keywords:
            query |= Q(category__icontains=keyword)
        return query

    @staticmethod
    def filter_for_user(user, filters=None, keywords=None):
        qs = Garment.objects.for_user(user).active()
        if keywords:
            qs = qs.filter(GarmentService._keyword_filter(keywords))
        if filters:
            filter_query = Q()
            for tag in filters:
                tag = tag.lower().strip()
                if tag in GarmentService.FILTER_MAP:
                    filter_query |= GarmentService.FILTER_MAP[tag]
            if filter_query:
                qs = qs.filter(filter_query)
        return qs

    @staticmethod
    def _apply_ai_fields(garment_id):
        garment = Garment.objects.filter(id=garment_id).first()
        if not garment:
            return
        try:
            garment.ai_status = "processing"
            garment.save(update_fields=["ai_status"])
            ai_data = analyze_garment(garment.image.path)
            normalized = GarmentService._normalize_category(ai_data.get("category", ""))
            garment.category = normalized or "Top"
            garment.color_hex = ai_data.get("color_hex", "#FFFFFF")
            garment.detected_material = ai_data.get("detected_material", "Unknown")
            garment.name = ai_data.get("name", "New Item")
            if not garment.fabric_type:
                garment.fabric_type = None
            garment.ai_status = "complete"
            garment.save()
        except Exception:
            logger.exception("Garment AI analysis failed.")
            garment.ai_status = "failed"
            garment.save(update_fields=["ai_status"])

    @staticmethod
    def create_from_form(form, user):
        garment = form.save(commit=False)
        garment.owner = user
        if garment.image:
            output_bytes = GarmentService._remove_background(garment.image)
            if output_bytes:
                base = os.path.splitext(os.path.basename(garment.image.name))[0]
                new_name = f"{base}_nobg.png"
                garment.image.save(new_name, ContentFile(output_bytes), save=False)
        garment.save()
        submit_job(GarmentService._apply_ai_fields, garment.id)
        return garment

    @staticmethod
    def bulk_create_from_images(images, user, price, fabric_type=None):
        created = 0
        for image in images:
            processed = GarmentService._remove_background(image)
            if processed:
                base = os.path.splitext(os.path.basename(image.name))[0]
                image = ContentFile(processed)
                image.name = f"{base}_nobg.png"
            garment = Garment(
                owner=user,
                image=image,
                purchase_price=price,
                fabric_type=fabric_type or None,
            )
            garment.save()
            submit_job(GarmentService._apply_ai_fields, garment.id)
            created += 1
        return created


class DashboardService:
    """Data aggregation for the main wardrobe dashboard."""

    @staticmethod
    def build_context(user, filters=None):
        profile = ProfileService.get_or_create(user)
        clothes = list(
            GarmentService.filter_for_user(user, filters=filters).order_by("-created_at")
        )
        total_value = 0
        for item in clothes:
            total_value += item.purchase_price or 0
            is_match, reason = is_season_match(item.color_hex, profile.season)
            item.is_match = is_match
            item.match_reason = reason
        season_details = get_season_details(profile.season)

        return {
            "profile": profile,
            "clothes": clothes,
            "total_value": total_value,
            "item_count": len(clothes),
            "season_details": season_details,
        }


class WeatherService:
    """Small wrapper around weather context for UI."""

    @staticmethod
    def get_speech(city=None):
        city = city.strip() if city else None
        context = get_weather_context(city=city)
        if context.get("temp_c") is None:
            return "the weather is a mystery today, so dress comfortably."

        return (
            f"{context.get('condition', 'Pleasant').lower()} at "
            f"{context.get('temp_c')} degrees with {context.get('description')}."
        )

    @staticmethod
    def get_context(city=None):
        city = city.strip() if city else None
        return get_weather_context(city=city)


class LocationService:
    """Resolve location details from coordinates."""

    @staticmethod
    def resolve_city(lat, lon):
        return reverse_geocode_city(lat, lon)


class OutfitService:
    """Outfit selection logic for moods."""

    MOOD_RULES = {
        "Formal": (["Top", "Layer", "Dress"], ["Bottom"]),
        "Sport": (["Top"], ["Bottom"]),
        "Party": (["Top", "Layer", "Dress"], ["Bottom"]),
        "Casual": (["Top", "Layer", "Dress"], ["Bottom"]),
    }

    @staticmethod
    def _weather_weight(item, weather_context):
        if not weather_context:
            return 1

        temp = weather_context.get("temp_c")
        desc = (weather_context.get("description") or "").lower()
        is_rain = any(word in desc for word in ["rain", "drizzle", "shower", "storm"])

        weight = 1
        category_text = f"{item.category or ''} {item.name or ''}".lower()
        fabric = (item.fabric_type or "").lower()

        if temp is not None and temp > 30:
            if any(word in category_text for word in ["blazer", "hoodie", "jacket", "coat", "layer", "sweater"]):
                return 0
            if "cotton" in fabric or "linen" in fabric:
                weight *= 1.5

        if temp is not None and temp < 15:
            if any(word in category_text for word in ["short", "sleeveless", "tank"]):
                return 0
            if "wool" in fabric or "denim" in fabric:
                weight *= 1.5
            if "layer" in category_text:
                weight *= 1.3

        if is_rain:
            if "suede" in fabric or "leather" in fabric:
                return 0
            if "polyester" in fabric or "nylon" in fabric or "synthetic" in fabric:
                weight *= 1.4
            if item.color_hex:
                try:
                    h = item.color_hex.lstrip("#")
                    r, g, b = tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
                    if (r + g + b) / 3 < 90:
                        weight *= 1.2
                except Exception:
                    pass

        return weight

    @staticmethod
    def _cpw_threshold(items):
        values = []
        for item in items:
            if item.purchase_price and item.purchase_price > 0:
                cpw = float(item.purchase_price) / max(1, item.wear_count or 0)
                values.append(cpw)
        if not values:
            return None
        values.sort()
        idx = int(len(values) * 0.75)
        idx = min(idx, len(values) - 1)
        return values[idx]

    @staticmethod
    def _weighted_choice(items, season, advanced=False, weather_context=None):
        if not items:
            return None

        today = timezone.localdate()
        cpw_threshold = OutfitService._cpw_threshold(items) if advanced else None

        eligible = []
        weights = []
        for item in items:
            if advanced and item.last_worn:
                days = (today - item.last_worn).days
                if days <= 3:
                    continue

            weight = 1
            if season and is_season_match(item.color_hex, season)[0]:
                weight *= 3

            if advanced:
                weight *= OutfitService._weather_weight(item, weather_context)
                if weight == 0:
                    continue

                if cpw_threshold:
                    cpw = float(item.purchase_price or 0) / max(1, item.wear_count or 0)
                    if cpw >= cpw_threshold:
                        weight *= 5

                if item.last_worn:
                    days = (today - item.last_worn).days
                    if days >= 180 and is_season_match(item.color_hex, season)[0]:
                        weight *= 2

            eligible.append(item)
            weights.append(weight)

        if not eligible:
            eligible = items
            weights = [1] * len(items)

        return random.choices(eligible, weights=weights, k=1)[0]

    @staticmethod
    def generate_for_mood(
        user, mood, locked_top_id=None, locked_bottom_id=None, advanced=False, weather_context=None
    ):
        profile = ProfileService.get_or_create(user)
        top_cats, bot_cats = OutfitService.MOOD_RULES.get(
            mood, OutfitService.MOOD_RULES["Casual"]
        )
        all_tops = list(Garment.objects.for_user(user).active().for_categories(top_cats))
        all_bottoms = list(Garment.objects.for_user(user).active().for_categories(bot_cats))

        locked_top = None
        locked_bottom = None
        if locked_top_id:
            locked_top = (
                Garment.objects.for_user(user).active().filter(id=locked_top_id).first()
            )
        if locked_bottom_id:
            locked_bottom = (
                Garment.objects.for_user(user).active().filter(id=locked_bottom_id).first()
            )

        selected_top = locked_top or OutfitService._weighted_choice(
            all_tops, profile.season, advanced=advanced, weather_context=weather_context
        )
        selected_bottom = locked_bottom or OutfitService._weighted_choice(
            all_bottoms, profile.season, advanced=advanced, weather_context=weather_context
        )
        guilt_messages = {}
        if advanced:
            cpw_threshold = OutfitService._cpw_threshold(all_tops + all_bottoms)

            def _guilt(item):
                if not item or not cpw_threshold:
                    return None
                cpw = float(item.purchase_price or 0) / max(1, item.wear_count or 0)
                if cpw >= cpw_threshold:
                    next_cpw = float(item.purchase_price or 0) / max(1, (item.wear_count or 0) + 1)
                    return (
                        f"This {item.name} costs you INR {cpw:.0f} per wear now. "
                        f"Wear it today to bring it down to INR {next_cpw:.0f}."
                    )
                return None

            guilt_messages["top"] = _guilt(selected_top)
            guilt_messages["bottom"] = _guilt(selected_bottom)

        return {
            "mood": mood,
            "profile": profile,
            "top": selected_top,
            "bottom": selected_bottom,
            "locked_top": locked_top,
            "locked_bottom": locked_bottom,
            "guilt_messages": guilt_messages,
        }

    @staticmethod
    def custom_options(user, top_filters=None, bottom_filters=None):
        tops = GarmentService.filter_for_user(
            user, filters=top_filters, keywords=GarmentService.TOP_KEYWORDS
        ).order_by("-created_at")
        bottoms = GarmentService.filter_for_user(
            user, filters=bottom_filters, keywords=GarmentService.BOTTOM_KEYWORDS
        ).order_by("-created_at")

        if not tops.exists():
            tops = GarmentService.filter_for_user(user, filters=top_filters).order_by(
                "-created_at"
            )
        if not bottoms.exists():
            bottoms = GarmentService.filter_for_user(
                user, filters=bottom_filters
            ).order_by("-created_at")

        return {
            "wardrobe_tops": tops,
            "wardrobe_bottoms": bottoms,
        }


class TryOnService:
    """Virtual try-on orchestration with file handling."""

    @staticmethod
    def _apply_item(current_image_source, garment, category):
        color_name = get_color_name(garment.color_hex)
        detailed_desc = f"{color_name} {garment.name}".strip()
        return generate_tryon(
            current_image_source,
            garment.image.path,
            category=category,
            description=detailed_desc,
        )

    @staticmethod
    def try_on(user, top_id=None, bottom_id=None):
        profile = ProfileService.get_or_create(user)
        if not profile.full_body_image:
            return {"status": "error", "message": "Please upload a full body photo first!"}

        current_image_source = profile.full_body_image.path

        if top_id:
            top = Garment.objects.for_user(user).active().filter(id=top_id).first()
            if top:
                result_url = TryOnService._apply_item(
                    current_image_source, top, category="upper_body"
                )
                if result_url:
                    current_image_source = result_url

        if bottom_id:
            bottom = Garment.objects.for_user(user).active().filter(id=bottom_id).first()
            if bottom:
                result_url = TryOnService._apply_item(
                    current_image_source, bottom, category="lower_body"
                )
                if result_url:
                    current_image_source = result_url

        if current_image_source.startswith("http"):
            try:
                filename = f"tryon_complete_{user.id}.jpg"
                dest_dir = os.path.join(settings.MEDIA_ROOT, "generated_tryons")
                os.makedirs(dest_dir, exist_ok=True)
                final_path = os.path.join(dest_dir, filename)

                response = requests.get(current_image_source, timeout=10)
                if response.status_code == 200:
                    with open(final_path, "wb") as f:
                        f.write(response.content)
                    return {
                        "status": "success",
                        "image_url": f"{settings.MEDIA_URL}generated_tryons/{filename}",
                    }
            except Exception:
                logger.exception("Error saving try-on result.")

        return {"status": "error", "message": "AI processing failed."}

    @staticmethod
    def create_job(user, top_id=None, bottom_id=None):
        job = TryOnJob.objects.create(
            owner=user,
            top_id=top_id or None,
            bottom_id=bottom_id or None,
            status="pending",
        )
        submit_job(TryOnService._run_job, job.id)
        return job

    @staticmethod
    def _run_job(job_id):
        job = TryOnJob.objects.filter(id=job_id).first()
        if not job:
            return
        try:
            job.status = "running"
            job.save(update_fields=["status"])
            result = TryOnService.try_on(job.owner, top_id=job.top_id, bottom_id=job.bottom_id)
            if result.get("status") == "success":
                job.status = "success"
                job.result_url = result.get("image_url", "")
                job.save(update_fields=["status", "result_url"])
            else:
                job.status = "failed"
                job.error_message = result.get("message", "Processing failed.")
                job.save(update_fields=["status", "error_message"])
        except Exception as exc:
            logger.exception("Try-on job failed.")
            job.status = "failed"
            job.error_message = str(exc)
            job.save(update_fields=["status", "error_message"])


class OutfitSaveService:
    """Persist try-on results into the lookbook."""

    @staticmethod
    def save_result(user, image_url, top_id=None, bottom_id=None):
        if not image_url:
            return {"status": "error", "message": "No image to save!"}

        try:
            filename = image_url.split("/")[-1]
            source_path = os.path.join(settings.MEDIA_ROOT, "generated_tryons", filename)

            if not os.path.exists(source_path):
                return {"status": "error", "message": f"Source file lost. Path: {filename}"}

            outfit = Outfit(owner=user)
            if top_id:
                outfit.top_id = top_id
            if bottom_id:
                outfit.bottom_id = bottom_id

            with open(source_path, "rb") as f:
                new_filename = f"saved_outfit_{user.id}_{random.randint(1000,9999)}.jpg"
                outfit.vton_result_image.save(new_filename, File(f))

            outfit.save()
            return {"status": "success", "message": "Outfit saved to Lookbook!"}
        except Exception as exc:
            logger.exception("Save outfit failed.")
            return {"status": "error", "message": str(exc)}


class ScheduleService:
    """Schedule outfits on calendar dates and surface daily reminders."""

    @staticmethod
    def schedule_outfit(
        user,
        scheduled_date,
        top_id=None,
        bottom_id=None,
        image_url=None,
        source="ai",
        notify_on_day=None,
    ):
        if not scheduled_date:
            return {"status": "error", "message": "Please select a date."}
        if scheduled_date < timezone.localdate():
            return {"status": "error", "message": "Scheduled date must be today or later."}
        if not top_id and not bottom_id:
            return {"status": "error", "message": "Select at least a top or bottom."}

        try:
            schedule = ScheduledOutfit(
                owner=user,
                top_id=top_id or None,
                bottom_id=bottom_id or None,
                scheduled_date=scheduled_date,
                source=source,
            )
            if notify_on_day is not None:
                schedule.notify_on_day = bool(notify_on_day)

            if image_url:
                filename = image_url.split("/")[-1]
                source_path = os.path.join(settings.MEDIA_ROOT, "generated_tryons", filename)
                if os.path.exists(source_path):
                    with open(source_path, "rb") as f:
                        new_filename = (
                            f"scheduled_{user.id}_{random.randint(1000,9999)}.jpg"
                        )
                        schedule.vton_result_image.save(new_filename, File(f))

            schedule.save()
            return {"status": "success", "message": "Outfit scheduled successfully."}
        except Exception as exc:
            logger.exception("Schedule outfit failed.")
            return {"status": "error", "message": str(exc)}

    @staticmethod
    def todays_schedule(user):
        today = timezone.localdate()
        schedules = list(
            ScheduledOutfit.objects.for_user(user)
            .filter(notify_on_day=True)
            .for_date(today)
            .select_related("top", "bottom", "layer")
            .order_by("created_at")
        )
        if schedules:
            ScheduledOutfit.objects.filter(
                id__in=[s.id for s in schedules], is_notified=False
            ).update(is_notified=True)
        return schedules

    @staticmethod
    def upcoming(user, limit=5):
        return list(
            ScheduledOutfit.objects.for_user(user)
            .filter(notify_on_day=True)
            .filter(scheduled_date__gt=timezone.localdate())
            .order_by("scheduled_date")
            .select_related("top", "bottom", "layer")[:limit]
        )


class ImpactService:
    """Compute sustainability impact summary for dashboards."""

    @staticmethod
    def _defaults():
        activity = getattr(settings, "TEXTILE_ACTIVITY_DEFAULTS", {})
        factors = getattr(settings, "TEXTILE_EMISSION_FACTORS", {})
        return activity, factors

    @staticmethod
    def _base_impacts():
        activity, factors = ImpactService._defaults()
        electricity_kwh = float(activity.get("electricity_kwh", 0))
        water_l = float(activity.get("water_l", 0))
        yarn_kg = float(activity.get("yarn_kg", 0))

        ef_elec = float(factors.get("electricity_kgco2_per_kwh", 0))
        ef_water = float(factors.get("water_kgco2_per_l", 0))
        ef_yarn = float(factors.get("yarn_kgco2_per_kg", 0))

        carbon_kg = (electricity_kwh * ef_elec) + (water_l * ef_water) + (yarn_kg * ef_yarn)
        return {
            "carbon_kg": carbon_kg,
            "water_l": water_l,
            "electricity_kwh": electricity_kwh,
        }

    @staticmethod
    def summary(user, month=None):
        garments = Garment.objects.for_user(user)
        active = garments.active()
        total_items = active.count()
        total_wears = sum((g.wear_count or 0) for g in active)

        base = ImpactService._base_impacts()
        target_wears = getattr(settings, "GARMENT_TARGET_WEARS", 30) or 30
        per_wear_carbon = base["carbon_kg"] / target_wears
        per_wear_water = base["water_l"] / target_wears
        per_wear_energy = base["electricity_kwh"] / target_wears

        extra_wears = sum(max(0, (g.wear_count or 0) - 1) for g in active)

        if month:
            try:
                year, mon = [int(part) for part in str(month).split("-")]
                start = datetime(year, mon, 1).date()
            except Exception:
                start = timezone.localdate().replace(day=1)
            if start.month == 12:
                end = start.replace(year=start.year + 1, month=1, day=1)
            else:
                end = start.replace(month=start.month + 1, day=1)
            month_wears = (
                active.filter(last_worn__gte=start, last_worn__lt=end).count()
            )
            total_wears = month_wears
            extra_wears = month_wears

        carbon_saved = extra_wears * per_wear_carbon
        water_saved = extra_wears * per_wear_water
        energy_saved = extra_wears * per_wear_energy

        donated_count = garments.filter(disposal_method__in=["Donated", "Donate"]).count()
        recycled_count = garments.filter(disposal_method__in=["Recycled", "Recycle"]).count()

        return {
            "total_items": total_items,
            "total_wears": total_wears,
            "avg_wears": round(total_wears / total_items, 1) if total_items else 0,
            "carbon_saved_kg": round(carbon_saved, 2),
            "water_saved_l": int(water_saved),
            "energy_saved_kwh": round(energy_saved, 1),
            "donated_count": donated_count,
            "recycled_count": recycled_count,
            "base_carbon_kg": round(base["carbon_kg"], 2),
            "base_water_l": int(base["water_l"]),
            "base_energy_kwh": round(base["electricity_kwh"], 1),
        }


class SustainabilityEngine:
    """
    Handles all gamification and eco-impact logic.
    Follows Single Responsibility Principle.
    """

    POINTS_PER_WEAR = 10
    POINTS_BREAK_EVEN_BONUS = 50
    POINTS_DONATION = 100
    POINTS_RECYCLE = 150

    @staticmethod
    def register_wear(garment, user):
        with transaction.atomic():
            Garment.objects.filter(id=garment.id).update(
                wear_count=F("wear_count") + 1,
                last_worn=timezone.localdate(),
            )
            garment.refresh_from_db(fields=["wear_count", "last_worn", "purchase_price"])

            points_earned = SustainabilityEngine.POINTS_PER_WEAR
            if garment.break_even_status == 100 and garment.wear_count > 1:
                points_earned += 5

            profile = ProfileService.get_or_create(user)
            UserProfile.objects.filter(id=profile.id).update(
                green_points=F("green_points") + points_earned
            )
            profile.refresh_from_db(fields=["green_points"])

        return {
            "status": "success",
            "new_cpw": garment.cost_per_wear,
            "points_added": points_earned,
            "total_points": profile.green_points,
        }

    @staticmethod
    def discard_item(garment, user, method):
        method_map = {
            "Donate": "Donated",
            "Donated": "Donated",
            "Recycle": "Recycled",
            "Recycled": "Recycled",
            "Resell": "Resold",
            "Resold": "Resold",
        }
        normalized = method_map.get(method, method)
        with transaction.atomic():
            Garment.objects.filter(id=garment.id).update(
                is_active=False,
                disposal_method=normalized,
            )

            if normalized == "Donated":
                points = SustainabilityEngine.POINTS_DONATION
            elif normalized == "Recycled":
                points = SustainabilityEngine.POINTS_RECYCLE
            else:
                points = 0

            profile = ProfileService.get_or_create(user)
            if points:
                UserProfile.objects.filter(id=profile.id).update(
                    green_points=F("green_points") + points
                )

        return points
