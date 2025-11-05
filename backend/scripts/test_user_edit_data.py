"""
Script para verificar los datos del usuario para el formulario de edición
"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import CustomUser
from api.serializers import UserSerializer

print("=== Verificación de Datos para Formulario de Edición ===\n")

# Obtener un usuario de cada tipo
users = CustomUser.objects.all()[:3]

for user in users:
    print(f"\n{'='*60}")
    print(f"Usuario: {user.full_name} (ID: {user.id})")
    print(f"Rol: {user.role}")
    print(f"{'='*60}")
    
    # Serializar como lo hace el backend
    serializer = UserSerializer(user)
    data = serializer.data
    
    print("\nDatos que recibe el frontend (JSON):")
    print(json.dumps(data, indent=2, default=str))
    
    # Verificar campos problemáticos
    print("\n📋 Verificación de campos:")
    print(f"  • Email: '{data.get('email')}' (tipo: {type(data.get('email')).__name__})")
    print(f"  • Home address: '{data.get('home_address')}' (tipo: {type(data.get('home_address')).__name__})")
    print(f"  • Agent profit: {data.get('agent_profit')} (tipo: {type(data.get('agent_profit')).__name__})")
    print(f"  • Assigned agent: {data.get('assigned_agent')} (tipo: {type(data.get('assigned_agent')).__name__})")
    
    # Simular lo que hace el frontend con valores null
    print("\n🔄 Conversión para formulario:")
    form_data = {
        'email': data.get('email') or '',
        'name': data.get('name'),
        'last_name': data.get('last_name'),
        'home_address': data.get('home_address') or '',
        'phone_number': data.get('phone_number'),
        'role': data.get('role'),
        'agent_profit': data.get('agent_profit') or 0,
        'assigned_agent': data.get('assigned_agent') or None,
    }
    
    print(json.dumps(form_data, indent=2))
    
    # Verificar si hay problemas potenciales
    issues = []
    if data.get('email') is None:
        issues.append("❌ Email es NULL - puede causar problemas con validación")
    if data.get('home_address') is None:
        issues.append("⚠️ Home address es NULL")
    if data.get('assigned_agent') is None and user.role == 'client':
        issues.append("⚠️ Cliente sin agente asignado")
    
    if issues:
        print("\n🔍 Problemas detectados:")
        for issue in issues:
            print(f"  {issue}")
    else:
        print("\n✅ No se detectaron problemas")

print("\n" + "="*60)
print("✅ Verificación completada")
print("="*60)
