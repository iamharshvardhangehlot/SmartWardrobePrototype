from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0013_add_dress_category"),
    ]

    operations = [
        migrations.AddField(
            model_name="garment",
            name="ai_status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("processing", "Processing"),
                    ("complete", "Complete"),
                    ("failed", "Failed"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
        migrations.CreateModel(
            name="TryOnJob",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status", models.CharField(choices=[("pending", "Pending"), ("running", "Running"), ("success", "Success"), ("failed", "Failed")], default="pending", max_length=20)),
                ("result_url", models.CharField(blank=True, max_length=512)),
                ("error_message", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("bottom", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="tryon_bottom_jobs", to="core.garment")),
                ("owner", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="auth.user")),
                ("top", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="tryon_top_jobs", to="core.garment")),
            ],
        ),
    ]
