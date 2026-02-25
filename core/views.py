from datetime import datetime
import json
from zoneinfo import ZoneInfo

from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render, redirect
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout

from .forms import BulkGarmentForm, GarmentScanForm, UserSetupForm
from .models import Garment, ScheduledOutfit, TryOnJob, UserProfile
from .services import (
    GarmentService,
    LocationService,
    OutfitSaveService,
    OutfitService,
    ProfileService,
    ScheduleService,
    SustainabilityEngine,
    TryOnService,
    WeatherService,
    ImpactService,
)
from .utils import get_season_details


def try_on_outfit(request):
    if request.method != "POST":
        return JsonResponse({"status": "error"}, status=400)

    top_id = request.POST.get("top_id")
    bottom_id = request.POST.get("bottom_id")
    profile = ProfileService.get_or_create(request.user)
    if not profile.full_body_image:
        return JsonResponse(
            {"status": "error", "message": "Please upload a full body photo first!"},
            status=400,
        )
    job = TryOnService.create_job(request.user, top_id=top_id, bottom_id=bottom_id)
    return JsonResponse({"status": "processing", "job_id": job.id})


def save_outfit(request):
    if request.method != "POST":
        return JsonResponse({"status": "error"}, status=400)

    image_url = request.POST.get("image_url")
    top_id = request.POST.get("top_id")
    bottom_id = request.POST.get("bottom_id")

    result = OutfitSaveService.save_result(
        request.user, image_url=image_url, top_id=top_id, bottom_id=bottom_id
    )
    return JsonResponse(result)


def schedule_outfit(request):
    if request.method != "POST":
        return JsonResponse({"status": "error"}, status=400)

    date_str = request.POST.get("scheduled_date")
    top_id = request.POST.get("top_id")
    bottom_id = request.POST.get("bottom_id")
    image_url = request.POST.get("image_url")
    source = request.POST.get("source", "ai")
    notify_on_day = request.POST.get("notify_on_day")
    notify_flag = None
    if notify_on_day is not None:
        notify_flag = notify_on_day == "true"

    scheduled_date = None
    if date_str:
        try:
            scheduled_date = datetime.fromisoformat(date_str).date()
        except ValueError:
            return JsonResponse({"status": "error", "message": "Invalid date format."})

    result = ScheduleService.schedule_outfit(
        request.user,
        scheduled_date=scheduled_date,
        top_id=top_id,
        bottom_id=bottom_id,
        image_url=image_url,
        source=source,
        notify_on_day=notify_flag,
    )
    return JsonResponse(result)


def resolve_location(request):
    lat = request.GET.get("lat")
    lon = request.GET.get("lon")
    city = LocationService.resolve_city(lat, lon)
    if city:
        return JsonResponse({"status": "success", "city": city})
    return JsonResponse({"status": "error", "message": "Unable to resolve city."})


def update_location(request):
    if request.method != "POST":
        return JsonResponse({"status": "error"}, status=400)

    city = request.POST.get("city")
    tz_name = request.POST.get("timezone")
    profile = ProfileService.get_or_create(request.user)
    ProfileService.update_location(profile, city=city, timezone_name=tz_name)
    return JsonResponse({"status": "success"})


def update_advanced_stylist(request):
    if request.method != "POST":
        return JsonResponse({"status": "error"}, status=400)

    profile = ProfileService.get_or_create(request.user)
    enabled = request.POST.get("enabled") == "true"
    if getattr(settings, "ADVANCED_STYLIST_ENABLED", False):
        profile.advanced_stylist_enabled = enabled
        profile.save(update_fields=["advanced_stylist_enabled"])
    return JsonResponse({"status": "success", "enabled": profile.advanced_stylist_enabled})


def confirm_wear(request):
    if request.method == "POST":
        item_ids = [request.POST.get("top_id"), request.POST.get("bottom_id")]
        total_points = 0

        for item_id in item_ids:
            if item_id:
                garment = get_object_or_404(Garment, id=item_id, owner=request.user)
                result = SustainabilityEngine.register_wear(garment, request.user)
                total_points += result["points_added"]

        return JsonResponse(
            {
                "status": "success",
                "message": f"Great choice! +{total_points} Green Points added.",
            }
        )
    return JsonResponse({"status": "error"})


