import { useState } from 'react'
import { motion } from 'framer-motion'
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
      {renderPage()}
    </Sidebar>
  )
}
