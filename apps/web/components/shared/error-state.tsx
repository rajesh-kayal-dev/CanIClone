import Link from 'next/link';

import { Icons } from '@/components/icons';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Button } from '@/components/ui/button';

export function ErrorState({
  title = 'Something went wrong',
  description = 'We couldn’t reach the directory right now. Check that the API is running, then try again.',
  className = ''
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <Empty className={`border rounded-xl py-16 ${className}`}>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          <Icons.warning />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size='sm' variant='outline' nativeButton={false} render={<Link href='/apps' />}>
          Browse all apps
        </Button>
      </EmptyContent>
    </Empty>
  );
}