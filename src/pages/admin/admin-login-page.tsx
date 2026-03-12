import { type FormEvent, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { saveAdminSession } from '@/lib/admin-session';
import { loginAdmin } from '@/services/admin-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = useMemo(() => {
    const state = location.state as { redirectTo?: string } | null;
    return state?.redirectTo ?? '/admin/dashboard';
  }, [location.state]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const session = await loginAdmin(email, password);
      saveAdminSession(session);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to sign in');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ffffff_0%,#f5f7fb_45%,#e6edf6_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <Card className="grid w-full overflow-hidden border-white/80 bg-white/80 md:grid-cols-[0.95fr_1.05fr]">
          <div className="hidden bg-slate-950 p-8 text-white md:block">
            <p className="text-xs uppercase tracking-[0.22em] text-white/50">Admin Access</p>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight">Assessment operations made quiet and clear.</h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/70">
              Sign in with an administrator account stored in the application database to manage sessions, monitor participants, and review report-ready results.
            </p>
          </div>
          <div className="p-8 sm:p-10">
            <CardHeader className="p-0">
              <CardTitle>Admin login</CardTitle>
              <CardDescription>This workspace is protected and backed by your MySQL admin account.</CardDescription>
            </CardHeader>
            <CardContent className="mt-8 p-0">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label htmlFor="admin-email" className="text-sm font-medium text-slate-600">Email</label>
                  <Input id="admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="admin-password" className="text-sm font-medium text-slate-600">Password</label>
                  <Input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
                </div>
                {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
                <Button className="mt-3 w-full" size="lg" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Signing in...' : 'Enter dashboard'}
                </Button>
              </form>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}

