# RN-021 2.0.0 (ADR-0009): `balance` pasa a ser el saldo a favor (≥ 0) y
# la deuda pendiente se guarda en `debt`. Se recalculan todos los clientes.

from django.db import migrations, models


def recalculate_all(apps, schema_editor):
    CustomUser = apps.get_model('api', 'CustomUser')
    Order = apps.get_model('api', 'Order')
    DeliverReceip = apps.get_model('api', 'DeliverReceip')
    # Importar la función pura (no depende de modelos) en lugar de los
    # modelos reales, que podrían no coincidir con este punto del historial.
    from api.services.client_balance_service import compute_client_balance

    for client in CustomUser.objects.filter(role='client').iterator():
        items = [
            {'kind': 'order', 'cost': c, 'cash': r, 'applied': a}
            for c, r, a in Order.objects.filter(client=client).values_list(
                'total_costs', 'received_value_of_client', 'balance_applied'
            )
        ] + [
            {'kind': 'delivery', 'cost': c, 'cash': r, 'applied': a}
            for c, r, a in DeliverReceip.objects.filter(client=client).values_list(
                'weight_cost', 'payment_amount', 'balance_applied'
            )
        ]
        result = compute_client_balance(items)
        CustomUser.objects.filter(pk=client.pk).update(
            balance=result['balance'], debt=result['debt']
        )


def restore_net_balance(apps, schema_editor):
    """Reversión: vuelve a la posición neta de RN-021 1.x en `balance`."""
    CustomUser = apps.get_model('api', 'CustomUser')
    Order = apps.get_model('api', 'Order')
    DeliverReceip = apps.get_model('api', 'DeliverReceip')
    from django.db.models import Sum

    for client in CustomUser.objects.filter(role='client').iterator():
        o = Order.objects.filter(client=client).aggregate(
            cost=Sum('total_costs'), cash=Sum('received_value_of_client')
        )
        d = DeliverReceip.objects.filter(client=client).aggregate(
            cost=Sum('weight_cost'), cash=Sum('payment_amount')
        )
        net = round(
            float((o['cash'] or 0) + (d['cash'] or 0)) - float((o['cost'] or 0) + (d['cost'] or 0)),
            2,
        )
        CustomUser.objects.filter(pk=client.pk).update(balance=net)


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0041_package_package_picture_2'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='debt',
            field=models.FloatField(
                default=0,
                help_text='Deuda pendiente del cliente (RN-021 2.0.0): Σ max(0, costo − efectivo − saldo aplicado) de sus órdenes y entregas. Siempre ≥ 0.',
            ),
        ),
        migrations.AlterField(
            model_name='customuser',
            name='balance',
            field=models.FloatField(
                default=0,
                help_text='Saldo a favor del cliente (RN-021 2.0.0): Σ sobrepagos − Σ saldo aplicado, nunca negativo. La deuda va en `debt`.',
            ),
        ),
        migrations.RunPython(recalculate_all, restore_net_balance),
    ]
