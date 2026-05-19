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
      {/* Left: logo / brand panel — client-app look: orange clip-path
          polygon blobs, blurred, on a near-black base */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[oklch(21.779%_0.00002_271.152)] p-12 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 transform-gpu overflow-hidden blur-3xl"
        >
          <div
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 rotate-30 bg-gradient-to-tr from-[#dd6540] to-[#ca9b0d] opacity-30"
          />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 transform-gpu overflow-hidden blur-3xl"
        >
          <div
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
            className="relative left-[calc(50%+3rem)] aspect-[1155/674] w-[36.125rem] max-w-none -translate-x-1/2 bg-gradient-to-tr from-[#fab834] to-[#885b00] opacity-30"
          />
        </div>

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
