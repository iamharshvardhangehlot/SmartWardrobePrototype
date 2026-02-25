# smart_wardrobe/urls.py
from django.contrib import admin
from django.urls import path
from django.http import HttpResponse
from django.conf import settings
from django.conf.urls.static import static
from core import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('favicon.ico', lambda request: HttpResponse(status=204)),

    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),

    # React SPA as the only UI
    path('', views.react_app, name='react_app'),
    path('app/', views.react_app, name='react_app_alt'),

    # API + action endpoints
    path('try-on/', views.try_on_outfit, name='try_on'),
    path('save-outfit/', views.save_outfit, name='save_outfit'),
    path('schedule-outfit/', views.schedule_outfit, name='schedule_outfit'),
    path('resolve-location/', views.resolve_location, name='resolve_location'),
    path('update-location/', views.update_location, name='update_location'),
    path('update-advanced-stylist/', views.update_advanced_stylist, name='update_advanced_stylist'),
    path('confirm-wear/', views.confirm_wear, name='confirm_wear'),
    path('api/home/', views.api_home, name='api_home'),
    path('api/profile/', views.api_profile, name='api_profile'),
    path('api/add-item/', views.api_add_item, name='api_add_item'),
    path('api/wardrobe/', views.api_wardrobe, name='api_wardrobe'),
    path('api/garments/<int:garment_id>/', views.api_garment_detail, name='api_garment_detail'),
    path('api/outfit/', views.api_outfit, name='api_outfit'),
    path('api/tryon/<int:job_id>/', views.api_tryon_status, name='api_tryon_status'),
    path('api/calendar/', views.api_calendar, name='api_calendar'),
    path('api/sustainability/', views.api_sustainability, name='api_sustainability'),
    path('api/discard/', views.api_discard, name='api_discard'),
    path('api/achievements/claim/', views.api_achievement_claim, name='api_achievement_claim'),
    path('api/schedules/<int:schedule_id>/delete/', views.api_schedule_delete, name='api_schedule_delete'),
    path('api/schedules/<int:schedule_id>/notify/', views.api_schedule_notify, name='api_schedule_notify'),
    
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
