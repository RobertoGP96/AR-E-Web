import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { parseId } from '@/lib/action-helpers';
import { DashboardGreeting } from './dashboard-greeting';
import { AdminDashboard } from './admin-dashboard';
import { AgentDashboard } from './agent-dashboard';
import { AccountantDashboard } from './accountant-dashboard';
import { LogisticalDashboard } from './logistical-dashboard';

export const dynamic = 'force-dynamic';

/**
 * Dashboard adaptado al rol: cada rol de staff ve los atajos, las
 * métricas y las listas operativas de su trabajo diario. El proxy y
 * el layout ya garantizan que solo llega staff hasta aquí.
 */
export default async function DashboardPage() {
  const session = await auth();
  const role = session?.user.role ?? 'admin';

  const common = await prisma.commonInformation.findFirst({
    orderBy: { id: 'asc' },
  });

  let content: React.ReactNode;
  if (role === 'agent') {
    // parseId nunca debería fallar con una sesión válida; el centinela
    // -1 no coincide con ningún usuario y rinde un panel vacío seguro.
    const agentId = parseId(session?.user.id ?? '') ?? BigInt(-1);
    content = <AgentDashboard role={role} agentId={agentId} />;
  } else if (role === 'logistical') {
    content = <LogisticalDashboard role={role} />;
  } else if (role === 'accountant') {
    content = <AccountantDashboard role={role} />;
  } else {
    content = <AdminDashboard role={role} />;
  }

  return (
    <div className="animate-in space-y-8 pb-8 fade-in duration-500">
      <DashboardGreeting role={role} rate={common?.changeRate ?? 0} />
      {content}
    </div>
  );
}
