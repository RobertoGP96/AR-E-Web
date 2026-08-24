'use client';

import { QrCode } from 'lucide-react';
import { QRCode } from 'react-qrcode-logo';
import { Button, Popover } from '@heroui/react';

const FALLBACK_URL = 'https://arye-shipps.netlify.app';

/**
 * QR popover for a product link: dotted-style QR with the brand logo
 * inset, in a HeroUI popover.
 */
export function QRLink({ url, name }: { url: string | null; name: string }) {
  return (
    <Popover>
      <Button
        variant="ghost"
        size="sm"
        isIconOnly
        aria-label={`Código QR de ${name}`}
      >
        <QrCode className="h-4 w-4" aria-hidden />
      </Button>
      <Popover.Content placement="bottom start">
        <Popover.Dialog className="p-3">
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
          <span className="mt-1 block max-w-[152px] truncate text-center text-[10px] text-muted">
            {url || FALLBACK_URL}
          </span>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
