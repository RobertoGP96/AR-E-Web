"""
Script para diagnosticar el problema con los clientes asignados
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import CustomUser

print("=== Diagnóstico de Clientes Asignados ===\n")

# Obtener todos los usuarios
all_users = CustomUser.objects.all()
print(f"Total de usuarios en sistema: {all_users.count()}")

# Usuarios por rol
for role, role_name in CustomUser.ROLE_CHOICES:
    count = CustomUser.objects.filter(role=role).count()
    if count > 0:
        print(f"  - {role_name}: {count}")

print("\n=== Agentes y sus Clientes ===\n")

agents = CustomUser.objects.filter(role='agent', is_active=True)
print(f"Agentes activos: {agents.count()}\n")

for agent in agents:
    print(f"Agente: {agent.full_name} (ID: {agent.id})")
    print(f"  Email: {agent.email}")
    print(f"  Teléfono: {agent.phone_number}")
    
    # Verificar clientes asignados con diferentes métodos
    clients_method1 = CustomUser.objects.filter(assigned_agent=agent, role='client')
    clients_method2 = CustomUser.objects.filter(assigned_agent=agent)
    clients_method3 = agent.assigned_clients.all()
    
    print(f"  Clientes (con role='client'): {clients_method1.count()}")
    print(f"  Clientes (sin filtro de role): {clients_method2.count()}")
    print(f"  Clientes (via related_name): {clients_method3.count()}")
    
    if clients_method2.count() > 0:
        print(f"\n  Lista de usuarios asignados:")
        for client in clients_method2:
            print(f"    - {client.full_name} (Role: {client.role}, ID: {client.id})")
    print()

print("\n=== Clientes sin Agente Asignado ===\n")
clients_without_agent = CustomUser.objects.filter(role='client', assigned_agent__isnull=True)
print(f"Clientes sin agente: {clients_without_agent.count()}")
if clients_without_agent.count() > 0:
    for client in clients_without_agent:
        print(f"  - {client.full_name} (ID: {client.id})")

print("\n=== Usuarios con Agente Asignado (todos los roles) ===\n")
users_with_agent = CustomUser.objects.filter(assigned_agent__isnull=False)
print(f"Total de usuarios con agente asignado: {users_with_agent.count()}")
if users_with_agent.count() > 0:
    for user in users_with_agent:
        print(f"  - {user.full_name} (Role: {user.role}, Agente: {user.assigned_agent.full_name})")
