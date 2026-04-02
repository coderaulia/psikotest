import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/lib/language';
import { requestCustomerPasswordReset } from '@/services/customer-auth';

const copy = {
  en: {
    badge: 'Password reset',
    heroTitle: 'Recover workspace access securely.',
    heroDescription:
      'Enter the email used for your customer workspace. If the account exists, we will issue a short-lived reset link.',
    title: 'Forgot your password?',
    description: 'We will send a password reset link to your email if the workspace account exists.',
    emailLabel: 'Email',
    submit: 'Send reset link',
    submitting: 'Sending reset link...',
    successTitle: 'Check your email',
    successMessage:
      'If the email is registered, a reset link is on its way. The link expires after 1 hour for security.',
    backToLogin: 'Back to login',
    createAccount: 'Create an account',
    errors: {
      fallback: 'Unable to process your request right now.',
    },
  },
  id: {
    badge: 'Reset kata sandi',
    heroTitle: 'Pulihkan akses workspace dengan aman.',
    heroDescription:
      'Masukkan email yang digunakan untuk workspace pelanggan Anda. Jika akun tersedia, kami akan membuat tautan reset yang berlaku singkat.',
    title: 'Lupa kata sandi?',
    description: 'Kami akan mengirim tautan reset kata sandi ke email Anda jika akun workspace tersebut terdaftar.',
    emailLabel: 'Email',
    submit: 'Kirim tautan reset',
    submitting: 'Mengirim tautan reset...',
    successTitle: 'Periksa email Anda',
    successMessage:
      'Jika email terdaftar, tautan reset sedang dikirim. Tautan akan kedaluwarsa setelah 1 jam demi keamanan.',
    backToLogin: 'Kembali ke login',
    createAccount: 'Buat akun',
    errors: {
      fallback: 'Permintaan Anda belum bisa diproses saat ini.',
    },
  },
} as const;

export function CustomerForgotPasswordPage() {
  const { language } = useLanguage();
  const t = copy[language];
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await requestCustomerPasswordReset(email);
      setIsSuccess(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t.errors.fallback);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ffffff_0%,#f6f8fb_45%,#e9eef7_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <Card className="grid w-full overflow-hidden border-white/80 bg-white/84 md:grid-cols-[0.96fr_1.04fr]">
          <div className="hidden bg-slate-950 p-8 text-white md:block">
            <p className="text-xs uppercase tracking-[0.22em] text-white/50">{t.badge}</p>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight">{t.heroTitle}</h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/70">{t.heroDescription}</p>
          </div>
          <div className="p-8 sm:p-10">
            <CardHeader className="p-0">
              <CardTitle>{t.title}</CardTitle>
              <CardDescription>{t.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-8 p-0">
              {isSuccess ? (
                <div className="space-y-4 rounded-3xl border border-emerald-100 bg-emerald-50/80 p-5">
                  <h2 className="text-lg font-semibold text-emerald-950">{t.successTitle}</h2>
                  <p className="text-sm leading-7 text-emerald-900/80">{t.successMessage}</p>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label htmlFor="forgot-password-email" className="text-sm font-medium text-slate-600">{t.emailLabel}</label>
                    <Input
                      id="forgot-password-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                    />
                  </div>
                  {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
                  <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? t.submitting : t.submit}
                  </Button>
                </form>
              )}
              <div className="mt-6 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <Link to="/login" className="font-medium text-slate-950">{t.backToLogin}</Link>
                <Link to="/signup" className="text-slate-500 underline-offset-4 hover:text-slate-950 hover:underline">{t.createAccount}</Link>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}
