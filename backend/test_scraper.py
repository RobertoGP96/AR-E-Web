#!/usr/bin/env python
"""
Script de prueba para el scraper de Amazon
"""
import sys
import os
import json

# Añadir el directorio del proyecto al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from api.utils.amazon_scraper import amazon_scraper

def test_amazon_scraper():
    """Prueba el scraper con un link de Amazon"""

    # Link de ejemplo proporcionado por el usuario
    test_url = "https://www.amazon.com/Coach-Courage-Shoulder-28-Maple/dp/B0CTWGZ6TT/ref=sr_1_5?_encoding=UTF8&content-id=amzn1.sym.1719e459-1a7f-4473-9a36-764b0b1d8876&dib=eyJ2IjoiMSJ9.MmzW7BCxn_jkf1ZxwczF2VLvOemkHNptIIsc4kccmWAHgDZhgEUPr68hStOxMdD8w7Jb9yILUbM8lgxYRDt2Vvjx_Mnq_s3NLELwkJyTBekBcLt2Ec59MNpI9KaddyUPb-OJYbGHB_PW5-PBKewBYs1L3gWAGqHpTh84F4lSJr0ghKqfaBm_MNi0mFD3ZaLKEtHnREkXf6NixZq1FUccy3xw0.UTbDovsvXo7EwAHd5-iBiF4jmmKDx4v9qo3Zg0GoBm4&dib_tag=se&pd_rd_r=6bd5da02-5af8-4665-8436-b7909afd6dee&pd_rd_w=uPYlr&pd_rd_wg=RhvZa&pf_rd_i=7147440011&pf_rd_m=A2R2RITDJNW1Q6&pf_rd_s=merchandised-search-3&qid=1761245654&refinements=p_85%3A2470955011%2Cp_n_g-1004227705091%3A21451213011&rnid=14630382011&rps=1&s=apparel&sr=1-5&th=1&psc=1"

    print("Probando scraper de Amazon...")
    print(f"URL: {test_url}")
    print("-" * 50)

    try:
        result = amazon_scraper.scrape_product(test_url)

        print("Resultado:")
        print(json.dumps(result, indent=2, ensure_ascii=False))

        if result.get('success'):
            print("\n✅ Scraping exitoso!")
            data = result.get('data', {})
            print(f"Tipo: {data.get('type')}")
            print(f"Título: {data.get('title')}")
            print(f"Precio: {data.get('price')}")
            print(f"ASIN: {data.get('asin')}")
        else:
            print(f"\n❌ Error en scraping: {result.get('error')}")

    except Exception as e:
        print(f"\n❌ Error inesperado: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_amazon_scraper()