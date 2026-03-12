import { Link, Outlet } from 'react-router-dom';

export function MarketingLayout() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fdfdfd_0%,#f5f6f8_40%,#eef2f7_100%)] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            Vanaila Psikotest
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-slate-500 md:flex">
            <a href="#how-it-works">How It Works</a>
            <a href="#assessment-types">Assessment Types</a>
            <a href="#faq">FAQ</a>
            <Link to="/t/disc-batch-a" className="rounded-full px-4 py-2 transition hover:bg-white/70 hover:text-slate-950">
              Try Demo
            </Link>
            <Link to="/signup" className="rounded-full bg-slate-950 px-4 py-2 text-white shadow-sm transition hover:bg-slate-900">
              Sign Up
            </Link>
          </nav>
        </div>
      </header>
      <Outlet />
      <footer className="border-t border-white/60 bg-white/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>Digital psychological assessments for organizations, researchers, and education teams.</p>
          <p>Built for structured administration, automated scoring, and professional reports.</p>
        </div>
      </footer>
    </div>
  );
}
