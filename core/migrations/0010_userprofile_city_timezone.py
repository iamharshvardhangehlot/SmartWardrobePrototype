from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0009_scheduled_outfit"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="city",
            field=models.CharField(blank=True, max_length=120, null=True),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="timezone",
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
    ]
