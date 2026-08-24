'use client';

import type { ReactNode } from 'react';
import { useState, useTransition } from 'react';
import { Button, Modal } from '@heroui/react';
import { Loader2, TriangleAlert } from 'lucide-react';

/**
 * Destructive/irreversible action confirmation. Runs `onConfirm` in a
 * transition; shows the returned error inline instead of closing.
 */
export function ConfirmModal({
  isOpen,
  onClose,
  title,
  description,
  confirmLabel = 'Eliminar',
  tone = 'danger',
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  tone?: 'danger' | 'accent';
  onConfirm: () => Promise<{ ok: boolean; error?: string }>;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await onConfirm();
      if (result.ok) {
        onClose();
      } else {
        setError(result.error ?? 'La operación falló');
      }
    });
  }

  return (
    <Modal.Backdrop
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open && !isPending) {
          setError(null);
          onClose();
        }
      }}
    >
      <Modal.Container size="sm" placement="auto">
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Icon
              className={
                tone === 'danger'
                  ? 'bg-danger-soft text-danger-soft-foreground'
                  : 'bg-accent-soft text-accent-soft-foreground'
              }
            >
              <TriangleAlert className="h-5 w-5" aria-hidden />
            </Modal.Icon>
            <Modal.Heading>{title}</Modal.Heading>
            {description ? (
              <p className="text-sm text-muted">{description}</p>
            ) : null}
          </Modal.Header>
          {error ? (
            <Modal.Body>
              <p
                role="alert"
                className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger-soft-foreground"
              >
                {error}
              </p>
            </Modal.Body>
          ) : null}
          <Modal.Footer>
            <Button
              variant="tertiary"
              onPress={() => {
                setError(null);
                onClose();
              }}
              isDisabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              variant={tone === 'danger' ? 'danger' : 'primary'}
              onPress={confirm}
              isDisabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Procesando…
                </>
              ) : (
                confirmLabel
              )}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
