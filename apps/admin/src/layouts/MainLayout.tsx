import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import { AppSidebarWrapper } from '@/components/navigation/AppSidebarWrapper';
import LoadingSpinner from '@/components/utils/LoadingSpinner';

const MainLayout = () => {
  return (
    <AppSidebarWrapper>
      <Suspense fallback={<div className="flex items-center justify-center h-screen"><LoadingSpinner size="lg" text="Cargando..." /></div>}>
        <Outlet />
      </Suspense>
    </AppSidebarWrapper>
  );
};

export default MainLayout;