@ensure_csrf_cookie
def react_app(request):
    if not request.user.is_authenticated:
        next_url = request.get_full_path() or "/app/"
        return redirect(f"/login/?next={next_url}")
    return render(request, "react_index.html")


@require_http_methods(["GET", "POST"])
def login_view(request):
    if request.user.is_authenticated:
        return redirect(request.GET.get("next") or "/app/")

    error = None
    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        password = request.POST.get("password", "")
        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            return redirect(request.POST.get("next") or "/app/")
        error = "Invalid username or password."

    return render(
        request,
        "login.html",
        {"error": error, "next": request.GET.get("next", "/app/")},
    )


def logout_view(request):
    logout(request)
    return redirect("/login/")


def api_home(request):
    if not request.user.is_authenticated:
        return JsonResponse({"status": "error", "message": "Unauthorized"}, status=401)

    month = request.GET.get("month")
    profile = ProfileService.get_or_create(request.user)
    weather_context = WeatherService.get_context(city=profile.city)
    now = timezone.now()
    if profile.timezone:
        try:
            now = now.astimezone(ZoneInfo(profile.timezone))
        except Exception:
            now = timezone.localtime(now)
    else:
        now = timezone.localtime(now)

    hour = now.hour
    if hour < 5:
        greeting = "Good Night"
    elif hour < 12:
        greeting = "Good Morning"
    elif hour < 17:
        greeting = "Good Afternoon"
    elif hour < 21:
        greeting = "Good Evening"
    else:
        greeting = "Good Night"

    date_text = now.strftime("%A, %b %d")
    time_text = now.strftime("%I:%M %p").lstrip("0")

    impact = ImpactService.summary(request.user, month=month)
    wardrobe_count = Garment.objects.for_user(request.user).active().count()
    todays_schedules = ScheduleService.todays_schedule(request.user)
    todays_outfit = None
    if todays_schedules:
        schedule = todays_schedules[0]
        todays_outfit = {
            "id": schedule.id,
            "top_id": schedule.top.id if schedule.top else None,
            "bottom_id": schedule.bottom.id if schedule.bottom else None,
            "top_name": schedule.top.name if schedule.top else None,
            "bottom_name": schedule.bottom.name if schedule.bottom else None,
            "image_url": schedule.vton_result_image.url if schedule.vton_result_image else None,
        }

    return JsonResponse(
        {
            "status": "success",
            "greeting": greeting,
            "user_name": request.user.first_name or request.user.username,
            "date": date_text,
            "time": time_text,
            "city": profile.city or getattr(settings, "DEFAULT_WEATHER_CITY", "Unknown"),
            "weather": {
                "temp_c": weather_context.get("temp_c"),
                "condition": weather_context.get("condition"),
                "description": weather_context.get("description"),
            },
            "green_points": profile.green_points,
            "wardrobe_count": wardrobe_count,
            "impact": impact,
            "todays_outfit": todays_outfit,
        }
    )


