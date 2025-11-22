"""
Script simple para crear la configuración inicial del sistema
"""
import os
import sys
import django

# Configurar Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import CommonInformation

print("Creando configuración inicial del sistema...")

# Verificar si ya existe
existing = CommonInformation.objects.first()
if existing:
    print(f"✓ Ya existe una configuración:")
    print(f"  - ID: {existing.id}")
    print(f"  - Tasa de cambio: ${existing.change_rate}")
    print(f"  - Costo por libra: ${existing.cost_per_pound}")
else:
    # Crear nueva configuración
    config = CommonInformation.objects.create(
        change_rate=20.0,
        cost_per_pound=5.0
    )
    print(f"✓ Configuración creada exitosamente:")
    print(f"  - ID: {config.id}")
    print(f"  - Tasa de cambio: ${config.change_rate}")
    print(f"  - Costo por libra: ${config.cost_per_pound}")

print("\n✅ Listo!")
