import { type FormEvent, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { saveCustomerSession } from '@/lib/customer-session';
import { loginCustomer } from '@/services/customer-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function CustomerLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = useMemo(() => {
    const state = location.state as { redirectTo?: string } | null;
    return state?.redirectTo ?? '/workspace';
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
      const session = await loginCustomer(email, password);
      saveCustomerSession(session);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to sign in');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ffffff_0%,#f6f8fb_45%,#e9eef7_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <Card className="grid w-full overflow-hidden border-white/80 bg-white/82 md:grid-cols-[0.96fr_1.04fr]">
          <div className="hidden bg-slate-950 p-8 text-white md:block">
            <p className="text-xs uppercase tracking-[0.22em] text-white/50">Customer access</p>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight">Build a compliant assessment draft before you share.</h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/70">
              Sign in as a workspace owner or teammate to configure assessments, preview participant flows, and operate the same shared workspace.
            </p>
          </div>
          <div className="p-8 sm:p-10">
            <CardHeader className="p-0">
              <CardTitle>Workspace login</CardTitle>
              <CardDescription>For workspace owners, operators, reviewers, and research teams using the self-serve SaaS flow.</CardDescription>
            </CardHeader>
            <CardContent className="mt-8 p-0">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label htmlFor="customer-email" className="text-sm font-medium text-slate-600">Email</label>
                  <Input id="customer-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="customer-password" className="text-sm font-medium text-slate-600">Password</label>
                  <Input id="customer-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
                </div>
                {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
                <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Signing in...' : 'Open workspace'}
                </Button>
              </form>
              <div className="mt-6 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <Link to="/signup" className="font-medium text-slate-950">Create an account</Link>
                <Link to="/admin/login" className="text-slate-500 underline-offset-4 hover:text-slate-950 hover:underline">Webmaster login</Link>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}

