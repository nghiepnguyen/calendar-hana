import { Navigate, Route, Routes } from 'react-router-dom'
import { todayInVietnam } from '@shared/time'
import { calendarPath } from './hooks/useCalendarRoute'
import { CalendarPage } from './pages/CalendarPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={calendarPath('day', todayInVietnam())} replace />} />
      <Route path="/:view/:date" element={<CalendarPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
