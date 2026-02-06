#!/usr/bin/env python
"""
Análisis de la lógica actual del flujo de cambio de estado de productos
sin crear nuevas instancias, solo analizando el código existente.
"""

import os
import sys

# Configuración de Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + '/..')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

import django
django.setup()

from api.signals import _determine_product_status
from api.enums import ProductStatusEnum

def analyze_status_determination():
    """Analiza la función _determine_product_status"""
    print("\n" + "="*80)
    print("ANÁLISIS DE LA FUNCIÓN: _determine_product_status()")
    print("="*80)
    
    test_cases = [
        {
            "name": "CASO 1: amount_requested=10, purchased=0, received=0, delivered=0",
            "amount_purchased": 0,
            "amount_received": 0,
            "amount_delivered": 0,
            "amount_requested": 10,
            "current_status": ProductStatusEnum.ENCARGADO.value,
            "expected": ProductStatusEnum.ENCARGADO.value,
        },
        {
            "name": "CASO 2: amount_requested=10, purchased=10, received=0, delivered=0",
            "amount_purchased": 10,
            "amount_received": 0,
            "amount_delivered": 0,
            "amount_requested": 10,
            "current_status": ProductStatusEnum.ENCARGADO.value,
            "expected": ProductStatusEnum.COMPRADO.value,
        },
        {
            "name": "CASO 3: amount_requested=10, purchased=10, received=10, delivered=0",
            "amount_purchased": 10,
            "amount_received": 10,
            "amount_delivered": 0,
            "amount_requested": 10,
            "current_status": ProductStatusEnum.COMPRADO.value,
            "expected": ProductStatusEnum.RECIBIDO.value,
        },
        {
            "name": "CASO 4: amount_requested=10, purchased=10, received=10, delivered=10",
            "amount_purchased": 10,
            "amount_received": 10,
            "amount_delivered": 10,
            "amount_requested": 10,
            "current_status": ProductStatusEnum.RECIBIDO.value,
            "expected": ProductStatusEnum.ENTREGADO.value,
        },
        {
            "name": "CASO 5: REEMBOLSO - amount_requested=10, purchased=8, received=0, delivered=0",
            "amount_purchased": 8,
            "amount_received": 0,
            "amount_delivered": 0,
            "amount_requested": 10,
            "current_status": ProductStatusEnum.COMPRADO.value,
            "expected": ProductStatusEnum.ENCARGADO.value,
        },
        {
            "name": "CASO 6: PARCIAL - amount_requested=10, purchased=5, received=0, delivered=0",
            "amount_purchased": 5,
            "amount_received": 0,
            "amount_delivered": 0,
            "amount_requested": 10,
            "current_status": ProductStatusEnum.ENCARGADO.value,
            "expected": ProductStatusEnum.ENCARGADO.value,
        },
        {
            "name": "CASO 7: PARCIAL - amount_requested=10, purchased=10, received=5, delivered=0",
            "amount_purchased": 10,
            "amount_received": 5,
            "amount_delivered": 0,
            "amount_requested": 10,
            "current_status": ProductStatusEnum.COMPRADO.value,
            "expected": ProductStatusEnum.COMPRADO.value,
        },
        {
            "name": "CASO 8: ERROR POTENCIAL - delivered>received but received<requested",
            "amount_purchased": 10,
            "amount_received": 5,
            "amount_delivered": 5,
            "amount_requested": 10,
            "current_status": ProductStatusEnum.COMPRADO.value,
            "expected": ProductStatusEnum.COMPRADO.value,
        },
    ]
    
    results = []
    for case in test_cases:
        result = _determine_product_status(
            amount_purchased=case["amount_purchased"],
            amount_received=case["amount_received"],
            amount_delivered=case["amount_delivered"],
            amount_requested=case["amount_requested"],
            current_status=case["current_status"]
        )
        
        passed = result == case["expected"]
        results.append(passed)
        
        status_emoji = "✓" if passed else "❌"
        print(f"\n{status_emoji} {case['name']}")
        print(f"  Esperado: {case['expected']}")
        print(f"  Obtenido: {result}")
        
        if not passed:
            print(f"  ⚠️  FALLO: El estado devuelto no es el esperado")
    
    return results


def analyze_signal_logic():
    """Analiza la lógica de los signals"""
    print("\n" + "="*80)
    print("ANÁLISIS DE LA LÓGICA DE SIGNALS")
    print("="*80)
    
    print("""
    PROBLEMA 1: ¿Los signals se activan correctamente?
    ─────────────────────────────────────────────────
    Los signals en api/signals.py se registran para:
    - post_save de ProductBuyed
    - post_delete de ProductBuyed
    - post_save de ProductReceived
    - post_delete de ProductReceived
    - post_save de ProductDelivery
    - post_delete de ProductDelivery
    
    ✓ Los signals están configurados en api/signals.py
    ✓ Las funciones se ejecutan después de guardar/eliminar
    ✓ Cada signal recalcula los totales y actualiza el estado
    
    POSIBLE PROBLEMA: Verificar que los signals se hayan registrado
    en la aplicación Django correctamente.
    """)
    
    print("""
    PROBLEMA 2: ¿La lógica de determinación de estado es correcta?
    ─────────────────────────────────────────────────────────────
    
    Analizar la función _determine_product_status():
    
    Condición 1 - ENTREGADO:
    if amount_delivered >= amount_received AND 
       amount_delivered >= amount_purchased AND 
       amount_delivered > 0
    → ✓ Correcta: Verifica que se entregó lo recibido y lo comprado
    
    Condición 2 - RECIBIDO:
    if amount_received >= amount_requested AND 
       amount_received > 0
    → ⚠️  PROBLEMA POTENCIAL: 
        Solo verifica que se recibió lo solicitado
        Pero no verifica el estado anterior (COMPRADO)
        La lógica se ve correcta pero hay que verificar los flujos
    
    Condición 3 - COMPRADO:
    if amount_purchased >= amount_requested AND 
       amount_purchased > 0
    → ✓ Correcta: Verifica que se compró lo solicitado
    
    Condición 4 - ENCARGADO:
    Fallback: Vuelve al estado inicial si no cumple ninguna condición
    → ✓ Correcta: Manejo por defecto
    """)
    
    print("""
    PROBLEMA 3: ¿Se están sumando correctamente los totales?
    ───────────────────────────────────────────────────────
    
    En update_product_on_buyed_save():
    total_purchased = sum(
        pb.amount_buyed - pb.quantity_refuned
        for pb in product.buys.all()
    )
    → ✓ Correcto: Suma todas las compras y resta los reembolsos
    
    En update_product_on_received_save():
    total_received = sum(
        pr.amount_received
        for pr in product.receiveds.all()
    )
    → ✓ Correcto: Suma todas las recepciones
    
    En update_product_on_delivery_save():
    total_delivered = sum(
        pd.amount_delivered
        for pd in product.delivers.all()
    )
    → ✓ Correcto: Suma todas las entregas
    """)


