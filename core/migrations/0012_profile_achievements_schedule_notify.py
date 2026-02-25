from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0011_garment_fabric_type_profile_advanced"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="claimed_achievements",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="scheduledoutfit",
            name="notify_on_day",
            field=models.BooleanField(default=True),
        ),
    ]
