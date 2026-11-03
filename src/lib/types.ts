/** 从 MRR 后端 Java DTO 与原 Vue 接口类型整理，保留原字段大小写。 */
export interface ApiResult<T> {
  code?: number | string
  message?: string
  data?: T
  meta?: { requestId?: string; reasonCode?: string }
}
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  size: number
  totalPages: number
}
export interface CursorPage<T> {
  list: T[]
  nextCursorId?: number | null
  hasMore: boolean
  size: number
}
export interface AuthUser {
  id?: number
  username?: string
  displayName?: string
  roleCode?: string
  roleName?: string
  status?: string
  permissions?: string[]
  mustChangePassword?: boolean
}
export interface LoginResult {
  token?: string
  user?: AuthUser
  nextAction?: 'NONE' | 'CHANGE_PASSWORD'
}
export interface Patient {
  id?: number
  bah?: string
  name?: string
  idCard?: string
  ruyuan?: string
  admissiontime?: string
  department?: string
  bingqu?: string
  chuangwei?: string
}
export interface Scan {
  id?: number
  bah?: string
  sjh?: string
  brxh?: string
  filename?: string
  btype?: number | null
  pages?: number | null
  uploadDate?: string
  migrationStatus?: string
}
export interface StatisticsRow {
  id?: number
  bah?: string
  sjh?: string
  patientName?: string
  inpatientDepartment?: string
  date?: string
  type?: string
  pages?: number
  cid?: string
  openerNo?: string
}
export interface TrendPoint {
  date: string
  recordCount?: number
  totalPages?: number
}
export interface DashboardResult {
  overview?: { totalRecords?: number; totalPages?: number }
  uniqueBAHCount?: number
  recentTrend?: TrendPoint[]
  topBAH?: Array<{ bah?: string; recordCount?: number; totalPages?: number }>
}
export interface StatusResult {
  currentStatus: 'UP' | 'DOWN' | 'NO_DATA'
  currentStatusSince?: string | null
  lastCheckedAt?: string | null
  uptimePercentage?: number | null
  days: number
}
export interface ManagedUser extends AuthUser {
  createdAt?: string
  lastLoginAt?: string
}
export function hasPermission(user: AuthUser | null, permission: string) {
  if (!user) return false
  if (user.roleCode?.toUpperCase() === 'ADMIN') return true
  if (user.permissions?.includes(permission)) return true
  if (permission === 'record:read') return ['record:edit', 'record:download', 'record:pdf:export', 'record:manage'].some(p => user.permissions?.includes(p))
  if (permission.startsWith('record:') && user.permissions?.includes('record:manage')) return true
  return false
}
