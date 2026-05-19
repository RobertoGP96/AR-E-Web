import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ProfileForms } from './profile-forms';

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = await prisma.customUser.findUnique({
    where: { id: BigInt(session.user.id) },
    select: {
      name: true,
      lastName: true,
      email: true,
      homeAddress: true,
      phoneNumber: true,
      role: true,
      balance: true,
    },
  });
  if (!user) redirect('/login');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Your account ({user.role}) · {user.phoneNumber} · balance{' '}
          {user.balance.toFixed(2)}
        </p>
      </header>
      <ProfileForms
        defaults={{
          name: user.name,
          lastName: user.lastName,
          email: user.email ?? '',
          homeAddress: user.homeAddress,
        }}
      />
    </div>
  );
}
