from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0022_add_arrival_date_to_package'),
    ]

    operations = [
        migrations.CreateModel(
            name='Expense',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateTimeField(default=django.utils.timezone.now)),
                ('amount', models.FloatField(default=0.0, help_text='Monto del gasto en la moneda principal del sistema')),
                ('category', models.CharField(default='Operativo', max_length=50)),
                ('description', models.TextField(blank=True, null=True)),
                # 'is_reimbursable' removed in model design, not created here
                # Note: `receipt_urls` removed from the model (field was present in an earlier iteration)
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('account', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='expenses', to='api.buyingaccounts')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_expenses', to='api.customuser')),
                ('shop', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='expenses', to='api.shop')),
            ],
            options={
                'ordering': ['-date'],
                'verbose_name': 'Gasto',
                'verbose_name_plural': 'Gastos',
            },
        ),
    ]
