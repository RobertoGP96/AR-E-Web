#!/bin/bash
# Script para aplicar mejoras de notificaciones
# Ejecutar desde: backend/

echo "🚀 Aplicando mejoras del sistema de notificaciones..."
echo ""

# 1. Crear migraciones
echo "📝 Creando migraciones para índices..."
python manage.py makemigrations api --name add_notification_indexes

if [ $? -ne 0 ]; then
    echo "❌ Error al crear migraciones"
    exit 1
fi

echo "✅ Migraciones creadas"
echo ""

# 2. Aplicar migraciones
echo "🔧 Aplicando migraciones..."
python manage.py migrate

if [ $? -ne 0 ]; then
    echo "❌ Error al aplicar migraciones"
    exit 1
fi

echo "✅ Migraciones aplicadas"
echo ""

# 3. Ejecutar tests
echo "🧪 Ejecutando tests de notificaciones..."
python manage.py test api.tests.test_notifications --verbosity=2

if [ $? -ne 0 ]; then
    echo "⚠️  Algunos tests fallaron - Revisa la salida"
else
    echo "✅ Todos los tests pasaron"
fi

echo ""

# 4. Probar comando de limpieza (dry-run)
echo "🧹 Probando comando de limpieza (dry-run)..."
python manage.py clean_notifications --dry-run

echo ""
echo "============================================"
echo "✨ Mejoras aplicadas exitosamente"
echo "============================================"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Revisar las migraciones generadas"
echo "   2. Configurar limpieza automática (cron/scheduler)"
echo "   3. Ver documentación en: doc/NOTIFICATIONS_HIGH_PRIORITY_IMPROVEMENTS.md"
echo ""
