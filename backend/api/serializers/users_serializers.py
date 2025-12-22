from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from api.models import CustomUser
import re


class PasswordRecoverSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=False)
    password_secret = serializers.CharField(required=False)


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Serializador para crear usuarios.
    """
    password = serializers.CharField(write_only=True, required=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "email",
            "name",
            "password",
            "last_name",
            "home_address",
            "phone_number",
            "role",
            "agent_profit",
            "assigned_agent",
            "is_staff",
            "is_active",
            "is_verified",
            "date_joined",
            "full_name",
        ]
        # Permitir que administradores actualicen is_active/is_verified mediante PATCH
        read_only_fields = ["id", "is_staff", "date_joined"]

    def validate_phone_number(self, value):
        if re.search(r"^[\+\d\s\-\(\)]+$", value.strip()):
            if CustomUser.objects.filter(phone_number=value.strip()).exists():
                raise serializers.ValidationError("El número de teléfono ya existe.")
            return value.strip()
        raise serializers.ValidationError("El numero de telefono no es valido")

    def validate_email(self, value):
        if not value or value.strip() == '':
            return None
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("El email ya existe.")
        return value

    def create(self, validated_data):
        user = super().create(validated_data)
        user.set_password(validated_data["password"])
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializador para actualizar usuarios.
    Permite actualizar campos de usuario (incluyendo is_active e is_verified para administradores).
    """
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "email",
            "name",
            "last_name",
            "home_address",
            "phone_number",
            "role",
            "agent_profit",
            "assigned_agent",
            "is_staff",
            "is_active",
            "is_verified",
            "date_joined",
            "full_name",
        ]
        read_only_fields = ["id", "date_joined"]

    def validate_phone_number(self, value):
        clean_value = value.strip()
        if not re.search(r"^[\+\d\s\-\(\)]+$", clean_value):
            raise serializers.ValidationError("El número de teléfono no es válido")

        if self.instance:
            existing_user = CustomUser.objects.filter(phone_number=clean_value).exclude(id=self.instance.id).first()
            if existing_user:
                raise serializers.ValidationError("El número de teléfono ya está en uso por otro usuario.")
        else:
            if CustomUser.objects.filter(phone_number=clean_value).exists():
                raise serializers.ValidationError("El número de teléfono ya existe.")

        return clean_value

    def validate_email(self, value):
        if not value or value.strip() == '':
            return None

        if self.instance:
            existing_user = CustomUser.objects.filter(email=value).exclude(id=self.instance.id).first()
            if existing_user:
                raise serializers.ValidationError("El email ya está en uso por otro usuario.")
        else:
            if CustomUser.objects.filter(email=value).exists():
                raise serializers.ValidationError("El email ya existe.")
        return value


class UserSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo CustomUser.
    Incluye validaciones personalizadas para email y teléfono, y gestiona la creación de usuarios con contraseña encriptada.
    """
    # Removido user_id, usar id directamente
    email = serializers.EmailField(required=False, allow_blank=True)  # Removido write_only para que se devuelva en GET
    password = serializers.CharField(write_only=True, required=False)  # Password es opcional en updates
    full_name = serializers.CharField(read_only=True)

    class Meta:
        """Class of model"""

        model = CustomUser
        fields = [
            "id",  # Cambiado de user_id a id
            "email",
            "name",
            "password",
            "last_name",
            "home_address",
            "phone_number",
            "role",
            "agent_profit",
            "assigned_agent",
            "is_staff",
            "is_active",
            "is_verified",
            "date_joined",
            "full_name",
        ]
        read_only_fields = ["id"]  # Asegurar que id sea read-only

    def validate_phone_number(self, value):
        # Permitir números, espacios, guiones, paréntesis y el símbolo +
        if re.search(r"^[\+\d\s\-\(\)]+$", value.strip()):
            # Verificar unicidad excluyendo el usuario actual en actualizaciones
            if self.instance:
                existing_user = CustomUser.objects.filter(phone_number=value.strip()).exclude(id=self.instance.id).first()
                if existing_user:
                    raise serializers.ValidationError("El número de teléfono ya está en uso por otro usuario.")
            else:
                if CustomUser.objects.filter(phone_number=value.strip()).exists():
                    raise serializers.ValidationError("El número de teléfono ya existe.")
            return value.strip()
        raise serializers.ValidationError(
            {"error": "El numero de telefono no es valido"}
        )

    def validate_email(self, value):
        """Verification of email"""
        # Si el email está vacío o es None, retornar None
        if not value or value.strip() == '':
            return None

        # Verificar unicidad excluyendo el usuario actual en actualizaciones
        if self.instance:
            existing_user = CustomUser.objects.filter(email=value).exclude(id=self.instance.id).first()
            if existing_user:
                raise serializers.ValidationError("El email ya está en uso por otro usuario.")
        else:
            # Solo validar unicidad si el email tiene valor
            if CustomUser.objects.filter(email=value).exists():
                raise serializers.ValidationError({"error": "El email ya existe."})
        return value

    def validate(self, attrs):
        """
        Validaciones a nivel de objeto.
        Verificar que campos requeridos estén presentes según el contexto (create vs update).
        """
        # En creación, la contraseña es requerida
        if not self.instance and 'password' not in attrs:
            raise serializers.ValidationError({"password": "La contraseña es requerida al crear un usuario."})

        # Validar que agent_profit sea >= 0 si está presente
        if 'agent_profit' in attrs and attrs['agent_profit'] < 0:
            raise serializers.ValidationError({"agent_profit": "La ganancia del agente no puede ser negativa."})

        return attrs

    def create(self, validated_data):
        user = super().create(validated_data)
        user.set_password(validated_data["password"])
        user.save()
        return user

    def update(self, instance, validated_data):
        """
        Actualización de usuario con soporte para actualizaciones parciales.
        Solo actualiza los campos que se envían en la petición.
        """
        # Extraer la contraseña si está presente (no se debe asignar directamente)
        password = validated_data.pop('password', None)

        # Actualizar todos los demás campos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Si se proporcionó una contraseña, encriptarla antes de guardar
        if password:
            instance.set_password(password)

        instance.save()
        return instance
    
    def get_agent_name(self, obj):
        """
        Método para obtener el nombre del agente
        """
        return obj.agent_name

class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializador específico para actualizaciones de perfil de usuario.
    Permite la lectura y escritura de campos de perfil sin campos sensibles.
    """
    # Removido user_id, usar id directamente
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = CustomUser
        fields = [
            "id",  # Cambiado de user_id a id
            "email",
            "name",
            "last_name",
            "home_address",
            "phone_number",
            "role",
            "agent_profit",
            "assigned_agent",
            "agent_name",
            "is_staff",
            "is_active",
            "is_verified",
            "date_joined",
            "full_name",
        ]
        read_only_fields = [
            "id",  # Cambiado de user_id a id
            "role",
            "agent_profit",
            "is_staff",
            "is_active",
            "is_verified",
            "date_joined",
            "full_name"
        ]

    def validate_phone_number(self, value):
        """Validar formato de número de teléfono y unicidad"""
        # Limpiar el valor
        clean_value = value.strip()

        # Permitir números, espacios, guiones, paréntesis y el símbolo +
        if not re.search(r"^[\+\d\s\-\(\)]+$", clean_value):
            raise serializers.ValidationError(
                "El número de teléfono no es válido"
            )

        # Verificar unicidad excluyendo el usuario actual
        if self.instance:
            existing_user = CustomUser.objects.filter(phone_number=clean_value).exclude(id=self.instance.id).first()
            if existing_user:
                raise serializers.ValidationError("El número de teléfono ya está en uso por otro usuario.")
        else:
            if CustomUser.objects.filter(phone_number=clean_value).exists():
                raise serializers.ValidationError("El número de teléfono ya existe.")

        return clean_value

    def validate_email(self, value):
        """Validar email y unicidad"""
        # Permitir email vacío
        if not value or value.strip() == '':
            return None

        # Verificar unicidad excluyendo el usuario actual
        if self.instance:
            existing_user = CustomUser.objects.filter(email=value).exclude(id=self.instance.id).first()
            if existing_user:
                raise serializers.ValidationError("El email ya está en uso por otro usuario.")
        else:
            if CustomUser.objects.filter(email=value).exists():
                raise serializers.ValidationError("El email ya existe.")
        return value