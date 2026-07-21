import { Outlet } from 'react-router';

export default function FullscreenLayout() {
  return (
    <div className="min-h-screen text-brand-text bg-brand-bg relative select-none">
      <Outlet />
    </div>
  );
}
