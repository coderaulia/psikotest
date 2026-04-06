import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/lib/language';
import { resetCustomerPassword, validateCustomerPasswordResetToken } from '@/services/customer-auth';
import type { PasswordResetValidationReason } from '@/types/assessment';

type ValidationState = 'validating' | 'valid' | 'invalid';

const copy = {
  en: {
    badge: 'Reset password',
    heroTitle: 'Set a new password for your workspace.',
    heroDescription:
      'Password reset links are short-lived and can only be used once. Choose a strong password before returning to the workspace login.',
    validating: 'Validating your reset link...',
    title: 'Reset your password',
    description: 'Enter your new password and confirm it to regain access to the workspace.',
    fields: {
      newPassword: 'New password',
      confirmPassword: 'Confirm new password',
    },
    actions: {
      submit: 'Update password',
      submitting: 'Updating password...',
      backToLogin: 'Back to login',
      requestAnother: 'Request another reset link',
    },
    errors: {
      mismatch: 'Passwords do not match.',
      fallback: 'Unable to reset your password right now.',
      expired: 'This reset link has expired. Please request a new one.',
      used: 'This reset link has already been used. Request a new link to continue.',
      invalid: 'This reset link is invalid. Please request a new one.',
    },
  },
  id: {
    badge: 'Atur ulang kata sandi',
    heroTitle: 'Tetapkan kata sandi baru untuk workspace Anda.',
    heroDescription:
      'Tautan reset kata sandi hanya berlaku singkat dan hanya dapat digunakan sekali. Pilih kata sandi yang kuat sebelum kembali ke login workspace.',
    validating: 'Memvalidasi tautan reset Anda...',
    title: 'Atur ulang kata sandi',
    description: 'Masukkan kata sandi baru dan konfirmasi untuk mendapatkan kembali akses ke workspace.',
    fields: {
      newPassword: 'Kata sandi baru',
      confirmPassword: 'Konfirmasi kata sandi baru',
    },
    actions: {
      submit: 'Perbarui kata sandi',
      submitting: 'Memperbarui kata sandi...',
      backToLogin: 'Kembali ke login',
      requestAnother: 'Minta tautan reset baru',
    },
    errors: {
      mismatch: 'Kata sandi tidak cocok.',
      fallback: 'Kata sandi belum bisa direset saat ini.',
      expired: 'Tautan reset ini sudah kedaluwarsa. Silakan minta tautan baru.',
      used: 'Tautan reset ini sudah digunakan. Minta tautan baru untuk melanjutkan.',
      invalid: 'Tautan reset ini tidak valid. Silakan minta tautan baru.',
    },
  },
} as const;

export function CustomerResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const { language } = useLanguage();
  const t = copy[language];

  const [validationState, setValidationState] = useState<ValidationState>('validating');
  const [validationReason, setValidationReason] = useState<PasswordResetValidationReason | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const invalidMessage = useMemo(() => {
    if (!validationReason) return t.errors.invalid;
    return t.errors[validationReason] ?? t.errors.invalid;
  }, [t.errors, validationReason]);

  useEffect(() => {
    let cancelled = false;

    async function validateToken() {
      if (!token) {
        if (!cancelled) {
          setValidationReason('invalid');
          setValidationState('invalid');
        }
        return;
      }

      try {
        const response = await validateCustomerPasswordResetToken(token);
        if (cancelled) return;

        if (response.valid) {
          setValidationReason(null);
          setValidationState('valid');
          return;
        }

        setValidationReason(response.reason ?? 'invalid');
        setValidationState('invalid');
      } catch {
        if (cancelled) return;
        setValidationReason('invalid');
        setValidationState('invalid');
      }
    }

    validateToken();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');

    if (newPassword !== confirmPassword) {
      setErrorMessage(t.errors.mismatch);
      return;
    }

    setIsSubmitting(true);
    try {
      await resetCustomerPassword(token, newPassword);
      navigate('/login?reset=success', { replace: true });
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
              <CardDescription>
                {validationState === 'validating' ? t.validating : t.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-8 p-0">
              {validationState === 'validating' ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 text-sm text-slate-600">
                  {t.validating}
                </div>
              ) : null}

              {validationState === 'invalid' ? (
                <div className="space-y-4 rounded-3xl border border-amber-100 bg-amber-50/85 p-5">
                  <p className="text-sm leading-7 text-amber-950/85">{invalidMessage}</p>
                </div>
              ) : null}

              {validationState === 'valid' ? (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label htmlFor="reset-password-new" className="text-sm font-medium text-slate-600">{t.fields.newPassword}</label>
                    <Input
                      id="reset-password-new"
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="reset-password-confirm" className="text-sm font-medium text-slate-600">{t.fields.confirmPassword}</label>
                    <Input
                      id="reset-password-confirm"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                  {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
                  <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? t.actions.submitting : t.actions.submit}
                  </Button>
                </form>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <Link to="/login" className="font-medium text-slate-950">{t.actions.backToLogin}</Link>
                <Link to="/forgot-password" className="text-slate-500 underline-offset-4 hover:text-slate-950 hover:underline">{t.actions.requestAnother}</Link>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}
