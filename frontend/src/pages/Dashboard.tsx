import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cpu, Activity, Clock, TrendingUp, ArrowUpRight, ArrowDownRight,
  Zap, Radio, Bot, Users, CalendarClock, ListTodo, Orbit,
  Sparkles, PlayCircle, CheckCircle2, CircleDot, Terminal, Globe
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

// ── Data ──────────────────────────────────────────────
const agentSystemData = [
  { name: 'NOVA', tasks: 342, status: 'working', efficiency: 94 },
  { name: 'CIPHER', tasks: 567, status: 'working', efficiency: 98 },
  { name: 'ATLAS', tasks: 891, status: 'working', efficiency: 96 },
  { name: 'PIXEL', tasks: 234, status: 'idle', efficiency: 88 },
  { name: 'ORACLE', tasks: 156, status: 'working', efficiency: 92 },
  { name: 'SENTINEL', tasks: 1203, status: 'working', efficiency: 99 },
  { name: 'AURORA', tasks: 445, status: 'idle', efficiency: 85 },
  { name: 'PHOENIX', tasks: 678, status: 'working', efficiency: 95 },
  { name: 'ZEPHRA', tasks: 287, status: 'working', efficiency: 91 },
]

const taskFlowData = [
  { time: '00:00', tasks: 12 }, { time: '04:00', tasks: 8 },
  { time: '08:00', tasks: 45 }, { time: '10:00', tasks: 62 },
  { time: '12:00', tasks: 78 }, { time: '14:00', tasks: 71 },
  { time: '16:00', tasks: 65 }, { time: '18:00', tasks: 52 },
  { time: '20:00', tasks: 34 }, { time: '22:00', tasks: 21 },
]

const resourceDistribution = [
  { name: 'Compute', value: 45, color: '#00D4FF' },
  { name: 'Memory', value: 28, color: '#8B5CF6' },
  { name: 'Network', value: 15, color: '#10B981' },
  { name: 'Storage', value: 12, color: '#F59E0B' },
]

const liveTasks = [
  { id: 1, agent: 'ZEPHRA', task: 'Sync stock farid-shop-enterprise', status: 'running', progress: 72, priority: 'high' },
  { id: 2, agent: 'ATLAS', task: 'Generate monthly finance report', status: 'running', progress: 45, priority: 'medium' },
  { id: 3, agent: 'SENTINEL', task: 'Security scan gateway logs', status: 'queued', progress: 0, priority: 'high' },
  { id: 4, agent: 'NOVA', task: 'Research market trends FF accounts', status: 'running', progress: 88, priority: 'low' },
  { id: 5, agent: 'PHOENIX', task: 'Auto-reply Telegram messages', status: 'done', progress: 100, priority: 'medium' },
]

const cronJobs = [
  { id: 1, name: 'Daily Finance Summary', schedule: '0 9 * * *', next: '09:00', status: 'active', agent: 'ATLAS' },
  { id: 2, name: 'Stock Sync ZEPHRA', schedule: '*/30m', next: '14 min', status: 'active', agent: 'ZEPHRA' },
  { id: 3, name: 'Security Watchdog', schedule: 'every 2h', next: '1h 12m', status: 'active', agent: 'SENTINEL' },
  { id: 4, name: 'Memory Curator', schedule: '0 3 * * *', next: '03:00', status: 'paused', agent: 'COZY' },
]

// ── Tooltip style ─────────────────────────────────────
const darkTooltip = {
  contentStyle: {
    backgroundColor: 'rgba(10, 15, 30, 0.95)',
    border: '1px solid rgba(0, 212, 255, 0.3)',
    borderRadius: '12px',
    color: '#fff',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 0 20px rgba(0, 212, 255, 0.15)'
  },
  labelStyle: { color: '#94A3B8' }
}

// ── Count Up Hook ─────────────────────────────────────
function useCountUp(target: number, duration = 1400, delay = 0) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let raf = 0
    let start: number | null = null
    const timer = setTimeout(() => {
      const step = (ts: number) => {
        if (start === null) start = ts
        const p = Math.min((ts - start) / duration, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        setVal(Math.round(target * eased))
        if (p < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }, delay)
    return () => { clearTimeout(timer); cancelAnimationFrame(raf) }
  }, [target, duration, delay])
  return val
}

// ── Stat Card (sparkline style) ───────────────────────
interface StatItem {
  icon: typeof Users
  label: string
  value: number
  format: (n: number) => string
  trend: string
  up: boolean
  hex: string
  glow: string
  spark: number[]
}

