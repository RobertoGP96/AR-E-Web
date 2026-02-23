"""
Management command: sync_client_balances

Recalcula y sincroniza el campo `balance` de todos los clientes
basándose en sus órdenes y entregas acumuladas.

Uso:
    python manage.py sync_client_balances
    python manage.py sync_client_balances --dry-run
"""
from django.core.management.base import BaseCommand
from api.models import CustomUser


class Command(BaseCommand):
    help = (
        "Recalcula el campo 'balance' de todos los clientes en base a "
        "sus órdenes y entregas históricas."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Solo muestra los balances calculados sin guardarlos.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        clients = CustomUser.objects.filter(role='client')
        total = clients.count()
        updated = 0
        errors = 0

        self.stdout.write(
            self.style.NOTICE(
                f"Procesando {total} cliente(s)..."
                + (" [DRY RUN]" if dry_run else "")
            )
        )

        for client in clients:
            try:
                # Calcular sin guardar para comparar
                from django.db.models import Sum
                from api.models.orders import Order
                from api.models.deliveries import DeliverReceip

                order_agg = Order.objects.filter(client=client).aggregate(
                    total_cost=Sum('total_costs'),
                    total_received=Sum('received_value_of_client'),
                )
                delivery_agg = DeliverReceip.objects.filter(client=client).aggregate(
                    total_cost=Sum('weight_cost'),
                    total_received=Sum('payment_amount'),
                )

                order_cost = float(order_agg['total_cost'] or 0.0)
                order_received = float(order_agg['total_received'] or 0.0)
                delivery_cost = float(delivery_agg['total_cost'] or 0.0)
                delivery_received = float(delivery_agg['total_received'] or 0.0)

                new_balance = round(
                    (order_received + delivery_received) - (order_cost + delivery_cost),
                    2
                )

                old_balance = client.balance
                changed = old_balance != new_balance

                if dry_run:
                    status = "CAMBIARÍA" if changed else "SIN CAMBIO"
                    self.stdout.write(
                        f"  [{status}] {client.full_name} (id={client.id}): "
                        f"{old_balance} → {new_balance}"
                    )
                else:
                    if changed:
                        client.balance = new_balance
                        client.save(update_fields=['balance'])
                        updated += 1
                        self.stdout.write(
                            self.style.SUCCESS(
                                f"  ✓ {client.full_name} (id={client.id}): "
                                f"{old_balance} → {new_balance}"
                            )
                        )
                    else:
                        self.stdout.write(
                            f"  — {client.full_name} (id={client.id}): "
                            f"sin cambio ({new_balance})"
                        )

            except Exception as e:
                errors += 1
                self.stdout.write(
                    self.style.ERROR(
                        f"  ✗ Error en cliente id={client.id}: {e}"
                    )
                )

        if not dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f"\nFinalizado: {updated}/{total} cliente(s) actualizados. "
                    f"{errors} error(es)."
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING("\n[DRY RUN] No se guardaron cambios.")
            )
