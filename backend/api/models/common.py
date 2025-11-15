"""Common models"""

from django.utils import timezone
from django.db import models


class CommonInformation(models.Model):
    """
    Configuración global del sistema para variables dinámicas.
    Este modelo almacena variables que cambian constantemente y son necesarias
    para los cálculos de costos y ganancias del sistema.
    """

    change_rate = models.FloatField(
        default=0,
        help_text="Tasa de cambio de moneda (ej: USD a moneda local). Valor positivo requerido."
    )
    cost_per_pound = models.FloatField(
        default=0,
        help_text="Costo general de envío por libra en USD. Se usa para calcular costos de entrega."
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    @staticmethod
    def get_instance():
        """
        Obtiene o crea la instancia única de configuración del sistema.
        Este modelo sigue el patrón Singleton.
        """
        instance = CommonInformation.objects.first()
        if not instance:
            instance = CommonInformation.objects.create()
        return instance

    def clean(self):
        """Validaciones personalizadas del modelo"""
        from django.core.exceptions import ValidationError

        if self.change_rate < 0:
            raise ValidationError({
                'change_rate': 'La tasa de cambio no puede ser negativa.'
            })

        if self.cost_per_pound < 0:
            raise ValidationError({
                'cost_per_pound': 'El costo por libra no puede ser negativo.'
            })

    def save(self, *args, **kwargs):
        """Sobrescribe save para ejecutar validaciones"""
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Configuración - Tasa: ${self.change_rate}, Costo/lb: ${self.cost_per_pound}"

    class Meta:
        verbose_name = "Información Común"
        verbose_name_plural = "Información Común"


class EvidenceImages(models.Model):
    """Images for products"""

    public_id = models.CharField(max_length=200, null=True, blank=True)
    image_url = models.URLField()
    description = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    def __str__(self):
        return f"Image: {self.public_id or 'No ID'}"

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Evidence Image"
        verbose_name_plural = "Evidence Images"