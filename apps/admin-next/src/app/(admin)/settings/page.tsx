import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { SettingsForm } from './settings-form';

export default async function SettingsPage() {
  const session = await auth();
  const canEdit =
    session?.user.role === 'admin' || session?.user.role === 'accountant';

  const info = await prisma.commonInformation.findFirst({
    orderBy: { id: 'asc' },
    select: { changeRate: true, costPerPound: true },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Global system parameters (CommonInformation). These feed pricing
          and shipping calculations.
        </p>
      </header>

      {canEdit ? (
        <SettingsForm
          defaults={{
            changeRate: info?.changeRate ?? 0,
            costPerPound: info?.costPerPound ?? 0,
          }}
        />
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-white p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          <p>
            Change rate:{' '}
            <strong>{(info?.changeRate ?? 0).toFixed(2)}</strong>
          </p>
          <p className="mt-1">
            Cost per pound:{' '}
            <strong>{(info?.costPerPound ?? 0).toFixed(2)}</strong>
          </p>
          <p className="mt-3 text-xs text-zinc-500">
            Only admin or accountant roles can change these.
          </p>
        </div>
      )}
    </div>
  );
}
