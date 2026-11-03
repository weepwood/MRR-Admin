import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileImage, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DataGrid, ErrorPanel, LoadingPanel, PageHeading, Pager, Restricted } from '@/components/primitives'
import { useSession } from '@/context/session'
import { post } from '@/lib/api'
import { hasPermission, type CursorPage, type Scan } from '@/lib/types'

const size = 20
export function ScansPage() {
  const { user } = useSession()
  const allowed = hasPermission(user, 'record:read')
  const [bah, setBah] = useState('')
  const [sjh, setSjh] = useState('')
  const [applied, setApplied] = useState({ bah: '', sjh: '' })
  const [cursors, setCursors] = useState([0])
  const afterId = cursors[cursors.length - 1] ?? 0
  const result = useQuery({
    queryKey: ['scans', applied.bah, applied.sjh, afterId],
    queryFn: ({ signal }) => post<CursorPage<Scan>>('/api/v1/scan/cursor/condition?afterId=' + afterId + '&size=' + size, applied, signal),
    enabled: allowed,
    staleTime: 10000,
    retry: 1,
  })
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setApplied({ bah: bah.trim(), sjh: sjh.trim() })
    setCursors([0])
  }
  if (!allowed) return <Restricted permission="record:read" />
  return <>
    <PageHeading title="扫描记录" description="对大规模扫描表采用后端游标分页，避免深度 OFFSET 与频繁 COUNT。" />
    <Card className="mb-5 py-4"><CardContent><form onSubmit={submit} className="flex flex-wrap gap-3"><Input aria-label="病案号筛选" className="max-w-64" placeholder="病案号（完整值）" value={bah} onChange={e => setBah(e.target.value)} /><Input aria-label="上架号筛选" className="max-w-64" placeholder="上架号" value={sjh} onChange={e => setSjh(e.target.value)} /><Button type="submit"><Search />查询</Button><Button variant="outline" type="button" onClick={() => { setBah(''); setSjh(''); setApplied({ bah: '', sjh: '' }); setCursors([0]) }}>重置</Button></form></CardContent></Card>
    {result.isPending ? <LoadingPanel /> : result.error ? <ErrorPanel error={result.error} retry={() => void result.refetch()} /> :
    <Card className="gap-0 overflow-hidden py-0"><div className="flex items-center gap-2 px-6 py-5 text-sm font-semibold"><FileImage className="size-4 text-primary" />扫描清单 <span className="ml-auto text-xs font-normal text-muted-foreground">每页 {size} 条 · 游标查询</span></div>
      <DataGrid rows={result.data?.list ?? []} columns={[
        { title: '记录 ID', render: row => <span className="font-mono text-xs">{row.id ?? '—'}</span> },
        { title: '病案号', render: row => <span className="font-mono text-xs font-semibold">{row.bah || '—'}</span> },
        { title: '上架号', render: row => <span className="font-mono text-xs">{row.sjh || '—'}</span> },
        { title: '文件名', render: row => <span className="block max-w-64 truncate" title={row.filename}>{row.filename || '—'}</span> },
        { title: '影像类型', render: row => row.btype == null || row.btype === 0 ? '未分类' : '类型 ' + row.btype },
        { title: '页数', render: row => row.pages ?? '—' },
        { title: '上传日期', render: row => row.uploadDate || '—' },
      ]} />
      <Pager page={cursors.length} size={size} hasMore={Boolean(result.data?.hasMore && result.data.nextCursorId != null)} previous={() => setCursors(items => items.slice(0, -1))} next={() => {
        const cursor = result.data?.nextCursorId
        if (cursor != null && cursor > afterId) setCursors(items => [...items, cursor])
      }} />
    </Card>}
  </>
}
