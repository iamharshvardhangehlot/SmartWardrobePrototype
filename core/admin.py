from django.contrib import admin
from django.utils.html import format_html
from .models import Garment, UserProfile, Outfit, ScheduledOutfit

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    # FIXED: Changed 'season_type' to 'season' to match your new model
    list_display = ('user', 'season', 'skin_undertone', 'contrast_level')

@admin.register(Garment)
class GarmentAdmin(admin.ModelAdmin):
    # What columns to show in the list
    list_display = ('image_preview', 'name', 'owner', 'category', 'wear_count', 'get_value', 'is_active')
    
    # Add filters on the right side
    list_filter = ('category', 'is_active', 'detected_material', 'owner')
    
    # Add a search bar
    search_fields = ('name', 'category', 'owner__username')
    readonly_fields = ('image_preview',)

    # Show the calculated "Current Value" in the admin list
    def get_value(self, obj):
        return f"INR {obj.cost_per_wear}"
    get_value.short_description = 'Cost Per Wear'

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="height: 60px; width: 60px; object-fit: cover; border-radius: 8px;" />',
                obj.image.url,
            )
        return "-"
    image_preview.short_description = "Image"


admin.site.register(Outfit)
admin.site.register(ScheduledOutfit)
