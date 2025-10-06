"Email Sender"
import os
from django.template import Context, Template
from django.conf import settings
import resend


def send_email(to, to_email, verify_secret):
    """Email Sender - Solo envía si está habilitado en configuración"""
    
    # Verificar si el envío de email está habilitado
    if not getattr(settings, 'ENABLE_EMAIL_VERIFICATION', False):
        print(f"Email de verificación deshabilitado. Token para {to}: {verify_secret}")
        return
    
    # Verificar que las configuraciones necesarias estén presentes
    if not hasattr(settings, 'WEB_SITE_NAME'):
        print("Error: WEB_SITE_NAME no está configurado en settings")
        return
    
    if not hasattr(settings, 'VERIFICATION_URL'):
        print("Error: VERIFICATION_URL no está configurado en settings")
        return
    
    try:
        resend.api_key = settings.EMAIL_HOST_PASSWORD
        subject = f"Verifica tu cuenta de usuario para {settings.WEB_SITE_NAME}"
        html_template_path = os.path.join(os.path.dirname(__file__), "email_html.html")
        with open(html_template_path, "r", encoding="utf-8") as file:
            html_template_content = file.read()
        template = Template(html_template_content)
        context = Context(
            {
                "user_name": to,
                "verification_url": f"{settings.VERIFICATION_URL}{verify_secret}",
            }
        )
        html_message = template.render(context)
        params: resend.Emails.SendParams = {
            "from": "Acme <onboarding@resend.dev>",
            "to": ["aflopez000430@gmail.com", to_email],
            "subject": subject,
            "html": html_message,
        }
        resend.Emails.send(params)
        print(f"Email de verificación enviado a {to_email}")
    except Exception as e:
        print(f"Error enviando email de verificación: {e}")
        # No lanzar excepción para que no falle el registro
