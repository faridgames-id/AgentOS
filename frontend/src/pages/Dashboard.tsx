import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cpu, Activity, Clock, TrendingUp, ArrowUpRight, ArrowDownRight,
  Zap, Radio, Bot, Users, CalendarClock, ListTodo, Orbit,
  Sparkles, PlayCircle, CheckCircle2, CircleDot, Terminal, Globe,
  Gamepad2, Package, ShoppingCart
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
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 12 }}
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(139,92,246,0.13)', border: '1px solid rgba(139,92,246,0.55)', boxShadow: '0 0 14px rgba(139,92,246,0.2)' }}
          >
            <TrendingUp size={16} className="text-purple-400" />
          </motion.div>
          <span className="text-base font-semibold text-white tracking-wide">Income Tracker</span>
        </div>

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

// ── Task Flow (stat-card style + revenue-style chart) ─
function TaskFlowCard() {
  const totalToday = taskFlowData.reduce((a, b) => a + b.tasks, 0)
  const peak = Math.max(...taskFlowData.map(d => d.tasks))
  const n = useCountUp(totalToday, 1400, 450)

  return (
    <motion.div
      initial={{ opacity: 0, y: 48, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.35, type: 'spring', stiffness: 120, damping: 16 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="p-6 rounded-2xl relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.85), rgba(10,15,30,0.9))',
        border: '1px solid rgba(148,163,184,0.12)',
        boxShadow: '0 0 24px rgba(0,212,255,0.1), inset 0 1px 0 rgba(255,255,255,0.06)'
      }}
    >
      {/* corner glow */}
      <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl opacity-20 pointer-events-none bg-cyan-500" />
      {/* scan line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      {/* Header — icon tile + label + LIVE badge */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.45, type: 'spring', stiffness: 200, damping: 12 }}
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(34,211,238,0.13)', border: '1px solid rgba(34,211,238,0.55)', boxShadow: '0 0 14px rgba(34,211,238,0.2)' }}
          >
            <Radio size={16} className="text-cyan-400" />
          </motion.div>
          <span className="text-base font-semibold text-white tracking-wide">Task Flow Monitor</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/20">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs text-cyan-400 font-mono">LIVE</span>
        </div>
      </div>

      {/* Big number + trend */}
      <div className="flex items-end gap-3 mb-3 relative z-10">
        <p className="text-3xl font-black text-white font-mono leading-none">{n.toLocaleString('en-US')}</p>
        <span className="text-xs text-slate-500 pb-0.5">tasks today</span>
        <div className="flex items-center gap-1.5 pb-0.5 ml-auto">
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5">
            <ArrowUpRight size={12} />+18%
          </span>
          <span className="text-xs text-slate-500">vs yesterday</span>
        </div>
      </div>

      {/* Revenue-style area chart */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="relative z-10 -mx-2"
        style={{ filter: 'drop-shadow(0 0 12px rgba(34,211,238,0.22))' }}
      >
        <ResponsiveContainer width="100%" height={215}>
          <AreaChart data={taskFlowData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.55} />
                <stop offset="55%" stopColor="#22D3EE" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 6" stroke="rgba(148,163,184,0.07)" vertical={false} />
            <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dy={6} />
            <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} width={32} />
            <Tooltip
              cursor={{ stroke: 'rgba(34,211,238,0.35)', strokeWidth: 1, strokeDasharray: '4 4' }}
              contentStyle={{
                backgroundColor: 'rgba(10, 15, 30, 0.95)',
                border: '1px solid rgba(34,211,238,0.3)',
                borderRadius: '12px',
                color: '#fff',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 0 20px rgba(34,211,238,0.15)'
              }}
              labelStyle={{ color: '#E2E8F0', fontWeight: 'bold' }}
              formatter={(value: number | string) => [`${value} tasks`, '']}
            />
            <Area
              type="monotone"
              dataKey="tasks"
              stroke="#38BDF8"
              strokeWidth={2.5}
              fill="url(#flowGrad)"
              dot={{ r: 3, fill: '#38BDF8', stroke: '#0B1120', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#7DD3FC', stroke: '#0B1120', strokeWidth: 2 }}
              isAnimationActive
              animationDuration={1300}
              animationBegin={550}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Footer stats */}
      <div className="flex items-center gap-5 mt-3 px-1 relative z-10">
        <span className="text-xs text-slate-500">Peak <span className="text-cyan-300 font-bold font-mono">{peak}</span></span>
        <span className="text-xs text-slate-500">Window <span className="text-slate-300 font-mono">24h</span></span>
      </div>
    </motion.div>
  )
}

