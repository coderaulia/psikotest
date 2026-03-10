import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ffffff_0%,#f5f7fb_45%,#e6edf6_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <Card className="grid w-full overflow-hidden border-white/80 bg-white/80 md:grid-cols-[0.95fr_1.05fr]">
          <div className="hidden bg-slate-950 p-8 text-white md:block">
            <p className="text-xs uppercase tracking-[0.22em] text-white/50">Admin Access</p>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight">Assessment operations made quiet and clear.</h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/70">
              Log in to manage sessions, review participant progress, and inspect report-ready results from one composed dashboard.
            </p>
          </div>
          <div className="p-8 sm:p-10">
            <CardHeader className="p-0">
              <CardTitle>Admin login</CardTitle>
              <CardDescription>Use the demo credentials `admin@psikotest.local` / `admin123` for the starter flow.</CardDescription>
            </CardHeader>
            <CardContent className="mt-8 p-0">
              <form className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Email</label>
                  <Input type="email" defaultValue="admin@psikotest.local" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Password</label>
                  <Input type="password" defaultValue="admin123" />
                </div>
                <Button className="mt-3 w-full" size="lg" asChild>
                  <Link to="/admin/dashboard">Enter dashboard</Link>
                </Button>
              </form>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}