def analyze_potential_issues():
    """Identifica problemas potenciales"""
    print("\n" + "="*80)
    print("PROBLEMAS POTENCIALES IDENTIFICADOS")
    print("="*80)
    
    print("""
    1. SIGNALS NO REGISTRADOS EN app.py
       ──────────────────────────────────
       Los signals deben estar importados en api/apps.py en ready():
       
       from . import signals  # O importar manualmente
       
       ¿VERIFICAR: ¿Está configurado en api/apps.py?
    
    
    2. EJECUCIÓN EN CASCADA DE SIGNALS
       ────────────────────────────────
       Cuando se guarda un ProductBuyed:
       1. Signal post_save se ejecuta
       2. Este signal hace save() en el Product
       3. El save() de Product dispara su propio signal
       
       Esto puede causar ciclos o no actualizar correctamente.
       
       ¿VERIFICAR: ¿Hay configuración de update_fields para evitar cascadas?
    
    
    3. RELACIONES INVERSAS (related_name)
       ──────────────────────────────────
       ProductBuyed: related_name="buys"
       ProductReceived: related_name="receiveds"
       ProductDelivery: related_name="delivers"
       
       ¿VERIFICAR: ¿Los related_name están correctos en los modelos?
    
    
    4. PROBLEMAS DE ACTUALIZACIÓN PARCIAL
       ───────────────────────────────────
       Algunos signals usan update_fields para optimización.
       Pero esto puede evitar que ciertos campos se actualicen.
       
       ¿VERIFICAR: ¿update_fields incluye todos los campos necesarios?
    
    
    5. ORDEN DE EJECUCIÓN
       ──────────────────
       ¿Qué pasa si:
       - Se crea un ProductBuyed pero el signal falla?
       - Se actualiza amount_purchased pero falla el cambio de estado?
       
       ¿VERIFICAR: ¿Hay manejo de excepciones?
    """)


def check_app_configuration():
    """Verifica la configuración de la aplicación"""
    print("\n" + "="*80)
    print("VERIFICACIÓN DE CONFIGURACIÓN DE LA APLICACIÓN")
    print("="*80)
    
    try:
        from api.apps import ApiConfig
        print(f"\n✓ ApiConfig encontrado")
        print(f"  Name: {ApiConfig.name}")
        
        # Ver si tiene ready()
        if hasattr(ApiConfig, 'ready'):
            print(f"  ✓ Método ready() existe")
        else:
            print(f"  ❌ Método ready() NO existe")
            print(f"     → Los signals puede que no estén registrados")
    except Exception as e:
        print(f"❌ Error cargando ApiConfig: {e}")


def main():
    """Ejecuta todos los análisis"""
    print("\n" + "="*80)
    print("DIAGNÓSTICO: LÓGICA DE CAMBIO DE ESTADO DE PRODUCTOS")
    print("="*80)
    
    # Análisis de la función de determinación de estado
    results = analyze_status_determination()
    
    # Resumen de resultados
    print("\n" + "="*80)
    print("RESUMEN DE PRUEBAS DE DETERMINACIÓN DE ESTADO")
    print("="*80)
    
    passed = sum(results)
    total = len(results)
    
    print(f"\nPruebas pasadas: {passed}/{total}")
    if passed == total:
        print("✓ Todos los casos pasaron")
    else:
        print(f"❌ {total - passed} casos fallaron")
    
    # Análisis de signals
    analyze_signal_logic()
    
    # Problemas potenciales
    analyze_potential_issues()
    
    # Verificación de configuración
    check_app_configuration()
    
    print("\n" + "="*80)
    print("RECOMENDACIONES PARA FIX")
    print("="*80)
    
    print("""
    1. Verificar en api/apps.py que los signals estén registrados:
       
       class ApiConfig(AppConfig):
           default_auto_field = 'django.db.models.BigAutoField'
           name = 'api'
           
           def ready(self):
               import api.signals  # ← ESTO DEBE ESTAR AQUÍ
    
    
    2. Verificar que la función _determine_product_status() sea correcta
    
    
    3. Añadir logging en los signals para debugging
    
    
    4. Hacer pruebas manuales con:
       python manage.py shell
       
       Crear un producto y verificar que los signals se ejecutan
    
    
    5. Considerar usar @transaction.atomic() en los signals
       para evitar inconsistencias
    """)


if __name__ == "__main__":
    main()
