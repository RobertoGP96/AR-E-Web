"""Modelo para registrar gastos en el sistema"""

from django.utils import timezone
from django.db import models


class Expense(models.Model):
    """Gasto registrado en el sistema.

    Este modelo almacena cualquier coste relacionado con el negocio, por ejemplo:
    envíos, comisiones, sueldos, gastos operativos, marketing, entre otros.
    """

    CATEGORY_CHOICES = [
        ("Envio", "Envío"),
        ("Tasas", "Tasas y cargos"),
        ("Sueldo", "Sueldo"),
        ("Publicidad", "Publicidad / Marketing"),
        ("Operativo", "Gasto operativo"),
        ("Entrega", "Entrega"),
        ("Otro", "Otro"),
    ]

    # Relación opcional con tienda/compra fue removida

    # Datos principales
    date = models.DateTimeField(default=timezone.now)
    amount = models.FloatField(default=0.0, help_text="Monto del gasto en la moneda principal del sistema")
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default="Operativo")
    description = models.TextField(blank=True, null=True)

    # Control y origen
    created_by = models.ForeignKey(
        "api.CustomUser", on_delete=models.SET_NULL, null=True, blank=True, related_name="created_expenses"
    )
    # NOTE: is_reimbursable was removed per request

    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    class Meta:
        ordering = ["-date"]
        verbose_name = "Gasto"
        verbose_name_plural = "Gastos"

    def __str__(self):
        return f"Gasto #{self.pk} - {self.category} - {self.amount}"
