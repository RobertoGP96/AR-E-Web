"""Admin page"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .forms import CustomUserCreationForm, CustomUserChangeForm
from .models import CustomUser, Order
from .models.models_expected_metrics import ExpectedMetrics
from decimal import Decimal


class CustomUserAdmin(UserAdmin):
    """Admin Class for User"""

    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = CustomUser
    list_display = (
        "name",
        "email",
        "id",
        "is_active",
        "is_verified",
        "role",
        "agent_profit",
    )
    list_filter = (
        "name",
        "email",
        "id",
        "is_active",
        "is_verified",
    )
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "name",
                    "email",
                    "password",
                    "home_address",
                    "phone_number",
                    "role",
                    "agent_profit",
                )
            },
        ),
        ("Permissions", {"fields": ("is_staff", "is_active")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "password1",
                    "password2",
                    "is_staff",
                    "is_active",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
    )
    search_fields = ("email",)
    ordering = ("email",)


admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Order)


@admin.register(ExpectedMetrics)
class ExpectedMetricsAdmin(admin.ModelAdmin):
    """Admin interface for Expected Metrics"""
    
    list_display = (
        'id',
        'start_date',
        'end_date',
        'registered_weight',
        'registered_profit',
        'invoice_cost',
        'real_profit',
        'cost_difference',
        'profit_difference',
        'created_at',
    )
    
    list_filter = (
        'start_date',
        'end_date',
        'created_at',
    )
    
    search_fields = ('notes',)
    
    readonly_fields = (
        'cost_difference',
        'real_profit',
        'profit_difference',
        'profit_variance_percentage',
        'created_at',
        'updated_at',
    )
    
    fieldsets = (
        ('Rango de Fechas', {
            'fields': ('start_date', 'end_date')
        }),
        ('Métricas Esperadas', {
            'fields': ('registered_weight', 'registered_revenue', 'registered_profit')
        }),
        ('Métricas Reales', {
            'fields': ('invoice_weight', 'invoice_cost')
        }),
        ('Análisis de Varianza', {
            'fields': (
            'cost_difference',
            'real_profit',
            'profit_difference',
            'profit_variance_percentage',
            ),
            'classes': ('collapse',)
        }),
        ('Información Adicional', {
            'fields': ('notes', 'created_at', 'updated_at')
        }),
    )
    
    ordering = ('-start_date', '-end_date')
    date_hierarchy = 'start_date'

    def _to_decimal(self, value):
        try:
            return Decimal(str(value)) if value is not None else Decimal('0')
        except Exception:
            return Decimal('0')

    def cost_difference(self, obj):
        """invoice_cost - registered_cost"""
        return self._to_decimal(getattr(obj, 'invoice_cost', None)) - self._to_decimal(getattr(obj, 'registered_cost', None))
    cost_difference.short_description = 'Diferencia de costo'

    def real_profit(self, obj):
        """registered_revenue - invoice_cost (approximate real profit)"""
        return self._to_decimal(getattr(obj, 'registered_revenue', None)) - self._to_decimal(getattr(obj, 'invoice_cost', None))
    real_profit.short_description = 'Ganancia real'

    def profit_difference(self, obj):
        """Real profit - expected (registered_profit)"""
        real = self._to_decimal(self.real_profit(obj))
        expected = self._to_decimal(getattr(obj, 'registered_profit', None))
        return real - expected
    profit_difference.short_description = 'Diferencia de ganancia'

    def profit_variance_percentage(self, obj):
        expected = self._to_decimal(getattr(obj, 'registered_profit', None))
        if expected == 0:
            return Decimal('0.00')
        diff = self._to_decimal(self.profit_difference(obj))
        return (diff / expected) * 100
    profit_variance_percentage.short_description = 'Porcentaje variación ganancia'
