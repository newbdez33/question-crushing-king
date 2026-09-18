import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { NavGroup } from '../nav-group'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, onClick }: { children: React.ReactNode; to: string; onClick?: () => void }) => (
    <a href={to} onClick={onClick}>
      {children}
    </a>
  ),
  useLocation: ({ select }: { select?: (l: { href: string }) => unknown }) =>
    select ? select({ href: '/' }) : { href: '/' },
}))

vi.mock('@/components/ui/sidebar', () => {
  const passthrough = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
  return {
    SidebarGroup: passthrough,
    SidebarGroupLabel: passthrough,
    SidebarMenu: passthrough,
    SidebarMenuItem: passthrough,
    SidebarMenuButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SidebarMenuSub: passthrough,
    SidebarMenuSubButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SidebarMenuSubItem: passthrough,
    useSidebar: () => ({ state: 'expanded', isMobile: false, setOpenMobile: vi.fn() }),
  }
})

const EXTERNAL = 'https://github.com/newbdez33/question-crushing-king/issues/new?template=exam-request.yml'

describe('NavGroup links', () => {
  afterEach(() => cleanup())

  it('renders internal urls through the router link', () => {
    render(<NavGroup title='General' items={[{ title: 'My Exams', url: '/exams' }]} />)
    const link = screen.getByRole('link', { name: 'My Exams' })
    expect(link).toHaveAttribute('href', '/exams')
    expect(link).not.toHaveAttribute('target')
  })

  it('renders http(s) urls as plain anchors opening in a new tab', () => {
    render(<NavGroup title='General' items={[{ title: 'Request an Exam', url: EXTERNAL }]} />)
    const link = screen.getByRole('link', { name: 'Request an Exam' })
    expect(link).toHaveAttribute('href', EXTERNAL)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'))
  })
})
