from django.core.management.base import BaseCommand
from api.models.users import CustomUser


class Command(BaseCommand):
    help = 'Recalcula el balance de todos los clientes'

    def handle(self, *args, **options):
        clients = CustomUser.objects.filter(role='client')
        total = clients.count()
        self.stdout.write(f'Recalculando balance de {total} clientes...')

        updated = 0
        for client in clients:
            old_balance = client.balance
            new_balance = client.recalculate_balance()
            if old_balance != new_balance:
                updated += 1
                self.stdout.write(
                    f'  Cliente {client.id} ({client.get_full_name()}): '
                    f'{old_balance} → {new_balance}'
                )

        self.stdout.write(self.style.SUCCESS(
            f'Completado. {updated}/{total} clientes actualizados.'
        ))
