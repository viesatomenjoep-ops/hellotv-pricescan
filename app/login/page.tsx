import { LoginForm } from './login-form';

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="font-logo text-3xl font-extrabold tracking-tight">
            <span className="text-primary">hello</span>TV
          </h1>
          <p className="text-sm font-semibold">PriceScan</p>
          <p className="text-sm text-muted-foreground">Log in om verder te gaan</p>
        </div>
        <LoginForm next={searchParams.next ?? '/'} />
      </div>
    </main>
  );
}
