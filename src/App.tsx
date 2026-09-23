import { Navigate, Route, Routes } from 'react-router-dom'
import { todayInVietnam } from '@shared/time'
import { DomainMove } from './components/DomainMove/DomainMove'
import { ThemeController } from './components/ThemeController'
import { UpdatePrompt } from './components/UpdatePrompt/UpdatePrompt'
import { calendarPath } from './hooks/useCalendarRoute'
import { CalendarPage } from './pages/CalendarPage'
import { EventListPage } from './pages/EventList/EventListPage'
import { SettingsPage } from './pages/Settings/SettingsPage'
import { ReminderService } from './reminders/ReminderService'

function App() {
  return (
    <>
      <ThemeController />
      <ReminderService />
      <UpdatePrompt />
      <DomainMove />
      <Routes>
        <Route path="/" element={<Navigate to={calendarPath('day', todayInVietnam())} replace />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/events" element={<EventListPage />} />
        <Route path="/:view/:date" element={<CalendarPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
