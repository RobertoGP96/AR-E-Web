"""
Script para probar los endpoints de notificaciones
"""
import os
import django
import requests
from django.contrib.auth import get_user_model

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

User = get_user_model()

def test_notifications_endpoints():
    """Probar endpoints de notificaciones"""
    
    # Credenciales del superusuario
    phone = "53123456"
    password = "admin123"
    
    base_url = "http://127.0.0.1:8000/arye_system"
    
    print("=" * 60)
    print("PRUEBA DE ENDPOINTS DE NOTIFICACIONES")
    print("=" * 60)
    
    # 1. Login
    print("\n1. Obteniendo token de autenticación...")
    login_response = requests.post(
        f"{base_url}/auth/",
        json={"phone_number": phone, "password": password}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Error en login: {login_response.status_code}")
        print(login_response.text)
        return
    
    token = login_response.json()['access']
    headers = {"Authorization": f"Bearer {token}"}
    print(f"✅ Token obtenido exitosamente")
    
    # 2. Obtener lista de notificaciones
    print("\n2. Obteniendo lista de notificaciones...")
    notifications_response = requests.get(
        f"{base_url}/api_data/notifications/",
        headers=headers
    )
    
    if notifications_response.status_code == 200:
        data = notifications_response.json()
        count = data.get('count', 0)
        print(f"✅ Notificaciones obtenidas: {count}")
        if data.get('results'):
            print(f"   - Primera notificación: {data['results'][0].get('title', 'Sin título')}")
    else:
        print(f"❌ Error obteniendo notificaciones: {notifications_response.status_code}")
        print(notifications_response.text)
    
    # 3. Obtener conteo de no leídas
    print("\n3. Obteniendo conteo de no leídas...")
    unread_response = requests.get(
        f"{base_url}/api_data/notifications/unread_count/",
        headers=headers
    )
    
    if unread_response.status_code == 200:
        unread_count = unread_response.json().get('unread_count', 0)
        print(f"✅ Notificaciones no leídas: {unread_count}")
    else:
        print(f"❌ Error obteniendo conteo: {unread_response.status_code}")
        print(unread_response.text)
    
    # 4. Obtener estadísticas
    print("\n4. Obteniendo estadísticas...")
    stats_response = requests.get(
        f"{base_url}/api_data/notifications/stats/",
        headers=headers
    )
    
    if stats_response.status_code == 200:
        stats = stats_response.json()
        print(f"✅ Estadísticas obtenidas:")
        print(f"   - Total: {stats.get('total', 0)}")
        print(f"   - No leídas: {stats.get('unread', 0)}")
        print(f"   - Por tipo: {stats.get('by_type', {})}")
    else:
        print(f"❌ Error obteniendo estadísticas: {stats_response.status_code}")
        print(stats_response.text)
    
    # 5. Obtener preferencias
    print("\n5. Obteniendo preferencias de notificación...")
    prefs_response = requests.get(
        f"{base_url}/api_data/notification-preferences/",
        headers=headers
    )
    
    if prefs_response.status_code == 200:
        prefs = prefs_response.json()
        print(f"✅ Preferencias obtenidas")
        if isinstance(prefs, dict):
            print(f"   - Email: {prefs.get('email_notifications', 'N/A')}")
            print(f"   - Push: {prefs.get('push_notifications', 'N/A')}")
    else:
        print(f"❌ Error obteniendo preferencias: {prefs_response.status_code}")
        print(prefs_response.text)
    
    # 6. Probar endpoint de tipos de notificación
    print("\n6. Obteniendo tipos de notificación disponibles...")
    types_response = requests.get(
        f"{base_url}/api_data/notification-preferences/notification_types/",
        headers=headers
    )
    
    if types_response.status_code == 200:
        types = types_response.json().get('notification_types', [])
        print(f"✅ Tipos disponibles: {len(types)}")
        for ntype in types[:3]:  # Mostrar los primeros 3
            print(f"   - {ntype.get('value')}: {ntype.get('label')}")
    else:
        print(f"❌ Error obteniendo tipos: {types_response.status_code}")
    
    # 7. Probar endpoint de reportes de ganancias
    print("\n7. Obteniendo reportes de ganancias...")
    reports_response = requests.get(
        f"{base_url}/api_data/reports/profits/",
        headers=headers
    )
    
    if reports_response.status_code == 200:
        reports = reports_response.json().get('data', {})
        print(f"✅ Reportes de ganancias obtenidos")
        summary = reports.get('summary', {})
        print(f"   - Ingresos totales: ${summary.get('total_revenue', 0):,.2f}")
        print(f"   - Ganancia del sistema: ${summary.get('total_system_profit', 0):,.2f}")
        print(f"   - Ganancia de agentes: ${summary.get('total_agent_profits', 0):,.2f}")
        print(f"   - Margen: {summary.get('profit_margin', 0):.2f}%")
        
        monthly = reports.get('monthly_reports', [])
        agents = reports.get('agent_reports', [])
        print(f"   - Reportes mensuales: {len(monthly)}")
        print(f"   - Agentes registrados: {len(agents)}")
    else:
        print(f"❌ Error obteniendo reportes: {reports_response.status_code}")
        print(reports_response.text)
    
    print("\n" + "=" * 60)
    print("PRUEBA COMPLETADA")
    print("=" * 60)

if __name__ == '__main__':
    test_notifications_endpoints()
