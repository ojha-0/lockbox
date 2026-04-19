import { Outlet } from 'react-router-dom';
import OrganizationSidebar from './OrganizationSidebar';

export default function OrganizationLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-paper">
      <OrganizationSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
