import { useState, useCallback } from 'react';
import { 
  getAmazonProductData, 
  isValidAmazonUrl, 
  type AmazonProduct, 
  type ScrapingResult 
} from '../lib/scrapping/amazon';

interface UseAmazonScrapperOptions {
  useProxy?: boolean;
  proxyApiUrl?: string;
  apiKey?: string;
  onSuccess?: (product: AmazonProduct) => void;
  onError?: (error: string) => void;
}

interface UseAmazonScrapperReturn {
  product: AmazonProduct | null;
  loading: boolean;
  error: string | null;
  scrapeProduct: (url: string) => Promise<ScrapingResult>;
  clearProduct: () => void;
  clearError: () => void;
  isValidUrl: (url: string) => boolean;
}

export function useAmazonScrapper(options: UseAmazonScrapperOptions = {}): UseAmazonScrapperReturn {
  const {
    useProxy = false,
    proxyApiUrl,
    apiKey,
    onSuccess,
    onError
  } = options;

  const [product, setProduct] = useState<AmazonProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrapeProduct = useCallback(async (url: string): Promise<ScrapingResult> => {
    // Validar URL
    if (!url.trim()) {
      const errorMsg = 'URL no puede estar vacía';
      setError(errorMsg);
      onError?.(errorMsg);
      return { success: false, error: errorMsg };
    }

    if (!isValidAmazonUrl(url)) {
      const errorMsg = 'URL de Amazon no válida';
      setError(errorMsg);
      onError?.(errorMsg);
      return { success: false, error: errorMsg };
    }

    setLoading(true);
    setError(null);
    setProduct(null);

    try {
      const scrapingOptions: Parameters<typeof getAmazonProductData>[1] = {
        useProxy
      };

      if (proxyApiUrl) {
        scrapingOptions.proxyApiUrl = proxyApiUrl;
      }

      if (apiKey) {
        scrapingOptions.apiKey = apiKey;
      }

      const result = await getAmazonProductData(url, scrapingOptions);

      if (result.success && result.data) {
        setProduct(result.data);
        setError(null);
        onSuccess?.(result.data);
      } else {
        const errorMsg = result.error || 'No se pudieron obtener los datos del producto';
        setError(errorMsg);
        onError?.(errorMsg);
      }

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      onError?.(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [useProxy, proxyApiUrl, apiKey, onSuccess, onError]);

  const clearProduct = useCallback(() => {
    setProduct(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const isValidUrl = useCallback((url: string) => {
    return isValidAmazonUrl(url);
  }, []);

  return {
    product,
    loading,
    error,
    scrapeProduct,
    clearProduct,
    clearError,
    isValidUrl
  };
}

export default useAmazonScrapper;