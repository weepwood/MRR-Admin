import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DataGrid, ErrorPanel, LoadingPanel, PageHeading, Pager, Restricted } from '@/components/primitives'
import { useSession } from '@/context/session'
import { api, query } from '@/lib/api'
import { hasPermission, type ManagedUser, type PageResult } from '@/lib/types'

const size = 20
export function UsersPage() {
  const { user } = useSession()
  const allowed = hasPermission(user, 'user:manage')
  const [keyword, setKeyword] = useState('')
  const [applied, setApplied] = useState('')
  const [page, setPage] = useState(1)
  const result = useQuery({
    queryKey: ['users', page, applied],
    queryFn: ({ signal }) => api<PageResult<ManagedUser>>('/api/v1/auth/users' + query({ page, size, keyword: applied }), { signal }),
    enabled: allowed, staleTime: 10000, retry: 1,
  })
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setApplied(keyword.trim()); setPage(1) }
  if (!allowed) return <Restricted permission="user:manage" />
  return <>
    <PageHeading title="用户与权限" description="用户账号、角色和审核状态由 MRR RBAC 服务管理；此页提供安全只读视图。" />
    <Card className="mb-5 py-4"><CardContent><form className="flex flex-wrap gap-3" onSubmit={submit}><Input aria-label="查询用户" className="max-w-sm" placeholder="按账号或姓名查找" value={keyword} onChange={e => setKeyword(e.target.value)} /><Button type="submit"><Search />查询</Button><Button variant="outline" type="button" onClick={() => { setKeyword(''); setApplied(''); setPage(1) }}>重置</Button></form></CardContent></Card>
    {result.isPending ? <LoadingPanel /> : result.error ? <ErrorPanel error={result.error} retry={() => void result.refetch()} /> :
    <Card className="gap-0 overflow-hidden py-0"><div className="flex items-center gap-2 px-6 py-5 text-sm font-semibold"><ShieldCheck className="size-4 text-primary" />系统账号 <span className="ml-auto text-xs font-normal text-muted-foreground">共 {result.data?.total?.toLocaleString('zh-CN') ?? '—'} 个</span></div>
      <DataGrid rows={result.data?.list ?? []} columns={[
        { title: '账号', render: row => <span className="font-medium">{row.username || '—'}</span> },
        { title: '显示名称', render: row => row.displayName || '—' },
        { title: '角色', render: row => <Badge variant="outline">{row.roleName || row.roleCode || '未分配'}</Badge> },
        { title: '状态', render: row => <Badge variant={row.status?.toLowerCase() === 'active' ? 'secondary' : 'outline'}>{row.status || '—'}</Badge> },
        { title: '创建时间', render: row => row.createdAt || '—' },
        { title: '最近登录', render: row => row.lastLoginAt || '—' },
      ]} />
      <Pager page={page} size={size} total={result.data?.total} previous={() => setPage(p => p - 1)} next={() => setPage(p => p + 1)} />
    </Card>}
  </>
}
