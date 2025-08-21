from django.contrib.auth.base_user import BaseUserManager
from django.utils.translation import gettext_lazy as _


class CustomUserManager(BaseUserManager):
    """
    Custom user model manager where email and name are the unique identifiers
    for authentication instead of usernames.
    """

    def create_user(self, phone_number, email=None, name=None, password=None, **extra_fields):
        """
        Crea y guarda un usuario con el número de teléfono, nombre y contraseña dados. El email es opcional.
        """
        if not phone_number:
            raise ValueError(_("El número de teléfono debe proporcionarse"))
        if not name:
            raise ValueError(_("El nombre debe proporcionarse"))
        if email:
            email = self.normalize_email(email)
        user = self.model(phone_number=phone_number, email=email, name=name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number, email=None, name=None, password=None, **extra_fields):
        """
        Crea y guarda un superusuario con el número de teléfono, nombre y contraseña dados. El email es opcional.
        """
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("Superuser must have is_staff=True."))
        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("Superuser must have is_superuser=True."))
        return self.create_user(phone_number, email, name, password, **extra_fields)
