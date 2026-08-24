import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, MicOff, Send, Sparkles, Brain, CalendarClock, MessageSquare,
  AudioLines, Plus, Trash2, Bot, User, Zap, Globe, Terminal, X, Play, Pause
} from 'lucide-react'

type Tab = 'voice' | 'chat' | 'memory' | 'cron'

interface ChatSession {
  id: number
  name: string
  messages: { role: 'user' | 'cozy'; text: string; time: string }[]
}

interface MemoryItem {
  id: number
  category: string
  content: string
  color: string
}

interface CronItem {
  id: number
  name: string
  schedule: string
  lastRun: string
  status: 'active' | 'paused'
}

const suggestions = [
  { icon: Zap, label: 'Cek profit hari ini', color: '#10B981' },
  { icon: Globe, label: 'Riset pasar akun FF', color: '#F59E0B' },
  { icon: Terminal, label: 'Deploy update terbaru', color: '#00D4FF' },
  { icon: Brain, label: 'Ingatkan jadwal konten', color: '#8B5CF6' },
]

const initialSessions: ChatSession[] = [
  { id: 1, name: 'Business Chat', messages: [
    { role: 'user', text: 'Cozy, profit hari ini berapa?', time: '14:02' },
    { role: 'cozy', text: 'Hari ini Bos Farid sudah mencatat Rp 150.000 profit dari 2 akun terjual. Total August: Rp 4.574.000 🔥', time: '14:02' },
  ]},
  { id: 2, name: 'Stock ZEPHRA', messages: [] },
]

const memoryItems: MemoryItem[] = [
  { id: 1, category: 'IDENTITY', content: 'Bos Farid — 15 yo AI Engineer, owner faridshopgame.online', color: '#FBBF24' },
  { id: 2, category: 'PREFERENCE', content: 'Concise Indonesian responses, cool emojis', color: '#EC4899' },
  { id: 3, category: 'FINANCE', content: 'August 2026 income Rp 4.574.000 (47 transactions)', color: '#10B981' },
  { id: 4, category: 'STOCK', content: 'ZEPHRA manages 272 accounts (188 FF, 84 ML) worth Rp 72.3jt', color: '#A855F7' },
  { id: 5, category: 'PLATFORMS', content: 'TikTok @Faridexcelent • Firebase x2 projects • Obsidian vault', color: '#06B6D4' },
]

const cronItems: CronItem[] = [
  { id: 1, name: 'Daily Finance Report', schedule: '0 9 * * *', lastRun: 'Today 09:00 ✓', status: 'active' },
  { id: 2, name: 'ZEPHRA Stock Sync', schedule: '*/30m', lastRun: '12 min ago ✓', status: 'active' },
  { id: 3, name: 'TikTok Content Ideas', schedule: '0 18 * * *', lastRun: 'Yesterday ✓', status: 'active' },
  { id: 4, name: 'Memory Consolidation', schedule: '0 3 * * *', lastRun: 'Paused by user', status: 'paused' },
]

