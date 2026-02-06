#!/usr/bin/env python
"""
Script para validar que las dependencias de estados de productos se cumplen correctamente.

Comprueba que:
1. RECIBIDO SOLO si COMPRADO completo
2. ENTREGADO SOLO si RECIBIDO completo
3. No hay transiciones inválidas
4. Los reembolsos revierten estados correctamente
"""

import os
import sys
import django
from pathlib import Path

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))

django.setup()

from api.enums import ProductStatusEnum
from api.signals import _determine_product_status

def test_state_dependency(amount_purchased, amount_received, amount_delivered, 
                         amount_requested, expected_status, test_name):
    """Prueba una combinación de cantidades y verifica el estado resultante"""
    
    current_status = ProductStatusEnum.ENCARGADO.value
    result_status = _determine_product_status(
        amount_purchased=amount_purchased,
        amount_received=amount_received,
        amount_delivered=amount_delivered,
        amount_requested=amount_requested,
        current_status=current_status
    )
    
    passed = result_status == expected_status
    status_icon = "✓ PASS" if passed else "✗ FAIL"
    
    print(f"\n{status_icon} | {test_name}")
    print(f"   Compra: {amount_purchased}/{amount_requested} | Recepción: {amount_received}/{amount_requested} | Entrega: {amount_delivered}/{amount_requested}")
    print(f"   Esperado: {expected_status} | Obtenido: {result_status}")
    
    if not passed:
        print(f"   ⚠️  ERROR: El estado no es el esperado!")
    
    return passed


