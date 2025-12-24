"""Serializers for Expected Metrics"""

from rest_framework import serializers
from api.models.balance import Balance
from decimal import Decimal


def _to_decimal(value):
    try:
        return Decimal(str(value)) if value is not None else Decimal('0')
    except Exception:
        return Decimal('0')


class BalanceSerializer(serializers.ModelSerializer):
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
        model = Balance
        fields = [
            'id',
            'start_date',
            'end_date',
            'system_weight',
            'registered_weight',
            'revenues',
            'buys_costs',
            'costs',
            'expenses',
            'notes',
            'total_cost',
            'weight_difference',
            'real_profit',
            'profit_percentage',
            'cost_difference',
            'profit_difference',
            'profit_variance_percentage',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'total_cost', 'weight_difference', 'real_profit', 'profit_percentage', 'cost_difference', 'profit_difference', 'profit_variance_percentage']
    
    def get_cost_difference(self, obj):
        """Calculate cost difference (currently returns 0 as model doesn't have expected cost)"""
        return str(Decimal('0.00'))
    
    def get_real_profit(self, obj):
        """Get real profit from model property"""
        return str(obj.real_profit)
    
    def get_profit_difference(self, obj):
        """Calculate profit difference (currently returns 0 as model doesn't have expected profit)"""
        return str(Decimal('0.00'))
    
    def get_profit_variance_percentage(self, obj):
        """Calculate profit variance percentage"""
        if obj.revenues == 0 or obj.revenues is None:
            return str(Decimal('0.00'))
        try:
            variance = (obj.real_profit / obj.revenues) * 100
            return str(variance)
        except (ZeroDivisionError, TypeError):
            return str(Decimal('0.00'))
    
    def validate(self, data):
        """Validate that end_date is after start_date"""
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({
                'end_date': 'La fecha de fin debe ser posterior a la fecha de inicio'
            })
        
        return data
