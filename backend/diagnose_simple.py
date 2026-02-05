"""
Script simple para diagnosticar el problema de estado de productos
sin requerir configuración completa de Django
"""

# Simulación del problema basado en tu descripción:
# Producto con: amount_requested=1, amount_purchased=1, amount_received=1
# Pero estado != RECIBIDO

def analyze_problem():
    print("DIAGNÓSTICO DEL PROBLEMA")
    print("="*50)
    
    print("\nSITUACIÓN DESCRITA:")
    print("- Producto con cantidad encargada: 1")
    print("- Producto con cantidad comprada: 1") 
    print("- Producto con cantidad recibida: 1")
    print("- Estado actual: NO RECIBIDO")
    
    print("\nANÁLISIS DE LA LÓGICA ACTUAL:")
    print("El signal update_product_on_received_save verifica:")
    print("1. total_received >= amount_requested")
    print("2. amount_requested > 0")
    print("3. status in [COMPRADO, ENCARGADO]")
    
    print("\nPOSIBLES CAUSAS:")
    print("1. El campo amount_received del producto no coincide con la suma real")
    print("2. El estado del producto no es COMPRADO ni ENCARGADO")
    print("3. El signal no se ejecutó cuando se creó el ProductReceived")
    print("4. Hay múltiples ProductReceived y la suma es incorrecta")
    
    print("\nVERIFICACIONES MANUALES SUGERIDAS:")
    print("1. Ejecuta en Django shell:")
    print("   from api.models import Product, ProductReceived")
    print("   product = Product.objects.get(id=<ID_DEL_PRODUCTO>)")
    print("   total_received = sum(pr.amount_received for pr in product.receiveds.all())")
    print("   print(f'amount_received en BD: {product.amount_received}')")
    print("   print(f'total_received calculado: {total_received}')")
    print("   print(f'Estado actual: {product.status}')")
    
    print("\n2. Si hay inconsistencia, corrige con:")
    print("   product.amount_received = total_received")
    print("   if total_received >= product.amount_requested:")
    print("       product.status = 'Recibido'")
    print("   product.save()")
    
    print("\n3. Para verificar si el problema es generalizado:")
    print("   from api.models import Product")
    print("   from api.enums import ProductStatusEnum")
    print("   problematicos = []")
    print("   for p in Product.objects.all():")
    print("       total_received = sum(pr.amount_received for pr in p.receiveds.all())")
    print("       if (total_received >= p.amount_requested and ")
    print("           p.status != ProductStatusEnum.RECIBIDO.value and")
    print("           p.status != ProductStatusEnum.ENTREGADO.value):")
    print("           problematicos.append(p)")
    print("   print(f'Productos con problemas: {len(problematicos)}')")

if __name__ == "__main__":
    analyze_problem()
