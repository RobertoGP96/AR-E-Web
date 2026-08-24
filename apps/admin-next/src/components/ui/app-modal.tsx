'use client';

import type { ReactNode } from 'react';
import { Modal } from '@heroui/react';

type ModalSize = Modal['ContainerProps']['size'];

/**
 * Controlled modal of the design system (HeroUI Modal: focus trap,
 * Escape, backdrop dismiss, entrance/exit animations). Keep it mounted
 * and drive it with `isOpen` so the exit animation can play:
 *
 *   <AppModal isOpen={!!editing} onClose={() => setEditing(null)} …>
 */
export function AppModal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  size = 'md',
  isDismissable = true,
  children,
  footer,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  size?: ModalSize;
  isDismissable?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Modal.Backdrop
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      isDismissable={isDismissable}
    >
      <Modal.Container size={size} placement="auto" scroll="inside">
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header>
            {icon ? (
              <Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
                {icon}
              </Modal.Icon>
            ) : null}
            <Modal.Heading>{title}</Modal.Heading>
            {description ? (
              <p className="text-sm text-muted">{description}</p>
            ) : null}
          </Modal.Header>
          <Modal.Body>{children}</Modal.Body>
          {footer ? <Modal.Footer>{footer}</Modal.Footer> : null}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
