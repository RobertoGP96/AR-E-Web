'use client';

import Image from 'next/image';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import {
  Mail,
  Phone,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  Check,
} from 'lucide-react';

interface LoginFormProps {
  nextPath: string;
  initialError?: string;
}

const PRIMARY = 'oklch(71.065% 0.15929 64.92)';

export function LoginForm({ nextPath, initialError }: LoginFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>(initialError);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const identifierValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim()) ||
    /^\+?\d[\d\s-]{5,}$/.test(identifier.trim());

  async function handleSubmit(formData: FormData) {
    setError(undefined);
    const id = String(formData.get('identifier') ?? '');
    const pw = String(formData.get('password') ?? '');

    const result = await signIn('credentials', {
      identifier: id,
      password: pw,
      redirect: false,
    });

    if (!result || result.error) {
      setError('Email/teléfono o contraseña incorrectos.');
      return;
    }

    startTransition(() => {
      router.replace(nextPath);
      router.refresh();
    });
  }

  return (
    <div className="w-full max-w-md rounded-xl border-0 bg-white/95 p-6 shadow-2xl drop-shadow-xl backdrop-blur-sm">
      <div className="space-y-1 text-center">
        <div className="mb-2 flex justify-center">
          <Image
            src="/logo.svg"
            alt="Logo"
            width={160}
            height={96}
            priority
            className="h-24 w-auto object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Iniciar Sesión</h1>
        <p className="text-gray-600">Panel de administración</p>
      </div>

      <form action={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="identifier"
            className="flex items-center gap-1 text-sm font-medium text-gray-700"
          >
            <Mail className="h-4 w-4" aria-hidden />
            Email o
            <Phone className="h-4 w-4" aria-hidden />
            Teléfono
          </label>
          <div className="relative">
            <input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="tu@email.com o +53..."
              className="h-11 w-full rounded-md border border-gray-200 bg-white px-3 pr-10 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30"
            />
            {identifierValid ? (
              <Check
                className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500"
                aria-hidden
              />
            ) : null}
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="text-sm font-medium text-gray-700"
          >
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 w-full rounded-md border border-gray-200 bg-white px-3 pr-10 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
              }
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-500 transition hover:bg-gray-100"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden />
              ) : (
                <Eye className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-normal text-gray-600">
            <input
              type="checkbox"
              name="remember"
              className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
            />
            Recordarme
          </label>
        </div>

        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          style={{ backgroundColor: PRIMARY }}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-md font-medium text-white transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Iniciando sesión...
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" aria-hidden />
              Iniciar Sesión
            </>
          )}
        </button>
      </form>
    </div>
  );
}
