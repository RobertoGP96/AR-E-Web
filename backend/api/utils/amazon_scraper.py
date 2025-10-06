"""
Utilidades para hacer scraping de productos de Amazon
"""
import re
import json
import requests
from bs4 import BeautifulSoup
from typing import Dict, Optional, List
from urllib.parse import urlparse, parse_qs
import time
import random


class AmazonScraper:
    """Clase para hacer scraping de productos de Amazon"""
    
    def __init__(self):
        self.session = requests.Session()
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        self.session.headers.update(self.headers)

    def extract_asin_from_url(self, url: str) -> Optional[str]:
        """Extrae el ASIN de una URL de Amazon"""
        try:
            # Patrones comunes para ASIN en URLs de Amazon
            patterns = [
                r'/dp/([A-Z0-9]{10})',
                r'/gp/product/([A-Z0-9]{10})',
                r'asin=([A-Z0-9]{10})',
                r'/([A-Z0-9]{10})/',
            ]
            
            for pattern in patterns:
                match = re.search(pattern, url)
                if match:
                    return match.group(1)
            
            return None
        except Exception:
            return None

    def clean_text(self, text: str) -> str:
        """Limpia el texto eliminando espacios extra y caracteres especiales"""
        if not text:
            return ""
        return re.sub(r'\s+', ' ', text.strip())

    def extract_price(self, soup: BeautifulSoup) -> Optional[float]:
        """Extrae el precio del producto"""
        price_selectors = [
            '.a-price-whole',
            '.a-offscreen',
            '.a-price .a-offscreen',
            '#priceblock_dealprice',
            '#priceblock_ourprice',
            '.a-price-range',
            '.a-color-price',
        ]
        
        for selector in price_selectors:
            price_elem = soup.select_one(selector)
            if price_elem:
                price_text = self.clean_text(price_elem.get_text())
                # Extraer números del precio
                price_match = re.search(r'[\d,]+\.?\d*', price_text.replace(',', ''))
                if price_match:
                    try:
                        return float(price_match.group().replace(',', ''))
                    except ValueError:
                        continue
        
        return None

    def extract_images(self, soup: BeautifulSoup) -> List[str]:
        """Extrae las URLs de las imágenes del producto"""
        images = []
        
        # Buscar en el script JSON que contiene las imágenes
        scripts = soup.find_all('script', string=re.compile(r'ImageBlockATF'))
        for script in scripts:
            try:
                # Buscar JSON con datos de imágenes
                json_match = re.search(r'var data = ({.*?});', script.string, re.DOTALL)
                if json_match:
                    data = json.loads(json_match.group(1))
                    if 'colorImages' in data:
                        for color_group in data['colorImages'].values():
                            for image in color_group:
                                if 'large' in image:
                                    images.append(image['large'])
                                elif 'hiRes' in image:
                                    images.append(image['hiRes'])
            except (json.JSONDecodeError, KeyError):
                continue
        
        # Fallback: buscar imágenes en elementos img
        if not images:
            img_elements = soup.select('#landingImage, .a-dynamic-image, .a-image-wrapper img')
            for img in img_elements:
                src = img.get('src') or img.get('data-src')
                if src and 'images-amazon.com' in src:
                    images.append(src)
        
        return list(set(images))  # Eliminar duplicados

    def extract_specifications(self, soup: BeautifulSoup) -> Dict[str, str]:
        """Extrae las especificaciones técnicas del producto"""
        specs = {}
        
        # Buscar en la tabla de detalles técnicos
        detail_tables = soup.select('#productDetails_techSpec_section_1 tr, #productDetails_detailBullets_sections1 tr')
        for row in detail_tables:
            key_elem = row.select_one('td.a-span3 span, th')
            value_elem = row.select_one('td.a-span9 span, td:last-child')
            
            if key_elem and value_elem:
                key = self.clean_text(key_elem.get_text()).replace(':', '').strip()
                value = self.clean_text(value_elem.get_text())
                if key and value:
                    specs[key] = value
        
        # Buscar en la lista de detalles
        detail_lists = soup.select('#feature-bullets ul li span, #productDetails_detailBullets_sections1 span')
        for item in detail_lists:
            text = self.clean_text(item.get_text())
            if ':' in text:
                key, value = text.split(':', 1)
                key = key.strip()
                value = value.strip()
                if key and value:
                    specs[key] = value
        
        return specs

    def scrape_product(self, url: str) -> Dict:
        """Scrape principal para obtener datos del producto o carrito"""
        try:
            # Añadir delay aleatorio para evitar detección
            time.sleep(random.uniform(1, 3))
            
            # Realizar request
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Verificar si la página es válida
            if 'robot check' in response.text.lower() or soup.select_one('.a-alert-error'):
                return {
                    'success': False,
                    'error': 'Página bloqueada por Amazon o página no encontrada'
                }
            
            # Verificar si es una URL de carrito
            if self.is_cart_url(url):
                return self.scrape_cart(url, soup)
            else:
                return self.scrape_single_product(url, soup)
                
        except requests.RequestException as e:
            return {
                'success': False,
                'error': f'Error de conexión: {str(e)}'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Error inesperado: {str(e)}'
            }

    def scrape_cart(self, url: str, soup: BeautifulSoup) -> Dict:
        """Scrape específico para carritos de Amazon"""
        try:
            products = self.extract_cart_products(soup)
            
            if not products:
                return {
                    'success': False,
                    'error': 'No se pudieron extraer productos del carrito o el carrito está vacío'
                }
            
            # Calcular totales del carrito
            total_items = sum(product.get('quantity', 1) for product in products)
            total_price = sum((product.get('price', 0) * product.get('quantity', 1)) for product in products if product.get('price'))
            
            # Extraer información adicional del carrito
            cart_title_elem = soup.select_one('#sc-active-cart h1, .a-size-extra-large')
            cart_title = self.clean_text(cart_title_elem.get_text()) if cart_title_elem else "Carrito de Amazon"
            
            return {
                'success': True,
                'data': {
                    'type': 'cart',
                    'title': cart_title,
                    'url': url,
                    'total_items': total_items,
                    'total_price': total_price,
                    'currency': 'USD',  # Asumir USD por defecto
                    'products': products,
                    'product_count': len(products)
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Error procesando carrito: {str(e)}'
            }

    def scrape_single_product(self, url: str, soup: BeautifulSoup) -> Dict:
        """Scrape específico para productos individuales"""
        try:
            # Extraer ASIN
            asin = self.extract_asin_from_url(url)
            
            # Extraer título
            title_elem = soup.select_one('#productTitle, .product-title, h1.a-size-large')
            title = self.clean_text(title_elem.get_text()) if title_elem else "Título no encontrado"
            
            # Extraer precio
            price = self.extract_price(soup)
            
            # Extraer descripción
            description_elem = soup.select_one('#feature-bullets ul, .a-unordered-list.a-vertical ul')
            description = ""
            if description_elem:
                bullet_points = description_elem.select('li span')
                description = " ".join([self.clean_text(bp.get_text()) for bp in bullet_points if bp.get_text().strip()])
            
            # Extraer imágenes
            images = self.extract_images(soup)
            
            # Extraer especificaciones
            specifications = self.extract_specifications(soup)
            
            # Extraer categoría
            breadcrumb_elem = soup.select_one('#wayfinding-breadcrumbs_feature_div')
            category = ""
            if breadcrumb_elem:
                breadcrumbs = breadcrumb_elem.select('a')
                category = " > ".join([self.clean_text(bc.get_text()) for bc in breadcrumbs if bc.get_text().strip()])
            
            # Extraer rating
            rating_elem = soup.select_one('.a-icon-alt, .reviewCountTextLinkedHistogram .a-offscreen')
            rating = None
            if rating_elem:
                rating_text = rating_elem.get_text()
                rating_match = re.search(r'(\d+\.?\d*)', rating_text)
                if rating_match:
                    try:
                        rating = float(rating_match.group(1))
                    except ValueError:
                        pass
            
            # Extraer número de reviews
            reviews_elem = soup.select_one('#acrCustomerReviewText, .reviewCountTextLinkedHistogram .a-size-base')
            reviews_count = None
            if reviews_elem:
                reviews_text = reviews_elem.get_text()
                reviews_match = re.search(r'([\d,]+)', reviews_text.replace(',', ''))
                if reviews_match:
                    try:
                        reviews_count = int(reviews_match.group(1).replace(',', ''))
                    except ValueError:
                        pass
            
            # Extraer disponibilidad
            availability_elem = soup.select_one('#availability span, .a-color-success, .a-color-state')
            availability = self.clean_text(availability_elem.get_text()) if availability_elem else "No disponible"
            
            return {
                'success': True,
                'data': {
                    'type': 'product',
                    'asin': asin,
                    'title': title,
                    'price': price,
                    'currency': 'USD',  # Asumir USD por defecto
                    'description': description,
                    'images': images,
                    'specifications': specifications,
                    'category': category,
                    'rating': rating,
                    'reviews_count': reviews_count,
                    'availability': availability,
                    'url': url,
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Error procesando producto: {str(e)}'
            }

    def validate_amazon_url(self, url: str) -> bool:
        """Valida si la URL es de Amazon"""
        try:
            parsed = urlparse(url)
            amazon_domains = ['amazon.com', 'amazon.es', 'amazon.co.uk', 'amazon.de', 'amazon.fr', 'amazon.it']
            return any(domain in parsed.netloc for domain in amazon_domains)
        except Exception:
            return False

    def is_cart_url(self, url: str) -> bool:
        """Detecta si la URL es de un carrito de Amazon"""
        cart_patterns = [
            '/cart',
            '/gp/cart',
            '/gp/aw/c',
            'cart.html',
            'Cart',
        ]
        return any(pattern in url for pattern in cart_patterns)

    def extract_cart_products(self, soup: BeautifulSoup) -> List[Dict]:
        """Extrae los productos de un carrito de Amazon"""
        products = []
        
        # Selectores para elementos del carrito
        cart_selectors = [
            '[data-asin]',  # Elementos con ASIN
            '.sc-list-item',  # Items del carrito
            '[data-itemid]',  # Items con ID
            '.a-row.sc-list-item-content',  # Contenido de items
        ]
        
        cart_items = []
        for selector in cart_selectors:
            items = soup.select(selector)
            if items:
                cart_items = items
                break
        
        for item in cart_items:
            try:
                product_data = {}
                
                # Extraer ASIN
                asin = item.get('data-asin') or item.get('data-itemid')
                if not asin:
                    # Buscar ASIN en links internos
                    links = item.select('a[href*="/dp/"], a[href*="/gp/product/"]')
                    for link in links:
                        href = link.get('href', '')
                        extracted_asin = self.extract_asin_from_url(href)
                        if extracted_asin:
                            asin = extracted_asin
                            break
                
                if not asin:
                    continue
                
                product_data['asin'] = asin
                
                # Extraer título
                title_selectors = [
                    '[data-title]',
                    '.sc-product-title',
                    '.a-size-medium',
                    'h4 a',
                    'span[dir="auto"]'
                ]
                
                title = ""
                for selector in title_selectors:
                    title_elem = item.select_one(selector)
                    if title_elem:
                        title = self.clean_text(title_elem.get_text())
                        break
                
                product_data['title'] = title or f"Producto {asin}"
                
                # Extraer precio
                price_selectors = [
                    '.sc-price',
                    '.a-price-whole',
                    '.a-price .a-offscreen',
                    '[data-price]'
                ]
                
                price = None
                for selector in price_selectors:
                    price_elem = item.select_one(selector)
                    if price_elem:
                        price_text = self.clean_text(price_elem.get_text())
                        price_match = re.search(r'[\d,]+\.?\d*', price_text.replace(',', ''))
                        if price_match:
                            try:
                                price = float(price_match.group().replace(',', ''))
                                break
                            except ValueError:
                                continue
                
                product_data['price'] = price
                
                # Extraer cantidad
                quantity_selectors = [
                    'select[name*="quantity"] option[selected]',
                    'input[name*="quantity"]',
                    '.sc-quantity-textfield',
                    '[data-quantity]'
                ]
                
                quantity = 1
                for selector in quantity_selectors:
                    qty_elem = item.select_one(selector)
                    if qty_elem:
                        qty_text = qty_elem.get('value') or qty_elem.get_text()
                        if qty_text and qty_text.isdigit():
                            quantity = int(qty_text)
                            break
                
                product_data['quantity'] = quantity
                
                # Extraer imagen
                img_selectors = [
                    'img[src*="images-amazon"]',
                    '.sc-product-image img',
                    'img'
                ]
                
                image_url = ""
                for selector in img_selectors:
                    img_elem = item.select_one(selector)
                    if img_elem:
                        src = img_elem.get('src') or img_elem.get('data-src')
                        if src and 'images-amazon' in src:
                            image_url = src
                            break
                
                product_data['image'] = image_url
                
                # Generar URL del producto
                product_data['url'] = f"https://amazon.com/dp/{asin}"
                
                products.append(product_data)
                
            except Exception as e:
                # Si hay error procesando un item, continuar con el siguiente
                continue
        
        return products


# Instancia global del scraper
amazon_scraper = AmazonScraper()