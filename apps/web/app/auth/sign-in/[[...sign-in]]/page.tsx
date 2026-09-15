import Link from 'next/link';

import { SignIn } from '@clerk/nextjs';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { isClerkConfigured } from '@/lib/clerk';

export default function SignInPage() {
  if (!isClerkConfigured()) {
    return (
      <div className='flex min-h-dvh items-center justify-center p-4'>
        <div className='flex w-full max-w-sm flex-col items-center gap-4 rounded-xl border border-border bg-card p-10 text-center'>
          <span className='flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground'>
            <Icons.lock className='size-6' />
          </span>
          <div className='flex flex-col gap-1'>
            <h1 className='text-lg font-semibold tracking-tight'>Sign in isn’t available yet</h1>
            <p className='text-sm text-muted-foreground'>
              Authentication is not configured. Add your Clerk publishable and secret keys to
              enable sign in.
            </p>
          </div>
          <Button size='sm' nativeButton={false} render={<Link href='/' />}>
            Back to home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='flex min-h-dvh items-center justify-center p-4'>
      <SignIn />
    </div>
  );
}