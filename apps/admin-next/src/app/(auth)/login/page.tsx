import { LoginForm } from './login-form';

type SearchParams = Promise<{ next?: string; error?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { next, error } = await searchParams;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-gray-500">
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-100 to-gray-500 px-4">
        <LoginForm nextPath={next ?? '/dashboard'} initialError={error} />
      </div>
    </div>
  );
}
