import { useNavigate } from '@tanstack/react-router'
import { useLayout } from '@/context/layout-provider'
import { useAuth } from '@/context/auth-context'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
// import { AppTitle } from './app-title'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
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

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <div 
          onClick={() => navigate({ to: '/' })} 
          className="flex items-center gap-2 px-2 py-2 transition-opacity hover:opacity-80 cursor-pointer group-data-[collapsible=icon]/sidebar-wrapper:justify-center group-data-[collapsible=icon]/sidebar-wrapper:px-0 group-data-[collapsible=icon]/sidebar-wrapper:gap-0"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-black text-white">
            <svg width="32" height="32" viewBox="0 0 32 32" className="size-8">
              <circle cx="16" cy="16" r="16" fill="black" />
              <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold" dy=".1em">王</text>
            </svg>
          </div>
          <div className="grid flex-1 text-start text-sm leading-tight group-data-[collapsible=icon]/sidebar-wrapper:hidden">
            <span className="truncate font-bold text-lg">刷题大王</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} isGuest={!user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
