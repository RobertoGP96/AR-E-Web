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
      {/* Left: logo / brand panel — orange→black gradient */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand via-orange-900 to-black p-12 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 -top-32 h-[32rem] w-[32rem] rounded-full bg-brand/40 blur-3xl motion-safe:animate-pulse"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -right-24 h-[34rem] w-[34rem] rounded-full bg-orange-600/20 blur-3xl"
        />

        <Image
          src="/logo.svg"
          alt="AR-E"
          width={260}
          height={104}
          priority
          className="relative h-24 w-auto object-contain brightness-0 invert"
        />

        <div className="relative space-y-6 text-white">
          <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight">
            Panel de administración
          </h2>
          <ul className="space-y-3">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="text-sm text-white/85">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/50">
          © {new Date().getFullYear()} AR-E · Shein Shop Management
        </p>
      </div>

      {/* Right: form panel — white background */}
      <div className="flex items-center justify-center bg-white px-4 py-10 sm:px-6">
        <LoginForm nextPath={next ?? '/dashboard'} initialError={error} />
      </div>
    </div>
  );
}
