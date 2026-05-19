import Image from 'next/image';
import { ShieldCheck, Boxes, LineChart } from 'lucide-react';
import { LoginForm } from './login-form';

type SearchParams = Promise<{ next?: string; error?: string }>;

const HIGHLIGHTS = [
  { icon: Boxes, text: 'Pedidos, productos y entregas en un solo lugar' },
  { icon: LineChart, text: 'Balance y analíticas en tiempo real' },
  { icon: ShieldCheck, text: 'Acceso por rol, sesión segura' },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { next, error } = await searchParams;

  return (
    <div className="font-sans grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-brand lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/20 blur-3xl motion-safe:animate-pulse"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -right-20 h-[28rem] w-[28rem] rounded-full bg-amber-300/30 blur-3xl"
        />

        <div className="relative">
          <Image
            src="/logo.svg"
            alt="AR-E"
            width={150}
            height={56}
            priority
            className="h-14 w-auto object-contain brightness-0 invert"
          />
        </div>

        <div className="relative space-y-6 text-white">
          <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight">
            Panel de administración
          </h2>
          <ul className="space-y-3">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="text-sm text-white/90">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/60">
          © {new Date().getFullYear()} AR-E · Shein Shop Management
        </p>
      </div>

      {/* Auth panel */}
      <div className="relative flex items-center justify-center overflow-hidden bg-zinc-50 px-4 py-10 sm:px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-100/70 via-zinc-50 to-zinc-50 lg:from-transparent"
        />
        <LoginForm nextPath={next ?? '/dashboard'} initialError={error} />
      </div>
    </div>
  );
}
