import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, MessageSquare, Users, Brain,
  Menu, X, Bot, Network, Atom, Gauge
} from 'lucide-react'

interface SidebarProps {
  children: React.ReactNode
  currentPage: string
  onNavigate: (page: string) => void
}

const navItems = [
  { path: 'dashboard', icon: Home, label: 'Mission Control', hex: '#22D3EE' },
  { path: 'chat', icon: MessageSquare, label: 'Cozy Agentic', hex: '#34D399' },
  { path: 'agents', icon: Network, label: 'Sub Agent', hex: '#8B5CF6' },
  { path: 'memory', icon: Atom, label: 'Memory', hex: '#F59E0B' },
]

// AppIcon: tile gradient squircle ala iOS (clean, tanpa glow luar)
function AppIcon({ icon: Icon, hex, size = 38 }: { icon: typeof Home; hex: string; size?: number }) {
  const isz = Math.round(size * 0.52)
  return (
    <div
      className="relative flex items-center justify-center shrink-0 select-none"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: `linear-gradient(160deg, ${hex}E6, ${hex})`,
        boxShadow: `inset 0 1px 1px rgba(255,255,255,0.35), inset 0 -2px 4px rgba(0,0,0,0.15)`,
      }}
    >
      <div
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{
          height: '46%',
          borderRadius: `${size * 0.28}px ${size * 0.28}px 40% 40% / ${size * 0.28}px ${size * 0.28}px 70% 70%`,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0.02))',
        }}
      />
      <Icon size={isz} className="relative z-10 text-white" strokeWidth={2.4} />
    </div>
  )
}

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

      {/* Sidebar — floating card model */}
      <AnimatePresence>
        {(isOpen || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 25 }}
            className={`fixed left-4 top-4 bottom-4 w-[248px] z-40 flex flex-col ${isOpen ? 'block' : 'hidden lg:block'}`}
            style={{
              background: 'linear-gradient(170deg, rgba(17,26,48,0.97), rgba(8,13,28,0.99))',
              border: '1px solid rgba(96,140,220,0.22)',
              borderRadius: '22px',
              boxShadow: '0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(140,180,255,0.08)'
            }}
          >
            {/* Logo */}
            <div className="px-5 pt-6 pb-2">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3"
              >
                <AppIcon icon={Bot} hex="#22D3EE" size={44} />
                <div>
                  <h1 className="text-lg font-bold text-white font-display leading-tight">Cozy Assistant</h1>
                  <p className="text-[10px] text-sky-300/80 font-mono tracking-wider">AGENT OS v3.0</p>
                </div>
              </motion.div>
            </div>

            {/* Navigation */}
            <nav className="mt-4 px-4 space-y-2">
              {navItems.map((item, index) => {
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
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 relative group ${
                        isActive
                          ? 'bg-white/[0.08]'
                          : 'hover:bg-white/[0.04]'
                      }`}
                      style={isActive ? { border: '1px solid rgba(96,140,220,0.25)' } : { border: '1px solid transparent' }}
                    >
                      <AppIcon icon={item.icon} hex={isActive ? item.hex : '#64748B'} size={36} />
                      <span className={`text-sm font-semibold tracking-wide relative z-10 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                      }`}>
                        {item.label}
                      </span>

                      {isActive && (
                        <span className="ml-auto w-2 h-2 rounded-full shrink-0" style={{ background: item.hex, boxShadow: `0 0 10px ${item.hex}` }} />
                      )}
                    </button>
                  </motion.div>
                )
              })}
            </nav>

            {/* System Status */}
            <div className="mt-auto p-4">
              <div
                className="rounded-2xl p-4"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(96,140,220,0.18)'
                }}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <Gauge size={14} className="text-emerald-400" />
                  <span className="text-emerald-400 text-xs font-mono tracking-wider">System Online</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Agents</span>
                    <span className="text-sky-300 font-mono">9/9 Active</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Uptime</span>
                    <span className="text-sky-300 font-mono">99.9%</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Latency</span>
                    <span className="text-sky-300 font-mono">45ms</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="lg:ml-[264px] min-h-screen p-4 lg:p-8 relative z-10">
        {children}
      </main>
    </div>
  )
}
