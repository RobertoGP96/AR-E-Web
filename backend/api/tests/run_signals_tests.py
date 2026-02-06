#!/usr/bin/env python
"""Script para ejecutar tests con SQLite (más confiable para testing local)"""
import os
import sys
import django
from django.conf import settings
from django.test.utils import get_runner

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

# Cambiar temporalmente a SQLite para tests
os.environ['TEST_DATABASE'] = 'sqlite'

django.setup()

TestRunner = get_runner(settings)
test_runner = TestRunner(verbosity=2, interactive=True, keepdb=True)

# Ejecutar el test específico
failures = test_runner.run_tests([
    'api.tests.test_product_status_signals.ProductBuyedSignalsTest.test_product_status_changes_to_comprado_on_buyed_save',
    'api.tests.test_product_status_signals.ProductBuyedSignalsTest.test_product_amount_purchased_updates_on_buyed_save',
    'api.tests.test_product_status_signals.ProductBuyedSignalsTest.test_product_status_reverts_to_encargado_on_buyed_delete',
    'api.tests.test_product_status_signals.ProductReceivedSignalsTest.test_product_status_changes_to_recibido_on_received_save',
    'api.tests.test_product_status_signals.ProductReceivedSignalsTest.test_product_amount_received_updates_on_received_save',
    'api.tests.test_product_status_signals.ProductDeliverySignalsTest.test_product_status_changes_to_entregado_on_delivery_save',
    'api.tests.test_product_status_signals.ProductDeliverySignalsTest.test_product_amount_delivered_updates_on_delivery_save',
    'api.tests.test_product_status_signals.ProductDeliverySignalsTest.test_order_status_changes_to_completado_when_all_delivered',
    'api.tests.test_product_status_signals.SignalsIntegrationTest.test_complete_product_lifecycle',
])

if failures:
    sys.exit(1)
