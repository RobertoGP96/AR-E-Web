"""User models"""

from django.utils import timezone
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, Group, Permission
from django.utils.translation import gettext_lazy as _
from api.managers import CustomUserManager


class CustomUser(AbstractBaseUser, PermissionsMixin):
    """Custom user model"""
    email = models.EmailField(_("email"), unique=True, blank=True, null=True)
    name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    home_address = models.CharField(max_length=200)
    phone_number = models.CharField(max_length=20, unique=True)

    # Roles choices
    ROLE_CHOICES = [
        ('user', 'Usuario'),
        ('agent', 'Agente'),
        ('accountant', 'Contador'),
        ('buyer', 'Comprador'),
        ('logistical', 'Logístico'),
        ('community_manager', 'Community Manager'),
        ('admin', 'Administrador'),
        ('client', 'Cliente'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='client')
    agent_profit = models.FloatField(default=0)
    assigned_agent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'role': 'agent'},
        related_name='assigned_clients',
        help_text='Agente asignado para este cliente'
    )

    # Account management
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)
    sent_verification_email = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    verification_secret = models.CharField(max_length=200, blank=True, null=True)
    password_secret = models.CharField(max_length=200, blank=True, null=True)

    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "phone_number"
    REQUIRED_FIELDS = ["name"]

    objects = CustomUserManager()

    def __str__(self):
        return self.name + " " + self.last_name

    @property
    def full_name(self):
        """Get user's full name"""
        return f"{self.name} {self.last_name}".strip()

    def has_role(self, role):
        """Check if user has a specific role"""
        return self.role == role

    def is_agent(self):
        """Check if user is an agent"""
        return self.role == 'agent'

    def is_accountant(self):
        """Check if user is an accountant"""
        return self.role == 'accountant'

    def is_buyer(self):
        """Check if user is a buyer"""
        return self.role == 'buyer'

    def is_logistical(self):
        """Check if user is logistical"""
        return self.role == 'logistical'

    def is_community_manager(self):
        """Check if user is community manager"""
        return self.role == 'community_manager'

    def is_admin(self):
        """Check if user is admin"""
        return self.role == 'admin' or self.is_staff

    # Campos para resolver conflictos con el modelo User por defecto
    groups = models.ManyToManyField(
        Group,
        related_name='customuser_set',  # Cambia el related_name para evitar conflictos
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name='customuser_set',  # Cambia el related_name para evitar conflictos
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )

    def verify(self):
        """Verify user account"""
        self.is_verified = True
        self.is_active = True
        self.verification_secret = None
        self.save(update_fields=['is_verified', 'is_active', 'verification_secret'])

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"