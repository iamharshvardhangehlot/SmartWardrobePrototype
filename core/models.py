from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

# --- CHOICE LISTS ---
SEASON_CHOICES = [
    ('Winter', 'Winter'),
    ('Summer', 'Summer'),
    ('Autumn', 'Autumn'),
    ('Spring', 'Spring'),
    ('Unknown', 'Unknown'),
]

CATEGORY_CHOICES = [
    ('Top', 'Top'),
    ('Bottom', 'Bottom'),
    ('Dress', 'Dress'),
    ('Layer', 'Outerwear/Blazer'),
    ('Shoes', 'Shoes'),
    ('Accessory', 'Accessory'),
]

FABRIC_CHOICES = [
    ('Cotton', 'Cotton'),
    ('Linen', 'Linen'),
    ('Wool', 'Wool'),
    ('Denim', 'Denim'),
    ('Silk', 'Silk'),
    ('Polyester', 'Polyester'),
    ('Nylon', 'Nylon'),
    ('Synthetic', 'Synthetic/Blend'),
    ('Leather', 'Leather'),
    ('Suede', 'Suede'),
    ('Other', 'Other'),
]

UNDERTONE_CHOICES = [
    ('Cool', 'Cool (Blue Veins)'),
    ('Warm', 'Warm (Green Veins)'),
    ('Neutral', 'Neutral (Mix/Purple)'),
]

class UserProfile(models.Model):
    """Stores user biometrics and the Selfie for AI Analysis"""
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    
    # Biometrics for Virtual Try-On (VTON) Scaling
    height_cm = models.IntegerField(default=170)
    weight_kg = models.IntegerField(default=70)
    
    # --- SCANNER FIELDS ---
    selfie = models.ImageField(upload_to='selfies/', null=True, blank=True) # For undertone analysis
    full_body_image = models.ImageField(upload_to='body_shots/', null=True, blank=True) # Source for VTON
    
    skin_undertone = models.CharField(max_length=10, choices=UNDERTONE_CHOICES, default='Neutral')
    season = models.CharField(max_length=20, choices=SEASON_CHOICES, blank=True, null=True)
    contrast_level = models.CharField(max_length=20, blank=True, null=True)
    green_points = models.IntegerField(default=0)
    city = models.CharField(max_length=120, blank=True, null=True)
    timezone = models.CharField(max_length=64, blank=True, null=True)
    advanced_stylist_enabled = models.BooleanField(default=False)
    claimed_achievements = models.JSONField(default=list, blank=True)

    objects = models.Manager()

    def __str__(self):
        return f"{self.user.username}'s Profile ({self.season})"


class GarmentQuerySet(models.QuerySet):
    def for_user(self, user):
        return self.filter(owner=user)

    def active(self):
        return self.filter(is_active=True)

    def for_categories(self, categories):
        return self.filter(category__in=categories)


class GarmentManager(models.Manager):
    def get_queryset(self):
        return GarmentQuerySet(self.model, using=self._db)

    def for_user(self, user):
        return self.get_queryset().for_user(user)

    def active(self):
        return self.get_queryset().active()

    def for_categories(self, categories):
        return self.get_queryset().for_categories(categories)

