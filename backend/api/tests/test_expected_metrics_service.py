"""Tests for Expected Metrics Service"""

from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from datetime import date, timedelta

from api.services.expected_metrics_service import ExpectedMetricsService
from api.models_expected_metrics import ExpectedMetrics


class ExpectedMetricsServiceTest(TestCase):
    """Test cases for ExpectedMetricsService"""

    def setUp(self):
        """Set up test data"""
        self.today = date.today()
        self.yesterday = self.today - timedelta(days=1)
        self.tomorrow = self.today + timedelta(days=1)

        # Create test metric
        self.metric = ExpectedMetrics.objects.create(
            start_date=self.yesterday,
            end_date=self.tomorrow,
            range_delivery_weight=Decimal('100.00'),
            range_delivery_cost=Decimal('50.00'),
            range_revenue=Decimal('200.00'),
            range_profit=Decimal('150.00'),
            delivery_real_cost=Decimal('0.00'),
            others_costs=Decimal('0.00'),
            notes='Test metric'
        )

    def test_validate_date_range_valid(self):
        """Test valid date range validation"""
        is_valid, error = ExpectedMetricsService.validate_date_range(
            '2024-01-01', '2024-01-31'
        )
        self.assertTrue(is_valid)
        self.assertEqual(error, '')

    def test_validate_date_range_invalid_format(self):
        """Test invalid date format validation"""
        is_valid, error = ExpectedMetricsService.validate_date_range(
            '01-01-2024', '31-01-2024'
        )
        self.assertFalse(is_valid)
        self.assertIn('Formato de fecha inválido', error)

    def test_validate_date_range_missing_params(self):
        """Test missing parameters validation"""
        is_valid, error = ExpectedMetricsService.validate_date_range(None, '2024-01-31')
        self.assertFalse(is_valid)
        self.assertIn('Se requieren parámetros', error)

    def test_validate_date_range_start_after_end(self):
        """Test start date after end date validation"""
        is_valid, error = ExpectedMetricsService.validate_date_range(
            '2024-01-31', '2024-01-01'
        )
        self.assertFalse(is_valid)
        self.assertIn('no puede ser posterior', error)

    def test_get_summary_statistics(self):
        """Test summary statistics calculation"""
        # Create another metric for testing
        ExpectedMetrics.objects.create(
            start_date=self.yesterday,
            end_date=self.tomorrow,
            range_delivery_weight=Decimal('50.00'),
            range_delivery_cost=Decimal('25.00'),
            range_revenue=Decimal('100.00'),
            range_profit=Decimal('75.00'),
            delivery_real_cost=Decimal('20.00'),
            others_costs=Decimal('10.00'),
            notes='Test metric 2'
        )

        summary = ExpectedMetricsService.get_summary_statistics()

        # Check totals
        self.assertEqual(summary['total_range_delivery_weight'], Decimal('150.00'))
        self.assertEqual(summary['total_range_delivery_cost'], Decimal('75.00'))
        self.assertEqual(summary['total_range_revenue'], Decimal('300.00'))
        self.assertEqual(summary['total_range_profit'], Decimal('225.00'))
        self.assertEqual(summary['total_delivery_real_cost'], Decimal('20.00'))
        self.assertEqual(summary['total_others_costs'], Decimal('10.00'))
        self.assertEqual(summary['metrics_count'], 2)

        # Check variances
        self.assertEqual(summary['total_cost_variance'], Decimal('-45.00'))  # 30 - 75
        self.assertEqual(summary['total_profit_variance'], Decimal('195.00'))  # 225 - 30

    def test_filter_metrics_by_date_range(self):
        """Test filtering metrics by date range"""
        # Create metrics with different date ranges
        past_metric = ExpectedMetrics.objects.create(
            start_date=self.today - timedelta(days=10),
            end_date=self.today - timedelta(days=5),
            range_delivery_weight=Decimal('10.00'),
            notes='Past metric'
        )

        future_metric = ExpectedMetrics.objects.create(
            start_date=self.today + timedelta(days=5),
            end_date=self.today + timedelta(days=10),
            range_delivery_weight=Decimal('10.00'),
            notes='Future metric'
        )

        # Filter for current range
        success, result = ExpectedMetricsService.filter_metrics_by_date_range(
            self.yesterday.strftime('%Y-%m-%d'),
            self.tomorrow.strftime('%Y-%m-%d')
        )

        self.assertTrue(success)
        self.assertEqual(result['count'], 1)
        self.assertEqual(result['metrics'].first(), self.metric)

    def test_calculate_range_data_invalid_dates(self):
        """Test calculate_range_data with invalid dates"""
        result = ExpectedMetricsService.calculate_range_data('invalid', 'dates')
        self.assertFalse(result['success'])
        self.assertIn('Invalid date format', result['error'])

    def test_calculate_actuals_for_metric(self):
        """Test calculating actuals for a metric"""
        # Note: This test would require actual Order and ProductBuyed data
        # For now, we just test that the method runs without errors
        result = ExpectedMetricsService.calculate_actuals_for_metric(self.metric)

        # Should succeed even with no data (returns zeros)
        self.assertTrue(result['success'])
        self.assertEqual(result['actual_profit'], Decimal('0'))
        self.assertEqual(result['actual_cost'], Decimal('0'))
        self.assertEqual(result['orders_count'], 0)
        self.assertEqual(result['products_bought_count'], 0)