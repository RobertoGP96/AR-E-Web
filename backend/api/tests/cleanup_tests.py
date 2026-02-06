#!/usr/bin/env python
"""Script para limpiar la base de datos de test"""
import os
import sys
import django
from django.conf import settings
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

# Desconectar todas las conexiones a la BD de test
with connection.cursor() as cursor:
    # Terminar todas las conexiones a test_aryedb
    cursor.execute("""
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = 'test_aryedb'
        AND pid <> pg_backend_pid();
    """)

# Intentar eliminar la BD de test
with connection.cursor() as cursor:
    try:
        cursor.execute("DROP DATABASE IF EXISTS test_aryedb;")
        print("✅ Base de datos de test eliminada correctamente")
    except Exception as e:
        print(f"⚠️  Error al eliminar BD: {e}")

print("✅ Limpieza completada")
