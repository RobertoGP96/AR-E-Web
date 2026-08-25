'use client';

import type { ReactNode } from 'react';
import { useState, useTransition } from 'react';
import { AlertDialog, Button, Spinner } from '@heroui/react';

/**
 * Destructive/irreversible action confirmation (HeroUI AlertDialog).
 * Runs `onConfirm` in a transition; shows the returned error inline
 * instead of closing.
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
    <AlertDialog.Backdrop
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open && !isPending) {
          setError(null);
          onClose();
        }
      }}
      isDismissable={!isPending}
      isKeyboardDismissDisabled={isPending}
    >
      <AlertDialog.Container size="sm" placement="auto">
        <AlertDialog.Dialog>
          <AlertDialog.Header>
            <AlertDialog.Icon
              status={tone === 'danger' ? 'danger' : 'accent'}
            />
            <AlertDialog.Heading>{title}</AlertDialog.Heading>
            {description ? (
              <p className="text-sm text-muted">{description}</p>
            ) : null}
          </AlertDialog.Header>
          {error ? (
            <AlertDialog.Body>
              <p
                role="alert"
                className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger-soft-foreground"
              >
                {error}
              </p>
            </AlertDialog.Body>
          ) : null}
          <AlertDialog.Footer>
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
                  <Spinner size="sm" aria-hidden />
                  Procesando…
                </>
              ) : (
                confirmLabel
              )}
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}
