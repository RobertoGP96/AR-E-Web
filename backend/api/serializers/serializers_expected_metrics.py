"""Serializers for Expected Metrics"""

from rest_framework import serializers
from api.models.models_expected_metrics import ExpectedMetrics
from decimal import Decimal


def _to_decimal(value):
    try:
        return Decimal(str(value)) if value is not None else Decimal('0')
    except Exception:
        return Decimal('0')


class ExpectedMetricsSerializer(serializers.ModelSerializer):
    """
    Serializer for ExpectedMetrics model.
    Includes calculated fields for variance analysis.
    """
    
    # Read-only calculated fields (computed from model's registered_*/invoice_* fields)
    cost_difference = serializers.SerializerMethodField()
    real_profit = serializers.SerializerMethodField()
    profit_difference = serializers.SerializerMethodField()
    profit_variance_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = ExpectedMetrics
        fields = [
            'id',
            'start_date',
            'end_date',
            'registered_weight',
            'registered_cost',
            'registered_revenue',
            'registered_profit',
            'invoice_weight',
            'invoice_cost',
            'cost_difference',
            'weight_difference',
            'real_profit',
            'profit_difference',
            'profit_variance_percentage',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'cost_difference', 'weight_difference', 'real_profit', 'profit_difference', 'profit_variance_percentage']
    
    def validate(self, data):
        """Validate that end_date is after start_date"""
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({
                'end_date': 'La fecha de fin debe ser posterior a la fecha de inicio'
            })
        
        return data
    
    def validate_range_delivery_weight(self, value):
        """Validate range_delivery_weight is non-negative"""
        if value < Decimal('0.00'):
            raise serializers.ValidationError('El peso de entrega esperado no puede ser negativo')
        return value
    
    def validate_range_revenue(self, value):
        """Validate range_revenue is non-negative"""
        if value < Decimal('0.00'):
            raise serializers.ValidationError('Los ingresos esperados no pueden ser negativos')
        return value
    
    def validate_range_profit(self, value):
        """Validate range_profit is non-negative"""
        if value < Decimal('0.00'):
            raise serializers.ValidationError('La ganancia esperada no puede ser negativa')
        return value
    
    def validate_delivery_real_cost(self, value):
        """Validate delivery_real_cost is non-negative"""
        # This serializer uses `invoice_cost`/`invoice_weight` fields in the model.
        if value < Decimal('0.00'):
            raise serializers.ValidationError('El costo real de entrega no puede ser negativo')
        return value
    
    def validate_others_costs(self, value):
        """Validate others_costs is non-negative"""
        if value < Decimal('0.00'):
            raise serializers.ValidationError('Los otros costos no pueden ser negativos')
        return value

    def get_cost_difference(self, obj):
        # invoice_cost - registered_cost
        invoice = _to_decimal(getattr(obj, 'invoice_cost', None))
        registered = _to_decimal(getattr(obj, 'registered_cost', None))
        return invoice - registered

    def get_real_profit(self, obj):
        # Try to compute real profit as registered_revenue - invoice_cost
        revenue = _to_decimal(getattr(obj, 'registered_revenue', None))
        invoice = _to_decimal(getattr(obj, 'invoice_cost', None))
        return revenue - invoice

    def get_profit_difference(self, obj):
        real = _to_decimal(self.get_real_profit(obj))
        expected = _to_decimal(getattr(obj, 'registered_profit', None))
        return real - expected

    def get_profit_variance_percentage(self, obj):
        expected = _to_decimal(getattr(obj, 'registered_profit', None))
        if expected == 0:
            return Decimal('0.00')
        diff = _to_decimal(self.get_profit_difference(obj))
        return (diff / expected) * 100


class ExpectedMetricsListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing expected metrics.
    Includes only essential fields for performance.
    """
    
    cost_difference = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True
    )
    profit_difference = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True
    )
    
    class Meta:
        model = ExpectedMetrics
        fields = [
            'id',
            'start_date',
            'end_date',
            'range_delivery_weight',
            'range_revenue',
            'range_profit',
            'delivery_real_cost',
            'delivery_real_weight',
            'range_delivery_cost',
            'others_costs',
            'cost_difference',
            'weight_difference',
            'real_profit',
            'profit_difference',
            'profit_variance_percentage',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'cost_difference', 'weight_difference', 'real_profit', 'profit_difference', 'profit_variance_percentage']
