import { SiteFooter } from '@/components/shared/site-footer';
import { SiteHeader } from '@/components/shared/site-header';

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex min-h-dvh flex-col'>
      <SiteHeader />
      <main className='flex-1'>{children}</main>
      <SiteFooter />
    </div>
  );
}