"""
Script para probar el endpoint de configuración del sistema
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import CommonInformation
from api.serializers import CommonInformationSerializer

print("=" * 70)
print("PRUEBA DEL SISTEMA DE CONFIGURACIÓN")
print("=" * 70)

# 1. Obtener o crear la instancia
print("\n1. Obteniendo/creando instancia de CommonInformation...")
config = CommonInformation.get_instance()
print(f"   ✓ ID: {config.id}")
print(f"   ✓ Tasa de cambio: ${config.change_rate}")
print(f"   ✓ Costo por libra: ${config.cost_per_pound}")
print(f"   ✓ Creado: {config.created_at}")
print(f"   ✓ Actualizado: {config.updated_at}")

# 2. Serializar
print("\n2. Serializando datos...")
serializer = CommonInformationSerializer(config)
print(f"   ✓ Datos serializados:")
for key, value in serializer.data.items():
    print(f"      - {key}: {value}")

# 3. Actualizar valores
print("\n3. Actualizando valores...")
new_data = {
    'change_rate': 25.50,
    'cost_per_pound': 6.00
}
serializer = CommonInformationSerializer(config, data=new_data, partial=True)
if serializer.is_valid():
    updated_config = serializer.save()
    print(f"   ✓ Nueva tasa de cambio: ${updated_config.change_rate}")
    print(f"   ✓ Nuevo costo por libra: ${updated_config.cost_per_pound}")
else:
    print(f"   ✗ Errores: {serializer.errors}")

# 4. Verificar actualización
print("\n4. Verificando persistencia...")
config_refreshed = CommonInformation.get_instance()
print(f"   ✓ Tasa de cambio guardada: ${config_refreshed.change_rate}")
print(f"   ✓ Costo por libra guardado: ${config_refreshed.cost_per_pound}")

# 5. Prueba de validación (valores negativos)
print("\n5. Probando validaciones...")
invalid_data = {'change_rate': -10}
serializer = CommonInformationSerializer(config, data=invalid_data, partial=True)
if not serializer.is_valid():
    print(f"   ✓ Validación correcta - rechaza valores negativos")
    print(f"      Errores: {serializer.errors}")
else:
    print(f"   ✗ ERROR: No validó correctamente")

print("\n" + "=" * 70)
print("✅ TODAS LAS PRUEBAS COMPLETADAS")
print("=" * 70)
