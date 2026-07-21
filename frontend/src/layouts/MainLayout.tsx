import SidebarLayout from '../components/SidebarLayout';
import { Outlet } from 'react-router';

export default function MainLayout() {
  return (
    <SidebarLayout>
      <div className="flex-1 flex flex-col min-h-[calc(100vh-4rem)]">
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </SidebarLayout>
  );
}
