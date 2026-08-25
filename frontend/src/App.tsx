import { useState, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import Agents from './pages/Agents'
import Memory from './pages/Memory'
import Sidebar from './components/Sidebar'

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />
      case 'chat': return <Chat />
      case 'agents': return <Agents />
      case 'memory': return <Memory />
      default: return <Dashboard />
    }
  }

  return (
    <Sidebar currentPage={currentPage} onNavigate={setCurrentPage}>
      {/* mode="popLayout" + sync: halaman lama langsung diganti — tidak ada jeda kosong
          (penyebab blank sebelumnya: mode="wait" menunggu exit selesai, dan filter:blur
          membuat konten terlihat hilang saat transisi) */}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <Suspense fallback={null}>
            {renderPage()}
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </Sidebar>
  )
}
