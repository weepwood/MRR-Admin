import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRootRoute, createRoute, createRouter, Navigate, Outlet, RouterProvider, useRouterState } from '@tanstack/react-router'
import { AppShell } from '@/components/shell'
import { SessionProvider, useSession } from '@/context/session'
import { LoginPage, ChangePasswordPage } from '@/pages/login'
import { DashboardPage } from '@/pages/dashboard'
import { PatientsPage } from '@/pages/patients'
import { ScansPage } from '@/pages/scans'
import { StatisticsPage } from '@/pages/statistics'
import { ArchivePage } from '@/pages/archive'
import { UsersPage } from '@/pages/users'
import { StatusPage } from '@/pages/status'
import { LoadingPanel } from '@/components/primitives'
import './styles/index.css'
import './styles/mrr.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 15_000 },
  },
})

function RouteGate() {
  const { user, booting, passwordRequired } = useSession()
  const pathname = useRouterState({ select: state => state.location.pathname })
  if (booting) return <div className="mx-auto max-w-3xl p-8"><LoadingPanel /></div>
  if (!user) return pathname === '/login' ? <Outlet /> : <Navigate to="/login" replace />
  if (passwordRequired) return pathname === '/change-password' ? <Outlet /> : <Navigate to="/change-password" replace />
  if (pathname === '/login' || pathname === '/change-password') return <Navigate to="/" replace />
  return <AppShell><Outlet /></AppShell>
}

function Root() { return <SessionProvider><RouteGate /></SessionProvider> }
const root = createRootRoute({ component: Root })
const dashboard = createRoute({ getParentRoute: () => root, path: '/', component: DashboardPage })
const patients = createRoute({ getParentRoute: () => root, path: '/patients', component: PatientsPage })
const scans = createRoute({ getParentRoute: () => root, path: '/scans', component: ScansPage })
const statistics = createRoute({ getParentRoute: () => root, path: '/statistics', component: StatisticsPage })
const archive = createRoute({ getParentRoute: () => root, path: '/archive', component: ArchivePage })
const users = createRoute({ getParentRoute: () => root, path: '/users', component: UsersPage })
const status = createRoute({ getParentRoute: () => root, path: '/status', component: StatusPage })
const login = createRoute({ getParentRoute: () => root, path: '/login', component: LoginPage })
const changePassword = createRoute({ getParentRoute: () => root, path: '/change-password', component: ChangePasswordPage })
const routeTree = root.addChildren([dashboard, patients, scans, statistics, archive, users, status, login, changePassword])
const router = createRouter({ routeTree, defaultPreload: 'intent' })
declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}

const mount = document.getElementById('root')
if (!mount) throw new Error('缺少 #root 挂载节点')
createRoot(mount).render(<StrictMode><QueryClientProvider client={queryClient}><RouterProvider router={router} /></QueryClientProvider></StrictMode>)