@require_http_methods(["GET", "POST"])
def api_profile(request):
    if not request.user.is_authenticated:
        return JsonResponse({"status": "error", "message": "Unauthorized"}, status=401)

    profile = ProfileService.get_or_create(request.user)

    if request.method == "POST":
        if request.content_type and "application/json" in request.content_type:
            try:
                json_data = json.loads(request.body.decode("utf-8") or "{}")
            except Exception:
                json_data = {}
            data = request.POST.copy()
            for key, value in json_data.items():
                data[key] = value
        else:
            data = request.POST.copy()

        if "height_cm" not in data:
            data["height_cm"] = profile.height_cm
        if "weight_kg" not in data:
            data["weight_kg"] = profile.weight_kg
        if "skin_undertone" not in data:
            data["skin_undertone"] = profile.skin_undertone
        if "city" not in data and profile.city:
            data["city"] = profile.city
        if "timezone" not in data and profile.timezone:
            data["timezone"] = profile.timezone

        form = UserSetupForm(data, request.FILES, instance=profile)
        if form.is_valid():
            ProfileService.update_from_form(form, profile)
        else:
            return JsonResponse({"status": "error", "errors": form.errors}, status=400)

    profile.refresh_from_db()
    season_details = get_season_details(profile.season)
    color_map = {
        "Pure Black": "#000000",
        "Stark White": "#FFFFFF",
        "Royal Blue": "#4169E1",
        "Neon Pink": "#FF4FA3",
        "Pastel Blue": "#AEC6CF",
        "Soft Grey": "#BFC5C9",
        "Lavender": "#C4A3C3",
        "Mauve": "#B784A7",
        "Olive Green": "#7A8450",
        "Mustard": "#C9A24D",
        "Rust": "#C96A4A",
        "Warm Brown": "#6B4423",
        "Coral": "#FF7F50",
        "Bright Yellow": "#FFD200",
        "Kelly Green": "#4CBB17",
        "Turquoise": "#40E0D0",
    }
    palette = []
    for color in (season_details or {}).get("best_colors", []):
        palette.append(color_map.get(color, "#EADFC8"))

    return JsonResponse(
        {
            "status": "success",
            "profile": {
                "season": profile.season,
                "skin_undertone": profile.skin_undertone,
                "contrast_level": profile.contrast_level,
                "green_points": profile.green_points,
                "city": profile.city,
                "timezone": profile.timezone,
                "height_cm": profile.height_cm,
                "weight_kg": profile.weight_kg,
                "advanced_stylist_enabled": profile.advanced_stylist_enabled,
                "selfie_url": profile.selfie.url if profile.selfie else None,
                "full_body_url": profile.full_body_image.url if profile.full_body_image else None,
                "palette": palette,
            },
        }
    )


@require_http_methods(["POST"])
def api_add_item(request):
    if not request.user.is_authenticated:
        return JsonResponse({"status": "error", "message": "Unauthorized"}, status=401)

    mode = request.POST.get("mode", "single")
    if mode == "bulk":
        bulk_form = BulkGarmentForm(request.POST)
        images = request.FILES.getlist("images")
        if not images:
            return JsonResponse(
                {"status": "error", "message": "No photos selected."}, status=400
            )
        if bulk_form.is_valid():
            price = bulk_form.cleaned_data["bulk_price"]
            fabric_type = bulk_form.cleaned_data.get("fabric_type") or None
            count = GarmentService.bulk_create_from_images(
                images, request.user, price, fabric_type=fabric_type
            )
            return JsonResponse({"status": "success", "count": count})
        return JsonResponse(
            {"status": "error", "message": "Invalid bulk data.", "errors": bulk_form.errors},
            status=400,
        )

    scan_form = GarmentScanForm(request.POST, request.FILES)
    if scan_form.is_valid():
        garment = GarmentService.create_from_form(scan_form, request.user)
        return JsonResponse({"status": "success", "garment_id": garment.id})
    return JsonResponse(
        {"status": "error", "message": "Invalid item data.", "errors": scan_form.errors},
        status=400,
    )


def _map_color_group(color_hex):
    if not color_hex:
        return "Neutral"
    try:
        h = color_hex.lstrip("#")
        r, g, b = tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))
        brightness = (r + g + b) / 3
    except Exception:
        brightness = 255

    from .helpers import get_color_name

    name = get_color_name(color_hex)
    neutral = {"White", "Black", "Grey", "Navy", "Cream", "Khaki", "Beige"}
    warm = {"Red", "Orange", "Yellow", "Brown", "Beige", "Khaki", "Cream"}
    cool = {"Blue", "Green", "Purple", "Pink", "Navy"}

    if brightness < 70:
        return "Dark"
    if name in neutral:
        return "Neutral"
    if name in warm:
        return "Warm"
    if name in cool:
        return "Cool"
    return "Neutral"


