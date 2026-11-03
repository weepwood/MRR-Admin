import { useEffect, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileImage, Images, Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ErrorPanel, LoadingPanel, PageHeading, Restricted } from '@/components/primitives'
import { useSession } from '@/context/session'
import { api, fetchProtectedBlob, query } from '@/lib/api'
import { hasPermission } from '@/lib/types'

interface ArchiveImage {
  id?: number
  bah?: string
  sjh?: string
  brxh?: string
  folder?: string
  filename?: string
  btype?: number | null
  pages?: number | null
}
function needsShelf(bah: string) {
  return /^\d+$/.test(bah) && BigInt(bah) >= 10000000n
}
export function ArchivePage() {
  const { user } = useSession()
  const allowed = hasPermission(user, 'record:read')
  const [bah, setBah] = useState('')
  const [sjh, setSjh] = useState('')
  const [selection, setSelection] = useState<{ bah: string; sjh: string } | null>(null)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<ArchiveImage | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState('')
  const results = useQuery({
    queryKey: ['archive-images', selection?.bah, selection?.sjh],
    queryFn: ({ signal }) => api<ArchiveImage[]>('/api/v1/img/search' + query({ bah: selection?.bah, sjh: selection?.sjh }), { signal }),
    enabled: allowed && Boolean(selection),
    retry: 1, staleTime: 15000,
  })
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const b = bah.trim(); const s = sjh.trim()
    if (!b && !s) { setError('请至少输入病案号或上架号'); return }
    if (needsShelf(b) && !s) { setError('病案号大于或等于 10000000 时，必须同时提供上架号'); return }
    setError(''); setSelected(null); setSelection({ bah: b, sjh: s })
  }
  useEffect(() => {
    if (!selected) { setImageUrl(null); return }
    if (!selected.bah || !selected.brxh || !selected.folder || !selected.filename) {
      setImageError('该影像缺少预览所需的目录信息。')
      return
    }
    const controller = new AbortController()
    let url: string | null = null
    const path = '/api/v1/img/image/' + [selected.bah, selected.brxh, selected.folder, selected.filename].map(encodeURIComponent).join('/')
    setImageError('')
    setImageUrl(null)
    fetchProtectedBlob(path, controller.signal).then(blob => {
      if (!controller.signal.aborted) { url = URL.createObjectURL(blob); setImageUrl(url) }
    }).catch(e => { if (!controller.signal.aborted) setImageError(e instanceof Error ? e.message : '无法加载预览') })
    return () => { controller.abort(); if (url) URL.revokeObjectURL(url) }
  }, [selected])
  if (!allowed) return <Restricted permission="record:read" />
  return <>
    <PageHeading title="影像档案袋" description="按病案号与上架号检索影像元数据；受权限保护的原图通过后端接口获取。" />
    <Card className="mb-5"><CardHeader><CardTitle className="text-base">检索病案影像</CardTitle><CardDescription>病案号与上架号保留原始格式，不会自动补零。</CardDescription></CardHeader>
      <CardContent><form className="flex flex-wrap gap-3" onSubmit={submit}><Input className="max-w-56" aria-label="病案号" placeholder="病案号" value={bah} onChange={e => setBah(e.target.value)} /><Input className="max-w-56" aria-label="上架号" placeholder="上架号" value={sjh} onChange={e => setSjh(e.target.value)} /><Button type="submit"><Search />检索影像</Button></form>{error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}</CardContent>
    </Card>
    {!selection ? <Card><CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 text-muted-foreground"><Images className="size-9" /><p className="text-sm">输入检索条件以查看真实病案影像</p></CardContent></Card> :
      results.isPending ? <LoadingPanel /> : results.error ? <ErrorPanel error={results.error} retry={() => void results.refetch()} /> :
      <Card><CardHeader><CardTitle className="text-base">检索结果：{results.data?.length ?? 0} 张</CardTitle><CardDescription>当前最多展示前 100 条元数据；选择卡片后按需加载原图。</CardDescription></CardHeader>
        <CardContent>{results.data?.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {results.data.slice(0, 100).map((item, i) => <button key={item.id ?? i} type="button" onClick={() => setSelected(item)} className="group rounded-xl border p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/40">
            <div className="mb-3 flex aspect-[4/3] items-center justify-center rounded-lg bg-muted/60"><FileImage className="size-10 text-muted-foreground group-hover:text-primary" /></div>
            <div title={item.filename} className="truncate text-xs font-semibold">{item.filename || '未命名影像'}</div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground"><span>{item.bah || '—'}</span><Badge variant="outline">{!item.btype ? '未分类' : '类型 ' + item.btype}</Badge></div>
          </button>)}
        </div> : <div className="py-16 text-center text-sm text-muted-foreground">未找到符合条件的影像</div>}</CardContent>
      </Card>}
    {selected && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4" role="dialog" aria-modal="true" aria-label="影像预览" onClick={() => setSelected(null)}>
      <div className="flex max-h-[95vh] w-full max-w-5xl flex-col gap-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 text-white"><span className="truncate text-sm">{selected.filename || '影像预览'}</span><Button variant="secondary" size="icon" aria-label="关闭预览" onClick={() => setSelected(null)}><X /></Button></div>
        <div className="flex min-h-[50vh] items-center justify-center overflow-auto rounded-xl bg-slate-950 p-4">{imageError ? <p className="text-sm text-red-300">{imageError}</p> : imageUrl ? <img src={imageUrl} alt={selected.filename || '影像文件'} className="max-h-[80vh] max-w-full object-contain" /> : <p className="text-sm text-white/70">正在读取受保护的影像…</p>}</div>
      </div>
    </div>}
  </>
}
