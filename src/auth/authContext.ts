import { createContext, useContext } from 'react'

export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

export interface AuthContextValue {
  /** false nếu chưa cấu hình Firebase: ẩn toàn bộ tính năng tài khoản. */
  available: boolean
  /** true cho tới khi Firebase báo trạng thái đăng nhập lần đầu. */
  loading: boolean
  user: AuthUser | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  deleteAccount: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue>({
  available: false,
  loading: false,
  user: null,
  signIn: async () => {},
  signOut: async () => {},
  deleteAccount: async () => {},
})

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}

/** Thông báo lỗi đăng nhập bằng tiếng Việt. */
export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? ''
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Bạn đã đóng cửa sổ đăng nhập.'
    case 'auth/network-request-failed':
      return 'Không có kết nối mạng. Vui lòng thử lại.'
    case 'auth/unauthorized-domain':
      return 'Tên miền này chưa được cho phép đăng nhập (Firebase > Authentication > Settings).'
    case 'auth/operation-not-allowed':
      return 'Đăng nhập Google chưa được bật trong Firebase.'
    default:
      return error instanceof Error ? error.message : 'Đăng nhập không thành công.'
  }
}
