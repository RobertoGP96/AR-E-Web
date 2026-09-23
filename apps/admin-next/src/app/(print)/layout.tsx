import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { isStaff } from '@/lib/route-roles';

/**
 * Grupo de rutas para documentos imprimibles (estado de cuenta, facturas
 * al cliente). Sin sidebar, cabecera ni bottom nav: la página es el
 * documento. Mismo doble control que (admin)/layout.tsx: proxy.ts aplica
 * el RBAC por ruta y aquí se vuelve a exigir un rol de personal.
 */
export default async function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (!isStaff(session.user.role)) redirect('/unauthorized');

  return (
    <div className="min-h-dvh bg-background text-foreground print:bg-white">
      {children}
    </div>
  );
}
