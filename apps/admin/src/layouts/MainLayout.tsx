import { Outlet } from 'react-router-dom';
import { AppSidebarWrapper } from '@/components/navigation/AppSidebarWrapper';

const MainLayout = () => {
  return (
    <AppSidebarWrapper>
      <Outlet />
    </AppSidebarWrapper>
  );
};

export default MainLayout;