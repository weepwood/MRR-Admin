import { useQuery } from '@tanstack/react-query'
import { Activity, CheckCircle2, RefreshCcw, Server, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorPanel, LoadingPanel, MetricCard, PageHeading } from '@/components/primitives'
import { api } from '@/lib/api'
import type { StatusResult } from '@/lib/types'

export function StatusPage() {
  const state = useQuery({ queryKey: ['system-status', 90], queryFn: ({ signal }) => api<StatusResult>('/api/v1/public/status/summary?days=90', { signal }), retry: 1, staleTime: 30000 })
  return <><PageHeading title="服务状态" description="从 MRR 公开状态接口读取过去 90 天的系统可用性。" action={<Button variant="outline" onClick={() => void state.refetch()}><RefreshCcw />刷新</Button>} />
    {state.isLoading ? <LoadingPanel /> : state.error ? <ErrorPanel error={state.error} retry={() => void state.refetch()} /> : <>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="服务状态" value={state.data?.currentStatus === 'UP' ? '正常' : state.data?.currentStatus === 'DOWN' ? '不可用' : '暂无数据'} icon={<Server className="size-4" />} />
        <MetricCard label="90 天可用率" value={state.data?.uptimePercentage == null ? undefined : state.data.uptimePercentage.toFixed(2) + '%'} icon={<CheckCircle2 className="size-4" />} />
        <MetricCard label="观察周期" value={state.data?.days} note="天" icon={<Timer className="size-4" />} />
      </div>
      <Card className="mt-5"><CardHeader><CardTitle className="flex items-center gap-2"><Activity className="size-4" />状态信息</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><p><span className="text-muted-foreground">上次检查：</span>{state.data?.lastCheckedAt || '未知'}</p><p><span className="text-muted-foreground">状态持续起点：</span>{state.data?.currentStatusSince || '未知'}</p><p className="text-xs text-muted-foreground">页面只展示公开的脱敏健康指标，不提供未经授权的服务器调试数据。</p></CardContent></Card>
    </>}
  </>
}
