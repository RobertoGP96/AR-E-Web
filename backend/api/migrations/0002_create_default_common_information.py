# Generated manually

from django.db import migrations


def create_default_common_information(apps, schema_editor):
    """Crear configuración inicial del sistema si no existe"""
    CommonInformation = apps.get_model('api', 'CommonInformation')
    
    # Solo crear si no existe ninguna configuración
    if not CommonInformation.objects.exists():
        CommonInformation.objects.create(
            change_rate=20.0,
            cost_per_pound=5.0
        )


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),  # Ajustar según tu última migración
    ]

    operations = [
        migrations.RunPython(create_default_common_information),
    ]
