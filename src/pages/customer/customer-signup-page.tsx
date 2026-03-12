import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { saveCustomerSession } from '@/lib/customer-session';
import { signupCustomer } from '@/services/customer-auth';
import type { CustomerAccountType } from '@/types/assessment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

export function CustomerSignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [accountType, setAccountType] = useState<CustomerAccountType>('business');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const session = await signupCustomer({
        fullName,
        email,
        password,
        organizationName,
        accountType,
      });
      saveCustomerSession(session);
      navigate('/workspace/create', { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create account');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ffffff_0%,#f6f8fb_45%,#e9eef7_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <Card className="grid w-full overflow-hidden border-white/80 bg-white/84 md:grid-cols-[0.94fr_1.06fr]">
          <div className="hidden bg-slate-950 p-8 text-white md:block">
            <p className="text-xs uppercase tracking-[0.22em] text-white/50">Sign up</p>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight">Start with a guided assessment draft.</h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/70">
              Choose whether you are setting up a business assessment workflow or a research questionnaire workspace. The first assessment can be prepared in a few minutes.
            </p>
          </div>
          <div className="p-8 sm:p-10">
            <CardHeader className="p-0">
              <CardTitle>Create your workspace</CardTitle>
              <CardDescription>This signup is for companies, institutions, and researchers. Webmaster access remains separate.</CardDescription>
            </CardHeader>
            <CardContent className="mt-8 p-0">
              <form className="grid gap-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label htmlFor="signup-full-name" className="text-sm font-medium text-slate-600">Full name</label>
                  <Input id="signup-full-name" value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="signup-email" className="text-sm font-medium text-slate-600">Email</label>
                    <Input id="signup-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="signup-password" className="text-sm font-medium text-slate-600">Password</label>
                    <Input id="signup-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="signup-account-type" className="text-sm font-medium text-slate-600">Workspace type</label>
                    <Select id="signup-account-type" value={accountType} onChange={(event) => setAccountType(event.target.value as CustomerAccountType)}>
                      <option value="business">Company / Institution</option>
                      <option value="researcher">Researcher / Academic</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="signup-organization" className="text-sm font-medium text-slate-600">Organization name</label>
                    <Input id="signup-organization" value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} autoComplete="organization" />
                  </div>
                </div>
                {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
                <Button className="mt-2 w-full" size="lg" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating workspace...' : 'Create workspace'}
                </Button>
              </form>
              <div className="mt-6 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <Link to="/login" className="font-medium text-slate-950">Already have an account?</Link>
                <Link to="/admin/login" className="text-slate-500 underline-offset-4 hover:text-slate-950 hover:underline">Webmaster login</Link>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}
