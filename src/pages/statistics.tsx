import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DataGrid, ErrorPanel, LoadingPanel, PageHeading, Pager, Restricted } from '@/components/primitives'
import { useSession } from '@/context/session'
import { api, downloadCsv, query } from '@/lib/api'
import { hasPermission, type PageResult, type StatisticsRow } from '@/lib/types'

const size = 20
export function StatisticsPage() {
  const { user } = useSession()
  const allowed = hasPermission(user, 'statistics:read')
  const [keyword, setKeyword] = useState('')
  const [applied, setApplied] = useState('')
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')
  const request = useQuery({
    queryKey: ['statistics', page, applied],
    queryFn: ({ signal }) => api<PageResult<StatisticsRow>>('/api/v1/statistics' + query({ page, size, keyword: applied, sortBy: 'date', sortOrder: 'desc' }), { signal }),
    enabled: allowed, retry: 1, staleTime: 15000,
  })
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setApplied(keyword.trim()); setPage(1) }
  async function exportCsv() {
    setError('')
    try { await downloadCsv('/api/v1/statistics/export/csv' + query({ keyword: applied }), 'mrr-statistics.csv') }
    catch (e) { setError(e instanceof Error ? e.message : '导出失败') }
  }
  if (!allowed) return <Restricted permission="statistics:read" />
  return <>
    <PageHeading title="病案统计" description="分页查看真实归档统计、日期、类型和扫描页数。" action={<Button variant="outline" onClick={() => void exportCsv()}><Download />导出 CSV</Button>} />
    {error && <p role="alert" className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    <Card className="mb-5 py-4"><CardContent><form className="flex flex-wrap items-center gap-3" onSubmit={submit}><Input aria-label="统计筛选关键词" className="max-w-md" placeholder="病案、科室、负责人或其他关键词" value={keyword} onChange={e => setKeyword(e.target.value)} /><Button type="submit"><Search />查询</Button><Button type="button" variant="outline" onClick={() => { setKeyword(''); setApplied(''); setPage(1) }}>重置</Button></form></CardContent></Card>
    {request.isPending ? <LoadingPanel /> : request.error ? <ErrorPanel error={request.error} retry={() => void request.refetch()} /> :
    <Card className="gap-0 overflow-hidden py-0">
      <div className="px-6 py-5 text-sm font-semibold">统计明细 <span className="float-right text-xs font-normal text-muted-foreground">共 {request.data?.total?.toLocaleString('zh-CN') ?? '—'} 条</span></div>
      <DataGrid rows={request.data?.list ?? []} columns={[
        { title: '病案号', render: x => <span className="font-mono text-xs font-semibold">{x.bah || '—'}</span> },
        { title: '上架号', render: x => <span className="font-mono text-xs">{x.sjh || '—'}</span> },
        { title: '姓名', render: x => x.patientName || '—' },
        { title: '科室', render: x => x.inpatientDepartment || '—' },
        { title: '归档日期', render: x => x.date || '—' },
        { title: '类型', render: x => x.type || '—' },
        { title: '扫描页数', render: x => x.pages ?? '—' },
      ]} />
      <Pager page={page} size={size} total={request.data?.total} previous={() => setPage(p => p - 1)} next={() => setPage(p => p + 1)} />
    </Card>}
  </>
}