// ── Cozy Cron (REAL data dari Hermes runtime) ─────────
interface CronJobReal {
  id: string
  name: string
  schedule: string
  agent: string
  status: string
  last_run: string | null
}
interface SysStats {
  cpu: number | null
  mem: number | null
  gateway: boolean
  uptime: string | null
}

function CozyCronCard() {
  const [jobs, setJobs] = useState<CronJobReal[]>([])
  const [stats, setStats] = useState<SysStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let alive = true
    const load = () => {
      fetch('/api/cozy/cron')
        .then(r => r.json())
        .then(d => {
          if (!alive) return
          setJobs(d.jobs || [])
          setStats(d.stats || null)
          setLoading(false)
        })
        .catch(() => { if (alive) setLoading(false) })
    }
    load()
    const iv = setInterval(load, 15000) // auto-refresh tiap 15s
    return () => { alive = false; clearInterval(iv) }
  }, [])

  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(iv)
  }, [])

  const activeCount = jobs.filter(j => j.status === 'active').length

  return (
    <motion.div
      initial={{ opacity: 0, y: 48, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 120, damping: 16 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="p-6 rounded-2xl relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.85), rgba(10,15,30,0.9))',
        border: '1px solid rgba(148,163,184,0.12)',
        boxShadow: '0 0 24px rgba(245,158,11,0.1), inset 0 1px 0 rgba(255,255,255,0.06)'
      }}
    >
      {/* corner glow */}
      <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl opacity-20 pointer-events-none bg-amber-500" />
      {/* scan line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 200, damping: 12 }}
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(245,158,11,0.13)', border: '1px solid rgba(245,158,11,0.55)', boxShadow: '0 0 14px rgba(245,158,11,0.2)' }}
          >
            <CalendarClock size={16} className="text-amber-400" />
          </motion.div>
          <span className="text-base font-semibold text-white tracking-wide">Cozy Cron</span>
          {stats?.gateway && (
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              GATEWAY
            </motion.span>
          )}
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 font-mono">
          {activeCount}/{jobs.length || 0} active
        </span>
      </div>

      {/* System stats strip (REAL) */}
      <div className="flex items-center gap-4 mb-4 text-xs font-mono relative z-10">
        <span className="text-slate-500">CPU <span className="text-amber-300 font-bold">{stats?.cpu ?? '–'}%</span></span>
        <span className="text-slate-500">MEM <span className="text-purple-300 font-bold">{stats?.mem ?? '–'}%</span></span>
        <span className="text-slate-500">UP <span className="text-cyan-300 font-bold">{stats?.uptime ?? '–'}</span></span>
      </div>

      {/* Job list */}
      {loading ? (
        <div className="flex items-center justify-center h-[180px] text-slate-500 text-sm font-mono relative z-10">
          <Sparkles size={18} className="animate-pulse mr-2 text-amber-400" /> Membaca Hermes runtime...
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[180px] text-slate-500 text-sm font-mono gap-2 relative z-10">
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <CalendarClock size={28} className="text-slate-600" />
          </motion.div>
          Belum ada cron job terjadwal
        </div>
      ) : (
        <div className="space-y-2.5 relative z-10">
          <AnimatePresence>
            {jobs.map((job, idx) => (
              <motion.div
                key={job.id + tick * 0}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 + idx * 0.07 }}
                whileHover={{ x: 4 }}
                className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-amber-400/30 transition-colors group relative overflow-hidden"
              >
                {/* running shimmer */}
                {job.status === 'active' && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.06), transparent)' }}
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', delay: idx * 0.4 }}
                  />
                )}
                <div className="flex items-center gap-3 relative z-10">
                  <motion.div
                    animate={job.status === 'active' ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 1.6, repeat: Infinity, delay: idx * 0.3 }}
                  >
                    <div className={`w-2 h-2 rounded-full ${job.status === 'active' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]' : 'bg-slate-600'}`} />
                  </motion.div>
                  <div>
                    <p className="font-semibold text-white text-sm">{job.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{job.schedule} → {job.agent}</p>
                  </div>
                </div>
                <div className="text-right relative z-10">
                  <p className="text-sm font-bold text-amber-400 font-mono">
                    {job.last_run ? `last ${job.last_run.slice(11, 16)}` : 'pending'}
                  </p>
                  <PlayCircle size={14} className="ml-auto text-slate-600 group-hover:text-amber-400 cursor-pointer transition-colors" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}

