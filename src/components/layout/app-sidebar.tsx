import { useNavigate } from '@tanstack/react-router'
import { LayoutDashboard, HelpCircle, FileText } from 'lucide-react'
import { useAuth } from '@/context/auth-ctx'
import { useLayout } from '@/context/layout-provider'
import { useLanguage } from '@/context/language-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { user } = useAuth()
  const { t } = useLanguage()
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

  // Dynamic navigation groups with translations
  const navGroups = [
    {
      title: t('sidebar.general'),
      items: [
        {
          title: t('sidebar.dashboard'),
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: t('sidebar.myExams'),
          url: '/exams',
          icon: FileText,
        },
      ],
    },
    {
      title: t('sidebar.other'),
      items: [
        {
          title: t('sidebar.helpCenter'),
          url: '/help-center',
          icon: HelpCircle,
        },
      ],
    },
  ]

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <div
          onClick={() => navigate({ to: '/' })}
          className='flex cursor-pointer items-center gap-2 px-0 py-2 transition-opacity group-data-[collapsible=icon]/sidebar-wrapper:-translate-x-[2px] group-data-[collapsible=icon]/sidebar-wrapper:justify-center group-data-[collapsible=icon]/sidebar-wrapper:gap-0 group-data-[collapsible=icon]/sidebar-wrapper:px-0 hover:opacity-80'
        >
          <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-black text-white'>
            <svg width='32' height='32' viewBox='0 0 32 32' className='size-8'>
              <circle cx='16' cy='16' r='16' fill='black' />
              <text
                x='50%'
                y='50%'
                dominantBaseline='central'
                textAnchor='middle'
                fill='white'
                fontSize='20'
                fontWeight='bold'
              >
                王
              </text>
            </svg>
          </div>
          <div className='grid flex-1 text-start text-sm leading-tight group-data-[collapsible=icon]/sidebar-wrapper:hidden'>
            <span className='truncate text-lg font-bold'>{t('sidebar.appTitle')}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((props) => (
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