def api_wardrobe(request):
    if not request.user.is_authenticated:
        return JsonResponse({"status": "error", "message": "Unauthorized"}, status=401)

    search = (request.GET.get("q") or "").strip()
    category = (request.GET.get("category") or "").strip()
    color = (request.GET.get("color") or "").strip()
    filters = request.GET.getlist("filter")

    garments = GarmentService.filter_for_user(request.user, filters=filters)
    if category and category.lower() != "all":
        garments = garments.filter(category__icontains=category)
    if search:
        garments = garments.filter(
            Q(name__icontains=search) | Q(category__icontains=search)
        )
    if color and color.lower() != "all":
        garments = [g for g in garments if _map_color_group(g.color_hex) == color]
    else:
        garments = list(garments)

    total_count = len(garments)
    try:
        limit = int(request.GET.get("limit", 200))
    except (TypeError, ValueError):
        limit = 200
    try:
        offset = int(request.GET.get("offset", 0))
    except (TypeError, ValueError):
        offset = 0
    limit = min(max(limit, 1), 500)
    offset = max(offset, 0)
    garments = garments[offset : offset + limit]

    payload = []
    for garment in garments:
        payload.append(
            {
                "id": garment.id,
                "name": garment.name,
                "category": garment.category,
                "image_url": garment.image.url if garment.image else "",
                "wear_count": garment.wear_count,
                "cost_per_wear": float(garment.cost_per_wear),
                "color_hex": garment.color_hex,
                "fabric_type": garment.fabric_type,
            }
        )

    return JsonResponse(
        {"status": "success", "garments": payload, "total_count": total_count}
    )


def api_garment_detail(request, garment_id):
    if not request.user.is_authenticated:
        return JsonResponse({"status": "error", "message": "Unauthorized"}, status=401)

    garment = get_object_or_404(Garment, id=garment_id, owner=request.user)
    if request.method == "POST":
        fabric_type = request.POST.get("fabric_type")
        if fabric_type:
            garment.fabric_type = fabric_type
            garment.save(update_fields=["fabric_type"])
        return JsonResponse(
            {
                "status": "success",
                "fabric_type": garment.fabric_type,
            }
        )
    base = ImpactService._base_impacts()
    target_wears = getattr(settings, "GARMENT_TARGET_WEARS", 30) or 30
    per_wear_water = base["water_l"] / target_wears
    per_wear_energy = base["electricity_kwh"] / target_wears
    carbon = garment.get_eco_impact()
    water = int(per_wear_water * max(1, garment.wear_count or 1))
    energy = round(per_wear_energy * max(1, garment.wear_count or 1), 1)

    return JsonResponse(
        {
            "status": "success",
            "garment": {
                "id": garment.id,
                "name": garment.name,
                "category": garment.category,
                "image_url": garment.image.url if garment.image else "",
                "purchase_price": float(garment.purchase_price or 0),
                "wear_count": garment.wear_count,
                "cost_per_wear": float(garment.cost_per_wear),
                "fabric_type": garment.fabric_type,
                "detected_material": garment.detected_material,
                "last_worn": garment.last_worn.isoformat() if garment.last_worn else None,
                "break_even_status": garment.break_even_status,
                "eco_impact": {
                    "carbon_kg": carbon,
                    "water_l": water,
                    "energy_kwh": energy,
                },
            },
        }
    )


def api_outfit(request):
    if not request.user.is_authenticated:
        return JsonResponse({"status": "error", "message": "Unauthorized"}, status=401)

    mood = request.GET.get("mood", "Casual")
    freeze_top = request.GET.get("freeze_top") == "1"
    freeze_bottom = request.GET.get("freeze_bottom") == "1"
    locked_top_id = request.GET.get("top_id") if freeze_top else None
    locked_bottom_id = request.GET.get("bottom_id") if freeze_bottom else None

    profile = ProfileService.get_or_create(request.user)
    advanced_available = getattr(settings, "ADVANCED_STYLIST_ENABLED", False)
    advanced_enabled = advanced_available and profile.advanced_stylist_enabled
    weather_context = WeatherService.get_context(city=profile.city)

    context = OutfitService.generate_for_mood(
        request.user,
        mood,
        locked_top_id=locked_top_id,
        locked_bottom_id=locked_bottom_id,
        advanced=advanced_enabled,
        weather_context=weather_context,
    )

    def _garment_payload(item):
        if not item:
            return None
        return {
            "id": item.id,
            "name": item.name,
            "category": item.category,
            "image_url": item.image.url if item.image else "",
            "wear_count": item.wear_count,
            "cost_per_wear": float(item.cost_per_wear),
            "fabric_type": item.fabric_type,
        }

    return JsonResponse(
        {
            "status": "success",
            "mood": mood,
            "top": _garment_payload(context.get("top")),
            "bottom": _garment_payload(context.get("bottom")),
            "guilt_messages": context.get("guilt_messages", {}),
        }
    )


