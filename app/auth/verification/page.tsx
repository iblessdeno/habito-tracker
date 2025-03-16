import Link from 'next/link';

export default function VerificationPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            We&apos;ve sent you a verification link to your email address.
          </p>
        </div>
        <div className="text-center text-sm">
          <Link href="/auth/login" className="underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
