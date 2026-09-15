'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SignOutButton, useUser } from '@clerk/nextjs';

export function UserNav() {
  const { user } = useUser();

  if (!user) return null;

  const firstInitial = user.firstName?.[0] ?? '';
  const lastInitial = user.lastName?.[0] ?? '';
  const initials = (firstInitial + lastInitial).toUpperCase() || '?';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant='ghost' className='relative h-8 w-8 rounded-full' />}
      >
        <Avatar className='h-8 w-8'>
          <AvatarImage src={user.imageUrl} alt={user.fullName ?? ''} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' sideOffset={10}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className='font-normal'>
            <div className='flex flex-col space-y-1'>
              <p className='text-sm leading-none font-medium'>{user.fullName}</p>
              <p className='text-muted-foreground text-xs leading-none'>
                {user.emailAddresses[0]?.emailAddress}
              </p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <SignOutButton redirectUrl='/auth/sign-in' />
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
