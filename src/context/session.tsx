import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api, getToken, post, saveToken } from '@/lib/api'
import type { AuthUser, LoginResult } from '@/lib/types'

interface SessionContextValue {
  user: AuthUser | null
  booting: boolean
  passwordRequired: boolean
  signIn: (username: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}
const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [booting, setBooting] = useState(true)
  const [passwordRequired, setPasswordRequired] = useState(false)

  const clear = useCallback(() => {
    saveToken(null)
    setUser(null)
    setPasswordRequired(false)
    client.clear()
  }, [client])

  const refresh = useCallback(async () => {
    if (!getToken()) { setUser(null); return }
    const profile = await api<AuthUser>('/api/v1/auth/me')
    setUser(profile)
    setPasswordRequired(Boolean(profile?.mustChangePassword))
  }, [])

  useEffect(() => {
    let active = true
    if (getToken()) {
      api<AuthUser>('/api/v1/auth/me').then(profile => {
        if (active) { setUser(profile); setPasswordRequired(Boolean(profile?.mustChangePassword)) }
      }).catch(() => { if (active) clear() })
        .finally(() => { if (active) setBooting(false) })
    } else {
      setBooting(false)
    }
    return () => { active = false }
  }, [clear])

  useEffect(() => {
    window.addEventListener('mrr:session-expired', clear)
    const requirePassword = () => setPasswordRequired(true)
    window.addEventListener('mrr:password-required', requirePassword)
    return () => {
      window.removeEventListener('mrr:session-expired', clear)
      window.removeEventListener('mrr:password-required', requirePassword)
    }
  }, [clear])

  const signIn = useCallback(async (username: string, password: string) => {
    const result = await post<LoginResult>('/api/v1/auth/login', { username, password })
    if (!result?.token) throw new Error('登录响应缺少令牌')
    saveToken(result.token)
    try {
      const profile = await api<AuthUser>('/api/v1/auth/me')
      setUser(profile)
      setPasswordRequired(Boolean(profile?.mustChangePassword) || result.nextAction === 'CHANGE_PASSWORD')
    } catch (error) {
      clear()
      throw error
    }
  }, [clear])

  const signOut = useCallback(async () => {
    try { if (getToken()) await post('/api/v1/auth/logout', {}) }
    catch { /* 即使服务不可用，也清除客户端会话。 */ }
    finally { clear() }
  }, [clear])
  const value = useMemo(() => ({ user, booting, passwordRequired, signIn, signOut, refresh }), [user, booting, passwordRequired, signIn, signOut, refresh])
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const value = useContext(SessionContext)
  if (!value) throw new Error('useSession 必须位于 SessionProvider 内')
  return value
}
