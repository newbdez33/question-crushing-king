import { type QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { AuthProvider } from '@/context/auth-context'
import { Toaster } from '@/components/ui/sonner'
import { NavigationProgress } from '@/components/navigation-progress'
import { GeneralError } from '@/features/errors/general-error'
import { NotFoundError } from '@/features/errors/not-found-error'
import { EnvError } from '@/features/errors/env-error'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: () => {
    const showDevtools = import.meta.env.VITE_SHOW_DEVTOOLS === '1'
    const isEnvValid =
      !!import.meta.env.VITE_FIREBASE_API_KEY &&
      !!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
      !!import.meta.env.VITE_FIREBASE_PROJECT_ID &&
      !!import.meta.env.VITE_FIREBASE_APP_ID &&
      !!import.meta.env.VITE_FIREBASE_DATABASE_URL

    if (!isEnvValid) {
      return <EnvError />
    }

    return (
      <AuthProvider>
        <NavigationProgress />
        <Outlet />
        <Toaster duration={5000} />
        {import.meta.env.MODE === 'development' && showDevtools && (
          <>
            <ReactQueryDevtools buttonPosition='bottom-left' />
            <TanStackRouterDevtools position='bottom-right' />
          </>
        )}
      </AuthProvider>
    )
  },
  notFoundComponent: NotFoundError,
  errorComponent: GeneralError,
})
