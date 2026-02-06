"""
Servicio centralizado para actualizar estados de productos basado en sus transacciones.
Este servicio reemplaza la lógica distribuida en los signals para mejorar mantenibilidad,
debuggeabilidad y evitar race conditions.
"""

import logging
from django.db import transaction
from api.models import Product
from api.signals import _determine_product_status

logger = logging.getLogger(__name__)


class ProductStatusService:
    """
    Servicio centralizado para actualizar estados de productos.
    
    Maneja:
    - Recalcular totales de cantidad (comprada, recibida, entregada)
    - Determinar el estado correcto del producto
    - Evitar race conditions con select_for_update()
    - Logging completo de cambios
    """
    
    @staticmethod
    def recalculate_product_status(product: Product) -> bool:
        """
        Recalcula todos los totales y el estado de un producto desde sus transacciones.
        
        Args:
            product: Instancia del Product a actualizar
            
        Returns:
            bool: True si el producto fue actualizado, False si no hubo cambios
            
        Raises:
            Exception: Si hay un error en la actualización
        """
        try:
            with transaction.atomic():
                # Bloquear el producto para evitar race conditions durante lectura/escritura
                product = Product.objects.select_for_update().get(pk=product.pk)
                logger.debug(f"Actualizando estado del producto {product.id} ({product.name})")
                
                # ================================================================
                # PASO 1: RECALCULAR TOTALES DESDE LAS TRANSACCIONES
                # ================================================================
                
                # Total comprado = suma de todas las compras menos los reembolsos
                amount_purchased = sum(
                    pb.amount_buyed - pb.quantity_refuned
                    for pb in product.buys.all()
                )
                amount_purchased = max(0, amount_purchased)
                logger.debug(f"  amount_purchased = {amount_purchased}")
                
                # Total recibido = suma de todas las recepciones
                amount_received = sum(
                    pr.amount_received
                    for pr in product.receiveds.all()
                )
                logger.debug(f"  amount_received = {amount_received}")
                
                # Total entregado = suma de todas las entregas
                amount_delivered = sum(
                    pd.amount_delivered
                    for pd in product.delivers.all()
                )
                logger.debug(f"  amount_delivered = {amount_delivered}")
                
                # ================================================================
                # PASO 2: DETERMINAR EL NUEVO ESTADO
                # ================================================================
                
                new_status = _determine_product_status(
                    amount_purchased=amount_purchased,
                    amount_received=amount_received,
                    amount_delivered=amount_delivered,
                    amount_requested=product.amount_requested,
                    current_status=product.status
                )
                logger.debug(f"  nuevo_estado = {new_status}")
                
                # ================================================================
                # PASO 3: COMPARAR CON ESTADO ACTUAL Y ACTUALIZAR SI CAMBIÓ
                # ================================================================
                
                # Verificar si hubo cambios
                changed = False
                changes = {}
                
                if product.amount_purchased != amount_purchased:
                    changes['amount_purchased'] = (product.amount_purchased, amount_purchased)
                    product.amount_purchased = amount_purchased
                    changed = True
                
                if product.amount_received != amount_received:
                    changes['amount_received'] = (product.amount_received, amount_received)
                    product.amount_received = amount_received
                    changed = True
                
                if product.amount_delivered != amount_delivered:
                    changes['amount_delivered'] = (product.amount_delivered, amount_delivered)
                    product.amount_delivered = amount_delivered
                    changed = True
                
                if product.status != new_status:
                    changes['status'] = (product.status, new_status)
                    product.status = new_status
                    changed = True
                
                # ================================================================
                # PASO 4: GUARDAR CAMBIOS EN LA BASE DE DATOS
                # ================================================================
                
                if changed:
                    # Usar update_fields para ser explícito sobre qué se actualiza
                    # Esto evita que se disparen otros signals innecesarios
                    product.save(update_fields=[
                        'amount_purchased',
                        'amount_received',
                        'amount_delivered',
                        'status',
                        'updated_at'
                    ])
                    
                    # Log de cambios realizados
                    logger.info(
                        f"Producto {product.id} ({product.name}) actualizado: "
                        f"{', '.join(f'{k}: {v[0]} → {v[1]}' for k, v in changes.items())}"
                    )
                    return True
                else:
                    logger.debug(f"Producto {product.id} sin cambios")
                    return False
                    
        except Product.DoesNotExist:
            logger.error(f"Producto {product.pk} no encontrado")
            raise
        except Exception as e:
            logger.error(f"Error actualizando producto {product.id}: {e}", exc_info=True)
            raise
    
    @staticmethod
    def verify_product_consistency(product: Product) -> dict:
        """
        Verifica la consistencia de un producto sin actualizarlo.
        Útil para debugging.
        
        Args:
            product: Instancia del Product a verificar
            
        Returns:
            dict: Información sobre el estado actual y esperado
        """
        # Recalcular totales
        amount_purchased = sum(
            pb.amount_buyed - pb.quantity_refuned
            for pb in product.buys.all()
        )
        amount_purchased = max(0, amount_purchased)
        
        amount_received = sum(
            pr.amount_received
            for pr in product.receiveds.all()
        )
        
        amount_delivered = sum(
            pd.amount_delivered
            for pd in product.delivers.all()
        )
        
        # Determinar estado esperado
        expected_status = _determine_product_status(
            amount_purchased=amount_purchased,
            amount_received=amount_received,
            amount_delivered=amount_delivered,
            amount_requested=product.amount_requested,
            current_status=product.status
        )
        
        # Verificar inconsistencias
        inconsistencies = []
        
        if product.amount_purchased != amount_purchased:
            inconsistencies.append(
                f"amount_purchased inconsistente: BD={product.amount_purchased}, "
                f"Calculado={amount_purchased}"
            )
        
        if product.amount_received != amount_received:
            inconsistencies.append(
                f"amount_received inconsistente: BD={product.amount_received}, "
                f"Calculado={amount_received}"
            )
        
        if product.amount_delivered != amount_delivered:
            inconsistencies.append(
                f"amount_delivered inconsistente: BD={product.amount_delivered}, "
                f"Calculado={amount_delivered}"
            )
        
        if product.status != expected_status:
            inconsistencies.append(
                f"status inconsistente: BD={product.status}, "
                f"Esperado={expected_status}"
            )
        
        return {
            "product_id": product.id,
            "product_name": product.name,
            "is_consistent": len(inconsistencies) == 0,
            "inconsistencies": inconsistencies,
            "current_state": {
                "amount_purchased": product.amount_purchased,
                "amount_received": product.amount_received,
                "amount_delivered": product.amount_delivered,
                "status": product.status,
            },
            "calculated_state": {
                "amount_purchased": amount_purchased,
                "amount_received": amount_received,
                "amount_delivered": amount_delivered,
                "status": expected_status,
            }
        }
    
    @staticmethod
    def fix_product_consistency(product: Product) -> bool:
        """
        Corrige inconsistencias en un producto.
        
        Args:
            product: Instancia del Product a corregir
            
        Returns:
            bool: True si se realizaron correcciones, False si ya era consistente
        """
        consistency_report = ProductStatusService.verify_product_consistency(product)
        
        if consistency_report["is_consistent"]:
            logger.info(f"Producto {product.id} ya es consistente")
            return False
        
        logger.warning(
            f"Inconsistencias encontradas en producto {product.id}: "
            f"{consistency_report['inconsistencies']}"
        )
        
        # Hacer la actualización
        return ProductStatusService.recalculate_product_status(product)
