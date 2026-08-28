'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from '@/lib/toast';
import { Button } from '@heroui/react';
import { UserDialog } from './user-dialog';
import type { AgentOption } from './schema';

/**
 * Self-contained "Nuevo usuario" header action: owns its create dialog
 * so the page header can live outside UsersClient (tabs layout).
 */
export function NewUserButton({
  agentOptions,
}: {
  agentOptions: AgentOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="primary" onPress={() => setOpen(true)}>
        <Plus className="h-4 w-4" aria-hidden />
        Nuevo usuario
      </Button>
      <UserDialog
        open={open}
        mode="create"
        agentOptions={agentOptions}
        onClose={() => setOpen(false)}
        onSuccess={() => {
          setOpen(false);
          toast.success('Usuario creado', {
            description: 'El nuevo usuario ya aparece en la lista.',
          });
          router.refresh();
        }}
      />
    </>
  );
}
