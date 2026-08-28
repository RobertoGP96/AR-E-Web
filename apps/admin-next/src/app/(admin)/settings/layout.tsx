import { auth } from '@/auth';
import { SettingsNav } from './settings-nav';

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div>
      <SettingsNav role={session?.user.role ?? ''} />
      {children}
    </div>
  );
}