export default function Chat() {
  const [tab, setTab] = useState<Tab>('voice')
  const [sessions, setSessions] = useState<ChatSession[]>(initialSessions)
  const [activeSession, setActiveSession] = useState(1)
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [orbIntensity, setOrbIntensity] = useState(1)
  const [typing, setTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Kirim pesan teks ke Telegram (REAL) ──
  const sendToTelegram = (text: string) => {
    fetch('/api/send/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    }).catch(() => {})
  }

  // ── Kirim file dari server ke Telegram ──
  const sendFileToTelegram = (path: string, caption: string) => {
    fetch('/api/send/file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, caption }),
    }).catch(() => {})
  }

  // ── Upload file dari laptop Bos: simpan sementara di cache lalu kirim ──
  const uploadAndSend = async (file: File) => {
    const buf = await file.arrayBuffer()
    const bytes = new Uint8Array(buf)
    // simpan ke server via endpoint upload
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/send/upload', { method: 'POST', body: fd })
      const d = await res.json()
      if (d.path) sendFileToTelegram(d.path, file.name)
    } catch { /* diam */ }
  }
  // Telegram sync state — di level atas biar tidak reset saat re-render
  const [tgSessions, setTgSessions] = useState<Array<{ id: string; name: string; preview: string; last_role: string; time: string; message_count: number }>>([])
  const [tgActive, setTgActive] = useState<string | null>(null)
  const [tgMessages, setTgMessages] = useState<Array<{ role: string; text: string; time: string; attachments?: string[] }>>([])
  const [tgLoading, setTgLoading] = useState(true)

  useEffect(() => {
    let alive = true
    const loadSessions = () => {
      fetch('/api/telegram/sessions')
        .then(r => r.json())
        .then(d => { if (alive) { setTgSessions(d.sessions || []); setTgLoading(false) } })
        .catch(() => { if (alive) setTgLoading(false) })
    }
    loadSessions()
    const iv = setInterval(loadSessions, 15000)
    return () => { alive = false; clearInterval(iv) }
  }, [])

  useEffect(() => {
    if (!tgActive) { setTgMessages([]); return }
    setTgMessages([])
    let alive = true
    fetch(`/api/telegram/messages/${tgActive}`)
      .then(r => r.json())
      .then(d => {
        if (!alive) return
        setTgMessages(d.messages || [])
        // langsung lompat ke chat terbaru (bawah) begitu pesan termuat
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ block: 'end' })
        })
      })
      .catch(() => {})
    return () => { alive = false }
  }, [tgActive])

  const session = sessions.find(s => s.id === activeSession)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session?.messages.length, tgMessages.length, tgActive])

  // Fake voice orb pulse when listening
  useEffect(() => {
    if (!isListening) return
    const i = setInterval(() => setOrbIntensity(0.7 + Math.random() * 0.6), 180)
    return () => clearInterval(i)
  }, [isListening])

  const sendMessage = () => {
    if (!input.trim() || !session) return
    // kirim juga ke Telegram Bos (real) — dashboard & Telegram selaras
    sendToTelegram(input.trim())
    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    const userMsg = { role: 'user' as const, text: input, time: now }
    setSessions(prev => prev.map(s => s.id === activeSession
      ? { ...s, messages: [...s.messages, userMsg] } : s))
    setInput('')
    setTyping(true)
    setTimeout(() => {
      const cozyMsg = { role: 'copy' as never, text: '', time: now }
      void cozyMsg
      const reply = {
        role: 'cozy' as const,
        text: generateReply(input),
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      }
      setSessions(prev => prev.map(s => s.id === activeSession
        ? { ...s, messages: [...s.messages, reply] } : s))
      setTyping(false)
    }, 1200)
  }

  const generateReply = (q: string) => {
    const l = q.toLowerCase()
    if (l.includes('profit') || l.includes('income') || l.includes('pendapatan'))
      return `💰 August 2026: Rp 4.574.000 dari 47 transaksi. Hari ini ada profit baru masuk! Mau saya buatkan breakdown per minggu?`
    if (l.includes('stock') || l.includes('stok'))
      return `📦 ZEPHRA reports: 272 accounts ready (188 FF, 84 ML). Total modal Rp 72.345.000. Semua sistem normal ✅`
    if (l.includes('cron') || l.includes('jadwal'))
      return `⏰ 3 cron aktif: Daily Finance (09:00), Stock Sync (30m), TikTok Ideas (18:00). Mau ubah jadwal?`
    if (l.includes('ingat') || l.includes('memory'))
      return `🧠 Saya ingat semuanya Bos — identitas, preferensi, data finansial, dan stok ZEPHRA. Ada yang mau ditambahkan ke memory?`
    return `🤖 Copy that Bos! Saya proses sekarang. Ada lagi yang bisa saya bantu?`
  }

  const newSession = () => {
    const id = Math.max(...sessions.map(s => s.id)) + 1
    setSessions([...sessions, { id, name: `New Session ${id}`, messages: [] }])
    setActiveSession(id)
  }

  const deleteSession = (id: number) => {
    if (sessions.length <= 1) return
    const rest = sessions.filter(s => s.id !== id)
    setSessions(rest)
    if (activeSession === id) setActiveSession(rest[0].id)
  }

  // ════════════════ VOICE TAB (Jarvis) ════════════════
  const VoiceTab = () => (
    <div className="flex flex-col items-center pt-7 relative">
      {/* Background rings — halus, jauh */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[260, 380, 520].map((size, i) => (
          <motion.div
            key={size}
            className="absolute rounded-full"
            style={{
              width: size, height: size,
              border: '1px solid rgba(99,102,241,0.12)',
            }}
            animate={{ scale: [1, 1.06, 1], opacity: [0.4, 0.1, 0.4] }}
            transition={{ duration: 4, repeat: Infinity, delay: i * 0.9, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* ═══ CENTRAL ORB — ala Siri: sphere gradient + ring energi ═══ */}
      <motion.div
        className="relative cursor-pointer select-none"
        onClick={() => setIsListening(!isListening)}
        animate={{ scale: isListening ? orbIntensity : 1 }}
        transition={isListening ? { duration: 0.18 } : { duration: 1.2 }}
      >
        {/* Orb utama — gradient gelap dengan aurora dalam */}
        <motion.div
          className="relative w-52 h-52 rounded-full"
          animate={isListening
            ? { background: [
                'radial-gradient(circle at 30% 70%, #d946ef 0%, #ef4444 35%, #1a0b2e 75%)',
                'radial-gradient(circle at 60% 40%, #f97316 0%, #d946ef 40%, #1a0b2e 75%)',
                'radial-gradient(circle at 40% 60%, #ef4444 0%, #8b5cf6 45%, #1a0b2e 75%)',
              ] }
            : { background: 'radial-gradient(circle at 35% 65%, rgba(217,70,239,0.85) 0%, rgba(239,68,68,0.6) 35%, rgba(20,10,40,0.98) 72%)' }}
          transition={{ duration: 2.2, repeat: isListening ? Infinity : 0, ease: 'easeInOut' }}
          style={{
            boxShadow: isListening
              ? '0 0 90px rgba(217,70,239,0.45), 0 0 160px rgba(239,68,68,0.25), inset 0 0 60px rgba(0,0,0,0.55)'
              : '0 0 50px rgba(217,70,239,0.25), 0 0 110px rgba(239,68,68,0.12), inset 0 0 50px rgba(0,0,0,0.5)',
            border: '1.5px solid rgba(216,180,254,0.35)',
          }}
        >
          {/* aurora swirl dalam orb */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'conic-gradient(from 180deg, transparent, rgba(249,115,22,0.5), transparent 40%, rgba(217,70,239,0.4), transparent 75%)',
              filter: 'blur(14px)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: isListening ? 4 : 9, repeat: Infinity, ease: 'linear' }}
          />
          {/* highlight kiri atas */}
          <div className="absolute inset-0 rounded-full" style={{
            background: 'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.22), transparent 42%)',
          }} />
          {/* gelap tepi bawah biar sphere */}
          <div className="absolute inset-0 rounded-full" style={{
            background: 'radial-gradient(circle at 50% 115%, rgba(0,0,0,0.55), transparent 55%)',
          }} />

          {/* Icon tengah */}
          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {isListening ? (
                <motion.div key="mic" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <AudioLines size={48} className="text-white drop-shadow-[0_0_16px_rgba(217,70,239,0.9)]" />
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Mic size={42} className="text-white/90" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ═══ RING ENERGI — plasma ring ala referensi ke-2 ═══ */}
        {/* ring 1: ungu-biru */}
        <motion.div
          className="absolute -inset-5 rounded-full pointer-events-none"
          style={{
            border: '3px solid transparent',
            borderTopColor: 'rgba(139,92,246,0.85)',
            borderLeftColor: 'rgba(99,102,241,0.5)',
            filter: 'blur(2px)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: isListening ? 2.2 : 7, repeat: Infinity, ease: 'linear' }}
        />
        {/* ring 2: pink-putih berlawanan arah */}
        <motion.div
          className="absolute -inset-8 rounded-full pointer-events-none"
          style={{
            border: '2px solid transparent',
            borderBottomColor: 'rgba(232,121,249,0.7)',
            borderRightColor: 'rgba(251,207,232,0.35)',
            filter: 'blur(1.5px)',
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: isListening ? 3 : 10, repeat: Infinity, ease: 'linear' }}
        />
        {/* ring 3: tipis luar */}
        <motion.div
          className="absolute -inset-11 rounded-full pointer-events-none"
          style={{
            border: '1.5px solid transparent',
            borderTopColor: 'rgba(251,113,133,0.5)',
            borderLeftColor: 'rgba(196,181,253,0.3)',
            filter: 'blur(1px)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: isListening ? 3.5 : 13, repeat: Infinity, ease: 'linear' }}
        />
        {/* ═══ PARTIKEL ENERGI — orbit di sekeliling orb ═══ */}
        {Array.from({ length: 10 }).map((_, i) => {
          const angle = (i / 10) * Math.PI * 2
          const r = 130
          const size = 4 + (i % 3) * 2
          const colors = ['#e879f9', '#fb7185', '#a78bfa', '#f97316']
          return (
            <motion.div
              key={`p-${i}`}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: size, height: size,
                background: colors[i % colors.length],
                boxShadow: `0 0 ${size}px ${colors[i % colors.length]}`,
                left: '50%', top: '50%',
                marginLeft: -size / 2, marginTop: -size / 2,
              }}
              animate={{
                x: [Math.cos(angle) * r * 0.85, Math.cos(angle + Math.PI * 1.6) * r * 1.1, Math.cos(angle + Math.PI * 3.2) * r * 0.85],
                y: [Math.sin(angle) * r * 0.5, Math.sin(angle + Math.PI * 1.6) * r * 0.65, Math.sin(angle + Math.PI * 3.2) * r * 0.5],
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.3, 0.8],
              }}
              transition={{
                duration: isListening ? 3 + i * 0.15 : 6 + i * 0.3,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.12,
              }}
            />
          )
        })}

        {/* ring 4: dashed halus terluar */}
        <motion.div
          className="absolute -inset-[44px] rounded-full pointer-events-none opacity-40"
          style={{
            border: '1px dashed rgba(216,180,254,0.35)',
          }}
          animate={{ rotate: isListening ? -360 : 360 }}
          transition={{ duration: isListening ? 14 : 30, repeat: Infinity, ease: 'linear' }}
        />

        {/* halo glow di belakang orb */}
        <motion.div
          className="absolute -inset-12 rounded-full pointer-events-none"
          style={{
            background: isListening
              ? 'radial-gradient(circle, rgba(217,70,239,0.18), rgba(99,102,241,0.08) 55%, transparent 75%)'
              : 'radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%)',
            filter: 'blur(10px)',
          }}
          animate={{ scale: isListening ? [1, 1.12, 1] : 1 }}
          transition={{ duration: 1.6, repeat: isListening ? Infinity : 0, ease: 'easeInOut' }}
        />
      </motion.div>

      <motion.h2
        className="mt-20 text-4xl font-bold font-display tracking-tight"
        animate={isListening ? {
          background: [
            'linear-gradient(90deg,#67e8f9,#e879f9)',
            'linear-gradient(90deg,#e879f9,#fb923c)',
            'linear-gradient(90deg,#fb923c,#67e8f9)',
          ],
        } : {}}
        transition={{ duration: 2, repeat: isListening ? Infinity : 0 }}
        style={isListening ? { WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : { color: '#fff' }}
      >
        {isListening ? 'Listening...' : 'Hey Cozy!'}
      </motion.h2>
      <p className="text-slate-400 mt-1 text-sm">
        {isListening ? 'Speak now — saya dengar Bos 👂' : 'Tap orb atau tekan mic untuk ngobrol via voice'}
      </p>

      {/* Waveform dots — ala referensi 1: deretan titik biru */}
      <div className="flex items-center gap-[7px] h-8 mt-10">
        {Array.from({ length: 32 }).map((_, i) => (
          <motion.div
            key={i}
            className={`w-[5px] rounded-full ${i % 2 === 0 ? 'bg-sky-400' : 'bg-fuchsia-400'}`}
            animate={isListening
              ? { height: [6, 6 + Math.random() * 18, 6], opacity: [0.5, 1, 0.5] }
              : { height: 6, opacity: [0.35, 0.8, 0.35] }}
            transition={
              isListening
                ? { duration: 0.45, repeat: Infinity, delay: i * 0.035, ease: 'easeInOut' }
                : { duration: 2.2, repeat: Infinity, delay: i * 0.08, ease: 'easeInOut' }
            }
          />
        ))}
      </div>

      {/* Quick voice actions — iOS widget style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-9 w-full max-w-lg pb-2">
        {suggestions.map((s, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.08, type: 'spring', stiffness: 220, damping: 18 }}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="relative flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left overflow-hidden group"
            style={{
              background: `linear-gradient(150deg, ${s.color}14, rgba(24,29,38,0.9) 55%)`,
              border: '1px solid rgba(148,163,184,0.12)',
              boxShadow: '0 6px 18px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* corner glow */}
            <div
              className="absolute -top-6 -right-6 w-16 h-16 rounded-full blur-xl opacity-15 pointer-events-none transition-opacity group-hover:opacity-35"
              style={{ background: s.color }}
            />
            {/* AppIcon tile */}
            <span
              className="relative flex items-center justify-center shrink-0 select-none w-9 h-9"
              style={{
                borderRadius: 10,
                background: `linear-gradient(160deg, ${s.color}E6, ${s.color})`,
                boxShadow: `inset 0 1px 1px rgba(255,255,255,0.35), inset 0 -2px 3px rgba(0,0,0,0.15)`,
              }}
            >
              <span
                className="absolute inset-x-0 top-0"
                style={{
                  height: '46%',
                  borderRadius: '10px 10px 40% 40% / 10px 10px 70% 70%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0.02))',
                }}
              />
              <s.icon size={17} className="relative z-10 text-white" strokeWidth={2.4} />
            </span>
            <span className="text-[13px] font-semibold text-slate-200 flex-1 relative z-10">{s.label}</span>
            {/* arrow muncul saat hover */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className="shrink-0 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 relative z-10">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </motion.button>
        ))}
      </div>
    </div>
  )

  // ════════════════ CHAT TAB (Orion-style) ════════════════
  const ChatTab = () => {
    const hasMessages = (session?.messages.length ?? 0) > 0
    const hour = new Date().getHours()
    const greet = hour < 11 ? 'Good Morning' : hour < 15 ? 'Good Afternoon' : hour < 19 ? 'Good Evening' : 'Good Night'

    return (
      <div className="flex gap-4 h-[calc(100vh-190px)]">
        {/* ── History Chat (ala referensi 3) ── */}
        <div
          className="w-[264px] flex-shrink-0 flex flex-col rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(170deg, rgba(16,28,52,0.97), rgba(7,14,30,0.99))',
            border: '1px solid rgba(96,140,220,0.22)',
            boxShadow: '0 12px 36px rgba(0,0,0,0.4), inset 0 1px 0 rgba(140,180,255,0.08)'
          }}
        >
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <p className="text-base font-bold text-white">History Chat</p>
            <button
              onClick={newSession}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-white transition-transform hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(160deg, #22D3EEE6, #22D3EE)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.35), 0 3px 10px rgba(34,211,238,0.35)' }}
            >
              <Plus size={12} strokeWidth={3} /> New Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-3">
            {/* ── Sesi Telegram REAL ── */}
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1 pt-1 pb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" /> Telegram • Live
            </p>
            <div className="space-y-1.5 mb-4">
              {tgLoading && (
                <div className="px-3 py-3 text-[11px] text-slate-500 font-mono">Membaca sesi Telegram...</div>
              )}
              {tgSessions.map(s => (
                <div
                  key={s.id}
                  onClick={() => setTgActive(tgActive === s.id ? null : s.id)}
                  className={`group flex items-start gap-2.5 px-3 py-2.5 rounded-2xl cursor-pointer transition-all ${tgActive === s.id ? '' : 'hover:bg-white/[0.04]'}`}
                  style={tgActive === s.id ? {
                    background: 'rgba(56,189,248,0.1)',
                    border: '1px solid rgba(56,189,248,0.4)',
                    boxShadow: '0 0 16px rgba(56,189,248,0.15)'
                  } : { border: '1px solid rgba(148,163,184,0.08)' }}
                >
                  <span
                    className="flex items-center justify-center shrink-0 w-7 h-7 rounded-full mt-0.5"
                    style={{
                      background: tgActive === s.id ? 'linear-gradient(160deg,#38BDF8E6,#38BDF8)' : 'rgba(56,189,248,0.15)',
                      boxShadow: tgActive === s.id ? '0 0 10px rgba(56,189,248,0.45)' : 'none'
                    }}
                  >
                    <Send size={11} className="text-white" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className={`block text-[12px] truncate font-medium ${tgActive === s.id ? 'text-white' : 'text-slate-300'}`}>{s.preview}</span>
                    <span className="block text-[9px] text-slate-500 font-mono mt-0.5">{s.time} · {s.message_count} pesan</span>
                  </span>
                </div>
              ))}
              {!tgLoading && tgSessions.length === 0 && (
                <div className="px-3 py-3 text-[11px] text-slate-500 font-mono">Belum ada sesi Telegram</div>
              )}
            </div>

            {/* ── Sesi lokal ── */}
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1 pb-2">Lokal</p>
            <div className="space-y-1.5">
              {sessions.map(s => (
                <div
                  key={s.id}
                  onClick={() => { setActiveSession(s.id); setTgActive(null) }}
                  className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-2xl cursor-pointer transition-all ${activeSession === s.id && !tgActive ? '' : 'hover:bg-white/[0.04]'}`}
                  style={activeSession === s.id && !tgActive ? {
                    background: 'rgba(34,211,238,0.08)',
                    border: '1px solid rgba(34,211,238,0.3)',
                    boxShadow: '0 0 16px rgba(34,211,238,0.12)'
                  } : { border: '1px solid rgba(148,163,184,0.08)' }}
                >
                  <span
                    className="flex items-center justify-center shrink-0 w-7 h-7 rounded-full"
                    style={{
                      background: activeSession === s.id && !tgActive ? 'linear-gradient(160deg,#22D3EEE6,#22D3EE)' : 'rgba(148,163,184,0.12)',
                      boxShadow: activeSession === s.id && !tgActive ? '0 0 10px rgba(34,211,238,0.4)' : 'none'
                    }}
                  >
                    <MessageSquare size={12} className="text-white" />
                  </span>
                  <span className={`text-[12px] flex-1 truncate font-medium ${activeSession === s.id && !tgActive ? 'text-white' : 'text-slate-400'}`}>{s.name}</span>
                  <Trash2 size={12} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity shrink-0"
                    onClick={(e) => { e.stopPropagation(); deleteSession(s.id) }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Chat area ── */}
        <div
          className="flex-1 flex flex-col rounded-2xl overflow-hidden relative"
          style={{
            background: 'linear-gradient(170deg, rgba(16,28,52,0.97), rgba(7,14,30,0.99))',
            border: '1px solid rgba(96,140,220,0.22)',
            boxShadow: '0 12px 36px rgba(0,0,0,0.4), inset 0 1px 0 rgba(140,180,255,0.08)'
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/5">
            <div className="relative">
              <div className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(160deg,#22D3EEE6,#22D3EE)', boxShadow: '0 0 14px rgba(34,211,238,0.4)' }}>
                <Bot size={17} className="text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2" style={{ borderColor: '#0a1020' }} />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Cozy</p>
              <p className="text-emerald-400 text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />online
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {tgActive && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Sesi Telegram • {tgActive.slice(0, 15)}</p>
                </div>
                {tgMessages.map((m, i) => {
                  const cleanText = m.text.replace(/\s*\[Image attached at:[^\]]*\]/g, '').replace(/\s*\[screenshot\]/g, '').trim()
                  const atts = m.attachments || []
                  return (
                    <motion.div
                      key={`tg-${i}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === 'user'
                        ? 'text-white rounded-br-md'
                        : 'bg-white/[0.06] text-slate-200 border border-white/5 rounded-bl-md'
                        }`}
                        style={m.role === 'user' ? {
                          background: 'linear-gradient(160deg,#38BDF8E6,#0284C7)',
                          boxShadow: '0 4px 14px rgba(56,189,248,0.25)'
                        } : {}}
                      >
                        {atts.length > 0 && (
                          <div className={`flex flex-wrap gap-2 mb-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
                            {atts.map(a => {
                              const ext = a.split('.').pop()?.toLowerCase()
                              const isImg = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')
                              const src = `/api/media/file?path=${encodeURIComponent(a)}`
                              return isImg ? (
                                <a key={a} href={src} target="_blank" rel="noreferrer" className="block">
                                  <img
                                    src={src}
                                    alt="attachment"
                                    className="max-h-52 rounded-xl border border-white/20 hover:border-white/50 transition-colors cursor-zoom-in"
                                    style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
                                    loading="lazy"
                                  />
                                </a>
                              ) : (
                                <a key={a} href={src} target="_blank" rel="noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-[11px] font-semibold text-white hover:bg-white/20 transition-colors">
                                  📎 {a.split('/').pop()}
                                </a>
                              )
                            })}
                          </div>
                        )}
                        {cleanText && <p className="whitespace-pre-wrap break-words">{cleanText}</p>}
                        {m.time && <p className={`text-[10px] mt-1 text-right ${m.role === 'user' ? 'text-white/70' : 'text-slate-500'}`}>{m.time}</p>}
                      </div>
                    </motion.div>
                  )
                })}
                {tgMessages.length === 0 && (
                  <div className="h-40 flex items-center justify-center text-slate-500 text-sm font-mono">Memuat pesan Telegram...</div>
                )}
              </>
            )}
            {!tgActive && !hasMessages && (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                {/* mini orb ala voice */}
                <motion.div
                  className="relative w-24 h-24 rounded-full mb-6"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    background: 'radial-gradient(circle at 32% 68%, rgba(103,232,249,0.95) 0%, rgba(56,189,248,0.85) 30%, rgba(59,130,246,0.7) 55%, rgba(15,23,60,0.98) 80%)',
                    boxShadow: '0 0 44px rgba(56,189,248,0.4), 0 0 90px rgba(59,130,246,0.2), inset 0 0 26px rgba(2,6,23,0.55)',
                    border: '1px solid rgba(125,211,252,0.45)'
                  }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ background: 'conic-gradient(from 180deg, transparent, rgba(125,211,252,0.55), transparent 40%, rgba(167,139,250,0.45), transparent 75%)', filter: 'blur(7px)' }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles size={26} className="text-white/90" />
                  </div>
                </motion.div>
                <h3 className="text-2xl font-bold text-white font-display">
                  {greet}, Bos Farid! 👋
                </h3>
                <p className="text-slate-400 mt-2 text-sm">How can I assist you today?</p>
                <p className="text-slate-500 text-xs mt-4 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Chat ini tersinkron dengan Telegram kamu 📱
                </p>
              </div>
            )}
            {!tgActive && hasMessages && session?.messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === 'user'
                  ? 'text-white rounded-br-md'
                  : 'bg-white/[0.06] text-slate-200 border border-white/5 rounded-bl-md'
                  }`}
                  style={m.role === 'user' ? {
                    background: 'linear-gradient(160deg,#22D3EEE6,#0EA5E9)',
                    boxShadow: '0 4px 14px rgba(34,211,238,0.25)'
                  } : {}}
                >
                  <p>{m.text}</p>
                  <p className={`text-[10px] mt-1 text-right ${m.role === 'user' ? 'text-white/70' : 'text-slate-500'}`}>{m.time}</p>
                </div>
              </motion.div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-white/[0.06] border border-white/5 px-4 py-3 rounded-2xl rounded-bl-md flex gap-1">
                  {[0, 1, 2].map(d => (
                    <motion.span key={d} className="w-2 h-2 bg-slate-400 rounded-full"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: d * 0.15 }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer besar ala Orion */}
          <div className="p-4 pt-1">
            <div
              className="rounded-3xl px-4 pt-3.5 pb-2.5 transition-all focus-within:border-sky-400/50"
              style={{
                background: 'linear-gradient(155deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02) 60%)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 12px 36px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
              }}
            >
              <div className="flex items-center gap-2.5 mb-2.5">
                <Sparkles size={14} className="text-fuchsia-400 shrink-0" />
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Start your request, and let Cozy handle everything..."
                  className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-slate-500"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.txt,.csv,.xlsx,.docx"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) uploadAndSend(f)
                    e.target.value = ''
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:scale-110 transition-all"
                    style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.14)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)' }}
                    title="Kirim gambar / dokumen ke Telegram">
                    <Plus size={14} />
                  </button>
                  <button className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-white transition-all"
                    style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.14)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)' }}
                    title="Voice">
                    <Mic size={14} />
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-slate-200 hover:text-white transition-all"
                    style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.14)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)' }}>
                    <Brain size={12} /> Reasoning
                  </button>
                  <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-slate-200 hover:text-white transition-all"
                    style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.14)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)' }}>
                    <Globe size={12} /> Deep Research
                  </button>
                </div>
                <button
                  onClick={sendMessage}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                  style={{ background: 'linear-gradient(160deg,#34D399E6,#10B981)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.35), 0 4px 12px rgba(16,185,129,0.4)' }}
                >
                  <Send size={15} className="text-white ml-0.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ════════════════ MEMORY TAB ════════════════
  const MemoryTab = () => (
    <div className="space-y-4 max-w-4xl mx-auto pt-4">
      <div className="flex items-center gap-3 mb-2">
        <Brain size={22} className="text-purple-400" />
        <h2 className="text-xl font-bold text-white">Cozy Core Memory</h2>
        <span className="ml-auto text-xs px-3 py-1 rounded-full bg-purple-500/10 border border-purple-400/30 text-purple-300 font-mono">
          {memoryItems.length} entries
        </span>
      </div>
      {memoryItems.map((item, idx) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.07 }}
          whileHover={{ x: 4 }}
          className="flex items-start gap-4 p-4 rounded-2xl relative overflow-hidden group"
          style={{ background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(148,163,184,0.1)' }}
        >
          <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: item.color, boxShadow: `0 0 12px ${item.color}` }} />
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}18`, border: `1px solid ${item.color}40` }}>
            <Brain size={16} style={{ color: item.color }} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-mono tracking-widest" style={{ color: item.color }}>{item.category}</p>
            <p className="text-sm text-slate-200 mt-1">{item.content}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )

  // ════════════════ CRON TAB ════════════════
  const CronTab = () => (
    <div className="space-y-4 max-w-4xl mx-auto pt-4">
      <div className="flex items-center gap-3 mb-2">
        <CalendarClock size={22} className="text-amber-400" />
        <h2 className="text-xl font-bold text-white">Cozy Cron Manager</h2>
        <span className="ml-auto text-xs px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 font-mono">
          {cronItems.filter(c => c.status === 'active').length}/{cronItems.length} active
        </span>
      </div>
      {cronItems.map((job, idx) => (
        <motion.div
          key={job.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.07 }}
          className="flex items-center justify-between p-4 rounded-2xl"
          style={{ background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(148,163,184,0.1)' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10 border border-amber-400/30">
              <CalendarClock size={16} className="text-amber-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{job.name}</p>
              <p className="text-xs text-slate-500 font-mono">{job.schedule} · last: {job.lastRun}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold ${job.status === 'active'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-400/20'
              : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
              }`}>
              {job.status}
            </span>
            <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${job.status === 'active'
              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
              }`}>
              {job.status === 'active' ? <Pause size={13} /> : <Play size={13} />}
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  )

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black font-display">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-sky-300 to-violet-300 drop-shadow-[0_0_22px_rgba(56,189,248,0.65)]">
            Cozy Agentic
          </span>
          <Sparkles className="inline-block text-yellow-300 ml-3 animate-pulse" size={26} />
        </h1>
        <p className="text-slate-400 text-sm font-mono mt-1 mb-4">Neural Link Interface • v3.0</p>

        {/* Tab switcher — floating pill kiri, di bawah judul */}
        <div className="flex justify-start">
        <div
          className="inline-flex items-center gap-1 p-1.5 rounded-full"
          style={{
            background: 'linear-gradient(160deg, rgba(16,28,52,0.97), rgba(7,14,30,0.99))',
            border: '1px solid rgba(96,140,220,0.22)',
            boxShadow: '0 10px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(140,180,255,0.08)'
          }}
        >
          {([
            { key: 'voice', icon: AudioLines, label: 'Voice', hex: '#e879f9' },
            { key: 'chat', icon: MessageSquare, label: 'Chat Session', hex: '#34d399' },
            { key: 'memory', icon: Brain, label: 'Memory', hex: '#a78bfa' },
            { key: 'cron', icon: CalendarClock, label: 'Cron', hex: '#fbbf24' },
          ] as { key: Tab; icon: typeof Mic; label: string; hex: string }[]).map(t => {
            const isActive = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="relative flex items-center gap-2 px-4 py-2.5 rounded-full transition-all"
              >
                {isActive && (
                  <motion.div
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  >
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `linear-gradient(160deg, ${t.hex}E6, ${t.hex})`,
                        boxShadow: `inset 0 1px 1px rgba(255,255,255,0.35), inset 0 -2px 3px rgba(0,0,0,0.15), 0 4px 14px ${t.hex}55`
                      }}
                    />
                    <div
                      className="absolute inset-x-0 top-0"
                      style={{
                        height: '46%',
                        borderRadius: '999px 999px 40% 40% / 999px 999px 70% 70%',
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0.02))'
                      }}
                    />
                  </motion.div>
                )}
                <t.icon size={15} className={`relative z-10 ${isActive ? 'text-white' : 'text-slate-500'}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`relative z-10 text-[13px] hidden sm:inline font-semibold tracking-wide ${
                  isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}>
                  {t.label}
                </span>
              </button>
            )
          })}
        </div>
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
        >
          {/* dipanggil sebagai fungsi (bukan <Comp />) agar tidak remount saat parent re-render — fix bug input reset */}
          {tab === 'voice' && VoiceTab()}
          {tab === 'chat' && ChatTab()}
          {tab === 'memory' && MemoryTab()}
          {tab === 'cron' && CronTab()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