class Garment(models.Model):
    """The Digital Twin of your cloth"""
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100, default="New Item")
    image = models.ImageField(upload_to='wardrobe_images/') # Raw photo
    vton_processed_image = models.ImageField(upload_to='vton_garments/', null=True, blank=True) # Masked for AI
    
    # AI-Detected Metadata
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, blank=True)
    color_hex = models.CharField(max_length=7, default="#FFFFFF") 
    detected_material = models.CharField(max_length=50, default="Cotton")
    fabric_type = models.CharField(
        max_length=30, choices=FABRIC_CHOICES, blank=True, null=True
    )
    ai_status = models.CharField(
        max_length=20,
        choices=[("pending", "Pending"), ("processing", "Processing"), ("complete", "Complete"), ("failed", "Failed")],
        default="pending",
    )
    
    # Financial & Usage Logic
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    wear_count = models.IntegerField(default=0)
    wash_count = models.IntegerField(default=0)
    last_worn = models.DateField(null=True, blank=True)
    
    # Sustainability & Lifecycle
    is_active = models.BooleanField(default=True)
    disposal_method = models.CharField(max_length=50, choices=[('Donated', 'Donated'), ('Recycled', 'Recycled'), ('Resold', 'Resold')], null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    objects = GarmentManager()

    @property
    def cost_per_wear(self):
        """Calculates CPW - Central metric for Wardrobe.AI"""
        if self.wear_count <= 0:
            return self.purchase_price
        return round(self.purchase_price / self.wear_count, 2)

    def get_eco_impact(self):
        """Sustainability score based on material and usage longevity"""
        # Logic: High wear_count reduces the 'impact' of the garment creation
        base_impact = 10.0  # Assumed kg of CO2 to produce
        if self.wear_count > 0:
            return round(base_impact / self.wear_count, 2)
        return base_impact

    # ADD THIS PROPERTY:
    @property
    def break_even_status(self):
        """Returns percentage of value recovered (Target: 30 wears)"""
        from django.conf import settings

        target_wears = getattr(settings, "GARMENT_TARGET_WEARS", 30) or 30
        if self.wear_count >= target_wears:
            return 100
        return int((self.wear_count / target_wears) * 100)

    def __str__(self):
        return f"{self.name} - INR {self.cost_per_wear}/wear"

class OutfitQuerySet(models.QuerySet):
    def for_user(self, user):
        return self.filter(owner=user)

    def with_garments(self):
        return self.select_related("top", "bottom", "layer")


class OutfitManager(models.Manager):
    def get_queryset(self):
        return OutfitQuerySet(self.model, using=self._db)

    def for_user(self, user):
        return self.get_queryset().for_user(user)

    def with_garments(self):
        return self.get_queryset().with_garments()


class Outfit(models.Model):
    """A curated combination of garments"""
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    top = models.ForeignKey(Garment, related_name='outfits_top', on_delete=models.SET_NULL, null=True)
    bottom = models.ForeignKey(Garment, related_name='outfits_bottom', on_delete=models.SET_NULL, null=True)
    layer = models.ForeignKey(Garment, related_name='outfits_layer', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Result of IDM-VTON
    vton_result_image = models.ImageField(upload_to='vton_outfits/', null=True, blank=True)
    
    is_favorite = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = OutfitManager()

    def log_wear(self):
        """Helper to update wear count for all items in the outfit at once"""
        if self.top: self.top.wear_count += 1; self.top.save()
        if self.bottom: self.bottom.wear_count += 1; self.bottom.save()
        if self.layer: self.layer.wear_count += 1; self.layer.save()

    def __str__(self):
        return f"Outfit for {self.owner.username} on {self.created_at.date()}"


class OutfitScheduleQuerySet(models.QuerySet):
    def for_user(self, user):
        return self.filter(owner=user)

    def for_date(self, target_date):
        return self.filter(scheduled_date=target_date)

    def upcoming(self):
        return self.filter(scheduled_date__gte=timezone.localdate()).order_by("scheduled_date")


class OutfitScheduleManager(models.Manager):
    def get_queryset(self):
        return OutfitScheduleQuerySet(self.model, using=self._db)

    def for_user(self, user):
        return self.get_queryset().for_user(user)

    def for_date(self, target_date):
        return self.get_queryset().for_date(target_date)

    def upcoming(self):
        return self.get_queryset().upcoming()


class ScheduledOutfit(models.Model):
    """Stores outfits planned for specific dates."""

    SOURCE_CHOICES = [
        ("ai", "AI Suggested"),
        ("custom", "Custom"),
    ]

    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    top = models.ForeignKey(
        "Garment", related_name="scheduled_top", on_delete=models.SET_NULL, null=True, blank=True
    )
    bottom = models.ForeignKey(
        "Garment",
        related_name="scheduled_bottom",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    layer = models.ForeignKey(
        "Garment",
        related_name="scheduled_layer",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    vton_result_image = models.ImageField(upload_to="scheduled_outfits/", null=True, blank=True)
    scheduled_date = models.DateField()
    source = models.CharField(max_length=10, choices=SOURCE_CHOICES, default="ai")
    is_notified = models.BooleanField(default=False)
    notify_on_day = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = OutfitScheduleManager()

    def __str__(self):
        return f"Scheduled outfit for {self.owner.username} on {self.scheduled_date}"


class TryOnJob(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("running", "Running"),
        ("success", "Success"),
        ("failed", "Failed"),
    ]

    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    top = models.ForeignKey(
        "Garment", related_name="tryon_top_jobs", on_delete=models.SET_NULL, null=True, blank=True
    )
    bottom = models.ForeignKey(
        "Garment", related_name="tryon_bottom_jobs", on_delete=models.SET_NULL, null=True, blank=True
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    result_url = models.CharField(max_length=512, blank=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"TryOnJob {self.id} ({self.status})"