def main():
    print("=" * 80)
    print("🧪 VALIDACIÓN DE DEPENDENCIAS DE ESTADOS DE PRODUCTOS")
    print("=" * 80)
    
    tests_passed = 0
    tests_total = 0
    
    # ========================================================================
    # GRUPO 1: FLUJO NORMAL VÁLIDO
    # ========================================================================
    print("\n" + "=" * 80)
    print("📊 GRUPO 1: FLUJO NORMAL VÁLIDO (Transiciones correctas)")
    print("=" * 80)
    
    # Test 1: ENCARGADO → ENCARGADO (sin compra)
    tests_total += 1
    if test_state_dependency(0, 0, 0, 10, ProductStatusEnum.ENCARGADO.value, 
                            "Test 1: Sin compra → ENCARGADO"):
        tests_passed += 1
    
    # Test 2: ENCARGADO → COMPRADO (compra completa)
    tests_total += 1
    if test_state_dependency(10, 0, 0, 10, ProductStatusEnum.COMPRADO.value,
                            "Test 2: Compra completa → COMPRADO"):
        tests_passed += 1
    
    # Test 3: COMPRADO → COMPRADO (recepción parcial)
    tests_total += 1
    if test_state_dependency(10, 5, 0, 10, ProductStatusEnum.COMPRADO.value,
                            "Test 3: Recepción parcial → COMPRADO"):
        tests_passed += 1
    
    # Test 4: COMPRADO → RECIBIDO (recepción completa)
    tests_total += 1
    if test_state_dependency(10, 10, 0, 10, ProductStatusEnum.RECIBIDO.value,
                            "Test 4: Recepción completa → RECIBIDO"):
        tests_passed += 1
    
    # Test 5: RECIBIDO → RECIBIDO (entrega parcial)
    tests_total += 1
    if test_state_dependency(10, 10, 5, 10, ProductStatusEnum.RECIBIDO.value,
                            "Test 5: Entrega parcial → RECIBIDO"):
        tests_passed += 1
    
    # Test 6: RECIBIDO → ENTREGADO (entrega completa)
    tests_total += 1
    if test_state_dependency(10, 10, 10, 10, ProductStatusEnum.ENTREGADO.value,
                            "Test 6: Entrega completa → ENTREGADO"):
        tests_passed += 1
    
    # ========================================================================
    # GRUPO 2: TRANSICIONES INVÁLIDAS (Deben ser bloqueadas)
    # ========================================================================
    print("\n" + "=" * 80)
    print("🚫 GRUPO 2: TRANSICIONES INVÁLIDAS (Deben permanecer en estado anterior)")
    print("=" * 80)
    
    # Test 7: Intento de RECIBIDO sin COMPRADO completo
    tests_total += 1
    if test_state_dependency(5, 10, 0, 10, ProductStatusEnum.ENCARGADO.value,
                            "Test 7: Recepción sin compra completa → ENCARGADO (BLOQUEADO)"):
        tests_passed += 1
    
    # Test 8: Intento de ENTREGADO sin RECIBIDO completo
    tests_total += 1
    if test_state_dependency(10, 5, 10, 10, ProductStatusEnum.COMPRADO.value,
                            "Test 8: Entrega sin recepción completa → COMPRADO (BLOQUEADO)"):
        tests_passed += 1
    
    # Test 9: Intento de saltar de COMPRADO a ENTREGADO
    tests_total += 1
    if test_state_dependency(10, 0, 10, 10, ProductStatusEnum.COMPRADO.value,
                            "Test 9: Salto COMPRADO→ENTREGADO sin RECIBIDO → COMPRADO (BLOQUEADO)"):
        tests_passed += 1
    
    # Test 10: Intento de ir a ENTREGADO saltando todos los estados
    tests_total += 1
    if test_state_dependency(0, 0, 10, 10, ProductStatusEnum.ENCARGADO.value,
                            "Test 10: Entrega sin compra/recepción → ENCARGADO (BLOQUEADO)"):
        tests_passed += 1
    
    # ========================================================================
    # GRUPO 3: CASOS PARCIALES VÁLIDOS
    # ========================================================================
    print("\n" + "=" * 80)
    print("🔄 GRUPO 3: CASOS PARCIALES VÁLIDOS (Estados intermedios correctos)")
    print("=" * 80)
    
    # Test 11: Compra parcial, ninguna recepción
    tests_total += 1
    if test_state_dependency(5, 0, 0, 10, ProductStatusEnum.ENCARGADO.value,
                            "Test 11: Compra parcial (5/10) → ENCARGADO"):
        tests_passed += 1
    
    # Test 12: Compra parcial después completada
    tests_total += 1
    if test_state_dependency(10, 2, 0, 10, ProductStatusEnum.COMPRADO.value,
                            "Test 12: Compra completada + recepción parcial → COMPRADO"):
        tests_passed += 1
    
    # Test 13: Recepción menor a compra (válido, esperando más)
    tests_total += 1
    if test_state_dependency(10, 8, 0, 10, ProductStatusEnum.COMPRADO.value,
                            "Test 13: Recepción parcial (8/10) → COMPRADO"):
        tests_passed += 1
    
    # Test 14: Entrega parcial de lo recibido
    tests_total += 1
    if test_state_dependency(10, 10, 7, 10, ProductStatusEnum.RECIBIDO.value,
                            "Test 14: Entrega parcial (7/10) → RECIBIDO"):
        tests_passed += 1
    
    # ========================================================================
    # GRUPO 4: CASOS ESPECIALES CON REEMBOLSOS
    # ========================================================================
    print("\n" + "=" * 80)
    print("💰 GRUPO 4: REEMBOLSOS Y REVERSIONES (Devolviendo cantidad comprada)")
    print("=" * 80)
    
    # Test 15: Reembolso durante COMPRADO (baja de 10 a 8)
    tests_total += 1
    if test_state_dependency(8, 0, 0, 10, ProductStatusEnum.ENCARGADO.value,
                            "Test 15: Reembolso (8/10) durante COMPRADO → ENCARGADO"):
        tests_passed += 1
    
    # Test 16: Reembolso durante RECIBIDO (baja compra)
    tests_total += 1
    if test_state_dependency(8, 10, 0, 10, ProductStatusEnum.ENCARGADO.value,
                            "Test 16: Reembolso con cantidad recibida > comprada → ENCARGADO"):
        tests_passed += 1
    
    # Test 17: Reembolso de entrega
    tests_total += 1
    if test_state_dependency(10, 10, 8, 10, ProductStatusEnum.RECIBIDO.value,
                            "Test 17: Devolución de entrega (8/10) → RECIBIDO"):
        tests_passed += 1
    
    # ========================================================================
    # RESUMEN
    # ========================================================================
    print("\n" + "=" * 80)
    print(f"📈 RESUMEN: {tests_passed}/{tests_total} pruebas PASARON")
    print("=" * 80)
    
    if tests_passed == tests_total:
        print("✓ TODAS LAS DEPENDENCIAS DE ESTADO ESTÁN CORRECTAMENTE IMPLEMENTADAS")
        print("\n✓ Garantías verificadas:")
        print("  • RECIBIDO solo es posible si COMPRADO está completo")
        print("  • ENTREGADO solo es posible si RECIBIDO está completo")
        print("  • No hay saltos de estado permitidos")
        print("  • Las transiciones inválidas son bloqueadas automáticamente")
        print("  • Los reembolsos revierten estados correctamente")
        return 0
    else:
        print(f"✗ {tests_total - tests_passed} prueba(s) FALLARON")
        print("\n⚠️  PROBLEMAS DETECTADOS:")
        print("  • Revisar la función _determine_product_status()")
        print("  • Verificar que las condiciones están implementadas correctamente")
        return 1


if __name__ == '__main__':
    try:
        exit_code = main()
        sys.exit(exit_code)
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
