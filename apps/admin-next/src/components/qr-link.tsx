'use client';

import { useEffect, useRef, useState } from 'react';
import { QrCode } from 'lucide-react';
import { QRCode } from 'react-qrcode-logo';

const FALLBACK_URL = 'https://arye-shipps.netlify.app';

/**
 * QR popover for a product link, ported from the Vite admin's
 * products/qr-link.tsx: dotted-style QR with the brand logo inset.
 */
export function QRLink({ url, name }: { url: string | null; name: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  return (
    <span ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Código QR de ${name}`}
        title="Ver código QR"
        aria-expanded={open}
        className="rounded-md border border-border p-1 text-zinc-500 transition hover:bg-orange-50 hover:text-orange-600"
      >
        <QrCode className="h-3.5 w-3.5" aria-hidden />
      </button>
      {open ? (
        <span className="absolute left-0 top-full z-50 mt-2 block rounded-xl border border-border bg-white p-3 shadow-xl">
          <QRCode
            value={url || FALLBACK_URL}
            size={140}
            qrStyle="dots"
            eyeRadius={6}
            logoImage="/icon-192.png"
            logoWidth={32}
            logoHeight={32}
            removeQrCodeBehindLogo
            quietZone={6}
          />
          <span className="mt-1 block max-w-[152px] truncate text-center text-[10px] text-gray-400">
            {url || FALLBACK_URL}
          </span>
        </span>
      ) : null}
    </span>
  );
}