def api_tryon_status(request, job_id):
    if not request.user.is_authenticated:
        return JsonResponse({"status": "error", "message": "Unauthorized"}, status=401)

    job = get_object_or_404(TryOnJob, id=job_id, owner=request.user)
    payload = {
        "status": job.status,
        "job_id": job.id,
        "image_url": job.result_url or None,
        "error": job.error_message or None,
    }
    return JsonResponse(payload)


def api_calendar(request):
    if not request.user.is_authenticated:
        return JsonResponse({"status": "error", "message": "Unauthorized"}, status=401)

    month = request.GET.get("month")
    if month:
        try:
            year, mon = [int(part) for part in month.split("-")]
            start = datetime(year, mon, 1).date()
        except Exception:
            start = timezone.localdate().replace(day=1)
    else:
        start = timezone.localdate().replace(day=1)

    if start.month == 12:
        end = start.replace(year=start.year + 1, month=1, day=1)
    else:
        end = start.replace(month=start.month + 1, day=1)

    schedules = (
        ScheduledOutfit.objects.for_user(request.user)
        .filter(scheduled_date__gte=start, scheduled_date__lt=end)
        .select_related("top", "bottom", "layer")
        .order_by("scheduled_date")
    )

    items = []
    for entry in schedules:
        items.append(
            {
                "id": entry.id,
                "scheduled_date": entry.scheduled_date.isoformat(),
                "source": entry.source,
                "notify_on_day": entry.notify_on_day,
                "top_id": entry.top.id if entry.top else None,
                "bottom_id": entry.bottom.id if entry.bottom else None,
                "top": entry.top.name if entry.top else None,
                "bottom": entry.bottom.name if entry.bottom else None,
                "top_image_url": entry.top.image.url if entry.top and entry.top.image else None,
                "bottom_image_url": entry.bottom.image.url if entry.bottom and entry.bottom.image else None,
                "image_url": entry.vton_result_image.url if entry.vton_result_image else None,
            }
        )

    return JsonResponse(
        {
            "status": "success",
            "month": start.strftime("%Y-%m"),
            "items": items,
        }
    )


def api_sustainability(request):
    if not request.user.is_authenticated:
        return JsonResponse({"status": "error", "message": "Unauthorized"}, status=401)

    month = request.GET.get("month")
    impact = ImpactService.summary(request.user, month=month)
    garments = Garment.objects.for_user(request.user).active()
    total = garments.count() or 1
    breakdown = {}
    for garment in garments:
        key = garment.fabric_type or "Other"
        breakdown[key] = breakdown.get(key, 0) + 1

    palette = {
        "Cotton": "#F4D06F",
        "Polyester": "#5DADEC",
        "Wool": "#8E7DBE",
        "Blends": "#7AC7A3",  
        "Other": "#C2C7CF",
        "Linen": "#E6A57E",
        "Denim": "#4E79A7",
        "Leather": "#A65D57",
        "Synthetic": "#6CC5B3",
        "Nylon": "#9C88FF",
        "Silk": "#E07A5F",
        "Suede": "#C9975B",
    }
    fabric_data = []
    for name, count in breakdown.items():
        fabric_data.append(
            {
                "name": name,
                "value": round((count / total) * 100),
                "color": palette.get(name, "#BFC5C9"),
            }
        )

    items = []
    for garment in garments:
        items.append(
            {
                "id": garment.id,
                "name": garment.name,
                "image_url": garment.image.url if garment.image else "",
                "fabric_type": garment.fabric_type,
                "wear_count": garment.wear_count,
            }
        )

    achievements = _build_achievements(request.user, impact, garments)

    return JsonResponse(
        {
            "status": "success",
            "month": month,
            "impact": impact,
            "fabric": fabric_data,
            "items": items,
            "achievements": achievements,
        }
    )


