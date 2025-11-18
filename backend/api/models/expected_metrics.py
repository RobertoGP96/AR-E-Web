"""Expected Metrics Model for comparing expected vs actual costs and profits"""

from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


class ExpectedMetrics(models.Model):
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
    registered_weight = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        default=Decimal('0.00'),
        help_text="Peso total de las entregas dentro del periodo."
    )
    
    registered_revenue = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        default=Decimal('0.00'),
        help_text="Ingresos reales del periodo segun el registro"
    )

    registered_profit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        default=Decimal('0.00'),
        help_text="Ganacia real del periodo segun el registro"
    )
    
    registered_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        default=Decimal('0.00'),
        help_text="Costo total de las entregas dentro del periodo."
    )
    
    registered_revenue = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        default=Decimal('0.00'),
        help_text="Ingresos totales dentro del periodo"
    )
    
    registered_profit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        default=Decimal('0.00'),
        help_text="Ganancia total dentro del periodo"
    )
    
    #Facturas
    invoice_weight = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        default=Decimal('0.00'),
        help_text="Peso real segun facturas"
    )
    
    invoice_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        default=Decimal('0.00'),
        help_text="Costo segun facturas"
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
        verbose_name = "Métrica Esperada"
        verbose_name_plural = "Métricas Esperadas"
        ordering = ['-start_date', '-end_date']
        indexes = [
            models.Index(fields=['start_date', 'end_date']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"Métricas {self.start_date} - {self.end_date}"
    
    @property
    def weight_difference(self):
        """Calculate the difference between expected and actual weights"""
        return self.invoice_weight - self.registered_weight

    @property
    def cost_difference(self):
        """Calculate the difference between expected and actual costs"""
        return self.invoice_cost - self.registered_cost
    
    @property
    def real_profit(self):
        """Calculate the difference between expected and actual profits"""
        return self.range_profit - self.cost_difference


    @property
    def profit_percentage(self):
        """Calculate profit variance as percentage"""
        if self.range_profit == 0:
            return Decimal('0.00')
        return (self.general_profit / self.range_cost) * 100

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
