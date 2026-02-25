import os

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand

from rembg import remove

from core.models import Garment


class Command(BaseCommand):
    help = "Remove backgrounds from garment images using rembg."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Reprocess images even if they already look processed.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=0,
            help="Limit number of garments to process.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be processed without saving.",
        )

    def handle(self, *args, **options):
        force = options["force"]
        limit = options["limit"]
        dry_run = options["dry_run"]

        processed = 0
        skipped = 0
        errors = 0

        queryset = Garment.objects.exclude(image="")
        for garment in queryset.iterator():
            if limit and processed >= limit:
                break

            if not garment.image:
                skipped += 1
                continue

            filename = os.path.basename(garment.image.name)
            if filename.endswith("_nobg.png") and not force:
                skipped += 1
                continue

            try:
                with garment.image.open("rb") as handle:
                    input_bytes = handle.read()
                output_bytes = remove(input_bytes)

                if dry_run:
                    processed += 1
                    continue

                base = os.path.splitext(filename)[0]
                new_name = f"wardrobe_images/{base}_nobg.png"
                garment.image.save(new_name, ContentFile(output_bytes), save=True)
                processed += 1
            except Exception as exc:
                errors += 1
                self.stderr.write(f"Failed {garment.id} {garment.name}: {exc}")

        self.stdout.write(
            f"Done. processed={processed} skipped={skipped} errors={errors} dry_run={dry_run}"
        )
