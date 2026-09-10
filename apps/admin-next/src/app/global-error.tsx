'use client';

import { useEffect } from 'react';

/**
 * Última red de seguridad: sustituye al layout raíz cuando falla el
 * propio layout (fuentes, providers). Debe renderizar <html>/<body>
 * y no depender de nada de la app, por eso va con estilos inline.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global] layout error', error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#fafaf9',
          color: '#1a1a1a',
        }}
      >
        <div style={{ textAlign: 'center', padding: 24, maxWidth: 420 }}>
          <h1 style={{ fontSize: 20, margin: '0 0 8px' }}>Algo salió mal</h1>
          <p style={{ fontSize: 14, color: '#6b6b6b', margin: '0 0 20px' }}>
            La aplicación no pudo iniciarse. Vuelve a intentarlo.
            {error.digest ? ` Ref: ${error.digest}` : ''}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: '#e8772e',
              color: '#fff',
              border: 0,
              borderRadius: 8,
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
