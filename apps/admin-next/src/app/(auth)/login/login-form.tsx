'use client';

import Image from 'next/image';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Alert, Button, Input, Spinner } from '@heroui/react';
import { AtSign, Lock, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';

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
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-1.5">
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
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Bienvenido de nuevo
        </h1>
        <p className="text-sm text-muted">
          Inicia sesión para entrar al panel de administración.
        </p>
      </div>

      <form action={handleSubmit} className="mt-7 space-y-5">
        <div className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards delay-100 duration-500 space-y-1.5">
          <label htmlFor="identifier" className="field-label">
            Email o teléfono
          </label>
          <div className="relative">
            <AtSign
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <Input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="tu@email.com o +53..."
              fullWidth
              className="h-12 rounded-xl pl-11 pr-10 text-base"
            />
            {identifierValid ? (
              <Check
                className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-success"
                aria-hidden
              />
            ) : null}
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards delay-150 duration-500 space-y-1.5">
          <label htmlFor="password" className="field-label">
            Contraseña
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              fullWidth
              className="h-12 rounded-xl pl-11 pr-11 text-base"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
              }
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-lg p-1.5 text-muted transition-colors duration-200 hover:bg-default hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden />
              ) : (
                <Eye className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>
        </div>

        <label className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards delay-200 duration-500 flex w-fit cursor-pointer items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            name="remember"
            className="h-4 w-4 cursor-pointer rounded border-border accent-[var(--accent)] focus-visible:ring-2 focus-visible:ring-accent/40"
          />
          Recordarme
        </label>

        {error ? (
          <Alert
            status="danger"
            role="alert"
            aria-live="assertive"
            className="animate-in fade-in slide-in-from-top-1 duration-300 items-center gap-2.5 rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-2.5 shadow-none"
          >
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{error}</Alert.Title>
            </Alert.Content>
          </Alert>
        ) : null}

        <div className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards delay-300 duration-500">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isDisabled={busy}
            className="group h-12 rounded-xl text-base"
          >
            {busy ? (
              <>
                <Spinner size="sm" aria-hidden />
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
          </Button>
        </div>
      </form>

      <p className="animate-in fade-in fill-mode-backwards delay-500 duration-500 mt-6 text-center text-xs text-muted">
        Usa el mismo usuario y contraseña del sistema AR-E.
      </p>
    </div>
  );
}
