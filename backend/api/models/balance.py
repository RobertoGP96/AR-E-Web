"""Expected Metrics Model for comparing expected vs actual costs and profits"""

from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


class Balance(models.Model):
    """
    Model to store vs actual costs and profits for a specific date range.
    This helps analyze business performance by comparing projections with reality.
    """
    # Date range
    start_date = models.DateField(
        help_text="Fecha de inicio del periodo"
    )
    end_date = models.DateField(
        help_text="Fecha de fin del periodo"
    )
    # Regitrados
    system_weight = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        default=Decimal('0.00'),
        help_text="Peso total de las entregas dentro del periodo."
    )
    
    registered_weight = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        default=Decimal('0.00'),
        help_text="Peso total de las entregas dentro del periodo."
    )
    
    revenues = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        default=Decimal('0.00'),
        help_text="Ingresos reales del periodo segun el registro"
    )
    
    buys_costs = models.DecimalField(
        max_digits=12,  decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        default=Decimal('0.00'),
        help_text="Costo de compras dentro del periodo"
    )
    
    costs = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        default=Decimal('0.00'),
        help_text="Costo total de las entregas dentro del periodo."
    )
    
    expenses = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        default=Decimal('0.00'),
        help_text="Gastos totales dentro del periodo"
    )
    # Metadata
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Notas adicionales sobre este periodo"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Balance"
        verbose_name_plural = "Balances"
        ordering = ['-start_date', '-end_date']
        indexes = [
            models.Index(fields=['start_date', 'end_date']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"Balance {self.start_date} - {self.end_date}"
    
    @property
    def weight_difference(self):
        """Calculate the difference between expected and actual weights"""
        return self.registered_weight - self.system_weight

    @property
    def total_cost(self):
        """Calculate the difference between expected and actual costs"""
        return self.costs + self.buys_costs + self.expenses
    
    @property
    def real_profit(self):
        """Calculate the difference between expected and actual profits"""
        return self.revenues - self.total_cost
    
    @property
    def profit_percentage(self):
        """Calculate profit variance as percentage"""
        if self.revenues == 0 or self.revenues is None:
            return Decimal('0.00')
        return (self.real_profit / self.revenues) * 100

    def clean(self):
        """Validate that end_date is after start_date"""
        from django.core.exceptions import ValidationError
        
        if self.end_date and self.start_date and self.end_date < self.start_date:
            raise ValidationError({
                'end_date': 'La fecha de fin debe ser posterior a la fecha de inicio'
            })
    
    def save(self, *args, **kwargs):
        """Override save to run validation"""
        self.full_clean()
        super().save(*args, **kwargs)
