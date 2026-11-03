import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { Activity, Archive, ChartNoAxesCombined, ChevronsLeft, ChevronsRight, LayoutDashboard, LogOut, Menu, Moon, ScanLine, Search, ShieldCheck, Sun, UsersRound, X, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSession } from '@/context/session'
import { hasPermission, type AuthUser } from '@/lib/types'
import { cn } from '@/lib/utils'

interface NavItem { href: string; label: string; icon: LucideIcon; group: string; permission?: string }
export const navigation: NavItem[] = [
  { href: '/', label: '工作台总览', icon: LayoutDashboard, group: '工作空间' },
  { href: '/patients', label: '患者与病案', icon: UsersRound, group: '工作空间', permission: 'record:read' },
  { href: '/scans', label: '扫描记录', icon: ScanLine, group: '工作空间', permission: 'record:read' },
  { href: '/statistics', label: '病案统计', icon: ChartNoAxesCombined, group: '工作空间', permission: 'statistics:read' },
  { href: '/archive', label: '影像档案袋', icon: Archive, group: '工作空间', permission: 'record:read' },
  { href: '/users', label: '用户与权限', icon: ShieldCheck, group: '系统管理', permission: 'user:manage' },
  { href: '/status', label: '服务状态', icon: Activity, group: '系统管理' },
]
export const userNav = (user: AuthUser | null) => navigation.filter(item => !item.permission || hasPermission(user, item.permission))

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useSession()
  const pathname = useRouterState({ select: state => state.location.pathname })
  const [collapsed, setCollapsed] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [search, setSearch] = useState(false)
  const [filter, setFilter] = useState('')
  const [dark, setDark] = useState(() => localStorage.getItem('mrr-theme') === 'dark')
  const links = useMemo(() => userNav(user), [user])
  const current = links.find(item => item.href === pathname)?.label || '管理控制台'

  useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('mrr-theme', dark ? 'dark' : 'light') }, [dark])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearch(x => !x) }
      if (event.key === 'Escape') { setSearch(false); setMobile(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  useEffect(() => { setMobile(false); setSearch(false) }, [pathname])

  const nav = <div className="flex h-full flex-col">
    <div className="flex h-[68px] items-center gap-3 border-b px-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Archive className="size-5" /></div>
      {!collapsed && <div><div className="text-sm font-bold">MRR Admin</div><div className="text-[11px] text-muted-foreground">医疗病案管理平台</div></div>}
    </div>
    <nav aria-label="主导航" className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {['工作空间', '系统管理'].map(group => <div key={group}>
        {!collapsed && <div className="mb-2 px-3 text-[11px] font-medium text-muted-foreground">{group}</div>}
        <div className="space-y-1">{links.filter(item => item.group === group).map(item => {
          const Icon = item.icon; const active = pathname === item.href
          return <Link key={item.href} to={item.href as '/'} aria-current={active ? 'page' : undefined} title={item.label} className={cn('mrr-sidebar-link flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground', active && 'bg-accent font-medium text-foreground', collapsed && 'justify-center px-2')}>
            <Icon className={cn('size-[18px] shrink-0', active && 'text-primary')} />{!collapsed && <span>{item.label}</span>}
          </Link>
        })}</div>
      </div>)}
    </nav>
    <div className="border-t p-3">
      {!collapsed && <div className="mb-2 rounded-lg bg-muted/50 p-3 text-[11px] leading-relaxed text-muted-foreground">医疗数据受权限保护。请在离开工作站时退出登录。</div>}
      <button type="button" onClick={() => void signOut()} className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground hover:bg-accent"><LogOut className="size-[18px]" />{!collapsed && '退出登录'}</button>
    </div>
  </div>

  return <div className="min-h-svh bg-background text-foreground">
    <aside className={cn('fixed inset-y-0 left-0 z-30 hidden border-r bg-sidebar transition-[width] duration-200 lg:block', collapsed ? 'w-[72px]' : 'w-[244px]')}>{nav}</aside>
    {mobile && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobile(false)} />}
    <aside className={cn('fixed inset-y-0 left-0 z-50 w-[260px] bg-sidebar transition-transform lg:hidden', mobile ? 'translate-x-0' : '-translate-x-full')}>{nav}<button aria-label="关闭菜单" className="absolute right-3 top-5" onClick={() => setMobile(false)}><X className="size-5" /></button></aside>
    <div className={cn('transition-[padding] duration-200', collapsed ? 'lg:pl-[72px]' : 'lg:pl-[244px]')}>
      <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b bg-background/90 px-4 backdrop-blur-xl sm:px-7">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="展开导航" onClick={() => setMobile(true)}><Menu /></Button>
          <Button variant="ghost" size="icon" className="hidden lg:inline-flex" aria-label="折叠导航" onClick={() => setCollapsed(x => !x)}>{collapsed ? <ChevronsRight /> : <ChevronsLeft />}</Button>
          <span className="text-sm text-muted-foreground">工作空间 <span className="mx-2 text-border">/</span> <strong className="font-medium text-foreground">{current}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSearch(true)} className="hidden sm:inline-flex"><Search />快速跳转 <kbd className="ml-3 rounded border px-1 text-[10px]">⌘ K</kbd></Button>
          <Button variant="ghost" size="icon" onClick={() => setSearch(true)} className="sm:hidden" aria-label="快速跳转"><Search /></Button>
          <Button variant="ghost" size="icon" onClick={() => setDark(x => !x)} aria-label="切换主题">{dark ? <Sun /> : <Moon />}</Button>
          <div className="ml-2 flex items-center gap-2 border-l pl-3"><div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{(user?.displayName || user?.username || 'U').slice(0, 1)}</div><span className="hidden text-xs font-medium sm:inline">{user?.displayName || user?.username}</span></div>
        </div>
      </header>
      <main id="main-content" className="mx-auto min-h-[calc(100svh-144px)] max-w-[1500px] px-4 py-8 sm:px-7">{children}</main>
      <footer className="mx-auto flex max-w-[1500px] items-center justify-between px-4 pb-6 text-xs text-muted-foreground sm:px-7"><span>MRR Admin · 基于 shadcn-admin</span><span>数据由 MRR 后端提供</span></footer>
    </div>
    {search && <div className="fixed inset-0 z-[80] flex justify-center bg-black/50 px-4 pt-[15vh]" onClick={() => setSearch(false)}>
      <div role="dialog" aria-modal="true" aria-label="快速跳转" className="h-fit w-full max-w-lg rounded-xl border bg-popover p-3 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b px-3 pb-3"><Search className="size-4 text-muted-foreground" /><input autoFocus value={filter} onChange={e => setFilter(e.target.value)} aria-label="搜索页面" placeholder="查找页面…" className="h-9 flex-1 bg-transparent text-sm outline-none" /><kbd className="text-xs text-muted-foreground">Esc</kbd></div>
        <div className="max-h-80 overflow-y-auto pt-2">{links.filter(item => item.label.includes(filter.trim())).map(item => {
          const Icon = item.icon
          return <Link key={item.href} to={item.href as '/'} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-accent"><Icon className="size-4" />{item.label}</Link>
        })}</div>
      </div>
    </div>}
  </div>
}
