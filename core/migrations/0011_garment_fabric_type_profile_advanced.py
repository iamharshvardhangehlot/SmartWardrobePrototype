from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0010_userprofile_city_timezone"),
    ]

    operations = [
        migrations.AddField(
            model_name="garment",
            name="fabric_type",
            field=models.CharField(
                blank=True,
                choices=[
                    ("Cotton", "Cotton"),
                    ("Linen", "Linen"),
                    ("Wool", "Wool"),
                    ("Denim", "Denim"),
                    ("Silk", "Silk"),
                    ("Polyester", "Polyester"),
                    ("Nylon", "Nylon"),
                    ("Synthetic", "Synthetic/Blend"),
                    ("Leather", "Leather"),
                    ("Suede", "Suede"),
                    ("Other", "Other"),
                ],
                max_length=30,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="advanced_stylist_enabled",
            field=models.BooleanField(default=False),
        ),
    ]
