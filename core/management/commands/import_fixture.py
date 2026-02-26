import os

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand

from core.models import Garment, UserProfile


class Command(BaseCommand):
    help = "Load a fixture file once on startup (for free-tier deploys without shell)."

    def handle(self, *args, **options):
        fixture_path = os.getenv("SEED_FIXTURE")
        if not fixture_path:
            self.stdout.write("SEED_FIXTURE not set; skipping.")
            return

        if not os.path.isabs(fixture_path):
            fixture_path = os.path.join(settings.BASE_DIR, fixture_path)

        if not os.path.exists(fixture_path):
            self.stdout.write(f"Fixture not found: {fixture_path}")
            return

        force = os.getenv("SEED_FORCE", "").lower() in {"1", "true", "yes"}
        # Avoid duplicate loads unless explicitly forced
        if not force and (Garment.objects.exists() or UserProfile.objects.exists()):
            self.stdout.write("Data already present; skipping fixture import.")
            return

        self.stdout.write(f"Loading fixture: {fixture_path}")
        try:
            call_command("loaddata", fixture_path)
        except Exception as exc:
            self.stdout.write(f"Fixture import failed: {exc}")
            return
        self.stdout.write("Fixture import complete.")
