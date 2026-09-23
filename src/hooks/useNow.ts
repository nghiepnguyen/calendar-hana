import { useEffect, useState } from 'react'
import { minutesNowInVietnam, todayInVietnam } from '@shared/time'

/** Ngày hôm nay và số phút hiện tại theo giờ Việt Nam, cập nhật mỗi phút. */
export function useNow(): { today: string; minutes: number } {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const tick = () => setNow(new Date())
    // Canh đúng đầu phút kế tiếp rồi chạy mỗi 60 giây.
    const timeout = setTimeout(
      () => {
        tick()
        interval = setInterval(tick, 60_000)
      },
      60_000 - (Date.now() % 60_000),
    )
    let interval: ReturnType<typeof setInterval> | undefined
    return () => {
      clearTimeout(timeout)
      if (interval) clearInterval(interval)
    }
  }, [])
  return { today: todayInVietnam(now), minutes: minutesNowInVietnam(now) }
}
