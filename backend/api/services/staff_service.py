"""
Gestor (`sales_manager`) de una orden — ADR-0007.

Cualquier miembro del personal (admin, agente, contador o logístico)
puede ser el gestor de una orden. Un agente siempre crea sus órdenes a
su propio nombre; para el resto, si no se indica gestor se asigna el
«admin general»: el admin activo con `is_superuser` o, a falta de él,
el admin activo más antiguo (menor id).

Espejo de `apps/admin-next/src/lib/order-manager.ts`.
"""

from django.contrib.auth import get_user_model

# ADR-0007
SALES_MANAGER_ROLES = ('admin', 'agent', 'accountant', 'logistical')


def is_sales_manager_role(role):
    return role in SALES_MANAGER_ROLES


def get_general_admin():
    """Admin general o None si no hay ningún admin activo."""
    User = get_user_model()
    return (
        User.objects.filter(role='admin', is_active=True)
        .order_by('-is_superuser', 'id')
        .first()
    )


def resolve_sales_manager(creator, requested):
    """
    Decide el gestor de la orden (ADR-0007):
    - agente → él mismo, ignorando lo pedido;
    - resto → el gestor pedido; si no hay, el admin general; si tampoco, None.
    """
    if creator is not None and getattr(creator, 'role', None) == 'agent':
        return creator
    if requested is not None:
        return requested
    return get_general_admin()
