/** Tên miền chính của app (đặt trong .env.production). Trống thì không chuyển. */
export const CANONICAL_HOST = (import.meta.env.VITE_CANONICAL_HOST as string | undefined) ?? ''

/** Tên miền mặc định của Firebase Hosting, chuyển sang tên miền chính. */
export function isLegacyHost(hostname: string): boolean {
  return /\.(web\.app|firebaseapp\.com)$/.test(hostname)
}

/**
 * URL tương ứng trên tên miền chính, hoặc null nếu không cần chuyển.
 * Không chuyển các trang /__/ của Firebase (đăng nhập, cấu hình).
 */
export function canonicalUrl(
  location: Pick<Location, 'hostname' | 'pathname' | 'search' | 'hash'>,
  canonicalHost: string = CANONICAL_HOST,
): string | null {
  if (!canonicalHost || location.hostname === canonicalHost) return null
  if (!isLegacyHost(location.hostname) || location.pathname.startsWith('/__/')) return null
  return `https://${canonicalHost}${location.pathname}${location.search}${location.hash}`
}
