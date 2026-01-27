import os
import sys
import django

# Añadir el directorio actual al path para poder importar la configuración
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configurar el entorno de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Order

def update_all_order_costs():
    """
    Script para actualizar el campo total_costs de todas las órdenes existentes.
    Utiliza el método update_total_costs definido en el modelo Order.
    """
    orders = Order.objects.all()
    total_orders = orders.count()
    
    print(f"Iniciando actualización de {total_orders} órdenes...")
    
    updated_count = 0
    error_count = 0
    
    for order in orders:
        try:
            old_cost = order.total_costs
            new_cost = order.update_total_costs()
            
            # Solo para mostrar información útil en la consola
            if abs(old_cost - new_cost) > 0.01:
                print(f"Orden #{order.pk} actualizada: {old_cost} -> {new_cost}")
            
            updated_count += 1
            if updated_count % 10 == 0:
                print(f"Progreso: {updated_count}/{total_orders} órdenes procesadas...")
                
        except Exception as e:
            print(f"Error actualizando Orden #{order.pk}: {str(e)}")
            error_count += 1
            
    print("\n--- RESUMEN ---")
    print(f"Total de órdenes revisadas: {total_orders}")
    print(f"Órdenes actualizadas con éxito: {updated_count}")
    print(f"Errores encontrados: {error_count}")
    print("----------------")

if __name__ == "__main__":
    update_all_order_costs()
