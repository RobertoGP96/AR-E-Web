"""
Script simple para verificar el estado actual de los productos y sus transiciones
"""
import os
import sys
import django

# Agregar el directorio backend al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Product, ProductBuyed, ProductReceived, ProductDelivery
from api.enums import ProductStatusEnum

def verify_product_status():
    """
    Verifica el estado de los productos existentes y muestra estadísticas
    """
    print("\n" + "="*70)
    print("VERIFICACIÓN DEL ESTADO DE PRODUCTOS")
    print("="*70 + "\n")
    
    # Estadísticas generales
    total_products = Product.objects.count()
    print(f"Total de productos en el sistema: {total_products}\n")
    
    if total_products == 0:
        print("❌ No hay productos en el sistema para verificar.")
        return
    
    # Contar productos por estado
    print("Distribución por estado:")
    print("-" * 70)
    for status in [ProductStatusEnum.ENCARGADO, ProductStatusEnum.COMPRADO, 
                   ProductStatusEnum.RECIBIDO, ProductStatusEnum.ENTREGADO]:
        count = Product.objects.filter(status=status.value).count()
        print(f"  {status.value:15} : {count:3} productos")
    print("-" * 70 + "\n")
    
    # Analizar algunos productos en detalle
    print("Análisis detallado de productos (primeros 5):")
    print("="*70)
    
    for product in Product.objects.all()[:5]:
        print(f"\n🔹 Producto: {product.name} (ID: {product.id})")
        print(f"   Estado actual: {product.status}")
        print(f"   Cantidad solicitada: {product.amount_requested}")
        print(f"   Cantidad comprada: {product.amount_purchased}")
        print(f"   Cantidad recibida: {product.total_received}")
        print(f"   Cantidad entregada: {product.amount_delivered}")
        
        # Verificar consistencia
        issues = []
        
        # Verificar si el estado es correcto según las cantidades
        if product.amount_delivered >= product.amount_requested:
            if product.status != ProductStatusEnum.ENTREGADO.value:
                issues.append(f"⚠ Debería estar ENTREGADO (entregado: {product.amount_delivered}/{product.amount_requested})")
        elif product.total_received >= product.amount_requested:
            if product.status != ProductStatusEnum.RECIBIDO.value and product.status != ProductStatusEnum.ENTREGADO.value:
                issues.append(f"⚠ Debería estar RECIBIDO (recibido: {product.total_received}/{product.amount_requested})")
        elif product.amount_purchased >= product.amount_requested:
            if product.status not in [ProductStatusEnum.COMPRADO.value, ProductStatusEnum.RECIBIDO.value, ProductStatusEnum.ENTREGADO.value]:
                issues.append(f"⚠ Debería estar COMPRADO (comprado: {product.amount_purchased}/{product.amount_requested})")
        
        if issues:
            print("   " + "\n   ".join(issues))
        else:
            print("   ✓ Estado consistente")
        
        # Mostrar registros relacionados
        buys_count = product.buys.count()
        receives_count = product.receiveds.count()
        delivers_count = product.delivers.count()
        
        print(f"   Registros: {buys_count} compras, {receives_count} recepciones, {delivers_count} entregas")
    
    print("\n" + "="*70)
    print("VERIFICACIÓN COMPLETADA")
    print("="*70 + "\n")

if __name__ == "__main__":
    verify_product_status()
