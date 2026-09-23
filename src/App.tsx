import { Navigate, Route, Routes } from 'react-router-dom'
import { todayInVietnam } from '@shared/time'
import { ThemeController } from './components/ThemeController'
import { calendarPath } from './hooks/useCalendarRoute'
import { CalendarPage } from './pages/CalendarPage'
import { SettingsPage } from './pages/Settings/SettingsPage'
import { ReminderService } from './reminders/ReminderService'

function App() {
  return (
    <>
      <ThemeController />
      <ReminderService />
      <Routes>
        <Route path="/" element={<Navigate to={calendarPath('day', todayInVietnam())} replace />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/:view/:date" element={<CalendarPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
