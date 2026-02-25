import json
from pathlib import Path

from django import template
from django.conf import settings
from django.templatetags.static import static
from django.utils.safestring import mark_safe

register = template.Library()


@register.simple_tag
def vite_asset(entry_name: str) -> str:
    """
    Render script/link tags for a Vite build entry using the manifest.
    """
    app_static_dir = Path(settings.BASE_DIR) / "core" / "static" / "app"
    manifest_path = app_static_dir / ".vite" / "manifest.json"
    if not manifest_path.exists():
        manifest_path = app_static_dir / "manifest.json"
    if not manifest_path.exists():
        return mark_safe("")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    entry = manifest.get(entry_name)
    if not entry:
        return mark_safe("")

    tags = []
    for css_file in entry.get("css", []):
        tags.append(f'<link rel="stylesheet" href="{static("app/" + css_file)}">')
    tags.append(f'<script type="module" src="{static("app/" + entry["file"])}"></script>')
    return mark_safe("\n".join(tags))
