import { createContext, useContext, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import styles from './Toast.module.css'

// undefined: không có vùng (render tại chỗ, vd. test component lẻ); null: vùng chưa gắn xong.
const RegionContext = createContext<HTMLElement | null | undefined>(undefined)

/**
 * Vùng chung ở đáy màn hình cho mọi thông báo nổi (toast, cập nhật app). Các thông báo
 * xếp thành cột trong vùng này thay vì mỗi cái tự neo cố định rồi đè lên nhau.
 */
export function ToastRegionProvider({ children }: { children: ReactNode }) {
  const [region, setRegion] = useState<HTMLElement | null>(null)
  return (
    <RegionContext.Provider value={region}>
      {children}
      <div data-toast-region ref={setRegion} className={styles.region} />
    </RegionContext.Provider>
  )
}

/** Đưa thông báo vào vùng chung. */
export function InToastRegion({ children }: { children: ReactNode }) {
  const region = useContext(RegionContext)
  if (region === undefined) return <>{children}</>
  return region ? createPortal(children, region) : null
}
