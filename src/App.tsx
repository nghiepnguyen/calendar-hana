import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { DomainMove } from './components/DomainMove/DomainMove'
import { TextSizeController } from './components/TextSizeController'
import { ThemeController } from './components/ThemeController'
import { ToastRegionProvider } from './components/Toast/ToastRegion'
import { UpdatePrompt } from './components/UpdatePrompt/UpdatePrompt'
import { Welcome } from './components/Welcome/Welcome'
import { CalendarPage } from './pages/CalendarPage'
import { EventListPage } from './pages/EventList/EventListPage'
import { SettingsPage } from './pages/Settings/SettingsPage'
import { LegalPage } from './pages/Legal/LegalPage'
import { ReminderService } from './reminders/ReminderService'
import { hideSplash } from './splash'

function App() {
  // App chỉ vẽ khi RepositoryProvider đã sẵn sàng (xong đăng nhập, tải dữ liệu) nên gỡ splash ở đây.
  useEffect(hideSplash, [])

  return (
    <ToastRegionProvider>
      <ThemeController />
      <TextSizeController />
      <ReminderService />
      <UpdatePrompt />
      <DomainMove />
      <Welcome />
      <Routes>
        {/* Trang chủ hiện xem Ngày của hôm nay ngay tại "/", không chuyển sang /day/...: giữ
            canonical "/" cho trang chủ, mỗi /day/YYYY-MM-DD là một trang riêng. */}
        <Route path="/" element={<CalendarPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/privacy" element={<LegalPage policy="privacy" />} />
        <Route path="/terms" element={<LegalPage policy="terms" />} />
        <Route path="/events" element={<EventListPage />} />
        <Route path="/:view/:date" element={<CalendarPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastRegionProvider>
  )
}

export default App
