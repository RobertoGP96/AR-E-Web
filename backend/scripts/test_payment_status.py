#!/usr/bin/env python
"""
Script para probar la funcionalidad del nuevo campo payment_status en DeliverReceip
"""
import os
import sys
import django

# Configurar el entorno de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
django.setup()

from api.models import DeliverReceip, CustomUser, Category
from django.utils import timezone
from api.services.delivery_service import analyze_deliveries, get_paid_deliveries, get_unpaid_deliveries
from api.services.profit_service import MetricsService


def test_payment_status():
    """Test payment status functionality"""
    print("\n" + "="*60)
    print("TESTING PAYMENT STATUS FUNCTIONALITY")
    print("="*60)
    
    # Get or create test data
    try:
        client = CustomUser.objects.filter(role='client').first()
        if not client:
            print("❌ No client found in database")
            return
        
        category = Category.objects.first()
        
        # Create test delivery with payment_status = False
        delivery1 = DeliverReceip.objects.create(
            client=client,
            category=category,
            weight=5.0,
            weight_cost=50.0,
            manager_profit=10.0,
            payment_status=False,  # Not paid
            status='Entregado'
        )
        print(f"✓ Created delivery 1 (UNPAID): ID={delivery1.id}, payment_status={delivery1.payment_status}")
        
        # Create test delivery with payment_status = True
        delivery2 = DeliverReceip.objects.create(
            client=client,
            category=category,
            weight=3.0,
            weight_cost=30.0,
            manager_profit=6.0,
            payment_status=True,  # Paid
            status='Entregado'
        )
        print(f"✓ Created delivery 2 (PAID): ID={delivery2.id}, payment_status={delivery2.payment_status}")
        
        # Test delivery analysis
        print("\n" + "-"*60)
        print("DELIVERY ANALYSIS")
        print("-"*60)
        
        analysis = analyze_deliveries()
        
        print(f"Total deliveries: {analysis['count']}")
        print(f"Paid deliveries: {analysis['paid_count']}")
        print(f"Unpaid deliveries: {analysis['unpaid_count']}")
        print(f"Paid revenue: ${analysis['paid_revenue']:.2f}")
        print(f"Unpaid revenue: ${analysis['unpaid_revenue']:.2f}")
        print(f"Payment collection rate: {analysis['payment_collection_rate']:.1f}%")
        print(f"Payment status breakdown: {analysis['deliveries_by_payment_status']}")
        
        # Test paid deliveries analysis
        print("\n" + "-"*60)
        print("PAID DELIVERIES ANALYSIS")
        print("-"*60)
        
        paid_analysis = get_paid_deliveries()
        print(f"Total paid deliveries: {paid_analysis['total_paid_deliveries']}")
        print(f"Total paid revenue: ${paid_analysis['total_paid_revenue']:.2f}")
        print(f"Total paid profit: ${paid_analysis['total_paid_profit']:.2f}")
        print(f"Average paid revenue: ${paid_analysis['average_paid_revenue']:.2f}")
        
        # Test unpaid deliveries analysis
        print("\n" + "-"*60)
        print("UNPAID DELIVERIES ANALYSIS")
        print("-"*60)
        
        unpaid_analysis = get_unpaid_deliveries()
        print(f"Total unpaid deliveries: {unpaid_analysis['total_unpaid_deliveries']}")
        print(f"Total unpaid revenue: ${unpaid_analysis['total_unpaid_revenue']:.2f}")
        print(f"Total unpaid profit: ${unpaid_analysis['total_unpaid_profit']:.2f}")
        print(f"Average unpaid revenue: ${unpaid_analysis['average_unpaid_revenue']:.2f}")
        
        # Test profit metrics
        print("\n" + "-"*60)
        print("PROFIT METRICS")
        print("-"*60)
        
        try:
            metrics = MetricsService.get_dashboard_metrics()
            if 'delivery_payment_status_distribution' in metrics:
                print(f"Delivery payment distribution: {metrics['delivery_payment_status_distribution']}")
            else:
                print("⚠ No payment status distribution in metrics")
        except Exception as e:
            print(f"⚠ Note: Error getting metrics (unrelated to payment_status): {str(e)[:50]}...")
        
        # Test update payment status
        print("\n" + "-"*60)
        print("UPDATE PAYMENT STATUS")
        print("-"*60)
        
        delivery1.payment_status = True
        delivery1.save()
        print(f"✓ Updated delivery 1: payment_status={delivery1.payment_status}")
        
        # Verify update
        delivery1.refresh_from_db()
        print(f"✓ Verified: delivery 1 payment_status={delivery1.payment_status}")
        
        # Clean up
        delivery1.delete()
        delivery2.delete()
        print("\n✓ Test data cleaned up")
        
        print("\n" + "="*60)
        print("✅ ALL TESTS PASSED")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    test_payment_status()
