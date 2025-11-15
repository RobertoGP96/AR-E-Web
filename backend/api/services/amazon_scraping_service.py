"""
Amazon scraping service.
Handles business logic for Amazon product scraping.
"""

import requests
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
import time
import re
from decimal import Decimal
from typing import Dict, List, Optional, Any
from django.conf import settings


class AmazonScrapingService:
    """
    Service class for Amazon product scraping operations.
    """

    def __init__(self):
        self.ua = UserAgent()
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': self.ua.random,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })

    def scrape_product(self, url: str) -> Dict[str, Any]:
        """
        Scrape product information from Amazon URL.

        Args:
            url: Amazon product URL

        Returns:
            Dict containing product information
        """
        try:
            # Add delay to avoid being blocked
            time.sleep(2)

            response = self.session.get(url, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'lxml')

            product_data = {
                'title': self._extract_title(soup),
                'price': self._extract_price(soup),
                'original_price': self._extract_original_price(soup),
                'rating': self._extract_rating(soup),
                'review_count': self._extract_review_count(soup),
                'availability': self._extract_availability(soup),
                'description': self._extract_description(soup),
                'images': self._extract_images(soup),
                'asin': self._extract_asin(url),
                'url': url,
            }

            return product_data

        except Exception as e:
            raise Exception(f"Error scraping product: {str(e)}")

    def _extract_title(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract product title."""
        selectors = [
            '#productTitle',
            '#title',
            '.product-title-word-break',
            '[data-cy="title-recipe"] h1',
        ]

        for selector in selectors:
            title_elem = soup.select_one(selector)
            if title_elem:
                return title_elem.get_text(strip=True)
        return None

    def _extract_price(self, soup: BeautifulSoup) -> Optional[Decimal]:
        """Extract current price."""
        selectors = [
            '.a-price .a-offscreen',
            '#priceblock_ourprice',
            '#priceblock_dealprice',
            '[data-cy="price-recipe"] .a-price .a-offscreen',
            '.a-color-price',
        ]

        for selector in selectors:
            price_elem = soup.select_one(selector)
            if price_elem:
                price_text = price_elem.get_text(strip=True)
                # Extract numeric price
                price_match = re.search(r'[\d,]+\.?\d*', price_text.replace(',', ''))
                if price_match:
                    try:
                        return Decimal(price_match.group())
                    except:
                        continue
        return None

    def _extract_original_price(self, soup: BeautifulSoup) -> Optional[Decimal]:
        """Extract original/list price."""
        selectors = [
            '.a-text-price .a-offscreen',
            '#priceblock_saleprice + .a-text-price .a-offscreen',
            '.a-price[data-cy="secondary-price-recipe"] .a-offscreen',
        ]

        for selector in selectors:
            price_elem = soup.select_one(selector)
            if price_elem:
                price_text = price_elem.get_text(strip=True)
                price_match = re.search(r'[\d,]+\.?\d*', price_text.replace(',', ''))
                if price_match:
                    try:
                        return Decimal(price_match.group())
                    except:
                        continue
        return None

    def _extract_rating(self, soup: BeautifulSoup) -> Optional[Decimal]:
        """Extract product rating."""
        selectors = [
            '[data-cy="reviews-ratings"] .a-icon-star',
            '#averageCustomerReviews .a-icon-star',
            '.a-icon-star .a-icon-alt',
        ]

        for selector in selectors:
            rating_elem = soup.select_one(selector)
            if rating_elem:
                rating_text = rating_elem.get_text(strip=True)
                rating_match = re.search(r'(\d+\.?\d*)', rating_text)
                if rating_match:
                    try:
                        return Decimal(rating_match.group(1))
                    except:
                        continue
        return None

    def _extract_review_count(self, soup: BeautifulSoup) -> Optional[int]:
        """Extract number of reviews."""
        selectors = [
            '[data-cy="reviews-ratings"] a',
            '#averageCustomerReviews a',
            '#acrCustomerReviewText',
        ]

        for selector in selectors:
            review_elem = soup.select_one(selector)
            if review_elem:
                review_text = review_elem.get_text(strip=True)
                review_match = re.search(r'(\d+(?:,\d+)*)', review_text.replace(',', ''))
                if review_match:
                    try:
                        return int(review_match.group(1).replace(',', ''))
                    except:
                        continue
        return None

    def _extract_availability(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract product availability."""
        selectors = [
            '#availability',
            '#outOfStock',
            '[data-cy="delivery-recipe"]',
            '#delivery-message',
        ]

        for selector in selectors:
            avail_elem = soup.select_one(selector)
            if avail_elem:
                return avail_elem.get_text(strip=True)
        return "In Stock"  # Default assumption

    def _extract_description(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract product description."""
        selectors = [
            '#productDescription',
            '#feature-bullets',
            '[data-cy="product-description"]',
            '#productDetails',
        ]

        for selector in selectors:
            desc_elem = soup.select_one(selector)
            if desc_elem:
                return desc_elem.get_text(strip=True)
        return None

    def _extract_images(self, soup: BeautifulSoup) -> List[str]:
        """Extract product images."""
        images = []

        # Main image
        main_img = soup.select_one('#landingImage, #imgBlkFront')
        if main_img and main_img.get('src'):
            images.append(main_img['src'])

        # Additional images
        img_selectors = [
            '.a-dynamic-image',
            '[data-image-index] img',
            '.imgTagWrapper img',
        ]

        for selector in img_selectors:
            img_elements = soup.select(selector)
            for img in img_elements[:5]:  # Limit to 5 images
                src = img.get('src') or img.get('data-src')
                if src and src not in images:
                    images.append(src)

        return images

    def _extract_asin(self, url: str) -> Optional[str]:
        """Extract ASIN from URL."""
        asin_match = re.search(r'/dp/([A-Z0-9]{10})', url)
        if asin_match:
            return asin_match.group(1)

        asin_match = re.search(r'/product/([A-Z0-9]{10})', url)
        if asin_match:
            return asin_match.group(1)

        return None

    def validate_amazon_url(self, url: str) -> bool:
        """
        Validate if URL is a valid Amazon product URL.

        Args:
            url: URL to validate

        Returns:
            True if valid Amazon product URL
        """
        amazon_patterns = [
            r'amazon\.com/dp/[A-Z0-9]{10}',
            r'amazon\.com/product/[A-Z0-9]{10}',
            r'amazon\.com/[^/]+/dp/[A-Z0-9]{10}',
            r'amazon\.com/gp/product/[A-Z0-9]{10}',
        ]

        for pattern in amazon_patterns:
            if re.search(pattern, url):
                return True
        return False