import { Link, useNavigate } from '@tanstack/react-router'
import useDialogState from '@/hooks/use-dialog-state'
import { useAuth } from '@/context/auth-ctx'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SignOutDialog } from '@/components/sign-out-dialog'

export function ProfileDropdown() {
  const [open, setOpen] = useDialogState()
  const { user } = useAuth()
  const navigate = useNavigate()

  const userData = user
    ? {
        name: user.displayName || 'User',
        email: user.email || '',
        avatar: user.photoURL || '',
      }
    : {
        name: 'Guest User',
        email: 'guest@example.com',
        avatar: '',
      }

  const isGuest = !user

  const handleAuthAction = () => {
    if (isGuest) {
      navigate({ to: '/sign-in' })
    } else {
      setOpen(true)
    }
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
            <Avatar className='h-8 w-8'>
              <AvatarImage src={userData.avatar} alt={userData.name} />
              <AvatarFallback>
                {userData.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-56' align='end' forceMount>
          <DropdownMenuLabel className='font-normal'>
            <div className='flex flex-col gap-1.5'>
              <p className='text-sm leading-none font-medium'>{userData.name}</p>
              {!isGuest && (
                <p className='text-xs leading-none text-muted-foreground'>
                  {userData.email}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {!isGuest && (
            <>
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link to='/settings'>
                    Settings
                    <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            variant={isGuest ? 'default' : 'destructive'}
            onClick={handleAuthAction}
          >
            {isGuest ? 'Sign in' : 'Sign out'}
            <DropdownMenuShortcut className='text-current'>
              ⇧⌘Q
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  )
}
