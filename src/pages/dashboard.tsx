import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Activity, Database, FileImage, Files, RefreshCcw, UsersRound } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataGrid, ErrorPanel, LoadingPanel, MetricCard, PageHeading } from '@/components/primitives'
import { useSession } from '@/context/session'
import { api } from '@/lib/api'
import { hasPermission, type DashboardResult, type StatusResult } from '@/lib/types'

export function DashboardPage() {
  const { user } = useSession()
  const canReadStats = hasPermission(user, 'statistics:read')
  const summary = useQuery({ queryKey: ['dashboard'], queryFn: ({ signal }) => api<DashboardResult>('/api/v1/statistics/dashboard', { signal }), enabled: canReadStats, staleTime: 60000, retry: 1 })
  const status = useQuery({ queryKey: ['public-status'], queryFn: ({ signal }) => api<StatusResult>('/api/v1/public/status/summary?days=30', { signal }), staleTime: 60000, retry: 1 })
  const data = summary.data
  return <>
    <PageHeading title="工作台总览" description="关注病案归档规模、扫描趋势与系统可用性；所有指标均来自后端。"
      action={<Button variant="outline" onClick={() => { void summary.refetch(); void status.refetch() }}><RefreshCcw />刷新数据</Button>} />
    {canReadStats && summary.isLoading ? <LoadingPanel /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="累计扫描记录" value={canReadStats ? data?.overview?.totalRecords : undefined} note="业务统计库中的记录总量" icon={<FileImage className="size-4" />} />
      <MetricCard label="累计归档页数" value={canReadStats ? data?.overview?.totalPages : undefined} note="扫描记录累计页数" icon={<Files className="size-4" />} />
      <MetricCard label="独立病案数量" value={canReadStats ? data?.uniqueBAHCount : undefined} note="按病案号去重统计" icon={<UsersRound className="size-4" />} />
      <MetricCard label="服务可用率（30 天）" value={status.data?.uptimePercentage == null ? undefined : status.data.uptimePercentage.toFixed(2) + '%'} note={status.data?.currentStatus === 'UP' ? '当前服务在线' : '当前状态：' + (status.data?.currentStatus || '未知')} icon={<Activity className="size-4" />} />
    </div>}
    {!canReadStats && <p className="mt-4 rounded-lg border p-4 text-sm text-muted-foreground">当前账号没有 statistics:read 权限，统计指标不会加载。</p>}
    {summary.error && canReadStats && <div className="mt-5"><ErrorPanel error={summary.error} retry={() => void summary.refetch()} /></div>}
    <div className="mt-5 grid gap-5 lg:grid-cols-5">
      <Card className="lg:col-span-3"><CardHeader><CardTitle>近 30 天扫描趋势</CardTitle><CardDescription>每日扫描记录与归档数量</CardDescription></CardHeader>
        <CardContent>{data?.recentTrend?.length ? <div className="h-[280px] w-full"><ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.recentTrend}><defs><linearGradient id="mrrTrend" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.22}/><stop offset="100%" stopColor="var(--primary)" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} tickFormatter={(x: string) => x.slice(5)}/><YAxis tickLine={false} axisLine={false} fontSize={11} width={36}/><Tooltip/><Area type="monotone" dataKey="recordCount" name="扫描记录" stroke="var(--primary)" fill="url(#mrrTrend)" strokeWidth={2} /></AreaChart>
          </ResponsiveContainer></div> : <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">{canReadStats ? '暂无趋势数据' : '需要统计读取权限'}</div>}</CardContent>
      </Card>
      <Card className="lg:col-span-2"><CardHeader><CardTitle>最近活跃病案</CardTitle><CardDescription>扫描数量较多的病案号</CardDescription></CardHeader>
        <CardContent>{data?.topBAH?.length ? <DataGrid rows={data.topBAH} columns={[
          { title: '病案号', render: x => <span className="font-mono text-xs">{x.bah || '—'}</span> },
          { title: '记录数', render: x => x.recordCount ?? '—' },
          { title: '总页数', render: x => x.totalPages ?? '—' },
        ]} /> : <div className="py-10 text-center text-sm text-muted-foreground">暂无可展示的数据</div>}</CardContent>
      </Card>
    </div>
    <Card className="mt-5 gap-4"><CardHeader><CardTitle>常用业务入口</CardTitle><CardDescription>根据当前账号权限快速进入对应模块</CardDescription></CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        {hasPermission(user, 'record:read') && <Button asChild variant="outline"><Link to="/patients"><UsersRound />患者档案</Link></Button>}
        {hasPermission(user, 'record:read') && <Button asChild variant="outline"><Link to="/scans"><Database />扫描记录</Link></Button>}
        {hasPermission(user, 'statistics:read') && <Button asChild variant="outline"><Link to="/statistics"><Files />病案报表</Link></Button>}
        <Button asChild variant="outline"><Link to="/status"><Activity />服务状态</Link></Button>
      </CardContent>
    </Card>
  </>
}
