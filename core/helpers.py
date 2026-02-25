import logging
import math

import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)


def get_weather_speech(city=None):
    """
    Fetches simple weather info to create a conversational string.
    Defaults to a safe fallback if the API fails or no key is configured.
    """
    default_msg = "the weather is a mystery today, so dress comfortably."
    api_key = getattr(settings, "OPENWEATHER_API_KEY", None)
    if not api_key:
        return "you look great!"

    resolved_city = city or getattr(settings, "DEFAULT_WEATHER_CITY", "Delhi")
    try:
        url = "http://api.openweathermap.org/data/2.5/weather"
        response = requests.get(
            url,
            params={"q": resolved_city, "appid": api_key, "units": "metric"},
            timeout=2,
        )
        if response.status_code != 200:
            return default_msg

        data = response.json()
        temp = data["main"]["temp"]
        desc = data["weather"][0]["description"]

        if temp < 15:
            condition = "it is quite cold outside"
        elif temp > 30:
            condition = "it is boiling hot outside"
        else:
            condition = "it is pleasant outside"

        return f"{condition} at {int(temp)} degrees with {desc}."
    except Exception:
        logger.exception("Weather fetch failed.")
        return default_msg


def get_weather_context(city=None):
    """
    Returns structured weather data for UI (city, temp_c, description, condition).
    Cached briefly to reduce API calls.
    """
    resolved_city = (city or "").strip() or getattr(settings, "DEFAULT_WEATHER_CITY", "Delhi")
    cache_key = f"weather:{resolved_city}".lower()
    cached = cache.get(cache_key)

    api_key = getattr(settings, "OPENWEATHER_API_KEY", None)
    if cached:
        if cached.get("temp_c") is None and api_key:
            # If we now have a key, re-fetch instead of returning stale "unavailable".
            cache.delete(cache_key)
        else:
            return cached
    if not api_key:
        data = {
            "city": resolved_city,
            "temp_c": None,
            "description": None,
            "condition": "Weather unavailable",
        }
        cache.set(cache_key, data, 600)
        return data

    try:
        url = "http://api.openweathermap.org/data/2.5/weather"
        response = requests.get(
            url,
            params={"q": resolved_city, "appid": api_key, "units": "metric"},
            timeout=2,
        )
        if response.status_code != 200:
            logger.warning("Weather API status %s for city %s", response.status_code, resolved_city)
            data = {
                "city": resolved_city,
                "temp_c": None,
                "description": None,
                "condition": "Weather unavailable",
            }
            cache.set(cache_key, data, 300)
            return data

        payload = response.json()
        temp = payload["main"]["temp"]
        desc = payload["weather"][0]["description"]

        if temp < 15:
            condition = "Cold"
        elif temp > 30:
            condition = "Hot"
        else:
            condition = "Pleasant"

        data = {
            "city": resolved_city,
            "temp_c": int(temp),
            "description": desc,
            "condition": condition,
        }
        cache.set(cache_key, data, 600)
        return data
    except Exception:
        logger.exception("Weather context fetch failed.")
        data = {
            "city": resolved_city,
            "temp_c": None,
            "description": None,
            "condition": "Weather unavailable",
        }
        cache.set(cache_key, data, 300)
        return data


def get_color_name(hex_code):
    """
    Converts a hex color to the nearest human-readable color name.
    """
    if not hex_code or not hex_code.startswith("#"):
        return ""

    colors = {
        "Black": (0, 0, 0),
        "White": (255, 255, 255),
        "Grey": (128, 128, 128),
        "Red": (255, 0, 0),
        "Blue": (0, 0, 255),
        "Green": (0, 128, 0),
        "Yellow": (255, 255, 0),
        "Orange": (255, 165, 0),
        "Purple": (128, 0, 128),
        "Pink": (255, 192, 203),
        "Brown": (165, 42, 42),
        "Beige": (245, 245, 220),
        "Navy": (0, 0, 128),
        "Khaki": (195, 176, 145),
        "Cream": (255, 253, 208),
    }

    h = hex_code.lstrip("#")
    try:
        r, g, b = tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))
    except Exception:
        return ""

    min_dist = float("inf")
    closest_name = ""

    for name, (cr, cg, cb) in colors.items():
        dist = math.sqrt((r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2)
        if dist < min_dist:
            min_dist = dist
            closest_name = name

    return closest_name


def reverse_geocode_city(lat, lon):
    """
    Reverse geocode latitude/longitude to a city name using OpenStreetMap.
    Returns None if not available.
    """
    try:
        lat = float(lat)
        lon = float(lon)
    except (TypeError, ValueError):
        return None

    cache_key = f"geocode:{round(lat, 2)}:{round(lon, 2)}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    try:
        response = requests.get(
            "https://nominatim.openstreetmap.org/reverse",
            params={
                "format": "jsonv2",
                "lat": lat,
                "lon": lon,
            },
            headers={"User-Agent": "SmartWardrobe/1.0 (contact: local-dev)"},
            timeout=3,
        )
        if response.status_code != 200:
            return None

        payload = response.json()
        address = payload.get("address", {})
        city = (
            address.get("city")
            or address.get("town")
            or address.get("village")
            or address.get("county")
        )
        if city:
            cache.set(cache_key, city, 86400)
        return city
    except Exception:
        logger.exception("Reverse geocoding failed.")
        return None
