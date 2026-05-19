'use client';

import Image from 'next/image';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import {
  AtSign,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';

interface LoginFormProps {
  nextPath: string;
  initialError?: string;
}

export function LoginForm({ nextPath, initialError }: LoginFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(initialError);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const identifierValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim()) ||
    /^\+?\d[\d\s-]{5,}$/.test(identifier.trim());

  const busy = submitting || isPending;

  async function handleSubmit(formData: FormData) {
    setError(undefined);
    setSubmitting(true);
    const id = String(formData.get('identifier') ?? '');
    const pw = String(formData.get('password') ?? '');

    const result = await signIn('credentials', {
      identifier: id,
      password: pw,
      redirect: false,
    });

    if (!result || result.error) {
      setSubmitting(false);
      setError('Email/teléfono o contraseña incorrectos.');
      return;
    }

    startTransition(() => {
      router.replace(nextPath);
      router.refresh();
    });
  }

  return (
    <div className="w-full max-w-md p-2 sm:p-4">
      <div className="space-y-1.5">
        <div className="mb-5 flex justify-center lg:hidden">
          <Image
            src="/logo.svg"
            alt="AR-E"
            width={120}
            height={48}
            priority
            className="h-12 w-auto object-contain"
          />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Bienvenido de nuevo
        </h1>
        <p className="text-sm text-slate-600">
          Inicia sesión para entrar al panel de administración.
        </p>
      </div>

      <form action={handleSubmit} className="mt-7 space-y-5">
        <div className="space-y-1.5">
          <label
            htmlFor="identifier"
            className="text-sm font-medium text-slate-700"
          >
            Email o teléfono
          </label>
          <div className="relative">
            <AtSign
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="tu@email.com o +53..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-base text-slate-900 shadow-sm outline-none transition-colors duration-200 placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/30"
            />
            {identifierValid ? (
              <Check
                className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500"
                aria-hidden
              />
            ) : null}
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="text-sm font-medium text-slate-700"
          >
            Contraseña
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-11 text-base text-slate-900 shadow-sm outline-none transition-colors duration-200 placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
              }
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-lg p-1.5 text-slate-500 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden />
              ) : (
                <Eye className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>
        </div>

        <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            name="remember"
            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-brand accent-[oklch(71.065%_0.15929_64.92)] focus-visible:ring-2 focus-visible:ring-brand/40"
          />
          Recordarme
        </label>

        {error ? (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="group flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand text-base font-medium text-white shadow-sm shadow-brand/30 transition-colors duration-200 hover:bg-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Iniciando sesión...
            </>
          ) : (
            <>
              Iniciar sesión
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5"
                aria-hidden
              />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-500">
        Usa el mismo usuario y contraseña del sistema AR-E.
      </p>
    </div>
  );
}
