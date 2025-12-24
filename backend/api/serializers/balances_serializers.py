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
            'real_profit',
            'notes',
            'total_cost',
            'weight_difference',
            'real_profit',
            'profit_percentage',
            
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'total_cost', 'weight_difference', 'real_profit', 'profit_percentage']
    
    def validate(self, data):
        """Validate that end_date is after start_date"""
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({
                'end_date': 'La fecha de fin debe ser posterior a la fecha de inicio'
            })
        
        return data
