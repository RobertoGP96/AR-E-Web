"Vistas de la API"
from rest_framework.fields import ValidationError
from rest_framework import permissions
from rest_framework.permissions import BasePermission
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model

User = get_user_model()


class ReadOnlyorPost(BasePermission):
    "Clase de permisos para crear"

    def has_permission(self, request, view):
        return request.method in ["GET", "POST"]


class ReadOnly(BasePermission):
    "Clase de permisos para crear"

    def has_permission(self, request, view):
        return request.method in permissions.SAFE_METHODS


class AgentPermission(BasePermission):
    """Clase de permisos de agente"""

    def has_permission(self, request, view):
        try:
            user = User.objects.get(id=request.user.id)
            return user.role == 'agent'
        except Exception as e:
            raise ValidationError("El usuario no es un agente") from e

    def has_object_permission(self, request, view, obj):
        try:
            user = User.objects.get(id=request.user.id)
            return user.role == 'agent'
        except Exception as e:
            raise ValidationError("El usuario no es un agente") from e


class AccountantPermission(BasePermission):
    """Clase de permisos de contador"""

    def has_permission(self, request, view):
        try:
            user = User.objects.get(id=request.user.id)
            return user.role == 'accountant'
        except Exception as e:
            raise ValidationError("El usuario no es un contador") from e

    def has_object_permission(self, request, view, obj):
        try:
            user = User.objects.get(id=request.user.id)
            return user.role == 'accountant'
        except Exception as e:
            raise ValidationError("El usuario no es un contador") from e


class BuyerPermission(BasePermission):
    """Clase de permisos de comprador"""

    def has_permission(self, request, view):
        try:
            user = User.objects.get(id=request.user.id)
            return user.role == 'buyer'
        except Exception as e:
            raise ValidationError("El usuario no es un comprador") from e

    def has_object_permission(self, request, view, obj):
        try:
            user = User.objects.get(id=request.user.id)
            return user.role == 'buyer'
        except Exception as e:
            raise ValidationError("El usuario no es un comprador") from e


class LogisticalPermission(BasePermission):
    """Clase de permisos de logística"""

    def has_permission(self, request, view):
        try:
            user = User.objects.get(id=request.user.id)
            return user.role == 'logistical'
        except Exception as e:
            raise ValidationError("El usuario no es de logística") from e

    def has_object_permission(self, request, view, obj):
        try:
            user = User.objects.get(id=request.user.id)
            return user.role == 'logistical'
        except Exception as e:
            raise ValidationError("El usuario no es de logística") from e


class CommunityManagerPermission(BasePermission):
    """Clase de permisos de community manager"""

    def has_permission(self, request, view):
        try:
            user = User.objects.get(id=request.user.id)
            return user.role == 'community_manager'
        except Exception as e:
            raise ValidationError("El usuario no es community manager") from e

    def has_object_permission(self, request, view, obj):
        try:
            user = User.objects.get(id=request.user.id)
            return user.role == 'community_manager'
        except Exception as e:
            raise ValidationError("El usuario no es community manager") from e


class AdminPermission(BasePermission):
    """Clase de permisos de agente"""

    def has_permission(self, request, view):
        try:
            user = User.objects.get(id=request.user.id)
            return user.is_staff
        except Exception as e:
            raise ValidationError("El usuario no es un administrador") from e

    def has_object_permission(self, request, view, obj):
        try:
            user = User.objects.get(id=request.user.id)
            return user.is_staff
        except Exception as e:
            raise ValidationError("El usuario no es un administrador") from e

from rest_framework import permissions

class ClientOrderViewPermission(permissions.BasePermission):
    """
    Permiso personalizado para clientes:
    - Solo pueden ver sus propios pedidos
    - No pueden crear, editar ni eliminar pedidos
    """
    def has_permission(self, request, view):
        # Solo permitir métodos GET, HEAD, OPTIONS (solo lectura)
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        # Administradores y agentes pueden realizar todas las acciones
        return request.user.is_staff or request.user.is_superuser

    def has_object_permission(self, request, view, obj):
        # Solo métodos de lectura para clientes
        if request.method in permissions.SAFE_METHODS:
            # El cliente solo puede ver sus propios pedidos
            return obj.client == request.user.client
        
        # Administradores y agentes pueden realizar todas las acciones
        return request.user.is_staff or request.user.is_superuser
