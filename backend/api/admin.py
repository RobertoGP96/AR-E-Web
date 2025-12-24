"""Admin page"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .forms import CustomUserCreationForm, CustomUserChangeForm
from .models import CustomUser, Order, Expense
from .models.balance import Balance
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
@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('id', 'date', 'amount', 'category', 'created_by')
    list_filter = ('category', 'date')
    search_fields = ('description', 'created_by__name')


@admin.register(Balance)
class BalanceAdmin(admin.ModelAdmin):
    """Admin interface for Balance Metrics"""
    
    list_display = (
        'id',
        'start_date',
        'end_date',
        'system_weight',
        'registered_weight',
        'revenues',
        'buys_costs',
        'costs',
        'expenses',
        'real_profit',
        'notes',
        'total_cost',
        'weight_difference',
        'real_profit',
        'profit_percentage',
    )
    
    list_filter = (
        'start_date',
        'end_date',
        'created_at',
    )
    
    search_fields = ('notes',)
    
    readonly_fields = (
        'total_cost',
        'weight_difference',
        'real_profit',
        'profit_percentage',
        'created_at',
        'updated_at',
    )
    
    fieldsets = (
        ('Rango de Fechas', {
            'fields': ('start_date', 'end_date')
        }),
        ('Métricas', {
            'fields': (
                'system_weight',
                'registered_weight',
                'revenues',
                'buys_costs',
                'costs',
                'expenses',
                )
        }),
        ('Análisis de Varianza', {
            'fields': (
                'total_cost',
                'weight_difference',
                'real_profit',
                'profit_percentage',
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

    def total_cost(self, obj):
        """buys_costs + costs + expenses"""
        return self._to_decimal(getattr(obj, 'buys_costs', None)) + self._to_decimal(getattr(obj, 'costs', None))+ self._to_decimal(getattr(obj, 'expenses', None))
    total_cost.short_description = 'Costo total'

    def real_profit(self, obj):
        """revenues - total_cost (approximate real profit)"""
        return self._to_decimal(getattr(obj, 'revenues', None)) - self._to_decimal(getattr(obj, 'total_cost', None))
    real_profit.short_description = 'Ganancia real'

    def profit_percentage(self, obj):
        revenues = self._to_decimal(getattr(obj, 'revenues', None))
        if revenues == 0 or revenues is None:
            return Decimal('0.00')
        try:
            profit = self._to_decimal(getattr(obj, 'real_profit', None))
            return (profit / revenues) * 100
        except (ZeroDivisionError, TypeError):
            return Decimal('0.00')
    profit_percentage.short_description = 'Porcentaje de ganancia'