def _build_achievements(user, impact, garments):
    profile = ProfileService.get_or_create(user)
    claimed = set(profile.claimed_achievements or [])
    total_items = garments.count()
    donated = impact.get("donated_count", 0)
    recycled = impact.get("recycled_count", 0)
    natural = 0
    for garment in garments:
        fabric = (garment.fabric_type or "").lower()
        if fabric in ["cotton", "linen", "wool", "denim", "silk", "leather", "suede"]:
            natural += 1
    natural_ratio = (natural / total_items) * 100 if total_items else 0

    achievements = [
        {
            "key": "minimalist",
            "title": "Minimalist",
            "desc": "Own under 100 items",
            "earned": total_items <= 100 and total_items > 0,
            "points": 120,
        },
        {
            "key": "recycler",
            "title": "Recycler",
            "desc": "Donate or recycle 10+ items",
            "earned": (donated + recycled) >= 10,
            "points": 150,
        },
        {
            "key": "sustainable",
            "title": "Sustainable",
            "desc": "50%+ natural fabrics",
            "earned": natural_ratio >= 50,
            "points": 200,
        },
    ]

    for achievement in achievements:
        achievement["claimed"] = achievement["key"] in claimed
    return achievements


@require_http_methods(["POST"])
def api_achievement_claim(request):
    if not request.user.is_authenticated:
        return JsonResponse({"status": "error", "message": "Unauthorized"}, status=401)

    key = request.POST.get("key")
    if not key:
        return JsonResponse({"status": "error", "message": "Missing key"}, status=400)

    with transaction.atomic():
        profile = ProfileService.get_or_create(request.user)
        profile = UserProfile.objects.select_for_update().get(id=profile.id)

        garments = Garment.objects.for_user(request.user).active()
        impact = ImpactService.summary(request.user)
        achievements = _build_achievements(request.user, impact, garments)
        target = next((a for a in achievements if a["key"] == key), None)
        if not target or not target["earned"]:
            return JsonResponse({"status": "error", "message": "Not earned"}, status=400)

        claimed = set(profile.claimed_achievements or [])
        if key in claimed:
            return JsonResponse({"status": "success", "claimed": True})

        claimed.add(key)
        profile.claimed_achievements = list(claimed)
        profile.green_points += int(target["points"])
        profile.save(update_fields=["claimed_achievements", "green_points"])
        return JsonResponse({"status": "success", "claimed": True, "points": target["points"]})


@require_http_methods(["POST"])
def api_schedule_delete(request, schedule_id):
    if not request.user.is_authenticated:
        return JsonResponse({"status": "error", "message": "Unauthorized"}, status=401)

    schedule = get_object_or_404(ScheduledOutfit, id=schedule_id, owner=request.user)
    schedule.delete()
    return JsonResponse({"status": "success"})


@require_http_methods(["POST"])
def api_schedule_notify(request, schedule_id):
    if not request.user.is_authenticated:
        return JsonResponse({"status": "error", "message": "Unauthorized"}, status=401)

    schedule = get_object_or_404(ScheduledOutfit, id=schedule_id, owner=request.user)
    enabled = request.POST.get("enabled")
    if enabled is not None:
        schedule.notify_on_day = enabled == "true"
        schedule.save(update_fields=["notify_on_day"])
    return JsonResponse({"status": "success", "notify_on_day": schedule.notify_on_day})


@require_http_methods(["POST"])
def api_discard(request):
    if not request.user.is_authenticated:
        return JsonResponse({"status": "error", "message": "Unauthorized"}, status=401)

    garment_id = request.POST.get("garment_id")
    method = request.POST.get("method")
    if not garment_id or not method:
        return JsonResponse({"status": "error", "message": "Missing data"}, status=400)

    garment = get_object_or_404(Garment, id=garment_id, owner=request.user)
    points = SustainabilityEngine.discard_item(garment, request.user, method)
    return JsonResponse({"status": "success", "points": points})
