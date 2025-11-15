"""Admin page"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .forms import CustomUserCreationForm, CustomUserChangeForm
from .models import CustomUser, Order
from .models.models_expected_metrics import ExpectedMetrics


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
        'range_delivery_weight',
        'range_profit',
        'delivery_real_cost',
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
            'fields': ('range_delivery_weight', 'range_revenue', 'range_profit')
        }),
        ('Métricas Reales', {
            'fields': ('delivery_real_cost', 'others_costs')
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
