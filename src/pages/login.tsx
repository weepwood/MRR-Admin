import { useState, type FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Archive, ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useSession } from '@/context/session'
import { post } from '@/lib/api'

export function LoginPage() {
  const { signIn } = useSession()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(''); setPending(true)
    try {
      await signIn(username.trim(), password)
      setPassword('')
      await navigate({ to: '/' })
    } catch (err) { setError(err instanceof Error ? err.message : '登录失败') }
    finally { setPending(false) }
  }
  return <div className="relative grid min-h-svh place-items-center overflow-hidden bg-muted/30 p-5">
    <div className="pointer-events-none absolute -left-32 -top-40 size-[500px] rounded-full bg-blue-500/10 blur-3xl" />
    <div className="relative w-full max-w-[420px]">
      <div className="mb-8 flex items-center justify-center gap-3"><div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Archive /></div><div><div className="text-xl font-bold">MRR Admin</div><div className="text-xs text-muted-foreground">医疗病案管理平台</div></div></div>
      <Card className="shadow-xl shadow-slate-900/5"><CardHeader><CardTitle className="text-xl">登录工作空间</CardTitle><CardDescription>使用 MRR 系统账号登录，权限由后端统一校验。</CardDescription></CardHeader>
        <CardContent><form className="space-y-5" onSubmit={e => void submit(e)}>
          <div className="space-y-2"><label htmlFor="username" className="text-sm font-medium">账号</label><Input id="username" autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="输入系统账号" required /></div>
          <div className="space-y-2"><label htmlFor="password" className="text-sm font-medium">密码</label><Input id="password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="输入登录密码" required /></div>
          {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <Button className="w-full" disabled={pending || !username.trim() || !password} type="submit">{pending ? '正在验证…' : '登录系统'}<ArrowRight /></Button>
        </form></CardContent>
      </Card>
      <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground"><ShieldCheck className="size-4" /> 数据不存储于此管理端，访问受 MRR 权限系统保护。</p>
    </div>
  </div>
}

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const { signOut } = useSession()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [complete, setComplete] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (next.length < 6 || next.length > 64) { setError('新密码长度应为 6–64 位'); return }
    if (next !== confirm) { setError('两次输入的新密码不一致'); return }
    setError(''); setPending(true)
    try {
      await post('/api/v1/auth/password/required-change', { currentPassword: current, newPassword: next, confirmPassword: confirm })
      setComplete(true)
      setCurrent(''); setNext(''); setConfirm('')
      await signOut()
    } catch (err) { setError(err instanceof Error ? err.message : '修改密码失败') }
    finally { setPending(false) }
  }
  return <div className="grid min-h-svh place-items-center bg-muted/30 px-4"><Card className="w-full max-w-md">
    <CardHeader><div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><LockKeyhole /></div><CardTitle>首次登录请修改密码</CardTitle><CardDescription>为保证账号安全，需要先修改临时密码才能进入管理工作台。</CardDescription></CardHeader>
    <CardContent>{complete ? <div className="space-y-4"><p className="text-sm">密码修改成功，请使用新密码重新登录。</p><Button onClick={() => void navigate({ to: '/login' })}>返回登录</Button></div> :
    <form className="space-y-4" onSubmit={e => void submit(e)}>
      <div className="space-y-2"><label htmlFor="current" className="text-sm font-medium">当前临时密码</label><Input id="current" type="password" autoComplete="current-password" value={current} onChange={e => setCurrent(e.target.value)} required /></div>
      <div className="space-y-2"><label htmlFor="next" className="text-sm font-medium">新密码</label><Input id="next" type="password" autoComplete="new-password" value={next} onChange={e => setNext(e.target.value)} required minLength={6} maxLength={64} /></div>
      <div className="space-y-2"><label htmlFor="confirm" className="text-sm font-medium">确认新密码</label><Input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} required /></div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button className="w-full" disabled={pending} type="submit">{pending ? '正在提交…' : '修改密码并重新登录'}</Button>
    </form>}</CardContent>
  </Card></div>
}
