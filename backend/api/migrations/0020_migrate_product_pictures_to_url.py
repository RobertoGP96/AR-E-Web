from django.db import migrations
import json


def migrate_product_pictures(apps, schema_editor):
    Product = apps.get_model('api', 'Product')
    for p in Product.objects.all():
        val = getattr(p, 'product_pictures', None)
        if not val:
            continue
        # If it's a JSON array string, pick the first URL
        try:
            parsed = json.loads(val)
            if isinstance(parsed, list) and parsed:
                first = parsed[0]
                if isinstance(first, str):
                    p.product_pictures = first
                elif isinstance(first, dict):
                    p.product_pictures = first.get('image_url') or first.get('picture') or ''
                else:
                    # unknown shape, leave blank
                    p.product_pictures = ''
                p.save(update_fields=['product_pictures'])
        except Exception:
            # Not a JSON array - assume it's already a single url string; leave it
            continue


class Migration(migrations.Migration):
    dependencies = [
        ('api', '0019_remove_deliverreceip_deliver_picture_and_more'),
    ]

    operations = [
        migrations.RunPython(migrate_product_pictures, migrations.RunPython.noop),
    ]
