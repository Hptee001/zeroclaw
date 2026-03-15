import { Routes, Route } from 'react-router'
import { Toaster } from 'sonner'
import { MainLayout } from './components/layout/MainLayout'
import { HomePage } from './pages/HomePage'
import { SessionPage } from './pages/SessionPage'
import { SettingsPage } from './pages/SettingsPage'
import { Chat } from './pages/Chat'
import { Agents } from './pages/Agents'
import { Channels } from './pages/Channels'
import { Models } from './pages/Models'

function App() {
  return (
    <>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Chat />} />
          <Route path="/session/:id" element={<SessionPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/models" element={<Models />} />
          <Route path="/channels" element={<Channels />} />
          <Route path="/agents" element={<Agents />} />
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