function StatCard({ stat, idx }: { stat: StatItem; idx: number }) {
  const delay = 150 + idx * 130
  const n = useCountUp(stat.value, 1400, delay)
  const sparkData = stat.spark.map((v, i) => ({ i, v }))
  return (
    <motion.div
      initial={{ opacity: 0, y: 48, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: idx * 0.13, type: 'spring', stiffness: 130, damping: 15 }}
      whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.2 } }}
      className="relative p-5 rounded-2xl overflow-hidden group cursor-default"
      style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.85), rgba(10,15,30,0.9))',
        border: '1px solid rgba(148,163,184,0.12)',
        boxShadow: `0 0 24px ${stat.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`
      }}
    >
      {/* corner glow blob */}
      <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: stat.hex }} />
      {/* scan line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      {/* header: icon tile + label */}
      <div className="flex items-center gap-3 mb-4 relative z-10">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.25 + idx * 0.13, type: 'spring', stiffness: 200, damping: 12 }}
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${stat.hex}22`, border: `1px solid ${stat.hex}55`, boxShadow: `0 0 14px ${stat.hex}33` }}
        >
          <stat.icon size={16} style={{ color: stat.hex }} />
        </motion.div>
        <span className="text-sm font-semibold text-slate-300 tracking-wide">{stat.label}</span>
      </div>

      {/* big value */}
      <p className="text-3xl font-black text-white font-mono leading-none relative z-10">
        {stat.format(n)}
      </p>

      {/* trend row */}
      <div className="flex items-center gap-2 mt-2 mb-3 relative z-10">
        <span className={`text-xs font-bold flex items-center gap-0.5 ${stat.up ? 'text-emerald-400' : 'text-red-400'}`}>
          {stat.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{stat.trend}
        </span>
        <span className="text-xs text-slate-500">vs last week</span>
      </div>

      {/* sparkline with glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 + idx * 0.13, duration: 0.6 }}
        className="relative z-10 -mx-1"
        style={{ filter: `drop-shadow(0 0 6px ${stat.hex}55)` }}
      >
        <ResponsiveContainer width="100%" height={46}>
          <AreaChart data={sparkData} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
            <defs>
              <linearGradient id={`sparkGrad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stat.hex} stopOpacity={0.45} />
                <stop offset="100%" stopColor={stat.hex} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={stat.hex}
              strokeWidth={2}
              fill={`url(#sparkGrad-${idx})`}
              isAnimationActive={true}
              animationDuration={1200}
              animationBegin={500 + idx * 130}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </motion.div>
  )
}

