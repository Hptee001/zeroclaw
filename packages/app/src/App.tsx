import { Routes, Route } from 'react-router'
import { Toaster } from 'sonner'
import { MainLayout } from './components/layout/MainLayout'
import { Chat } from './pages/Chat'
import { Agents } from './pages/Agents'
import { Channels } from './pages/Channels'
import { Models } from './pages/Models'
import { Skills } from './pages/Skills'
import { Cron } from './pages/Cron'
import { Settings } from './pages/Settings'
import { Setup } from './pages/Setup'

function App() {
  return (
    <>
      <Routes>
        <Route path="/setup" element={<Setup />} />
        
        <Route element={<MainLayout />}>
          <Route path="/" element={<Chat />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/channels" element={<Channels />} />
          <Route path="/models" element={<Models />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/cron" element={<Cron />} />
          <Route path="/settings" element={<Settings />} />
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
