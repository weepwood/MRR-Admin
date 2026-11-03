import { type ReactNode } from 'react'
import { AlertCircle, ArrowLeft, ArrowRight, LockKeyhole, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function PageHeading({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
    <div><h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">{title}</h1><p className="mt-1.5 text-sm text-muted-foreground">{description}</p></div>{action}
  </div>
}
export function ErrorPanel({ error, retry }: { error: unknown; retry?: () => void }) {
  return <Card><CardContent className="flex flex-col items-center gap-3 py-12 text-center"><AlertCircle className="size-8 text-destructive" /><h2 className="text-sm font-semibold">数据加载失败</h2><p className="max-w-md text-sm text-muted-foreground">{error instanceof Error ? error.message : '请检查网络连接、权限或后端服务。'}</p>{retry && <Button variant="outline" size="sm" onClick={retry}><RefreshCcw />重新加载</Button>}</CardContent></Card>
}
export function LoadingPanel() {
  return <Card aria-busy="true"><CardContent className="space-y-4 py-8"><Skeleton className="h-8 w-1/3" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-2/3" /></CardContent></Card>
}
export function EmptyPanel({ text = '暂无符合条件的数据' }: { text?: string }) {
  return <div className="flex min-h-52 flex-col items-center justify-center gap-2 text-center"><AlertCircle className="size-6 text-muted-foreground" /><p className="text-sm">{text}</p></div>
}
export function Restricted({ permission }: { permission: string }) {
  return <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center"><LockKeyhole className="size-10 text-muted-foreground" /><h1 className="text-xl font-semibold">无权访问</h1><p className="text-sm text-muted-foreground">当前账号没有 {permission} 权限，请联系管理员。</p></div>
}
export interface Column<T> { title: string; render: (value: T) => ReactNode; className?: string }
export function DataGrid<T>({ columns, rows, emptyText }: { columns: Column<T>[]; rows: T[]; emptyText?: string }) {
  return <div className="w-full overflow-x-auto"><Table>
    <TableHeader><TableRow className="bg-muted/40">{columns.map((col, i) => <TableHead key={i} className={col.className}>{col.title}</TableHead>)}</TableRow></TableHeader>
    <TableBody>{rows.length ? rows.map((row, i) => <TableRow key={i}>{columns.map((col, j) => <TableCell key={j} className={col.className}>{col.render(row)}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={columns.length}><EmptyPanel text={emptyText} /></TableCell></TableRow>}</TableBody>
  </Table></div>
}
export function Pager({ page, total, size, previous, next, hasMore }: { page: number; total?: number; size: number; previous: () => void; next: () => void; hasMore?: boolean }) {
  const canGo = hasMore ?? (total !== undefined && page * size < total)
  return <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3 text-xs text-muted-foreground">
    <div>第 {page} 页 {total === undefined ? '· 游标分页' : '· 共 ' + total.toLocaleString('zh-CN') + ' 条'}</div>
    <div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={previous}><ArrowLeft />上一页</Button><Button size="sm" variant="outline" disabled={!canGo} onClick={next}>下一页<ArrowRight /></Button></div>
  </div>
}
export function MetricCard({ label, value, note, icon }: { label: string; value: string | number | undefined; note?: string; icon: ReactNode }) {
  return <Card className="gap-4 py-5"><CardHeader className="flex flex-row items-center justify-between pb-0"><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle><div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div></CardHeader><CardContent><div className="text-3xl font-bold tracking-tight tabular-nums">{value === undefined || value === null ? '—' : typeof value === 'number' ? value.toLocaleString('zh-CN') : value}</div>{note && <p className="mt-2 text-xs text-muted-foreground">{note}</p>}</CardContent></Card>
}