// ── Income Tracker (Jan–Dec + Year Picker) ────────────
interface MonthlyRow {
  month: string
  month_name: string
  income: number
  expense: number
  net_profit: number
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const YEARS = [2025, 2026, 2027, 2028, 2029, 2030]

function IncomeTracker() {
  const [year, setYear] = useState(2026)
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<MonthlyRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    fetch('/api/finance/monthly-summary')
      .then(r => r.json())
      .then((data: MonthlyRow[]) => { if (alive) setRows(Array.isArray(data) ? data : []) })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  // Map API data -> 12 bulan
  const chartData = MONTHS.map((m, i) => {
    const key = `${year}-${String(i + 1).padStart(2, '0')}`
    const found = rows.find(r => r.month === key)
    return {
      name: m,
      income: found ? found.income / 1_000_000 : 0,
      expense: found ? found.expense / 1_000_000 : 0,
      hasData: !!found,
    }
  })

  const totalIncome = chartData.reduce((a, b) => a + b.income, 0)
  const totalExpense = chartData.reduce((a, b) => a + b.expense, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 48, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.4, type: 'spring', stiffness: 120, damping: 16 }}
      className="p-6 rounded-2xl relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.85), rgba(10,15,30,0.9))',
        border: '1px solid rgba(148,163,184,0.12)',
        boxShadow: '0 0 24px rgba(139,92,246,0.08)'
      }}
    >
      {/* corner glow */}
      <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl opacity-15 pointer-events-none bg-purple-500" />
      {/* scan line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <TrendingUp size={20} className="text-emerald-400" />
          Income Tracker
        </h2>

        {/* Year picker dengan ikon kalender */}
        <div className="relative">
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 hover:border-purple-400/40 transition-colors"
          >
            <CalendarClock size={14} className="text-purple-400" />
            <span className="text-sm text-white font-mono font-bold">{year}</span>
            <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-slate-500 text-xs">▼</motion.span>
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 top-full mt-2 z-50 p-2 grid grid-cols-3 gap-1.5 rounded-xl min-w-[180px]"
                style={{
                  background: 'rgba(10, 15, 30, 0.97)',
                  border: '1px solid rgba(139,92,246,0.35)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.5), 0 0 20px rgba(139,92,246,0.15)'
                }}
              >
                {YEARS.map(y => (
                  <button
                    key={y}
                    onClick={() => { setYear(y); setOpen(false) }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-mono transition-all ${
                      y === year
                        ? 'bg-purple-500/25 text-purple-300 border border-purple-400/40 shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                        : y > new Date().getFullYear()
                          ? 'text-slate-600 border border-transparent hover:bg-white/5'
                          : 'text-slate-300 border border-transparent hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex items-center gap-4 mb-4 relative z-10">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]" />
          <span className="text-xs text-slate-400">Income</span>
          <span className="text-xs font-bold text-cyan-300 font-mono">{totalIncome.toFixed(1)}jt</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.7)]" />
          <span className="text-xs text-slate-400">Expense</span>
          <span className="text-xs font-bold text-rose-300 font-mono">{totalExpense.toFixed(1)}jt</span>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="flex items-center justify-center h-[230px] text-slate-500 text-sm font-mono">
          <Sparkles size={18} className="animate-pulse mr-2 text-purple-400" /> Memuat data...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={chartData} barGap={2}>
            <defs>
              <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22D3EE" stopOpacity={1} />
                <stop offset="100%" stopColor="#22D3EE" stopOpacity={0.35} />
              </linearGradient>
              <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FB7185" stopOpacity={1} />
                <stop offset="100%" stopColor="#FB7185" stopOpacity={0.35} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
            <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} />
            <YAxis stroke="#475569" fontSize={10} tickLine={false} unit="jt" width={38} />
            <Tooltip
              {...darkTooltip}
              formatter={(value: number | string, nameKey: string) => [
                `Rp ${(Number(value) * 1_000_000).toLocaleString('id-ID')}`,
                nameKey === 'income' ? 'Income' : 'Expense'
              ]}
            />
            <Bar dataKey="income" fill="url(#incGrad)" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={900} animationBegin={600} />
            <Bar dataKey="expense" fill="url(#expGrad)" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={900} animationBegin={750} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  )
}

// ── Agent Performance (stat-card style + fancy chart) ─
function AgentPerformanceCard() {
  const totalTasks = agentSystemData.reduce((a, b) => a + b.tasks, 0)
  const activeAgents = agentSystemData.filter(a => a.status === 'working').length
  const n = useCountUp(totalTasks, 1400, 500)

  return (
    <motion.div
      initial={{ opacity: 0, y: 48, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.45, type: 'spring', stiffness: 120, damping: 16 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="p-6 rounded-2xl relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.85), rgba(10,15,30,0.9))',
        border: '1px solid rgba(148,163,184,0.12)',
        boxShadow: '0 0 24px rgba(16,185,129,0.1), inset 0 1px 0 rgba(255,255,255,0.06)'
      }}
    >
      {/* corner glow */}
      <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl opacity-20 pointer-events-none bg-emerald-500" />
      {/* scan line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      {/* Header — icon tile + label (Active Crons style) */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.55, type: 'spring', stiffness: 200, damping: 12 }}
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.13)', border: '1px solid rgba(16,185,129,0.55)', boxShadow: '0 0 14px rgba(16,185,129,0.2)' }}
          >
            <Bot size={16} className="text-emerald-400" />
          </motion.div>
          <span className="text-base font-semibold text-white tracking-wide">Agent Performance</span>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 font-mono">
          {activeAgents}/{agentSystemData.length} active
        </span>
      </div>

      {/* Big number + trend */}
      <div className="flex items-end gap-3 mb-4 relative z-10">
        <p className="text-3xl font-black text-white font-mono leading-none">{n.toLocaleString('en-US')}</p>
        <div className="flex items-center gap-1.5 pb-0.5">
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5">
            <ArrowUpRight size={12} />+12%
          </span>
          <span className="text-xs text-slate-500">vs last week</span>
        </div>
      </div>

      {/* Fancy bar chart */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="relative z-10 -mx-2"
        style={{ filter: 'drop-shadow(0 0 10px rgba(34,211,238,0.18))' }}
      >
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={agentSystemData} barCategoryGap="28%">
            <defs>
              <linearGradient id="barActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#67E8F9" stopOpacity={1} />
                <stop offset="55%" stopColor="#22D3EE" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#0E7490" stopOpacity={0.55} />
              </linearGradient>
              <linearGradient id="barIdle" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#64748B" stopOpacity={0.75} />
                <stop offset="100%" stopColor="#334155" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 6" stroke="rgba(148,163,184,0.07)" vertical={false} />
            <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dy={6} />
            <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} width={34} />
            <Tooltip
              cursor={{ fill: 'rgba(34,211,238,0.06)' }}
              contentStyle={{
                backgroundColor: 'rgba(10, 15, 30, 0.95)',
                border: '1px solid rgba(34,211,238,0.3)',
                borderRadius: '12px',
                color: '#fff',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 0 20px rgba(34,211,238,0.15)'
              }}
              labelStyle={{ color: '#E2E8F0', fontWeight: 'bold' }}
              formatter={(value: number | string, nameKey: string, entry: { payload?: { status?: string; efficiency?: number } }) => [
                `${Number(value).toLocaleString()} tasks • ${entry?.payload?.efficiency ?? 0}% eff • ${entry?.payload?.status === 'working' ? '🟢 working' : '⚪ idle'}`,
                ''
              ]}
            />
            <Bar
              dataKey="tasks"
              radius={[7, 7, 2, 2]}
              isAnimationActive
              animationDuration={1100}
              animationBegin={700}
              animationEasing="ease-out"
            >
              {agentSystemData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.status === 'working' ? 'url(#barActive)' : 'url(#barIdle)'}
                  stroke={entry.status === 'working' ? 'rgba(103,232,249,0.5)' : 'rgba(100,116,139,0.3)'}
                  strokeWidth={1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </motion.div>
  )
}

