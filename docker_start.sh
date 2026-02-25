#!/bin/sh
set -e

python manage.py migrate
gunicorn smart_wardrobe.wsgi:application --bind 0.0.0.0:8000
