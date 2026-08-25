import Image from 'next/image';
import { Store } from 'lucide-react';
import { getShopLogo } from '@/lib/shop-logos';

const SIZES = {
  sm: { box: 'h-9 w-9 rounded-lg p-1.5', icon: 'h-4.5 w-4.5', px: 24 },
  md: { box: 'h-10 w-10 rounded-xl p-2', icon: 'h-5 w-5', px: 24 },
} as const;

/**
 * Brand logo of a shop in a bordered white tile; unknown shops get a
 * neutral store icon. Decorative (aria-hidden) — always render it next
 * to the shop name, never as its replacement.
 */
export function ShopAvatar({
  name,
  size = 'sm',
}: {
  name: string;
  size?: keyof typeof SIZES;
}) {
  const s = SIZES[size];
  const logo = getShopLogo(name);

  if (!logo) {
    return (
      <span
        aria-hidden
        className={`${s.box} flex shrink-0 items-center justify-center border border-border bg-default text-muted`}
      >
        <Store className={s.icon} />
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className={`${s.box} flex shrink-0 items-center justify-center border border-border bg-white shadow-xs`}
    >
      {/* unoptimized: local SVGs need no optimizer pass (which rejects SVG) */}
      <Image
        src={logo}
        alt=""
        width={s.px}
        height={s.px}
        unoptimized
        className="h-full w-full object-contain"
      />
    </span>
  );
}
