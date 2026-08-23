import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, MessageSquare, Users, Brain,
  Menu, X, Bot, Cpu, Network, Atom,
  TrendingUp, Clock, Zap, Activity, Sparkles
} from 'lucide-react'

interface SidebarProps {
  children: React.ReactNode
  currentPage: string
  onNavigate: (page: string) => void
}

const navItems = [
  { path: 'dashboard', icon: Home, label: 'Mission Control' },
  { path: 'chat', icon: MessageSquare, label: 'Cozy Agentic' },
  { path: 'agents', icon: Network, label: 'Sub Agent' },
  { path: 'memory', icon: Atom, label: 'Memory' },
]

export default function Sidebar({ children, currentPage, onNavigate }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-black relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(0, 212, 255, 0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(0, 212, 255, 0.3) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>
      
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-cyan-500/20 backdrop-blur-xl border border-cyan-400/30 rounded-xl"
      >
        {isOpen ? <X size={20} className="text-cyan-400" /> : <Menu size={20} className="text-cyan-400" />}
      </button>
      
      {/* Sidebar - Cyberpunk Navy */}
      <AnimatePresence>
        {(isOpen || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 25 }}
            className={`fixed left-0 top-0 h-full w-72 bg-slate-900/95 backdrop-blur-xl border-r border-cyan-500/20 z-40 flex flex-col ${isOpen ? 'block' : 'hidden lg:block'}`}
          >
            {/* Logo */}
            <div className="p-6">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20" />
                  <Bot size={24} className="text-white relative z-10" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white font-display">Cozy Assistant</h1>
                  <p className="text-xs text-cyan-400 font-mono tracking-wider">MISSION CONTROL</p>
                </div>
              </motion.div>
            </div>
            
            {/* Navigation */}
            <nav className="mt-4 px-4 space-y-2">
              {navItems.map((item, index) => {
                const Icon = item.icon
                const isActive = currentPage === item.path
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <button
                      onClick={() => {
                        onNavigate(item.path)
                        setIsOpen(false)
                      }}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 relative overflow-hidden group ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                          : 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10'
                      }`}
                    >
                      {/* Glow effect on hover */}
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-transparent" />
                      )}
                      
                      <Icon 
                        size={20} 
                        className={`relative z-10 ${isActive ? 'text-white' : 'group-hover:scale-110 transition-transform'}`} 
                      />
                      <span className="font-medium relative z-10">{item.label}</span>
                      
                      {isActive && (
                        <div className="ml-auto flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-lg animate-pulse" />
                          <Sparkles size={14} className="text-yellow-400" />
                        </div>
                      )}
                    </button>
                  </motion.div>
                )
              })}
            </nav>
            
            {/* System Status */}
            <div className="mt-auto p-4">
              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-2xl p-4 border border-cyan-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 shadow-lg shadow-green-400/50 animate-pulse" />
                  <span className="text-cyan-400 text-xs font-mono uppercase tracking-wider">System Online</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Agents</span>
                    <span className="text-cyan-400">9/9 Active</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Uptime</span>
                    <span className="text-cyan-400">99.9%</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Latency</span>
                    <span className="text-cyan-400">45ms</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      
      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen p-4 lg:p-8 relative z-10">
        {children}
      </main>
    </div>
  )
}
