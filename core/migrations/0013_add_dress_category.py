from django.db import migrations, models


def normalize_categories(apps, schema_editor):
    Garment = apps.get_model("core", "Garment")

    def normalize(text):
        text = (text or "").lower()
        if "dress" in text:
            return "Dress"
        if any(word in text for word in ["skirt", "jean", "trouser", "pant", "short"]):
            return "Bottom"
        if any(word in text for word in ["blazer", "jacket", "coat", "layer", "hoodie", "sweater"]):
            return "Layer"
        if any(word in text for word in ["shirt", "t-shirt", "tee", "top"]):
            return "Top"
        if "shoe" in text:
            return "Shoes"
        return None

    for garment in Garment.objects.all():
        combined = f"{garment.category or ''} {garment.name or ''}"
        normalized = normalize(combined)
        if normalized and normalized != garment.category:
            garment.category = normalized
            garment.save(update_fields=["category"])


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0012_profile_achievements_schedule_notify"),
    ]

    operations = [
        migrations.AlterField(
            model_name="garment",
            name="category",
            field=models.CharField(
                blank=True,
                choices=[
                    ("Top", "Top"),
                    ("Bottom", "Bottom"),
                    ("Dress", "Dress"),
                    ("Layer", "Outerwear/Blazer"),
                    ("Shoes", "Shoes"),
                    ("Accessory", "Accessory"),
                ],
                max_length=50,
            ),
        ),
        migrations.RunPython(normalize_categories, migrations.RunPython.noop),
    ]
