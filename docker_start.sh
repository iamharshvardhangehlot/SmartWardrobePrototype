#!/bin/sh
set -e

python manage.py migrate
python manage.py ensure_superuser
python manage.py import_fixture
gunicorn smart_wardrobe.wsgi:application --bind 0.0.0.0:${PORT:-8000}
