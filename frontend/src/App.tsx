import { useState } from 'react'
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
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 28, scale: 0.985, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -20, scale: 0.985, filter: 'blur(6px)' }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          {renderPage()}
        </motion.div>
      </AnimatePresence>
    </Sidebar>
  )
}
