// Kiểm tra IndexedDB có mở được không. Trên iOS (PWA cài ra màn hình chính), indexedDB.open()
// có lúc treo mãi ở trạng thái pending, không báo lỗi lẫn onblocked
// (https://bugs.webkit.org/show_bug.cgi?id=226547). Khi đó cache offline của Firestore làm mọi
// truy vấn đứng yên, nên phải biết trước để chuyển sang cache trong bộ nhớ.

export type IndexedDbProbeResult = 'ok' | 'timeout' | 'error' | 'unavailable'

/** Database riêng chỉ để thử mở, không đụng tới database của Firestore hay Dexie. */
const PROBE_DB = 'calendar-hana-idb-probe'
export const PROBE_TIMEOUT_MS = 3000

export function probeIndexedDb(timeoutMs = PROBE_TIMEOUT_MS): Promise<IndexedDbProbeResult> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve('unavailable')
      return
    }
    let settled = false
    const finish = (result: IndexedDbProbeResult) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(result)
    }
    const timer = setTimeout(() => finish('timeout'), timeoutMs)
    try {
      const request = indexedDB.open(PROBE_DB)
      request.onsuccess = () => {
        // Mở được muộn (sau khi đã hết giờ) vẫn phải đóng để không giữ kết nối.
        request.result.close()
        finish('ok')
      }
      request.onerror = () => finish('error')
    } catch {
      finish('error')
    }
  })
}
