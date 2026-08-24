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
    <ProfileForms
      defaults={{
        name: user.name,
        lastName: user.lastName,
        email: user.email ?? '',
        homeAddress: user.homeAddress,
      }}
      phoneNumber={user.phoneNumber}
      role={user.role}
    />
  );
}
