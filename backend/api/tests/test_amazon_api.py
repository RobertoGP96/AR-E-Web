#!/usr/bin/env python
"""
Script de prueba para el endpoint de Amazon scraping
"""
import os
import sys
import django
from pathlib import Path

# Configurar Django
sys.path.append(str(Path(__file__).parent.parent.parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def test_amazon_scraper():
    """Probar el scraper de Amazon directamente"""
    print("=== PRUEBA DEL AMAZON SCRAPER ===\n")
    
    try:
        from api.utils.amazon_scraper import amazon_scraper
        
        # URL de prueba (producto de ejemplo)
        test_url = "https://amazon.com/dp/B08N5WRWNW"  # Echo Dot
        
        print(f"Probando URL: {test_url}")
        print("Iniciando scraping...\n")
        
        # Realizar scraping
        result = amazon_scraper.scrape_product(test_url)
        
        if result['success']:
            print("✅ Scraping exitoso!")
            print(f"Título: {result['data']['title']}")
            print(f"Precio: ${result['data']['price']} {result['data']['currency']}")
            print(f"ASIN: {result['data']['asin']}")
            print(f"Rating: {result['data']['rating']}")
            print(f"Reviews: {result['data']['reviews_count']}")
            print(f"Disponibilidad: {result['data']['availability']}")
            print(f"Categoría: {result['data']['category']}")
            print(f"Imágenes encontradas: {len(result['data']['images'])}")
            print(f"Especificaciones: {len(result['data']['specifications'])} items")
            
            if result['data']['images']:
                print(f"Primera imagen: {result['data']['images'][0]}")
                
            if result['data']['specifications']:
                print("Algunas especificaciones:")
                for key, value in list(result['data']['specifications'].items())[:3]:
                    print(f"  - {key}: {value}")
                    
        else:
            print("❌ Error en el scraping:")
            print(f"Error: {result['error']}")
            
    except ImportError as e:
        print(f"❌ Error de importación: {e}")
        print("Asegúrate de que las dependencias estén instaladas:")
        print("pip install beautifulsoup4 lxml requests")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")

def test_amazon_serializers():
    """Probar los serializers de Amazon"""
    print("\n=== PRUEBA DE SERIALIZERS ===\n")
    
    try:
        from api.serializers import AmazonScrapingRequestSerializer, AmazonScrapingResponseSerializer
        
        # Probar request serializer
        print("Probando AmazonScrapingRequestSerializer...")
        request_data = {"url": "https://amazon.com/dp/B08N5WRWNW"}
        request_serializer = AmazonScrapingRequestSerializer(data=request_data)
        
        if request_serializer.is_valid():
            print("✅ Request serializer válido")
        else:
            print("❌ Request serializer inválido:")
            print(request_serializer.errors)
        
        # Probar URL inválida
        print("\nProbando URL inválida...")
        invalid_request = {"url": "https://google.com"}
        invalid_serializer = AmazonScrapingRequestSerializer(data=invalid_request)
        
        if not invalid_serializer.is_valid():
            print("✅ Validación de URL inválida funciona correctamente")
            print(f"Error esperado: {invalid_serializer.errors}")
        else:
            print("❌ La validación debería fallar para URLs no de Amazon")
            
        # Probar response serializer
        print("\nProbando AmazonScrapingResponseSerializer...")
        response_data = {
            "success": True,
            "data": {
                "asin": "B08N5WRWNW",
                "title": "Test Product",
                "price": 49.99,
                "currency": "USD",
                "description": "Test description",
                "images": ["https://example.com/image.jpg"],
                "specifications": {"Brand": "Test"},
                "category": "Electronics",
                "rating": 4.5,
                "reviews_count": 1000,
                "availability": "In Stock",
                "url": "https://amazon.com/dp/B08N5WRWNW"
            }
        }
        
        response_serializer = AmazonScrapingResponseSerializer(data=response_data)
        if response_serializer.is_valid():
            print("✅ Response serializer válido")
        else:
            print("❌ Response serializer inválido:")
            print(response_serializer.errors)
            
    except ImportError as e:
        print(f"❌ Error de importación: {e}")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")

def test_url_validation():
    """Probar validación de URLs"""
    print("\n=== PRUEBA DE VALIDACIÓN DE URLS ===\n")
    
    try:
        from api.utils.amazon_scraper import amazon_scraper
        
        test_urls = [
            ("https://amazon.com/dp/B08N5WRWNW", True),
            ("https://amazon.es/dp/B08N5WRWNW", True),
            ("https://amazon.co.uk/dp/B08N5WRWNW", True),
            ("https://google.com", False),
            ("https://ebay.com", False),
            ("invalid-url", False),
        ]
        
        for url, expected in test_urls:
            result = amazon_scraper.validate_amazon_url(url)
            status = "✅" if result == expected else "❌"
            print(f"{status} {url} -> {result} (esperado: {expected})")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_url_validation()
    test_amazon_serializers()
    test_amazon_scraper()  # Descomentado para probar scraping real
    
    print("\n=== RESUMEN ===")
    print("🔧 Para probar el scraping real, descomenta la línea test_amazon_scraper()")
    print("📚 Lee AMAZON_SCRAPING_API.md para documentación completa")
    print("🚀 El endpoint está disponible en: POST /api/amazon/scrape/")