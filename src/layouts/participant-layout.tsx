import { Outlet } from 'react-router-dom';

export function ParticipantLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ffffff_0%,#f5f7fb_45%,#e9eef5_100%)] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col justify-center">
        <Outlet />
      </div>
    </div>
  );
}