export default function Dashboard() {
  const [pulseActive, setPulseActive] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => setPulseActive(prev => !prev), 1000)
    return () => clearInterval(interval)
  }, [])

  const totalTasks = agentSystemData.reduce((a, b) => a + b.tasks, 0)
  const activeAgents = agentSystemData.filter(a => a.status === 'working').length
  const avgEfficiency = Math.round(agentSystemData.reduce((a, b) => a + b.efficiency, 0) / agentSystemData.length)
  const activeCrons = cronJobs.filter(c => c.status === 'active').length

  return (
    <div className="space-y-6">
      {/* ═══ Animated Background ═══ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-0 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-blue-500/6 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(rgba(0,212,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.5) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* ═══ Header ═══ */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black mb-1 font-display">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-sky-300 to-violet-300 drop-shadow-[0_0_22px_rgba(56,189,248,0.65)]">
              Mission Control
            </span>
            <Orbit className="inline-block text-cyan-200 ml-3 animate-spin-slow" size={30} />
          </h1>
          <p className="text-slate-400 text-sm font-mono tracking-wide">Selamat datang kembali, Bos Farid • Neural Link Active</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-slate-500 text-xs tracking-widest">Neural Sync</p>
          <div className="flex items-center gap-2 justify-end">
            <span className={`w-2 h-2 rounded-full ${pulseActive ? 'bg-green-400 shadow-green-400/50' : 'bg-green-600'} shadow-lg animate-pulse`} />
            <p className="text-white font-semibold font-mono">{new Date().toLocaleTimeString('id-ID')}</p>
          </div>
        </div>
      </motion.div>

      {/* ═══ Stat Cards — Sparkline Style ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Agents Online', value: activeAgents, format: (n: number) => `${n}`, trend: '+12%', up: true, hex: '#22D3EE', glow: 'rgba(34,211,238,0.25)', spark: [4, 6, 5, 7, 6, 8, 7, 7] },
          { icon: ListTodo, label: 'Total Tasks', value: totalTasks, format: (n: number) => n.toLocaleString('en-US'), trend: '+8.2%', up: true, hex: '#A78BFA', glow: 'rgba(139,92,246,0.25)', spark: [3200, 3600, 3400, 4100, 3900, 4400, 4600, totalTasks] },
          { icon: CalendarClock, label: 'Active Crons', value: activeCrons, format: (n: number) => `${n}`, trend: '+2', up: true, hex: '#34D399', glow: 'rgba(16,185,129,0.25)', spark: [1, 2, 2, 3, 2, 3, 3, activeCrons] },
          { icon: Activity, label: 'Efficiency', value: avgEfficiency, format: (n: number) => `${n}%`, trend: '+0.02%', up: true, hex: '#FBBF24', glow: 'rgba(245,158,11,0.25)', spark: [88, 89, 91, 90, 92, 91, 92, avgEfficiency] },
        ].map((stat, idx) => (
          <StatCard key={idx} stat={stat as StatItem} idx={idx} />
        ))}
      </div>

      {/* ═══ Charts Row: Task Flow + Income Tracker ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Task Flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="p-6 rounded-2xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(15,23,42,0.85), rgba(10,15,30,0.9))',
            border: '1px solid rgba(148,163,184,0.12)',
            boxShadow: '0 0 24px rgba(0,212,255,0.08)'
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Radio size={20} className="text-cyan-400" />
              Task Flow Monitor
            </h2>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/20">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs text-cyan-400 font-mono">LIVE</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={taskFlowData}>
              <defs>
                <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} />
              <YAxis stroke="#475569" fontSize={11} tickLine={false} />
              <Tooltip {...darkTooltip} />
              <Area type="monotone" dataKey="tasks" stroke="#00D4FF" strokeWidth={2} fillOpacity={1} fill="url(#colorTasks)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* 2. Income Tracker (Jan–Dec, year picker) */}
        <IncomeTracker />
      </div>

      {/* ═══ Row 2: Agent Perf + Cron Jobs ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Performance — stat-card style */}
        <AgentPerformanceCard />

        {/* Cron Jobs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="p-6 rounded-2xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(15,23,42,0.85), rgba(10,15,30,0.9))',
            border: '1px solid rgba(148,163,184,0.12)',
            boxShadow: '0 0 24px rgba(245,158,11,0.08)'
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CalendarClock size={20} className="text-amber-400" />
              Cozy Cron
            </h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 font-mono">
              {activeCrons}/{cronJobs.length} active
            </span>
          </div>
          <div className="space-y-2.5">
            {cronJobs.map((job, idx) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 + idx * 0.06 }}
                className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-cyan-400/20 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${job.status === 'active' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)] animate-pulse' : 'bg-slate-600'}`} />
                  <div>
                    <p className="font-semibold text-white text-sm">{job.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{job.schedule} → {job.agent}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-cyan-400 font-mono">next {job.next}</p>
                  <PlayCircle size={14} className="ml-auto text-slate-600 group-hover:text-cyan-400 cursor-pointer transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ═══ Live Tasks Table (Stakely-style) ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
        className="rounded-2xl overflow-hidden relative"
        style={{
          background: 'linear-gradient(135deg, rgba(15,23,42,0.85), rgba(10,15,30,0.9))',
          border: '1px solid rgba(148,163,184,0.12)',
          boxShadow: '0 0 24px rgba(0,212,255,0.06)'
        }}
      >
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Terminal size={20} className="text-cyan-400" />
            Live Task Queue
          </h2>
          <div className="flex items-center gap-3">
            {['All', 'Running', 'Queued', 'Done'].map((tab, i) => (
              <button key={tab}
                className={`text-xs px-3 py-1.5 rounded-full transition-all ${i === 0
                  ? 'bg-purple-500/20 border border-purple-400/40 text-purple-300'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
                  }`}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="border-y border-white/5">
              {['Task', 'Agent', 'Priority', 'Progress', 'Status'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {liveTasks.map((task, idx) => (
              <motion.tr
                key={task.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 + idx * 0.05 }}
                className="border-b border-white/[0.03] hover:bg-cyan-500/[0.03] transition-colors"
              >
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-200">{task.task}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 font-mono">
                    <CircleDot size={12} />{task.agent}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${task.priority === 'high'
                    ? 'bg-red-500/10 text-red-400 border border-red-400/20'
                    : task.priority === 'medium'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-400/20'
                      : 'bg-slate-500/10 text-slate-400 border border-slate-400/20'
                    }`}>
                    {task.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${task.progress}%` }}
                        transition={{ duration: 1, delay: 0.7 + idx * 0.05 }}
                        className="h-full rounded-full"
                        style={{
                          background: task.status === 'done' ? '#10B981' : 'linear-gradient(90deg,#00D4FF,#8B5CF6)'
                        }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 font-mono">{task.progress}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${task.status === 'running'
                    ? 'text-cyan-400'
                    : task.status === 'done'
                      ? 'text-emerald-400'
                      : 'text-slate-400'
                    }`}>
                    {task.status === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
                    {task.status === 'done' && <CheckCircle2 size={12} />}
                    {task.status}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  )
}
