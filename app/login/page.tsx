import { LoginForm } from './login-form';

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#19445B' }}>
            helloTV PriceScan
          </h1>
          <p className="text-sm text-muted-foreground">Log in om verder te gaan</p>
        </div>
        <LoginForm next={searchParams.next ?? '/'} />
      </div>
    </main>
  );
}
