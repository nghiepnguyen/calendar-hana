// Vite (define) gắn lúc build; cùng giá trị với /version.json của bản build này.
declare const __BUILD_INFO__: { version: string; build: string; builtAt: string }

/** Bản build đang chạy trong trình duyệt (CURRENT_BUILD). Không lấy từ /version.json: file đó là bản mới nhất trên server. */
export const APP_VERSION = __BUILD_INFO__.version
export const BUILD_VERSION = __BUILD_INFO__.build
export const BUILD_TIME = __BUILD_INFO__.builtAt
