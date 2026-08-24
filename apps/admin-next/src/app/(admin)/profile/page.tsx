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
        <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="mt-2 text-gray-600">
          Gestiona tu información personal y configuración de cuenta
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
