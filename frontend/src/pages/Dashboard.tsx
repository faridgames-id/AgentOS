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

      {/* ═══ Stat Cards — Holographic ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Agents Online', value: activeAgents, trend: '+12%', up: true, color: 'cyan', glow: 'rgba(0,212,255,0.25)' },
          { icon: ListTodo, label: 'Total Tasks', value: totalTasks.toLocaleString(), trend: '+8.2%', up: true, color: 'purple', glow: 'rgba(139,92,246,0.25)' },
          { icon: CalendarClock, label: 'Active Crons', value: activeCrons, trend: '+2', up: true, color: 'green', glow: 'rgba(16,185,129,0.25)' },
          { icon: Activity, label: 'Efficiency', value: `${avgEfficiency}%`, trend: '+0.02%', up: true, color: 'amber', glow: 'rgba(245,158,11,0.25)' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.08 }}
            whileHover={{ y: -4 }}
            className="relative p-5 rounded-2xl overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, rgba(15,23,42,0.85), rgba(10,15,30,0.9))',
              border: '1px solid rgba(148,163,184,0.12)',
              boxShadow: `0 0 24px ${stat.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`
            }}
          >
            {/* scan line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center relative"
                style={{ background: stat.glow, boxShadow: `0 0 18px ${stat.glow}` }}>
                <stat.icon size={20} className="text-white" />
              </div>
              <span className={`text-xs font-bold flex items-center gap-1 ${stat.up ? 'text-emerald-400' : 'text-red-400'}`}>
                {stat.up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{stat.trend}
              </span>
            </div>
            <p className="text-3xl font-black text-white font-mono">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-1 tracking-widest">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ═══ Charts Row ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="lg:col-span-2 p-6 rounded-2xl relative overflow-hidden"
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

        {/* Resource Usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="p-6 rounded-2xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(15,23,42,0.85), rgba(10,15,30,0.9))',
            border: '1px solid rgba(148,163,184,0.12)',
            boxShadow: '0 0 24px rgba(139,92,246,0.08)'
          }}
        >
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
            <Cpu size={20} className="text-purple-400" />
            Neural Resources
          </h2>
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={resourceDistribution} cx="50%" cy="50%" innerRadius={48} outerRadius={68} paddingAngle={6} dataKey="value" strokeWidth={0}>
                  {resourceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...darkTooltip} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-2 mt-4">
              {resourceDistribution.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }} />
                    <span className="text-xs text-slate-400">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold text-white font-mono">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══ Row 2: Agent Perf + Cron Jobs ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="p-6 rounded-2xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(15,23,42,0.85), rgba(10,15,30,0.9))',
            border: '1px solid rgba(148,163,184,0.12)',
            boxShadow: '0 0 24px rgba(16,185,129,0.08)'
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Bot size={20} className="text-emerald-400" />
              Agent Performance
            </h2>
            <span className="text-xs text-slate-500 font-mono">{totalTasks.toLocaleString()} tasks</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={agentSystemData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} />
              <YAxis stroke="#475569" fontSize={11} tickLine={false} />
              <Tooltip {...darkTooltip} cursor={{ fill: 'rgba(0,212,255,0.05)' }} />
              <Bar dataKey="tasks" radius={[6, 6, 0, 0]} >
                {agentSystemData.map((entry, index) => (
                  <Cell key={index} fill={entry.status === 'working' ? '#00D4FF' : '#475569'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

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
