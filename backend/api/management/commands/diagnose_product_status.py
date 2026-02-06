"""
Management command para diagnosticar y fijar inconsistencias en estados de productos.
"""

from django.core.management.base import BaseCommand
from django.db.models import Q
from api.models import Product
from api.services.product_status_service import ProductStatusService


class Command(BaseCommand):
    help = "Diagnostica y opcionalmente fija inconsistencias en estados de productos"
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--fix',
            action='store_true',
            help='Fijar inconsistencias encontradas',
        )
        parser.add_argument(
            '--product-id',
            type=str,
            help='ID del producto a diagnosticar (diagnostica todos si no se especifica)',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Mostrar información detallada',
        )
    
    def handle(self, *args, **options):
        fix = options['fix']
        product_id = options['product_id']
        verbose = options['verbose']
        
        if fix:
            self.stdout.write(
                self.style.WARNING('⚠️  Modo FIX activado - Se corregirán inconsistencias')
            )
        else:
            self.stdout.write('Modo DIAGNÓSTICO - No se realizarán cambios')
        
        # Obtener productos a diagnosticar
        if product_id:
            try:
                products = Product.objects.filter(pk=product_id)
                if not products.exists():
                    self.stdout.write(
                        self.style.ERROR(f'Producto con ID {product_id} no encontrado')
                    )
                    return
            except:
                self.stdout.write(
                    self.style.ERROR(f'ID de producto inválido: {product_id}')
                )
                return
        else:
            products = Product.objects.all()
        
        self.stdout.write(f'\nDiagnosticando {products.count()} productos...\n')
        
        # Diagnosticar cada producto
        inconsistent_count = 0
        fixed_count = 0
        
        for product in products:
            report = ProductStatusService.verify_product_consistency(product)
            
            if not report['is_consistent']:
                inconsistent_count += 1
                
                self.stdout.write(
                    self.style.ERROR(
                        f"\n❌ Producto {product.id}: {product.name}"
                    )
                )
                
                for inconsistency in report['inconsistencies']:
                    self.stdout.write(f"   - {inconsistency}")
                
                if verbose:
                    self.stdout.write(f"\n   Estado actual en BD:")
                    for key, value in report['current_state'].items():
                        self.stdout.write(f"     - {key}: {value}")
                    
                    self.stdout.write(f"\n   Estado esperado (calculado):")
                    for key, value in report['calculated_state'].items():
                        self.stdout.write(f"     - {key}: {value}")
                
                # Fijar si se solicita
                if fix:
                    try:
                        ProductStatusService.recalculate_product_status(product)
                        fixed_count += 1
                        self.stdout.write(
                            self.style.SUCCESS(f"   ✓ Producto corregido")
                        )
                    except Exception as e:
                        self.stdout.write(
                            self.style.ERROR(f"   ✗ Error corrigiendo: {e}")
                        )
            else:
                if verbose:
                    self.stdout.write(
                        self.style.SUCCESS(f"✓ Producto {product.id}: OK")
                    )
        
        # Resumen
        self.stdout.write('\n' + '='*80)
        self.stdout.write('RESUMEN')
        self.stdout.write('='*80)
        
        total = products.count()
        consistent = total - inconsistent_count
        
        self.stdout.write(f'\nTotal de productos: {total}')
        self.stdout.write(self.style.SUCCESS(f'Consistentes: {consistent}'))
        if inconsistent_count > 0:
            self.stdout.write(self.style.ERROR(f'Inconsistentes: {inconsistent_count}'))
        
        if fix:
            self.stdout.write(self.style.SUCCESS(f'Corregidos: {fixed_count}'))
            if fixed_count < inconsistent_count:
                self.stdout.write(
                    self.style.WARNING(
                        f'No se corrigieron {inconsistent_count - fixed_count} productos'
                    )
                )
