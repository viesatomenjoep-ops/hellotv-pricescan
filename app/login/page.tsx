import Image from 'next/image';
import { LoginForm } from './login-form';

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <Image
            src="/hellotv-logo.png"
            alt="helloTV"
            width={200}
            height={85}
            priority
            className="mx-auto h-14 w-auto"
          />
          <p className="text-sm font-semibold">PriceScan</p>
          <p className="text-sm text-muted-foreground">Log in om verder te gaan</p>
        </div>
        <LoginForm next={searchParams.next ?? '/'} />
      </div>
    </main>
  );
}
