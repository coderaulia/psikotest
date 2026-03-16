import { Link, Outlet } from 'react-router-dom';

const footerLinks = [
  { label: 'Manual', to: '/manual' },
  { label: 'White-label', to: '/white-label' },
  { label: 'Try Demo', to: '/t/disc-batch-a' },
  { label: 'Sign Up', to: '/signup' },
];

export function MarketingLayout() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fdfdfd_0%,#f5f6f8_40%,#eef2f7_100%)] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            Vanaila Psikotest
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-slate-500 md:flex">
            <a href="/#how-it-works">How It Works</a>
            <a href="/#assessment-types">Assessment Types</a>
            <Link to="/manual" className="transition hover:text-slate-950">
              Manual
            </Link>
            <a href="/#faq">FAQ</a>
            <Link to="/t/disc-batch-a" className="rounded-full px-4 py-2 transition hover:bg-white/70 hover:text-slate-950">
              Try Demo
            </Link>
            <Link
              to="/white-label"
              className="rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
            >
              White-label
            </Link>
            <Link to="/signup" className="rounded-full bg-slate-950 px-4 py-2 text-white shadow-sm transition hover:bg-slate-900">
              Sign Up
            </Link>
          </nav>
        </div>
      </header>
      <Outlet />
      <footer className="border-t border-white/60 bg-white/70">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div className="space-y-2 text-sm text-slate-500">
            <p>Digital psychological assessments for organizations, researchers, reviewers, and education teams.</p>
            <p>Built for structured administration, automated scoring, professional reports, and white-label deployment.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 md:justify-end">
            {footerLinks.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
