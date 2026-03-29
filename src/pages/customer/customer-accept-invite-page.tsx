import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { saveCustomerSession } from '@/lib/customer-session';
import { acceptWorkspaceInvite, getWorkspaceInvitePreview } from '@/services/customer-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function CustomerAcceptInvitePage() {
  const navigate = useNavigate();
  const { token = '' } = useParams<{ token: string }>();

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [invitePreview, setInvitePreview] = useState<Awaited<ReturnType<typeof getWorkspaceInvitePreview>> | null>(null);

  useEffect(() => {
    let mounted = true;

    void getWorkspaceInvitePreview(token)
      .then((payload) => {
        if (!mounted) {
          return;
        }

        setInvitePreview(payload);
        setFullName(payload.invite.fullName);
      })
      .catch((error) => {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load workspace invitation');
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const session = await acceptWorkspaceInvite(token, {
        fullName,
        password,
      });
      saveCustomerSession(session);
      navigate('/workspace', { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to activate workspace invitation');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ffffff_0%,#f6f8fb_45%,#e9eef7_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <Card className="grid w-full overflow-hidden border-white/80 bg-white/82 md:grid-cols-[0.96fr_1.04fr]">
          <div className="hidden bg-slate-950 p-8 text-white md:block">
            <p className="text-xs uppercase tracking-[0.22em] text-white/50">Workspace invitation</p>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight">Join the same assessment workspace as your team.</h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/70">
              Activate your access, set a password, and continue inside the shared customer workspace without creating a separate tenant.
            </p>
          </div>
          <div className="p-8 sm:p-10">
            <CardHeader className="p-0">
              <CardTitle>Activate workspace access</CardTitle>
              <CardDescription>Use the invitation details below to activate your teammate account.</CardDescription>
            </CardHeader>
            <CardContent className="mt-8 space-y-6 p-0">
              {isLoading ? <p className="text-sm text-slate-500">Loading invitation...</p> : null}
              {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
              {!isLoading && invitePreview ? (
                <>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 text-sm text-slate-600">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Invitation details</p>
                    <div className="mt-3 space-y-2">
                      <p><span className="font-medium text-slate-950">Workspace:</span> {invitePreview.invite.organizationName}</p>
                      <p><span className="font-medium text-slate-950">Role:</span> {invitePreview.invite.role}</p>
                      <p><span className="font-medium text-slate-950">Email:</span> {invitePreview.invite.email}</p>
                      {invitePreview.invite.expiresAt ? (
                        <p><span className="font-medium text-slate-950">Expires:</span> {new Date(invitePreview.invite.expiresAt).toLocaleString()}</p>
                      ) : null}
                    </div>
                  </div>

                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <label htmlFor="invite-full-name" className="text-sm font-medium text-slate-600">Full name</label>
                      <Input id="invite-full-name" value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="invite-password" className="text-sm font-medium text-slate-600">Password</label>
                      <Input id="invite-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="invite-password-confirm" className="text-sm font-medium text-slate-600">Confirm password</label>
                      <Input id="invite-password-confirm" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" />
                    </div>
                    <Button className="w-full" size="lg" type="submit" disabled={isSubmitting || invitePreview.invite.isExpired}>
                      {invitePreview.invite.isExpired ? 'Invitation expired' : isSubmitting ? 'Activating access...' : 'Activate workspace access'}
                    </Button>
                  </form>
                </>
              ) : null}
              <div className="flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <Link to="/login" className="font-medium text-slate-950">Back to workspace login</Link>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}