// ── Live Task Queue (REAL Hermes activity feed) ───────
interface ActivityItem {
  agent: string
  task: string
  status: string
  time: string
}

const AGENT_COLORS: Record<string, string> = {
  COZY: '#00D4FF', ATLAS: '#10B981', ZEPHRA: '#EF4444', CIPHER: '#06B6D4',
  NOVA: '#FF6B35', SENTINEL: '#F59E0B', PHOENIX: '#F97316', ORACLE: '#8B5CF6',
  PIXEL: '#EC4899', AURORA: '#14B8A6', CRON: '#A78BFA',
}

function LiveTaskQueue() {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('All')

  useEffect(() => {
    let alive = true
    const load = () => {
      fetch('/api/cozy/activity')
        .then(r => r.json())
        .then(d => { if (alive) { setItems(d.activities || []); setLoading(false) } })
        .catch(() => { if (alive) setLoading(false) })
    }
    load()
    const iv = setInterval(load, 20000) // refresh tiap 20s
    return () => { alive = false; clearInterval(iv) }
  }, [])

  const tabs = ['All', 'running', 'done', 'failed']
  const filtered = tab === 'All' ? items : items.filter(i => i.status === tab)

  return (
    <motion.div
      initial={{ opacity: 0, y: 48 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, type: 'spring', stiffness: 110, damping: 16 }}
      className="rounded-2xl overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.85), rgba(10,15,30,0.9))',
        border: '1px solid rgba(148,163,184,0.12)',
        boxShadow: '0 0 24px rgba(0,212,255,0.08), inset 0 1px 0 rgba(255,255,255,0.06)'
      }}
    >
      {/* scan line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      <div className="flex items-center justify-between p-6 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.65, type: 'spring', stiffness: 200, damping: 12 }}
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(34,211,238,0.13)', border: '1px solid rgba(34,211,238,0.55)', boxShadow: '0 0 14px rgba(34,211,238,0.2)' }}
          >
            <Terminal size={16} className="text-cyan-400" />
          </motion.div>
          <span className="text-base font-semibold text-white tracking-wide">Live Task Queue</span>
          <span className="text-[10px] text-slate-500 font-mono hidden md:inline">• real activity dari Hermes runtime</span>
        </div>
        <div className="flex items-center gap-2">
          {tabs.map(t => (
            <button key={t}
              onClick={() => setTab(t)}
              className={`text-xs px-3 py-1.5 rounded-full transition-all ${tab === t
                ? 'bg-purple-500/20 border border-purple-400/40 text-purple-300'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
                }`}>
              {t === 'All' ? 'All' : t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[160px] text-slate-500 text-sm font-mono relative z-10">
          <Sparkles size={18} className="animate-pulse mr-2 text-cyan-400" /> Membaca aktivitas Hermes...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[140px] gap-2 relative z-10">
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2.4, repeat: Infinity }}>
            <Terminal size={26} className="text-slate-600" />
          </motion.div>
          <p className="text-slate-500 text-sm font-mono">Belum ada aktivitas tercatat</p>
        </div>
      ) : (
        <table className="w-full relative z-10">
          <thead>
            <tr className="border-y border-white/5">
              {['Activity', 'Agent', 'Time', 'Status'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.slice(0, 8).map((item, idx) => {
                const color = AGENT_COLORS[item.agent] || '#94A3B8'
                return (
                  <motion.tr
                    key={`${item.time}-${idx}-${item.task.slice(0, 12)}`}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="border-b border-white/[0.03] hover:bg-cyan-500/[0.03] transition-colors group"
                  >
                    <td className="px-6 py-3.5">
                      <span className="text-sm text-slate-200">{item.task}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-2 text-xs font-bold font-mono" style={{ color }}>
                        <CircleDot size={12} style={{ color }} />
                        {item.agent}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-xs text-slate-500 font-mono">{item.time || '--:--'}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                        item.status === 'running' ? 'text-cyan-400'
                          : item.status === 'failed' ? 'text-red-400'
                            : 'text-emerald-400'
                      }`}>
                        {item.status === 'running' && (
                          <motion.span
                            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1.4, repeat: Infinity }}
                            className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                          />
                        )}
                        {item.status === 'done' && <CheckCircle2 size={12} />}
                        {item.status === 'failed' && <span className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                        {item.status}
                      </span>
                    </td>
                  </motion.tr>
                )
              })}
            </AnimatePresence>
          </tbody>
        </table>
      )}
    </motion.div>
  )
}

// ── ZEPHRA Stock Dashboard (filter bulan/tahun global) ─
interface StockAccount {
  id?: string
  game?: string
  status?: string
  tanggalMasuk?: string
  hargaBeli?: number
  hargaJual?: number
}

const STOCK_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const STOCK_YEARS = ['all', '2025', '2026', '2027', '2028', '2029', '2030']

function StockDashboard() {
  const [accounts, setAccounts] = useState<StockAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState<number | 'all'>('all')
  const [year, setYear] = useState<string>('all')
  const [openDrop, setOpenDrop] = useState<'month' | 'year' | null>(null)

  useEffect(() => {
    let alive = true
    fetch('/api/stock/')
      .then(r => r.json())
      .then(d => {
        if (!alive) return
        // API bisa balikin {items:[...]} atau array langsung
        const arr = Array.isArray(d) ? d : (Array.isArray(d.items) ? d.items : (Array.isArray(d.accounts) ? d.accounts : []))
        setAccounts(arr)
        setLoading(false)
      })
      .catch(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  // Filter by tanggalMasuk (YYYY-MM-DD)
  const filtered = accounts.filter(a => {
    const t = String(a.tanggalMasuk || '')
    if (!t) return month === 'all' && year === 'all' ? true : false
    const y = t.slice(0, 4)
    const m = parseInt(t.slice(5, 7), 10)
    if (year !== 'all' && y !== year) return false
    if (month !== 'all' && m !== month) return false
    return true
  })

  const isFF = (a: StockAccount) => a.game === 'Free Fire'
  const isML = (a: StockAccount) => a.game === 'Mobile Legends'
  const isReady = (a: StockAccount) => a.status === 'Ready'

  const stats = [
    { icon: Gamepad2, label: 'Total Akun FF', value: filtered.filter(isFF).length, sub: 'Semua status', hex: '#22D3EE' },
    { icon: CheckCircle2, label: 'FF Ready', value: filtered.filter(a => isFF(a) && isReady(a)).length, sub: 'Siap jual', hex: '#34D399' },
    { icon: Gamepad2, label: 'Total Akun ML', value: filtered.filter(isML).length, sub: 'Semua status', hex: '#A78BFA' },
    { icon: CheckCircle2, label: 'ML Ready', value: filtered.filter(a => isML(a) && isReady(a)).length, sub: 'Siap jual', hex: '#34D399' },
    { icon: Package, label: 'Total Semua', value: filtered.length, sub: 'Seluruh akun', hex: '#60A5FA' },
    { icon: CheckCircle2, label: 'Semua Ready', value: filtered.filter(isReady).length, sub: 'Siap jual', hex: '#34D399' },
    { icon: ShoppingCart, label: 'Terjual', value: filtered.filter(a => a.status === 'Terjual').length, sub: 'Sukses terjual', hex: '#FBBF24' },
    { icon: Clock, label: 'Cicilan', value: filtered.filter(a => a.status === 'Cicilan').length, sub: 'Pending payment', hex: '#F87171' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 48 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, type: 'spring', stiffness: 110, damping: 16 }}
      className="p-6 rounded-2xl relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.85), rgba(10,15,30,0.9))',
        border: '1px solid rgba(148,163,184,0.12)',
        boxShadow: '0 0 24px rgba(239,68,68,0.08), inset 0 1px 0 rgba(255,255,255,0.06)'
      }}
    >
      {/* scan line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      {/* Header + Global Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.7, type: 'spring', stiffness: 200, damping: 12 }}
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.13)', border: '1px solid rgba(239,68,68,0.55)', boxShadow: '0 0 14px rgba(239,68,68,0.2)' }}
          >
            <Gamepad2 size={16} className="text-red-400" />
          </motion.div>
          <span className="text-base font-semibold text-white tracking-wide">ZEPHRA Stock Dashboard</span>
          <span className="text-[10px] text-slate-500 font-mono hidden md:inline">• farid-shop-enterprise</span>
        </div>

        {/* Filter bulan + tahun */}
        <div className="flex items-center gap-2">
          {/* Month */}
          <div className="relative">
            <button
              onClick={() => setOpenDrop(openDrop === 'month' ? null : 'month')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 hover:border-red-400/40 transition-colors"
            >
              <CalendarClock size={13} className="text-red-400" />
              <span className="text-xs text-white font-mono font-bold">
                {month === 'all' ? 'Semua Bulan' : STOCK_MONTHS[month - 1]}
              </span>
              <motion.span animate={{ rotate: openDrop === 'month' ? 180 : 0 }} className="text-slate-500 text-[10px]">▼</motion.span>
            </button>
            <AnimatePresence>
              {openDrop === 'month' && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.16 }}
                  className="absolute right-0 top-full mt-2 z-50 p-2 rounded-xl w-44 grid grid-cols-3 gap-1.5"
                  style={{ background: 'rgba(10,15,30,0.97)', border: '1px solid rgba(239,68,68,0.35)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}
                >
                  <button
                    onClick={() => { setMonth('all'); setOpenDrop(null) }}
                    className={`col-span-3 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${month === 'all' ? 'bg-red-500/25 text-red-300 border border-red-400/40' : 'text-slate-300 border border-transparent hover:bg-white/5'}`}
                  >
                    Semua Bulan
                  </button>
                  {STOCK_MONTHS.map((m, i) => (
                    <button
                      key={m}
                      onClick={() => { setMonth(i + 1); setOpenDrop(null) }}
                      className={`px-2 py-1.5 rounded-lg text-xs font-mono transition-all ${month === i + 1 ? 'bg-red-500/25 text-red-300 border border-red-400/40' : 'text-slate-300 border border-transparent hover:bg-white/5'}`}
                    >
                      {m}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Year */}
          <div className="relative">
            <button
              onClick={() => setOpenDrop(openDrop === 'year' ? null : 'year')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 hover:border-red-400/40 transition-colors"
            >
              <CalendarClock size={13} className="text-red-400" />
              <span className="text-xs text-white font-mono font-bold">{year === 'all' ? 'Semua Tahun' : year}</span>
              <motion.span animate={{ rotate: openDrop === 'year' ? 180 : 0 }} className="text-slate-500 text-[10px]">▼</motion.span>
            </button>
            <AnimatePresence>
              {openDrop === 'year' && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.16 }}
                  className="absolute right-0 top-full mt-2 z-50 p-2 rounded-xl w-36 grid grid-cols-3 gap-1.5"
                  style={{ background: 'rgba(10,15,30,0.97)', border: '1px solid rgba(239,68,68,0.35)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}
                >
                  {STOCK_YEARS.map(y => (
                    <button
                      key={y}
                      onClick={() => { setYear(y); setOpenDrop(null) }}
                      className={`px-2 py-1.5 rounded-lg text-xs font-mono transition-all ${year === y ? 'bg-red-500/25 text-red-300 border border-red-400/40' : y === 'all' ? 'col-span-3 text-slate-300 border border-transparent hover:bg-white/5' : 'text-slate-300 border border-transparent hover:bg-white/5'}`}
                    >
                      {y === 'all' ? 'Semua Tahun' : y}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 8 stat cards dalam satu kotak */}
      {loading ? (
        <div className="flex items-center justify-center h-[180px] text-slate-500 text-sm font-mono relative z-10">
          <Sparkles size={18} className="animate-pulse mr-2 text-red-400" /> Memuat stok ZEPHRA...
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 relative z-10">
          {stats.map((s, idx) => (
            <StockStatCard key={s.label} s={s} idx={idx} />
          ))}
        </div>
      )}
    </motion.div>
  )
}

// count-up yang aman dipanggil dalam komponen tile
function useCountUpSafe(target: number, duration: number, delay: number) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let raf = 0
    let start: number | null = null
    const timer = setTimeout(() => {
      const step = (ts: number) => {
        if (start === null) start = ts
        const p = Math.min((ts - start) / duration, 1)
        setVal(Math.round(target * (1 - Math.pow(1 - p, 3))))
        if (p < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }, delay)
    return () => { clearTimeout(timer); cancelAnimationFrame(raf) }
  }, [target, duration, delay])
  return val
}

function StockStatCard({ s, idx }: { s: { icon: typeof Gamepad2; label: string; value: number; sub: string; hex: string }; idx: number }) {
  const n = useCountUpSafe(s.value, 900, 650 + idx * 70)
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.7 + idx * 0.06, type: 'spring', stiffness: 150, damping: 15 }}
      whileHover={{ y: -4, transition: { duration: 0.18 } }}
      className="p-4 rounded-xl relative overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(148,163,184,0.1)'
      }}
    >
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${s.hex}1f`, border: `1px solid ${s.hex}55` }}>
          <s.icon size={14} style={{ color: s.hex }} />
        </div>
        <span className="text-[11px] font-semibold text-slate-300 tracking-wide leading-tight">{s.label}</span>
      </div>
      <p className="text-2xl font-black text-white font-mono leading-none">{n}</p>
      <p className="text-[10px] text-slate-500 mt-1.5">{s.sub}</p>
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

      {/* ═══ ZEPHRA Stock Dashboard (filter global) ═══ */}
      <StockDashboard />

      {/* ═══ Charts Row: Task Flow + Income Tracker ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Task Flow — stat-card style */}
        <TaskFlowCard />

        {/* 2. Income Tracker (Jan–Dec, year picker) */}
        <IncomeTracker />
      </div>
      {/* ═══ Row 2: Agent Perf + Cron Jobs ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Performance — stat-card style */}
        <AgentPerformanceCard />

        {/* Cron Jobs — REAL Hermes data */}
        <CozyCronCard />
      </div>

      {/* ═══ Live Task Queue — REAL Hermes activity ═══ */}
      <LiveTaskQueue />
    </div>
  )
}
