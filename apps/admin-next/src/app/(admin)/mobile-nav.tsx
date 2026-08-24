'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Menu } from 'lucide-react';
import { Button, Drawer } from '@heroui/react';
import { AdminNav } from './admin-nav';

/**
 * Mobile navigation: HeroUI drawer (animated slide-in, focus trap,
 * Escape/backdrop dismiss) hosting the same AdminNav as the desktop
 * sidebar, over the near-black brand surface.
 */
export function MobileNav({ role }: { role: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        isIconOnly
        aria-label="Abrir menú"
        onPress={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" aria-hidden />
      </Button>

      <Drawer.Backdrop isOpen={open} onOpenChange={setOpen}>
        <Drawer.Content
          placement="left"
          className="w-72 max-w-[85vw] bg-sidebar p-0 text-sidebar-foreground"
        >
          <Drawer.Dialog className="flex h-full flex-col bg-transparent p-0">
            <div className="flex shrink-0 items-center justify-between border-b border-sidebar-border px-4 py-3">
              <Image
                src="/logo.svg"
                alt="AR-E"
                width={120}
                height={44}
                className="h-10 w-auto object-contain"
              />
              <Drawer.CloseTrigger className="text-sidebar-foreground/80 hover:text-white" />
            </div>
            <AdminNav role={role} onNavigate={() => setOpen(false)} />
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </div>
  );
}
