# Segunda foto del paquete (admin-next: /packages, /packages/[id]).

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0040_add_panel_filter_indexes'),
    ]

    operations = [
        migrations.AddField(
            model_name='package',
            name='package_picture_2',
            field=models.TextField(blank=True, help_text='Segunda foto del paquete (URL)', null=True),
        ),
    ]
