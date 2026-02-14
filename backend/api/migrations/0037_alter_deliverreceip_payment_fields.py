# Generated manually on 2026-02-14

from django.db import migrations, models
import api.enums


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0036_deliverreceip_payment_status"),
    ]

    operations = [
        # Eliminar el campo payment_status anterior (BooleanField)
        migrations.RemoveField(
            model_name="deliverreceip",
            name="payment_status",
        ),
        # Agregar el nuevo campo payment_status como CharField con choices
        migrations.AddField(
            model_name="deliverreceip",
            name="payment_status",
            field=models.CharField(
                max_length=100,
                choices=[(tag.value, tag.value) for tag in api.enums.PaymentStatusEnum],
                default=api.enums.PaymentStatusEnum.NO_PAGADO.value,
                help_text="Estado de pago de la entrega"
            ),
        ),
        # Agregar campo payment_date
        migrations.AddField(
            model_name="deliverreceip",
            name="payment_date",
            field=models.DateTimeField(
                null=True,
                blank=True,
                help_text="Fecha en que se realizó el pago"
            ),
        ),
        # Agregar campo payment_amount
        migrations.AddField(
            model_name="deliverreceip",
            name="payment_amount",
            field=models.FloatField(
                default=0,
                help_text="Monto recibido del pago"
            ),
        ),
    ]
