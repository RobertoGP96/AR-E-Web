import { LoginForm } from './login-form';

type SearchParams = Promise<{ next?: string; error?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { next, error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">AR-E Admin</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Sign in with your Supabase account
          </p>
        </div>
        <LoginForm nextPath={next ?? '/dashboard'} initialError={error} />
      </div>
    </div>
  );
}
