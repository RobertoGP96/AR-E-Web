"""
Management command para limpiar notificaciones antiguas y expiradas.

Uso:
    python manage.py clean_notifications
    python manage.py clean_notifications --days 60
    python manage.py clean_notifications --expired-only
    python manage.py clean_notifications --dry-run
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from api.models_notifications import Notification


class Command(BaseCommand):
    help = 'Limpia notificaciones antiguas y expiradas del sistema'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Número de días para considerar una notificación leída como antigua (default: 30)'
        )
        
        parser.add_argument(
            '--expired-only',
            action='store_true',
            help='Solo eliminar notificaciones con fecha de expiración pasada'
        )
        
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simular la limpieza sin eliminar realmente (muestra lo que se eliminaría)'
        )
        
        parser.add_argument(
            '--all-read',
            action='store_true',
            help='Eliminar todas las notificaciones leídas sin importar la fecha'
        )

    def handle(self, *args, **options):
        days = options['days']
        expired_only = options['expired_only']
        dry_run = options['dry_run']
        all_read = options['all_read']
        
        self.stdout.write(self.style.HTTP_INFO('🔍 Iniciando limpieza de notificaciones...'))
        
        if dry_run:
            self.stdout.write(self.style.WARNING('⚠️  Modo DRY-RUN activado - No se eliminará nada realmente'))
        
        total_deleted = 0
        
        # 1. Eliminar notificaciones expiradas
        expired_count = Notification.objects.expired().count()
        if expired_count > 0:
            self.stdout.write(f'\n📋 Notificaciones expiradas encontradas: {expired_count}')
            if not dry_run:
                deleted = Notification.objects.delete_expired()
                total_deleted += deleted
                self.stdout.write(self.style.SUCCESS(f'✅ Eliminadas {deleted} notificaciones expiradas'))
            else:
                self.stdout.write(self.style.WARNING(f'🔸 Se eliminarían {expired_count} notificaciones expiradas'))
        else:
            self.stdout.write('✓ No hay notificaciones expiradas')
        
        # 2. Eliminar notificaciones leídas antiguas (solo si no es expired-only)
        if not expired_only:
            if all_read:
                old_read_count = Notification.objects.filter(is_read=True).count()
                self.stdout.write(f'\n📋 Todas las notificaciones leídas: {old_read_count}')
                if not dry_run and old_read_count > 0:
                    deleted = Notification.objects.filter(is_read=True).delete()[0]
                    total_deleted += deleted
                    self.stdout.write(self.style.SUCCESS(f'✅ Eliminadas {deleted} notificaciones leídas'))
                elif old_read_count > 0:
                    self.stdout.write(self.style.WARNING(f'🔸 Se eliminarían {old_read_count} notificaciones leídas'))
            else:
                cutoff_date = timezone.now() - timedelta(days=days)
                old_read_count = Notification.objects.filter(
                    is_read=True,
                    created_at__lt=cutoff_date
                ).count()
                
                if old_read_count > 0:
                    self.stdout.write(f'\n📋 Notificaciones leídas más antiguas que {days} días: {old_read_count}')
                    if not dry_run:
                        deleted = Notification.objects.delete_old_read(days=days)
                        total_deleted += deleted
                        self.stdout.write(self.style.SUCCESS(f'✅ Eliminadas {deleted} notificaciones leídas antiguas'))
                    else:
                        self.stdout.write(self.style.WARNING(f'🔸 Se eliminarían {old_read_count} notificaciones leídas antiguas'))
                else:
                    self.stdout.write(f'✓ No hay notificaciones leídas más antiguas que {days} días')
        
        # 3. Resumen final
        self.stdout.write('\n' + '='*60)
        if dry_run:
            self.stdout.write(self.style.HTTP_INFO(f'📊 RESUMEN (DRY-RUN): Se eliminarían {expired_count + (old_read_count if not expired_only else 0)} notificaciones en total'))
        else:
            if total_deleted > 0:
                self.stdout.write(self.style.SUCCESS(f'✨ Limpieza completada: {total_deleted} notificaciones eliminadas'))
            else:
                self.stdout.write(self.style.SUCCESS('✨ No se encontraron notificaciones para eliminar'))
        
        # 4. Estadísticas adicionales
        remaining = Notification.objects.count()
        unread = Notification.objects.unread().count()
        
        self.stdout.write('\n📈 Estadísticas actuales:')
        self.stdout.write(f'   Total de notificaciones: {remaining}')
        self.stdout.write(f'   No leídas: {unread}')
        self.stdout.write(f'   Leídas: {remaining - unread}')
        
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('✅ Proceso completado exitosamente\n'))
