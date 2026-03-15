import { Routes, Route } from 'react-router'
import { Toaster } from 'sonner'
import { MainLayout } from './components/layout/MainLayout'
import { HomePage } from './pages/HomePage'
import { SessionPage } from './pages/SessionPage'
import { SettingsPage } from './pages/SettingsPage'

function App() {
  return (
    <>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/session/:id" element={<SessionPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/models" element={<HomePage />} />
          <Route path="/channels" element={<HomePage />} />
          <Route path="/tools" element={<HomePage />} />
          <Route path="/schedule" element={<HomePage />} />
        </Route>
      </Routes>
      
      {/* Global toast notifications */}
      <Toaster
        position="bottom-right"
        richColors
        closeButton
      />
    </>
  )
}

export default App
