import type { ApiResult } from './types'

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string | number) {
    super(message)
    this.name = 'ApiError'
  }
}

const storageKey = 'mrr-admin-session'
const prefix = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

export function getToken(): string | null {
  return sessionStorage.getItem(storageKey)
}
export function saveToken(token: string | null): void {
  if (token) sessionStorage.setItem(storageKey, token)
  else sessionStorage.removeItem(storageKey)
}

export function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  const value = search.toString()
  return value ? '?' + value : ''
}

function prepare(path: string, options: RequestInit = {}): RequestInit {
  const token = getToken()
  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', 'Bearer ' + token)
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  return { ...options, headers, credentials: 'same-origin', cache: 'no-store' }
}
async function execute(path: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(prefix + path, prepare(path, options))
  if (response.status === 401 && !path.endsWith('/login')) {
    saveToken(null)
    window.dispatchEvent(new Event('mrr:session-expired'))
  }
  if (response.status === 428) window.dispatchEvent(new Event('mrr:password-required'))
  return response
}
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await execute(path, options)
  let payload: ApiResult<T>
  try {
    payload = await response.json() as ApiResult<T>
  } catch {
    throw new ApiError('接口返回了无法解析的数据', response.status)
  }
  const code = Number(payload.code)
  if (!response.ok || (payload.code !== undefined && !(code >= 200 && code < 300))) {
    throw new ApiError(payload.message || '请求失败，请稍后重试', response.status, payload.code)
  }
  return payload.data as T
}
export function post<T>(path: string, body: unknown, signal?: AbortSignal) {
  return api<T>(path, { method: 'POST', body: JSON.stringify(body), signal })
}
export async function downloadCsv(path: string, filename: string) {
  const response = await execute(path)
  if (!response.ok) throw new ApiError('导出失败，请检查权限与查询条件', response.status)
  if (response.headers.get('content-type')?.includes('application/json')) {
    throw new ApiError('导出接口未返回 CSV 文件', response.status)
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** 通过带 JWT 的请求获取图片，不将令牌放在图片 URL 中。 */
export async function fetchProtectedBlob(path: string, signal?: AbortSignal): Promise<Blob> {
  const response = await execute(path, { signal })
  if (!response.ok) throw new ApiError('影像加载失败，请检查权限或文件是否存在', response.status)
  if (response.headers.get('content-type')?.includes('application/json')) {
    throw new ApiError('影像接口未返回图片文件', response.status)
  }
  return response.blob()
}
