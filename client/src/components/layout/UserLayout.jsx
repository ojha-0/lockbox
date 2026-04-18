import { Outlet } from 'react-router-dom';
import UserSidebar from './UserSidebar';

export default function UserLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-paper">
      <UserSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
