import { AsideNav } from './AsideNav';
import { NotificationsPopover } from '@/components/notifications/NotificationsPopover';
import { BreadcrumbNavigation } from './BreadcrumbNavigation';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

interface AppSidebarWrapperProps {
  children: React.ReactNode;
}

export function AppSidebarWrapper({ children }: AppSidebarWrapperProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        {/* Sidebar */}
        <AsideNav />

        {/* Área principal */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <header className="flex h-20 shrink-0  items-center gap-4 px-6 bg-background/95 backdrop-blur-sm shadow-sm border-0 w-full border-b border-border">
            {/* Trigger del sidebar */}
            <SidebarTrigger className="-ml-1" />

            {/* Título de la página */}
            <div className="flex items-center min-w-0 flex-1">
              <BreadcrumbNavigation />
            </div>

            {/* Acciones del header */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              {/* Notificaciones */}
              <NotificationsPopover />
            </div>
          </header>

          {/* Contenido */}
          <main className="flex-1 min-h-0 p-6 sm:p-8 xl:p-10 bg-background overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
