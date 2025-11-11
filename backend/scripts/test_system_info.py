"""
Script para probar el endpoint de información del sistema
"""

import requests
import json

# URL del endpoint
url = "http://localhost:8000/arye_system/api_data/system/info/"

# Token de autenticación (reemplazar con un token válido de administrador)
token = "TU_TOKEN_AQUI"

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

try:
    response = requests.get(url, headers=headers)
    
    print(f"Status Code: {response.status_code}")
    print("\nResponse:")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    
except Exception as e:
    print(f"Error: {e}")
