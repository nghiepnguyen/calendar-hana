import {
  Compass,
  Export,
  PlusSquare,
  CheckCircle,
  DotsThreeVertical,
  DownloadSimple,
  type Icon,
} from '@phosphor-icons/react'

export interface Step {
  icon: Icon
  title: string
  text: string
}

export const IOS_STEPS: Step[] = [
  {
    icon: Compass,
    title: 'Mở bằng Safari',
    text: 'Mở trang Lịch Việt trong Safari trên iPhone hoặc iPad.',
  },
  {
    icon: Export,
    title: 'Bấm Chia sẻ',
    text: 'Tìm biểu tượng ô vuông có mũi tên hướng lên, ở thanh công cụ hoặc cạnh địa chỉ web.',
  },
  {
    icon: PlusSquare,
    title: 'Thêm vào Màn hình chính',
    text: 'Cuộn danh sách Chia sẻ, chọn “Thêm vào Màn hình chính” (Add to Home Screen).',
  },
  {
    icon: CheckCircle,
    title: 'Xác nhận “Thêm”',
    text: 'Bấm “Thêm” ở góc trên. Sau đó mở Lịch Việt từ biểu tượng mới trên màn hình chính.',
  },
]

export const ANDROID_STEPS: Step[] = [
  {
    icon: Compass,
    title: 'Mở bằng Chrome',
    text: 'Mở trang Lịch Việt trong Chrome trên điện thoại.',
  },
  {
    icon: DotsThreeVertical,
    title: 'Mở menu ⋮',
    text: 'Bấm nút ba chấm ở góc trên bên phải trình duyệt.',
  },
  {
    icon: DownloadSimple,
    title: 'Chọn cài ứng dụng',
    text: 'Chọn “Cài đặt ứng dụng” (Install app) hoặc “Thêm vào màn hình chính”.',
  },
  {
    icon: CheckCircle,
    title: 'Xác nhận “Cài đặt”',
    text: 'Bấm “Cài đặt” hoặc “Thêm”. Mở Lịch Việt từ biểu tượng mới trên thiết bị.',
  },
]

export const DESKTOP_STEPS: Step[] = [
  {
    icon: Compass,
    title: 'Mở Chrome hoặc Edge',
    text: 'Mở trang Lịch Việt trong một trong hai trình duyệt này.',
  },
  {
    icon: DownloadSimple,
    title: 'Tìm nút cài app',
    text: 'Bấm biểu tượng cài đặt ở phía bên phải thanh địa chỉ. Nếu không thấy, tìm “Cài đặt ứng dụng” trong menu trình duyệt.',
  },
  {
    icon: CheckCircle,
    title: 'Xác nhận “Cài đặt”',
    text: 'App sẽ mở trong cửa sổ riêng. Lần sau, mở Lịch Việt từ danh sách ứng dụng của máy tính.',
  },
]
