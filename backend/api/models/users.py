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
        ('logistical', 'Logístico'),
        ('admin', 'Administrador'),
        ('client', 'Cliente'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='client')
    agent_profit = models.FloatField(default=0)

    # RN-021 (2.0.0, ADR-0009): saldo a favor y deuda por separado.
    # `balance` = dinero del cliente aún sin aplicar (nunca negativo);
    # `debt` = lo que debe. Ambos se recalculan juntos con
    # api.services.client_balance_service tras cada cobro, cambio de costo,
    # pesado o borrado de orden/entrega (señales en api/signals.py).
    balance = models.FloatField(
        default=0,
        help_text=(
            "Saldo a favor del cliente (RN-021 2.0.0): Σ sobrepagos − Σ saldo aplicado, "
            "nunca negativo. La deuda va en `debt`."
        )
    )
    debt = models.FloatField(
        default=0,
        help_text=(
            "Deuda pendiente del cliente (RN-021 2.0.0): Σ max(0, costo − efectivo − saldo aplicado) "
            "de sus órdenes y entregas. Siempre ≥ 0."
        )
    )
    
    assigned_agent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'role__in': ['agent', 'admin']},
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

     # Nuevo método para obtener el nombre del agente
    @property
    def agent_name(self):
        """
        Devuelve el nombre del agente asignado
        """
        return self.assigned_agent.full_name if self.assigned_agent else None

    def assign_agent(self, agent):
        """
        Método para asignar un agente de manera segura
        """
        if agent.is_agent():
            self.assigned_agent = agent
            self.save(update_fields=['assigned_agent'])
        else:
            raise ValueError("Solo se pueden asignar usuarios con rol de agente")

    # Método de clase para obtener clientes de un agente
    @classmethod
    def get_agent_clients(cls, agent):
        """
        Obtiene todos los clientes asignados a un agente
        """
        return cls.objects.filter(
            assigned_agent=agent, 
            role='client'
        )
        
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

    def recalculate_balance(self) -> float:
        """
        RN-021 (2.0.0, ADR-0009). Recalcula y guarda:
          - `balance`: saldo a favor = Σ sobrepagos − Σ saldo aplicado (≥ 0)
          - `debt`:    deuda pendiente = Σ max(0, costo − efectivo − saldo aplicado)
        sobre todas las órdenes y entregas del cliente, con la función pura
        compartida con admin-next (api.services.client_balance_service).

        Returns:
            float: el saldo a favor resultante (compatibilidad con llamadores 1.x).
        """
        from api.services.client_balance_service import compute_balance_for_client

        result = compute_balance_for_client(self)
        if self.balance != result['balance'] or self.debt != result['debt']:
            self.balance = result['balance']
            self.debt = result['debt']
            self.save(update_fields=['balance', 'debt', 'updated_at'])
        return result['balance']

    @property
    def net_position(self) -> float:
        """Posición neta de RN-021 1.x: saldo a favor − deuda (puede ser negativa)."""
        return round(float(self.balance or 0.0) - float(self.debt or 0.0), 2)

    @property
    def balance_status(self) -> str:
        """
        Estado del saldo del cliente (RN-021 2.0.0):
          - 'DEUDA'         → debe dinero (debt > 0), aunque también tenga saldo a favor
          - 'SALDO A FAVOR' → tiene crédito disponible (balance > 0) y nada pendiente
          - 'AL DÍA'        → ni deuda ni saldo a favor
        """
        from api.services.client_balance_service import balance_status

        return balance_status(self.balance, self.debt)

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
        # Índices para los filtros/ordenaciones del panel (admin-next y
        # admin Vite filtran por estado y fecha en cada lista).
        indexes = [
            models.Index(fields=['role'], name='api_customuser_role_idx'),
        ]
        ordering = ['-created_at']
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"