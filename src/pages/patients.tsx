import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, UsersRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DataGrid, ErrorPanel, LoadingPanel, PageHeading, Pager, Restricted } from '@/components/primitives'
import { useSession } from '@/context/session'
import { api, query } from '@/lib/api'
import { hasPermission, type PageResult, type Patient } from '@/lib/types'

const pageSize = 20
function maskIdCard(value?: string) {
  if (!value) return '—'
  return value.length > 7 ? value.slice(0, 3) + '***********' + value.slice(-4) : '******'
}
export function PatientsPage() {
  const { user } = useSession()
  const allowed = hasPermission(user, 'record:read')
  const [keyword, setKeyword] = useState('')
  const [applied, setApplied] = useState('')
  const [page, setPage] = useState(1)
  const response = useQuery({
    queryKey: ['patients', page, applied],
    queryFn: ({ signal }) => api<PageResult<Patient>>('/api/v1/patients' + query({ page, size: pageSize, keyword: applied }), { signal }),
    enabled: allowed,
    staleTime: 15000,
    retry: 1,
  })
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setApplied(keyword.trim()); setPage(1)
  }
  if (!allowed) return <Restricted permission="record:read" />
  return <>
    <PageHeading title="患者与病案" description="按病案号、姓名、科室等条件查询，保留病案号原始格式，不自动补零。" />
    <Card className="mb-5 py-4"><CardContent><form className="flex flex-wrap items-center gap-3" onSubmit={submit}><div className="relative w-full max-w-md flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input aria-label="病案查询关键词" className="pl-9" placeholder="搜索病案号 / 姓名 / 科室" value={keyword} onChange={e => setKeyword(e.target.value)} /></div><Button type="submit">查询</Button><Button type="button" variant="outline" onClick={() => { setKeyword(''); setApplied(''); setPage(1) }}>重置</Button></form></CardContent></Card>
    {response.isPending ? <LoadingPanel /> : response.error ? <ErrorPanel error={response.error} retry={() => void response.refetch()} /> :
    <Card className="gap-0 overflow-hidden py-0"><div className="flex items-center gap-2 px-6 py-5 text-sm font-semibold"><UsersRound className="size-4 text-primary" />患者记录 <span className="ml-auto text-xs font-normal text-muted-foreground">共 {response.data?.total?.toLocaleString('zh-CN') ?? '—'} 条</span></div>
      <DataGrid rows={response.data?.list ?? []} columns={[
        { title: '病案号', render: row => <span className="font-mono text-xs font-semibold">{row.bah || '—'}</span> },
        { title: '姓名', render: row => <span className="font-medium">{row.name || '—'}</span> },
        { title: '身份证号（脱敏）', render: row => <span className="font-mono text-xs text-muted-foreground">{maskIdCard(row.idCard)}</span> },
        { title: '入院日期', render: row => row.ruyuan || '—' },
        { title: '住院科室', render: row => row.department || '—' },
        { title: '病区 / 床位', render: row => [row.bingqu, row.chuangwei].filter(Boolean).join(' / ') || '—' },
      ]} />
      <Pager page={page} total={response.data?.total} size={pageSize} previous={() => setPage(p => p - 1)} next={() => setPage(p => p + 1)} />
    </Card>}
  </>
}
