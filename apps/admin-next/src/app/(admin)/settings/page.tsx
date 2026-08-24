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
    <SettingsForm
      canEdit={canEdit}
      defaults={{
        changeRate: info?.changeRate ?? 0,
        costPerPound: info?.costPerPound ?? 0,
      }}
    />
  );
}
