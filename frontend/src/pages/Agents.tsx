import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html, RoundedBox, Text } from '@react-three/drei'
import {
  Flame, Code, BarChart3, Palette, Eye, Shield, PenTool, Bird, Gamepad2,
  Network, X, Send, Zap, MessageSquare, Cpu, Activity, ListTodo,
  LayoutGrid, Building2, Brain, Maximize2, Minimize2, CalendarClock
} from 'lucide-react'

// ─────────────────────────────────────────────────────────
// Agent data (shared by both views)
// ─────────────────────────────────────────────────────────
interface SubAgent {
  id: string
  name: string
  role: string
  icon: typeof Cpu
  color: string
  status: 'working' | 'idle' | 'sleeping' | 'break'
  tasks: number
  efficiency: number
  model: string
  activity: string
}

const AGENTS: SubAgent[] = [
  { id: 'cozy',    name: 'COZY',     role: 'Orchestrator',           icon: Cpu,       color: '#FBBF24', status: 'working',  tasks: 4803, efficiency: 93, model: 'ox-alpha',        activity: 'Mengatur workflow global' },
  { id: 'nova',    name: 'NOVA',     role: 'Research & Analysis',     icon: Flame,     color: '#EC4899', status: 'working',   tasks: 342,  efficiency: 94, model: 'claude-sonnet-4', activity: 'Riset pasar akun FF' },
  { id: 'cipher',  name: 'CIPHER',   role: 'Code & Development',      icon: Code,      color: '#10B981', status: 'break',     tasks: 567,  efficiency: 98, model: 'claude-sonnet-4', activity: 'Ngopi dulu ☕ — deploy selesai' },
  { id: 'atlas',   name: 'ATLAS',    role: 'Finance & Tracking',      icon: BarChart3, color: '#F59E0B', status: 'working',   tasks: 891,  efficiency: 96, model: 'gpt-4o',          activity: 'Rekap keuangan Agustus' },
  { id: 'pixel',   name: 'PIXEL',    role: 'Image & Creative',        icon: Palette,   color: '#06B6D4', status: 'sleeping',  tasks: 234,  efficiency: 88, model: 'dall-e-3',        activity: 'Tidur — tidak ada task desain' },
  { id: 'oracle',  name: 'ORACLE',   role: 'Insights & Predictions',  icon: Eye,       color: '#8B5CF6', status: 'working',   tasks: 156,  efficiency: 92, model: 'gemini-pro',      activity: 'Prediksi tren Q4' },
  { id: 'sentinel',name: 'SENTINEL', role: 'Security & Monitoring',   icon: Shield,    color: '#EF4444', status: 'working',   tasks: 1203, efficiency: 99, model: 'claude-sonnet-4', activity: 'Scan log gateway' },
  { id: 'aurora',  name: 'AURORA',   role: 'Content & Writing',       icon: PenTool,   color: '#14B8A6', status: 'idle',      tasks: 445,  efficiency: 85, model: 'gpt-4o',          activity: 'Menunggu brief konten' },
  { id: 'phoenix', name: 'PHOENIX',  role: 'Automation & Tasks',      icon: Bird,      color: '#F97316', status: 'working',   tasks: 678,  efficiency: 95, model: 'claude-sonnet-4', activity: 'Auto-reply Telegram' },
  { id: 'zephra',  name: 'ZEPHRA',   role: 'Stock & Commerce',        icon: Gamepad2,  color: '#A855F7', status: 'working',   tasks: 287,  efficiency: 91, model: 'claude-sonnet-4', activity: 'Sinkron 272 stok akun' },
]

const STATUS_META: Record<string, { label: string; dot: string }> = {
  working:  { label: 'Working',  dot: '#34D399' },
  idle:     { label: 'Idle',     dot: '#94A3B8' },
  sleeping: { label: '😴 Sleeping', dot: '#60A5FA' },
  break:    { label: '☕ Break',    dot: '#FBBF24' },
}

// ─────────────────────────────────────────────────────────
// VIEW 1: Workflow Cards — structured 3-tier layout with
// full identity cards connected by an SVG layer
// ─────────────────────────────────────────────────────────
const TIER1 = ['cozy']
const TIER2 = ['nova', 'cipher', 'atlas', 'pixel', 'oracle']
const TIER3 = ['sentinel', 'aurora', 'phoenix', 'zephra']

function WorkflowView({ onOpen, selectedId }: { onOpen: (a: SubAgent) => void; selectedId: string | null }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [cardRects, setCardRects] = useState<Record<string, { cx: number; top: number; bottom: number }>>({})

  // measure card centers so SVG lines connect card-edge → card-edge
  useEffect(() => {
    const measure = () => {
      const el = containerRef.current
      if (!el) return
      const base = el.getBoundingClientRect()
      const next: Record<string, { cx: number; top: number; bottom: number }> = {}
      AGENTS.forEach(a => {
        const card = el.querySelector(`[data-card="${a.id}"]`) as HTMLElement | null
        if (!card) return
        const r = card.getBoundingClientRect()
        next[a.id] = {
          cx: r.left + r.width / 2 - base.left,
          top: r.top - base.top,
          bottom: r.bottom - base.top,
        }
      })
      setCardRects(next)
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (containerRef.current) ro.observe(containerRef.current)
    window.addEventListener('resize', measure)
    return () => { ro.disconnect(); window.removeEventListener('resize', measure) }
  }, [])

  const edge = (from: string, to: string) => {
    const f = cardRects[from], t = cardRects[to]
    if (!f || !t) return null
    const x1 = f.cx, y1 = f.bottom, x2 = t.cx, y2 = t.top
    const my = (y1 + y2) / 2
    const path = `M ${x1},${y1} C ${x1},${my} ${x2},${my} ${x2},${y2}`
    return { path, x1, y1, x2, y2 }
  }

  const renderEdges = (pairs: [string, string][]) =>
    pairs.map(([f, t], i) => {
      const e = edge(f, t)
      if (!e) return null
      return (
        <g key={`${f}-${t}`}>
          <path d={e.path} fill="none" stroke="url(#wfGrad)" strokeWidth={1.6} opacity={0.55} />
          <circle r={3} fill="#7DF9FF">
            <animateMotion dur={`${2.4 + i * 0.3}s`} repeatCount="indefinite" path={e.path} />
          </circle>
          <circle r={6.5} fill="#00D4FF" opacity={0.25}>
            <animateMotion dur={`${2.4 + i * 0.3}s`} repeatCount="indefinite" path={e.path} />
          </circle>
        </g>
      )
    })

  const AgentCard = ({ a, tier }: { a: SubAgent; tier: 1 | 2 | 3 }) => {
    const meta = STATUS_META[a.status]
    const isCozy = tier === 1
    const selected = selectedId === a.id
    return (
      <motion.button
        data-card={a.id}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: tier * 0.1 }}
        whileHover={{ y: -4 }}
        onClick={() => onOpen(a)}
        className={`relative text-left rounded-2xl p-4 cursor-pointer group transition-shadow ${isCozy ? 'w-64' : 'w-[13.5rem]'}`}
        style={{
          background: 'linear-gradient(160deg, rgba(16,28,52,0.97), rgba(7,14,30,0.99))',
          border: selected ? `1.5px solid ${a.color}` : '1px solid rgba(96,140,220,0.22)',
          boxShadow: selected
            ? `0 12px 36px rgba(0,0,0,0.45), 0 0 24px ${a.color}44`
            : '0 8px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(140,180,255,0.08)',
        }}
      >
        {/* corner glow */}
        <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl opacity-15 pointer-events-none transition-opacity group-hover:opacity-30"
          style={{ background: a.color }} />

        {/* header: AppIcon iOS + nama + status chip */}
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            {/* AppIcon squircle gradient */}
            <div
              className="relative flex items-center justify-center w-11 h-11 rounded-[13px]"
              style={{
                background: `linear-gradient(160deg, ${a.color}E6, ${a.color})`,
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.35), inset 0 -2px 4px rgba(0,0,0,0.15)',
              }}
            >
              <div
                className="absolute inset-x-0 top-0 pointer-events-none"
                style={{
                  height: '46%',
                  borderRadius: '13px 13px 40% 40% / 13px 13px 70% 70%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0.02))',
                }}
              />
              <a.icon size={20} className="relative z-10 text-white" strokeWidth={2.4} />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-950"
              style={{ backgroundColor: meta.dot, boxShadow: `0 0 8px ${meta.dot}`, opacity: a.status === 'working' ? undefined : 0.75 }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-black tracking-wide text-sm leading-tight" style={{ color: a.color }}>{a.name}</p>
            <p className="text-[10px] text-slate-400 truncate">{a.role}</p>
          </div>
          {/* status chip ala Total Tasks badge */}
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0"
            style={{ color: meta.dot, borderColor: `${meta.dot}55`, background: `${meta.dot}14` }}>
            {meta.label}
          </span>
        </div>

        {/* angka besar ala Total Tasks */}
        <p className="mt-3 text-[26px] font-black font-mono leading-none text-white tracking-tight">
          {a.tasks.toLocaleString('en-US')}
        </p>

        {/* trend row */}
        <div className="mt-1.5 flex items-center gap-2 text-[10px]">
          <span className="flex items-center gap-0.5 text-emerald-400 font-bold">
            ↗ {a.efficiency}%
          </span>
          <span className="text-slate-500">efficiency</span>
          <span className="ml-auto text-slate-600 font-mono truncate max-w-[70px] text-right">{a.model}</span>
        </div>

        {/* activity */}
        <p className="mt-2 text-[11px] text-slate-300 leading-snug line-clamp-1 min-h-[16px]">{a.activity}</p>

        {/* efficiency bar */}
        <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${a.efficiency}%` }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${a.color}, ${a.color}88)`, boxShadow: `0 0 8px ${a.color}66` }}
          />
        </div>
      </motion.button>
    )
  }

  const pick = (ids: string[]) => ids.map(id => AGENTS.find(a => a.id === id)!)

  return (
    <motion.div
      key="workflow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      ref={containerRef}
      className="relative rounded-3xl overflow-hidden px-6 py-8"
      style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.85), rgba(10,15,30,0.95))',
        border: '1px solid rgba(148,163,184,0.12)',
        boxShadow: '0 0 40px rgba(0,212,255,0.07)'
      }}
    >
      {/* faint grid bg */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(0,212,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,.5) 1px,transparent 1px)',
        backgroundSize: '44px 44px'
      }} />

      {/* SVG connection layer — measured, card-edge to card-edge */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        <defs>
          <linearGradient id="wfGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.85" />
          </linearGradient>
        </defs>
        {renderEdges(TIER1.flatMap(c => TIER2.map(t => [c, t] as [string, string])))}
        {renderEdges([
          ['nova', 'sentinel'], ['atlas', 'aurora'],
          ['atlas', 'phoenix'], ['oracle', 'zephra'],
        ])}
      </svg>

      {/* Tier rows */}
      <div className="relative" style={{ zIndex: 2 }}>
        {/* Tier 1 — Manager */}
        <div className="flex justify-center mb-12">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold tracking-[0.25em] text-amber-300/70 uppercase">Manager</span>
            {pick(TIER1).map(a => <AgentCard key={a.id} a={a} tier={1} />)}
          </div>
        </div>

        {/* Tier 2 — Core squad */}
        <div className="flex justify-center mb-12">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold tracking-[0.25em] text-cyan-300/70 uppercase">Core Squad</span>
            <div className="flex flex-wrap justify-center gap-4 max-w-5xl mx-auto">
              {pick(TIER2).map(a => <AgentCard key={a.id} a={a} tier={2} />)}
            </div>
          </div>
        </div>

        {/* Tier 3 — Ops squad */}
        <div className="flex justify-center">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold tracking-[0.25em] text-violet-300/70 uppercase">Ops Squad</span>
            <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
              {pick(TIER3).map(a => <AgentCard key={a.id} a={a} tier={3} />)}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute left-5 bottom-4 flex items-center gap-2 text-[11px] text-slate-400">
        <Zap size={12} className="text-cyan-400" /> Titik bergerak = aliran tugas · klik card untuk chat & assign
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────
// VIEW 2: 3D Office — robots working / sleeping / break
// ─────────────────────────────────────────────────────────

/** A little robot built from primitives */
/** Konstanta seragam & posisi server (shared) */
const UNIFORM_SHIRT = '#2E4057'
const UNIFORM_PANTS = '#222B38'
const SKIN = '#E8B58B'
const HAIR = '#4A3728'
const SERVER_POS: [number, number, number] = [9.2, 0, -9.2]

/** Karakter blok ala Minecraft — pakai SERAGAM kantor, jalan ke server utk simpan memori */
function BlockCharacter({ agent, position, deskPos, rotationY, onClick, isSelected }: {
  agent: SubAgent
  position: [number, number, number]
  deskPos: [number, number, number]
  rotationY: () => number
  onClick: () => void
  isSelected: boolean
}) {
  const group = useRef<THREE.Group>(null)
  const armL = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const carry = useRef<THREE.Group>(null)

  // ── siklus kerja: meja → jalan ke server → simpan memori → jalan balik ──
  const phase = useRef<{ name: 'desk' | 'go' | 'store' | 'back'; t: number }>({ name: 'desk', t: Math.random() * 22 })
  const posRef = useRef(new THREE.Vector3(position[0], position[1], position[2]))
  const isCozy = agent.id === 'cozy'
  const WALK_DUR = isCozy ? 4.5 : 7
  const DESK_DUR = isCozy ? 34 : 24 + (agent.name.charCodeAt(0) % 10)
  const STORE_DUR = 2.6

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime()
    const st = phase.current
    const d = Math.min(delta, 0.1)
    st.t += d

    const charV = new THREE.Vector3(position[0], position[1], position[2])
    const srvV = new THREE.Vector3(SERVER_POS[0], SERVER_POS[1], SERVER_POS[2])
    const ease = (k: number) => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
    let walking = false

    switch (st.name) {
      case 'desk': {
        posRef.current.lerp(charV, 0.15)
        if (st.t > DESK_DUR) { st.name = 'go'; st.t = 0 }
        break
      }
      case 'go': {
        walking = true
        const k = Math.min(1, st.t / WALK_DUR)
        posRef.current.lerpVectors(charV, srvV, ease(k))
        // hadap arah jalan
        const dx = srvV.x - posRef.current.x, dz = srvV.z - posRef.current.z
        if (group.current) group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, Math.atan2(dx, dz), 0.12)
        if (k >= 1) { st.name = 'store'; st.t = 0 }
        break
      }
      case 'store': {
        // menghadap server, memori "diserahkan" (kubus mengecil)
        const dx = srvV.x - posRef.current.x, dz = srvV.z - posRef.current.z
        if (group.current) group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, Math.atan2(dx, dz), 0.1)
        if (carry.current) {
          const s = Math.max(0.05, 1 - st.t / STORE_DUR)
          carry.current.scale.setScalar(s)
          carry.current.position.y = 1.05 + Math.sin(t * 3) * 0.05 + (1 - s) * 0.6
        }
        if (st.t > STORE_DUR) { st.name = 'back'; st.t = 0 }
        break
      }
      case 'back': {
        walking = true
        const k = Math.min(1, st.t / WALK_DUR)
        posRef.current.lerpVectors(srvV, charV, ease(k))
        const dx = charV.x - posRef.current.x, dz = charV.z - posRef.current.z
        if (group.current) group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, Math.atan2(dx, dz), 0.12)
        if (k >= 1) { st.name = 'desk'; st.t = 0 }
        break
      }
    }

    if (!group.current) return
    // posisi + bobbing saat jalan
    group.current.position.set(
      posRef.current.x,
      posRef.current.y + (walking ? Math.abs(Math.sin(t * 9)) * 0.05 : 0),
      posRef.current.z
    )
    if (st.name !== 'go' && st.name !== 'back') {
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, rotationY(), 0.08)
    }

    // animasi kerja sesuai fase
    if (st.name === 'desk') {
      switch (agent.status) {
        case 'working':
          if (armL.current) armL.current.rotation.x = -0.9 + Math.sin(t * 6) * 0.15
          if (armR.current) armR.current.rotation.x = -0.9 + Math.sin(t * 6 + Math.PI) * 0.15
          if (head.current) head.current.rotation.y = Math.sin(t * 0.8) * 0.12
          break
        case 'break':
          if (armR.current) armR.current.rotation.x = -1.9 + Math.sin(t * 1.2) * 0.06
          if (armL.current) armL.current.rotation.x = -0.2
          break
        case 'sleeping':
          if (head.current) head.current.rotation.x = 0.45
          group.current.scale.y = 1 + Math.sin(t * 1.4) * 0.015
          break
        default:
          if (armL.current) armL.current.rotation.x = Math.sin(t * 1.5) * 0.12
          if (armR.current) armR.current.rotation.x = Math.sin(t * 1.5 + Math.PI) * 0.12
          if (head.current) head.current.rotation.y = Math.sin(t * 0.5) * 0.35
      }
    } else if (walking) {
      // ayun lengan saat jalan
      if (armL.current) armL.current.rotation.x = Math.sin(t * 9) * 0.5
      if (armR.current) armR.current.rotation.x = Math.sin(t * 9 + Math.PI) * 0.5
      if (head.current) head.current.rotation.set(0, 0, 0)
    } else if (st.name === 'store') {
      if (armL.current) armL.current.rotation.x = -1.2
      if (armR.current) armR.current.rotation.x = -1.2
    }
  })

  const tie = isCozy ? '#FBBF24' : agent.color
  const shirt = isCozy ? '#1E2A3E' : UNIFORM_SHIRT

  return (
    <group ref={group} position={position} onClick={(e) => { e.stopPropagation(); onClick() }}>
      {/* ═══ KAKI ═══ */}
      {[-0.11, 0.11].map((dx, i) => (
        <mesh key={i} position={[dx, 0.38, 0]} castShadow>
          <boxGeometry args={[0.22, 0.76, 0.24]} />
          <meshLambertMaterial color={UNIFORM_PANTS} />
        </mesh>
      ))}

      {/* ═══ BADAN — seragam kantor navy ═══ */}
      <mesh position={[0, 1.14, 0]} castShadow>
        <boxGeometry args={[0.56, 0.62, 0.32]} />
        <meshLambertMaterial color={shirt} />
      </mesh>
      {/* dasi warna agent */}
      <mesh position={[0, 1.22, 0.168]}>
        <boxGeometry args={[0.08, 0.3, 0.02]} />
        <meshLambertMaterial color={tie} />
      </mesh>
      {/* badge nama di dada */}
      <mesh position={[0.17, 1.05, 0.168]}>
        <boxGeometry args={[0.12, 0.08, 0.02]} />
        <meshLambertMaterial color="#F8FAFC" />
      </mesh>

      {/* ═══ LENGAN — skin (seragam lengan pendek) ═══ */}
      <group ref={armL} position={[-0.39, 1.42, 0]}>
        <mesh position={[0, -0.28, 0]} castShadow>
          <boxGeometry args={[0.2, 0.62, 0.22]} />
          <meshLambertMaterial color={SKIN} />
        </mesh>
      </group>
      <group ref={armR} position={[0.39, 1.42, 0]}>
        <mesh position={[0, -0.28, 0]} castShadow>
          <boxGeometry args={[0.2, 0.62, 0.22]} />
          <meshLambertMaterial color={SKIN} />
        </mesh>
      </group>

      {/* ═══ KEPALA ═══ */}
      <group ref={head} position={[0, 1.78, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.62, 0.62, 0.62]} />
          <meshLambertMaterial color={SKIN} />
        </mesh>
        <mesh position={[0, 0.33, 0]}>
          <boxGeometry args={[0.64, 0.1, 0.64]} />
          <meshLambertMaterial color={HAIR} />
        </mesh>
        <mesh position={[0, 0.24, -0.26]}>
          <boxGeometry args={[0.64, 0.16, 0.1]} />
          <meshLambertMaterial color={HAIR} />
        </mesh>
        {[-0.14, 0.14].map((ex, i) => (
          <group key={i} position={[ex, 0.04, 0.315]}>
            <mesh>
              <boxGeometry args={[0.14, 0.12, 0.02]} />
              <meshLambertMaterial color="#FFFFFF" />
            </mesh>
            <mesh position={[i === 0 ? 0.03 : -0.03, 0, 0.012]}>
              <boxGeometry args={[0.07, 0.12, 0.02]} />
              <meshLambertMaterial color="#3B82F6" />
            </mesh>
          </group>
        ))}
        {/* mulut — senyum sesuai status */}
        <mesh position={[0, agent.status === 'working' ? -0.13 : -0.16, 0.315]}>
          <boxGeometry args={[0.16, agent.status === 'sleeping' ? 0.03 : 0.05, 0.02]} />
          <meshLambertMaterial color={agent.status === 'sleeping' ? '#5B6B7F' : '#8B5A4A'} />
        </mesh>
        {/* alis ekspresif */}
        {[-0.14, 0.14].map((ex, i) => (
          <mesh key={`br-${i}`} position={[ex, 0.14, 0.315]} rotation={[0, 0, i === 0 ? -0.12 : 0.12]}>
            <boxGeometry args={[0.15, 0.045, 0.02]} />
            <meshLambertMaterial color={HAIR} />
          </mesh>
        ))}
        {/* pipi merona */}
        {[-0.24, 0.24].map((cx, i) => (
          <mesh key={`ch-${i}`} position={[cx, -0.08, 0.312]}>
            <boxGeometry args={[0.08, 0.05, 0.015]} />
            <meshLambertMaterial color="#F0A088" />
          </mesh>
        ))}
        {agent.status === 'sleeping' && (
          <Html center position={[0.45, 0.4, 0]} distanceFactor={5}>
            <div style={{ fontSize: 15, userSelect: 'none' }}>
              <motion.span animate={{ y: [0, -7, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}>💤</motion.span>
            </div>
          </Html>
        )}
      </group>

      {/* ═══ KUBUS MEMORI dibawa tangan saat menuju server ═══ */}
      <group ref={carry} position={[0, 1.05, 0.42]} visible={false}>
        <mesh>
          <boxGeometry args={[0.22, 0.22, 0.22]} />
          <meshStandardMaterial color="#4ADE80" emissive="#22C55E" emissiveIntensity={1.4} />
        </mesh>
      </group>

      {/* cangkir kopi saat break */}
      {agent.status === 'break' && (
        <mesh position={[0.42, 1.05, 0.28]}>
          <boxGeometry args={[0.12, 0.14, 0.12]} />
          <meshLambertMaterial color="#F8FAFC" />
        </mesh>
      )}

      {/* name tag */}
      <Html center position={[0, 2.45, 0]} distanceFactor={7} zIndexRange={[20, 10]}>
        <button
          onClick={(e) => { e.stopPropagation(); onClick() }}
          className="px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer transition-transform hover:scale-105"
          style={{
            background: 'rgba(10,15,30,0.92)',
            border: `1px solid ${agent.color}`,
            color: agent.color,
            boxShadow: `0 0 12px ${agent.color}44`,
            fontFamily: 'JetBrains Mono, monospace'
          }}
        >
          {agent.name} · {STATUS_META[agent.status].label}
        </button>
      </Html>

      {isSelected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.62, 0.78, 4, 1]} />
          <meshBasicMaterial color={agent.color} transparent opacity={0.85} />
        </mesh>
      )}
    </group>
  )
}

/** Desk with glowing monitor + office chair */
function Workstation({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      {/* tabletop kayu ala Minecraft */}
      <mesh position={[0, 0.78, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.15, 0.08, 0.6]} />
        <meshLambertMaterial color="#B08968" />
      </mesh>
      {/* kaki kayu */}
      {[[-0.5, -0.24], [0.5, -0.24]].map(([dx, dz], i) => (
        <mesh key={i} position={[dx, 0.39, dz]} castShadow>
          <boxGeometry args={[0.09, 0.78, 0.09]} />
          <meshLambertMaterial color="#8B5E3C" />
        </mesh>
      ))}
      {/* ═══ DUAL MONITOR canggih (bezel tipis + stand metal) ═══ */}
      {[-0.34, 0.34].map((dx, i) => (
        <group key={i} position={[dx, 0.86, -0.14]}>
          {/* stand */}
          <mesh position={[0, 0.06, 0]}>
            <boxGeometry args={[0.16, 0.03, 0.16]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.16, 0]}>
            <boxGeometry args={[0.035, 0.22, 0.035]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* bezel */}
          <mesh position={[0, 0.38, 0]}>
            <boxGeometry args={[0.56, 0.36, 0.035]} />
            <meshStandardMaterial color="#111827" metalness={0.5} roughness={0.4} />
          </mesh>
          {/* layar glow */}
          <mesh position={[0, 0.38, 0.02]}>
            <planeGeometry args={[0.51, 0.31]} />
            <meshBasicMaterial color={color} transparent opacity={0.75} />
          </mesh>
          {/* lampu power bawah bezel */}
          <mesh position={[0, 0.215, 0.02]}>
            <boxGeometry args={[0.05, 0.012, 0.01]} />
            <meshBasicMaterial color="#4ADE80" />
          </mesh>
        </group>
      ))}

      {/* ═══ PC TOWER RGB di samping meja ═══ */}
      <group position={[0.72, 0, -0.05]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.26, 0.72, 0.5]} />
          <meshStandardMaterial color="#0F172A" metalness={0.6} roughness={0.35} />
        </mesh>
        {/* panel kaca samping */}
        <mesh position={[0.135, 0.5, 0]}>
          <boxGeometry args={[0.01, 0.6, 0.4]} />
          <meshStandardMaterial color="#1E293B" metalness={0.9} roughness={0.1} transparent opacity={0.7} />
        </mesh>
        {/* kipas RGB 3 tingkat */}
        {[0.28, 0.5, 0.72].map((y, i) => (
          <mesh key={i} position={[0.14, y, 0]}>
            <torusGeometry args={[0.07, 0.02, 8, 16]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.6} />
          </mesh>
        ))}
        {/* power LED */}
        <mesh position={[0, 0.9, 0.26]}>
          <boxGeometry args={[0.04, 0.02, 0.01]} />
          <meshBasicMaterial color="#4ADE80" />
        </mesh>
      </group>
    </group>
  )
}

/** Office chair behind each robot */
function OfficeChair({ position, color }: { position: [number, number, number]; color: string }) {
  const c = new THREE.Color(color)
  return (
    <group position={position}>
      {/* seat */}
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[0.34, 0.06, 0.34]} />
        <meshStandardMaterial color="#1E293B" roughness={0.7} />
      </mesh>
      {/* backrest */}
      <mesh position={[0, 0.68, -0.16]}>
        <boxGeometry args={[0.32, 0.44, 0.05]} />
        <meshStandardMaterial color={c.getStyle()} metalness={0.4} roughness={0.5} transparent opacity={0.85} />
      </mesh>
      {/* gas lift */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.22, 10]} />
        <meshStandardMaterial color="#475569" metalness={0.6} />
      </mesh>
      {/* base + wheels */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.14, 0.16, 0.04, 12]} />
        <meshStandardMaterial color="#334155" metalness={0.5} />
      </mesh>
    </group>
  )
}

/** Floor with grid */
function OfficeFloor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#0A0F1E" metalness={0.4} roughness={0.7} />
      </mesh>
      <gridHelper args={[40, 40, '#132033', '#101828']} position={[0, 0.001, 0]} />
    </group>
  )
}

function OfficeScene({ onOpen, selectedId, brainAgentId }: { onOpen: (a: SubAgent) => void; selectedId: string | null; brainAgentId: string | null }) {
  // meja masing-magent di dekat tembok (posisi melingkar di pinggir ruangan)
  const layout: { id: string; pos: [number, number, number]; wall: 'back' | 'left' | 'right' }[] = [
    { id: 'nova',     pos: [-5.5, 0, -10.5], wall: 'back' },
    { id: 'cipher',   pos: [-2.2, 0, -10.5], wall: 'back' },
    { id: 'atlas',    pos: [1.2, 0, -10.5],  wall: 'back' },
    { id: 'pixel',    pos: [4.5, 0, -10.5],  wall: 'back' },
    { id: 'oracle',   pos: [7.8, 0, -10.5],  wall: 'back' },
    { id: 'sentinel', pos: [-10.5, 0, -4],   wall: 'left' },
    { id: 'aurora',   pos: [-10.5, 0, -0.5], wall: 'left' },
    { id: 'phoenix',  pos: [10.5, 0, -4],    wall: 'right' },
    { id: 'zephra',   pos: [10.5, 0, -0.5],  wall: 'right' },
  ]

  // hadap tembok (dari meja ke arah dinding)
  const faceWall = (wall: string) => wall === 'back' ? Math.PI : wall === 'left' ? -Math.PI / 2 : Math.PI / 2

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 12, 6]} intensity={0.9} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <pointLight position={[0, 4.5, 0]} intensity={1.2} color="#BFE3FF" />

      <MinecraftRoom />
      <Furniture />

      {/* ═══ SERVER MEMORI — pojok kanan belakang ═══ */}
      <MemoryServer position={SERVER_POS} brainAgentId={brainAgentId} />

      {layout.map((slot) => {
        const agent = AGENTS.find(a => a.id === slot.id)!
        const rot = faceWall(slot.wall)
        // meja sedikit di depan karakter (ke arah tembok)
        const deskOff: [number, number, number] =
          slot.wall === 'back' ? [slot.pos[0], 0, slot.pos[2] - 1.0]
          : slot.wall === 'left' ? [slot.pos[0] - 1.0, 0, slot.pos[2]]
          : [slot.pos[0] + 1.0, 0, slot.pos[2]]
        return (
          <group key={slot.id}>
            <Workstation position={deskOff} color={agent.color} />
            <BlockCharacter
              agent={agent}
              position={slot.pos}
              deskPos={deskOff}
              rotationY={() => rot}
              onClick={() => onOpen(agent)}
              isSelected={selectedId === slot.id}
            />
            <mesh position={[slot.pos[0], 0.012, slot.pos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
              <boxGeometry args={[1.3, 0.02, 1.3]} />
              <meshLambertMaterial color={agent.color} transparent opacity={0.28} />
            </mesh>
          </group>
        )
      })}

      {/* ═══ ZONA COZY — premium di tengah ruangan ═══ */}
      <group position={[0, 0, 2.5]}>
        {/* meja manajer premium (lebih besar, kayu gelap) */}
        <group position={[0, 0.14, -1.1]}>
          <mesh position={[0, 0.72, 0]} castShadow>
            <boxGeometry args={[2.6, 0.1, 1.1]} />
            <meshLambertMaterial color="#5D4037" />
          </mesh>
          {[-1.15, 1.15].map((dx, i) => (
            <mesh key={i} position={[dx, 0.36, 0]} castShadow>
              <boxGeometry args={[0.14, 0.72, 0.9]} />
              <meshLambertMaterial color="#4E342E" />
            </mesh>
          ))}
          {/* ═══ DUAL MONITOR ULTRA-WIDE premium ═══ */}
          {[-0.62, 0.62].map((dx, i) => (
            <group key={i} position={[dx, 1.0, -0.25]}>
              <mesh position={[0, 0.08, 0]}>
                <boxGeometry args={[0.18, 0.03, 0.18]} />
                <meshStandardMaterial color="#D4AF37" metalness={0.85} roughness={0.25} />
              </mesh>
              <mesh position={[0, 0.22, 0]}>
                <boxGeometry args={[0.04, 0.28, 0.04]} />
                <meshStandardMaterial color="#D4AF37" metalness={0.85} roughness={0.25} />
              </mesh>
              <mesh position={[0, 0.48, 0]}>
                <boxGeometry args={[0.95, 0.55, 0.045]} />
                <meshStandardMaterial color="#0B1120" metalness={0.6} roughness={0.3} />
              </mesh>
              <mesh position={[0, 0.48, 0.028]}>
                <planeGeometry args={[0.88, 0.48]} />
                <meshBasicMaterial color="#FBBF24" transparent opacity={0.65} />
              </mesh>
              <mesh position={[0, 0.225, 0.028]}>
                <boxGeometry args={[0.06, 0.014, 0.01]} />
                <meshBasicMaterial color="#4ADE80" />
              </mesh>
            </group>
          ))}
          {/* PC tower emas */}
          <group position={[1.35, 0, -0.1]}>
            <mesh position={[0, 0.55, 0]} castShadow>
              <boxGeometry args={[0.3, 0.85, 0.55]} />
              <meshStandardMaterial color="#1B2536" metalness={0.7} roughness={0.3} />
            </mesh>
            {[0.32, 0.55, 0.78].map((y, i) => (
              <mesh key={i} position={[0.16, y, 0]}>
                <torusGeometry args={[0.08, 0.022, 8, 16]} />
                <meshStandardMaterial color="#FBBF24" emissive="#FBBF24" emissiveIntensity={1.8} />
              </mesh>
            ))}
          </group>
          {/* tanaman meja */}
          <mesh position={[-1.15, 0.92, 0.2]}>
            <boxGeometry args={[0.16, 0.14, 0.16]} />
            <meshLambertMaterial color="#8D6E63" />
          </mesh>
          <mesh position={[-1.15, 1.06, 0.2]}>
            <boxGeometry args={[0.2, 0.18, 0.2]} />
            <meshLambertMaterial color="#66BB6A" />
          </mesh>
        </group>
        {/* COZY duduk menghadap ruangan */}
        <BlockCharacter
          agent={AGENTS.find(a => a.id === 'cozy')!}
          position={[0, 0, 0.35]}
          deskPos={[0, 0, -1.1]}
          rotationY={() => Math.PI}
          onClick={() => onOpen(AGENTS.find(a => a.id === 'cozy')!)}
          isSelected={selectedId === 'cozy'}
        />
        <Text position={[0, 3.2, -1]} fontSize={0.3} color="#8D6E63" anchorX="center" fontWeight="bold" letterSpacing={0.05}>
          COZY — EXECUTIVE SUITE
        </Text>
      </group>
    </>
  )
}

/** Furniture kantor: sofa lounge, tanaman, water cooler, whiteboard, karpet pusat */
function Furniture() {
  return (
    <group>
      {/* karpet pusat besar */}
      <mesh position={[0, 0.01, 2.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[9, 0.015, 6]} />
        <meshLambertMaterial color="#CFE0F0" />
      </mesh>

      {/* sofa lounge kiri-depan */}
      <group position={[-6.5, 0, 5.5]} rotation={[0, 0.5, 0]}>
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[2.6, 0.5, 0.9]} />
          <meshLambertMaterial color="#7C9EB8" />
        </mesh>
        <mesh position={[0, 0.75, -0.35]} castShadow>
          <boxGeometry args={[2.6, 0.6, 0.25]} />
          <meshLambertMaterial color="#6B8DAB" />
        </mesh>
        {[-1.15, 1.15].map((dx, i) => (
          <mesh key={i} position={[dx, 0.55, 0]}>
            <boxGeometry args={[0.25, 0.45, 0.9]} />
            <meshLambertMaterial color="#6B8DAB" />
          </mesh>
        ))}
        {/* meja kopi */}
        <mesh position={[0, 0.28, 1.1]}>
          <boxGeometry args={[0.9, 0.08, 0.9]} />
          <meshLambertMaterial color="#8B5E3C" />
        </mesh>
      </group>

      {/* tanaman besar di pojok-pojok */}
      {[[-12.5, -12.5], [12.5, -12.5], [-12.5, 8], [12.5, 8]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <boxGeometry args={[0.5, 0.6, 0.5]} />
            <meshLambertMaterial color="#8D6E63" />
          </mesh>
          <mesh position={[0, 1.0, 0]} castShadow>
            <boxGeometry args={[0.9, 1.1, 0.9]} />
            <meshLambertMaterial color="#4CAF50" />
          </mesh>
          <mesh position={[0, 1.6, 0]}>
            <boxGeometry args={[0.5, 0.4, 0.5]} />
            <meshLambertMaterial color="#66BB6A" />
          </mesh>
        </group>
      ))}

      {/* water cooler kanan-depan */}
      <group position={[8.5, 0, 6.5]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.5, 1.0, 0.5]} />
          <meshLambertMaterial color="#B0BEC5" />
        </mesh>
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[0.4, 0.5, 0.4]} />
          <meshStandardMaterial color="#4FC3F7" transparent opacity={0.75} />
        </mesh>
      </group>

      {/* whiteboard di dinding belakang-tengah */}
      <group position={[0, 2.6, -14.6]}>
        <mesh>
          <boxGeometry args={[5, 2.2, 0.08]} />
          <meshLambertMaterial color="#FAFAFA" />
        </mesh>
        <mesh position={[0, 0, 0.06]}>
          <boxGeometry args={[4.6, 1.8, 0.02]} />
          <meshLambertMaterial color="#E3F2FD" />
        </mesh>
        {/* coretan diagram */}
        {[-1.5, -0.5, 0.5, 1.5].map((x, i) => (
          <mesh key={i} position={[x, i % 2 ? 0.3 : -0.2, 0.08]}>
            <boxGeometry args={[0.7, 0.06, 0.01]} />
            <meshLambertMaterial color={i % 2 ? '#EF5350' : '#43A047'} />
          </mesh>
        ))}
      </group>

      {/* rak arsip dekat dinding kiri */}
      <group position={[-14.4, 0, 4]}>
        {[0, 1, 2].map(i => (
          <mesh key={i} position={[0, 0.4 + i * 0.55, 0]} castShadow>
            <boxGeometry args={[0.5, 0.45, 2.4]} />
            <meshLambertMaterial color={i % 2 ? '#90A4AE' : '#78909C'} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** Ruangan kotak putih ala Minecraft: lantai + 4 dinding blok */
function MinecraftRoom() {
  const W = 19   // half-width (mewah & luas)
  const H = 7.5  // plafon tinggi
  return (
    <group>
      {/* lantai marmer checkerboard mewah */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[W * 2, W * 2]} />
        <meshLambertMaterial color="#F4F7FB" />
      </mesh>
      <gridHelper args={[W * 2, 19, '#C9D6E4', '#E8EFF6']} position={[0, 0.002, 0]} />

      {/* ═══ DINDING satu-arah (plane menghadap ke dalam — invisible dari luar) ═══ */}
      {/* dinding belakang DIHAPUS — biar meja COZY & tembok kerja tidak tertutup */}

      {/* dinding kiri (menghadap kanan/dalam) */}
      <mesh position={[-W, H / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[W * 2, H]} />
        <meshLambertMaterial color="#E8EEF6" side={THREE.FrontSide} />
      </mesh>
      {/* dinding kanan (menghadap kiri/dalam) */}
      <mesh position={[W, H / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[W * 2, H]} />
        <meshLambertMaterial color="#E8EEF6" side={THREE.FrontSide} />
      </mesh>
      {/* plafon menghadap ke bawah */}
      <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W * 2, W * 2]} />
        <meshLambertMaterial color="#F8FAFD" side={THREE.FrontSide} />
      </mesh>
      {/* chandelier kristal tengah */}
      <group position={[0, H - 1.6, 0]}>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 1.0, 8]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.85} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.35, 12, 12]} />
          <meshStandardMaterial color="#FFF7D6" emissive="#FFE9A8" emissiveIntensity={1.6} />
        </mesh>
        {[0, 1, 2, 3].map(i => {
          const a = (i / 4) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 0.55, -0.35, Math.sin(a) * 0.55]}>
              <sphereGeometry args={[0.12, 10, 10]} />
              <meshStandardMaterial color="#FFF7D6" emissive="#FFE9A8" emissiveIntensity={1.3} />
            </mesh>
          )
        })}
      </group>

      {/* lampu plafon ala Minecraft (glowstone strip) */}
      {[-8, -4, 0, 4, 8].map((x, i) => (
        <mesh key={i} position={[x, H - 0.4, 0]}>
          <boxGeometry args={[3, 0.14, 1.6]} />
          <meshStandardMaterial color="#FFF7D6" emissive="#FFE9A8" emissiveIntensity={0.9} />
        </mesh>
      ))}
      {[[-8, -5], [0, -5], [8, -5], [-8, 5], [0, 5], [8, 5]].map(([x, z], i) => (
        <mesh key={`s-${i}`} position={[x, H - 0.4, z]}>
          <boxGeometry args={[2.4, 0.14, 1.4]} />
          <meshStandardMaterial color="#FFF7D6" emissive="#FFE9A8" emissiveIntensity={0.8} />
        </mesh>
      ))}
    </group>
  )
}

/** Server memori — di pojok ruangan, agent datang utk menyimpan memori */
function MemoryServer({ position, brainAgentId }: { position: [number, number, number]; brainAgentId: string | null }) {
  const blinkRef = useRef<THREE.MeshStandardMaterial>(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (blinkRef.current) {
      blinkRef.current.emissiveIntensity = 1.2 + Math.sin(t * 4) * 0.8
    }
  })

  const racks = [-0.9, 0, 0.9]
  return (
    <group position={position} rotation={[0, Math.PI * 0.75, 0]}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[2.4, 2.2, 1]} />
        <meshLambertMaterial color="#3B4657" />
      </mesh>
      {racks.map((y, i) => (
        <group key={i} position={[0, 0.55 + i * 0.55, 0.51]}>
          <mesh>
            <boxGeometry args={[2.1, 0.38, 0.06]} />
            <meshLambertMaterial color="#1F2937" />
          </mesh>
          {[0, 1, 2, 3, 4, 5].map(j => (
            <mesh key={j} position={[-0.8 + j * 0.16, 0.05, 0.04]}>
              <boxGeometry args={[0.07, 0.07, 0.02]} />
              <meshStandardMaterial
                color={brainAgentId ? '#4ADE80' : '#22C55E'}
                emissive="#22C55E"
                emissiveIntensity={0.8 + ((i + j) % 3) * 0.4}
              />
            </mesh>
          ))}
          <mesh position={[0.55, 0.02, 0.045]}>
            <planeGeometry args={[0.7, 0.18]} />
            <meshStandardMaterial ref={i === 1 ? blinkRef : undefined} color="#0B1120" emissive="#38BDF8" emissiveIntensity={1} />
          </mesh>
        </group>
      ))}
      <Text position={[0, 2.75, 0.2]} fontSize={0.26} color="#475569" anchorX="center" fontWeight="bold" letterSpacing={0.05}>
        MEMORY SERVER
      </Text>
      <mesh position={[0.9, 2.6, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1, 8]} />
        <meshStandardMaterial color="#64748B" />
      </mesh>
      <mesh position={[0.9, 3.15, 0]}>
        <sphereGeometry args={[0.08, 10, 10]} />
        <meshStandardMaterial color="#4ADE80" emissive="#22C55E" emissiveIntensity={1.6} />
      </mesh>
    </group>
  )
}

function OfficeView({ onOpen, selectedId }: { onOpen: (a: SubAgent) => void; selectedId: string | null }) {
  const [isFull, setIsFull] = useState(false)

  // ESC untuk keluar fullscreen
  useEffect(() => {
    if (!isFull) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFull(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isFull])

  const canvas = (
    <motion.div
      key="office"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="relative overflow-hidden"
      style={isFull ? {
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        zIndex: 9999, borderRadius: 0,
        background: '#DDE7F2',
      } : {
        borderRadius: 24,
        height: '62vh', minHeight: 520,
        background: 'linear-gradient(180deg, #0B1226 0%, #05070F 100%)',
        border: '1px solid rgba(148,163,184,0.12)',
        boxShadow: '0 0 40px rgba(0,212,255,0.07)'
      }}
    >
      <Canvas shadows camera={{ position: [0, 6.2, 17], fov: 48 }} gl={{ antialias: true }}>
        <color attach="background" args={['#DDE7F2']} />
        <fog attach="fog" args={['#DDE7F2', 26, 48]} />
        <OfficeScene onOpen={onOpen} selectedId={selectedId} brainAgentId={null} />
        <OrbitControls
          target={[0, 1, 0]}
          minDistance={6} maxDistance={26}
          maxPolarAngle={Math.PI / 2.1}
          enablePan={false}
          enableDamping
        />
      </Canvas>

      <div className="absolute left-5 bottom-4 flex flex-wrap items-center gap-4 text-[11px] text-slate-300 bg-slate-900/70 backdrop-blur px-4 py-2.5 rounded-xl border border-white/10">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#34D399', boxShadow: '0 0 8px #34D399' }} /> Working — ngetik</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#FBBF24', boxShadow: '0 0 8px #FBBF24' }} /> ☕ Break — ngopi</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#60A5FA', boxShadow: '0 0 8px #60A5FA' }} /> 😴 Sleeping</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#94A3B8' }} /> Idle</span>
        <span className="text-slate-500">· drag putar · scroll zoom · klik robot</span>
      </div>

      {/* Tombol fullscreen ala YouTube — pojok kanan bawah */}
      <button
        onClick={() => setIsFull(!isFull)}
        title={isFull ? 'Keluar layar penuh (Esc)' : 'Layar penuh'}
        className="absolute right-4 bottom-4 w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95"
        style={{
          background: 'rgba(10,15,30,0.75)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.18)',
          boxShadow: '0 6px 18px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)'
        }}
      >
        {isFull ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
      </button>

      {/* hint ESC saat fullscreen */}
      {isFull && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[11px] text-slate-600 bg-white/70 backdrop-blur px-3 py-1.5 rounded-full font-mono">
          tekan ESC untuk keluar
        </div>
      )}
    </motion.div>
  )

  // fullscreen: render di document.body lewat portal biar lepas dari transform parent
  return isFull ? createPortal(canvas, document.body) : canvas
}

// ─────────────────────────────────────────────────────────
// Chat session panel — BELOW the 3D/card layout
// ─────────────────────────────────────────────────────────
function ChatSessionPanel({ agent, onClose, tab, onTabChange }: { agent: SubAgent | null; onClose: () => void; tab: AgentTab; onTabChange: (t: AgentTab) => void }) {
  const [chat, setChat] = useState<{ role: 'user' | 'agent'; text: string }[]>([])
  const [memories, setMemories] = useState<{ id: number; content: string; time: string; kind: string }[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [showMemory, setShowMemory] = useState(true)
  const [agentId, setAgentId] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const onSwitchTab = (t: AgentTab) => onTabChange?.(t)

  useEffect(() => {
    if (agent && agent.id !== agentId) {
      setAgentId(agent.id)
      setChat([])
      setInput('')
      // muat otak: memori + riwayat chat dari server
      fetch(`/api/brain/${agent.id}/memory`)
        .then(r => r.json())
        .then(d => {
          setMemories(d.memories || [])
          setChat((d.chats || []).map((c: { role: string; text: string }) => ({
            role: c.role === 'user' ? 'user' : 'agent',
            text: c.text,
          })))
          if ((d.chats || []).length === 0) {
            setChat([{
              role: 'agent',
              text: `${agent.name} online! 🧠 Otak siap — ${memories.length ? memories.length : 0} memori termuat. Ada tugas, Bos?`
            }])
          }
        })
        .catch(() => setChat([{ role: 'agent', text: `${agent.name} online! (otak belum terhubung)` }]))
    }
  }, [agent])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat, thinking])

  const send = () => {
    if (!input.trim() || !agent || thinking) return
    const q = input.trim()
    setChat(prev => [...prev, { role: 'user', text: q }])
    setInput('')
    setThinking(true)
    // REAL: forward ke otak agent (LLM + memori)
    fetch('/api/brain/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: agent.id, message: q }),
    })
      .then(r => r.json())
      .then(d => {
        setChat(prev => [...prev, { role: 'agent', text: d.reply || '(tidak ada jawaban)' }])
        // auto-ingat: kalau pesan user mengandung "ingat"/"catat", simpan ke memori
        if (/\b(ingat|catat|remember)\b/i.test(q)) {
          fetch('/api/brain/memory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agent_id: agent.id, content: q }),
          }).then(() => fetch(`/api/brain/${agent.id}/memory`))
            .then(r => r.json())
            .then(d => setMemories(d.memories || []))
            .catch(() => {})
        }
      })
      .catch(() => setChat(prev => [...prev, { role: 'agent', text: '⚠️ Koneksi otak terganggu, coba lagi Bos.' }]))
      .finally(() => setThinking(false))
  }

  const addManualMemory = () => {
    if (!agent) return
    const fact = prompt(`Memori baru untuk ${agent.name}:`)
    if (!fact?.trim()) return
    fetch('/api/brain/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: agent.id, content: fact.trim() }),
    })
      .then(() => fetch(`/api/brain/${agent.id}/memory`))
      .then(r => r.json())
      .then(d => setMemories(d.memories || []))
      .catch(() => {})
  }

  return (
    <AnimatePresence>
      {agent && (
        <motion.div
          key={agent.id}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: 'spring', damping: 24 }}
          className="mt-4 rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(170deg, rgba(16,28,52,0.97), rgba(7,14,30,0.99))', border: `1px solid ${agent.color}55`, boxShadow: `0 12px 36px rgba(0,0,0,0.45), 0 0 24px ${agent.color}18` }}
        >
          {/* panel header + nav halaman (icon-only, hover/klik = nama muncul) */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${agent.color}18`, border: `1px solid ${agent.color}55` }}>
              <agent.icon size={16} style={{ color: agent.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm truncate">
                {agent.name} — <span className="text-slate-400 font-medium">
                  {tab === 'chat' ? 'Chat Session' : tab === 'memory' ? 'Memory' : 'Cron'}
                </span>
              </p>
              <p className="text-[11px] text-slate-500 truncate">{agent.role} · {agent.model}</p>
            </div>
            {/* icon tabs */}
            <div className="flex items-center gap-1 p-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {([
                { key: 'chat', icon: MessageSquare, label: 'Chat Session' },
                { key: 'memory', icon: Brain, label: 'Memory' },
                { key: 'cron', icon: CalendarClock, label: 'Cron' },
              ] as { key: AgentTab; icon: typeof MessageSquare; label: string }[]).map(t => {
                const active = tab === t.key
                return (
                  <button
                    key={t.key}
                    onClick={() => onSwitchTab(t.key)}
                    title={t.label}
                    className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all group/tab"
                  >
                    {active && (
                      <motion.div
                        layoutId="agent-tab-pill"
                        className="absolute inset-0 rounded-full"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        style={{ background: `linear-gradient(160deg, ${agent.color}E6, ${agent.color})`, boxShadow: `0 3px 10px ${agent.color}55` }}
                      />
                    )}
                    <t.icon size={14} className={`relative z-10 ${active ? 'text-white' : 'text-slate-500 group-hover/tab:text-slate-300'}`} />
                    <span className={`relative z-10 text-[11px] font-semibold max-w-0 overflow-hidden whitespace-nowrap group-hover/tab:max-w-[100px] transition-all duration-200 ${active ? 'text-white max-w-[100px]' : ''}`}>
                      {t.label}
                    </span>
                  </button>
                )
              })}
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white ml-1 shrink-0"><X size={16} /></button>
          </div>

          <div className="flex flex-col md:flex-row">
            {/* ═══ Memori (kiri) — tampil di tab chat & memory ═══ */}
            <div className={`${tab !== 'cron' ? 'md:w-72 border-b md:border-b-0 md:border-r border-white/5 flex flex-col' : 'hidden'}`}>
              <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <button onClick={() => setShowMemory(!showMemory)}
                  className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 flex items-center gap-1.5">
                  <Brain size={12} /> Memori ({memories.length}) {showMemory ? '▾' : '▸'}
                </button>
                <button onClick={addManualMemory} title="Tambah memori"
                  className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                  style={{ color: agent.color, border: `1px solid ${agent.color}55` }}>
                  + ingat
                </button>
              </div>
              {showMemory && (
                <div className="px-3 pb-3 space-y-1.5 overflow-y-auto max-h-40 md:max-h-64">
                  {memories.length === 0 && (
                    <p className="text-[11px] text-slate-500 px-1 font-mono">Otak masih kosong — chat dulu atau + ingat</p>
                  )}
                  {memories.map(m => (
                    <div key={m.id} className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/5">
                      <p className="text-[11px] text-slate-300 leading-snug">{m.content}</p>
                      <p className="text-[9px] text-slate-600 font-mono mt-1">{m.time}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ═══ Chat (kanan) — hanya di tab chat ═══ */}
            <div className={`flex-1 flex flex-col ${tab === 'chat' ? '' : 'hidden'}`}>
              <div className="h-64 overflow-y-auto p-5 space-y-3">
                {chat.map((m, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user'
                      ? 'text-white rounded-br-md'
                      : 'bg-white/[0.06] text-slate-200 border border-white/5 rounded-bl-md'
                      }`}
                      style={m.role === 'user' ? { background: `linear-gradient(160deg, ${agent.color}E6, ${agent.color}99)`, boxShadow: `0 4px 14px ${agent.color}33` } : {}}
                    >
                      {m.text}
                    </div>
                  </motion.div>
                ))}
                {thinking && (
                  <div className="flex justify-start">
                    <div className="bg-white/[0.06] border border-white/5 px-4 py-3 rounded-2xl rounded-bl-md flex gap-1">
                      {[0, 1, 2].map(d => (
                        <motion.span key={d} className="w-2 h-2 rounded-full"
                          style={{ background: agent.color }}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: d * 0.15 }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* input */}
              <div className="p-4 border-t border-white/5">
                <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-2.5 focus-within:border-sky-400/40 transition-colors">
                  <MessageSquare size={15} className="text-slate-500" />
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && send()}
                    placeholder={`Bicara dengan otak ${agent.name}...`}
                    className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-slate-500"
                  />
                  <button onClick={send} disabled={thinking}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:shadow-lg transition-shadow disabled:opacity-40"
                    style={{ background: `linear-gradient(135deg, ${agent.color}, ${agent.color}88)` }}>
                    <Send size={13} className="text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* ═══ HALAMAN MEMORY (tab memory) ═══ */}
          {tab === 'memory' && (
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Brain size={15} style={{ color: agent.color }} />
                <p className="text-[12px] font-bold text-slate-300">
                  Memori jangka panjang {agent.name} — {memories.length} entri
                </p>
                <button onClick={addManualMemory}
                  className="ml-auto text-[10px] px-2.5 py-1 rounded-full font-bold"
                  style={{ color: agent.color, border: `1px solid ${agent.color}55` }}>
                  + ingat
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                {memories.length === 0 && (
                  <p className="text-[12px] text-slate-500 font-mono">Otak masih kosong — chat dulu atau tambah memori.</p>
                )}
                {memories.map(m => (
                  <div key={m.id} className="px-3.5 py-3 rounded-xl bg-white/[0.04] border border-white/5 hover:border-white/15 transition-colors">
                    <p className="text-[12px] text-slate-300 leading-snug">{m.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[9px] font-mono text-slate-600">{m.time}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{ color: agent.color, background: `${agent.color}14` }}>
                        {m.kind}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ HALAMAN CRON (tab cron) ═══ */}
          {tab === 'cron' && (
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <CalendarClock size={15} style={{ color: agent.color }} />
                <p className="text-[12px] font-bold text-slate-300">Jadwal tugas otomatis {agent.name}</p>
              </div>
              <div className="space-y-2">
                {(agent.id === 'cozy' ? [
                  { name: 'Laporan Keuangan Harian', schedule: '0 9 * * *', status: 'aktif' },
                  { name: 'Sinkronisasi Memory Server', schedule: '*/30m', status: 'aktif' },
                ] : agent.id === 'sentinel' ? [
                  { name: 'Security Scan', schedule: '*/15m', status: 'aktif' },
                  { name: 'Log Cleanup', schedule: '0 3 * * *', status: 'aktif' },
                ] : agent.id === 'zephra' ? [
                  { name: 'Stok Sync Firebase', schedule: '*/30m', status: 'aktif' },
                ] : agent.id === 'phoenix' ? [
                  { name: 'Auto-reply Telegram', schedule: 'realtime', status: 'aktif' },
                ] : [
                  { name: `Task rutin ${agent.name}`, schedule: '0 10 * * *', status: 'aktif' },
                ]).map((j, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]" />
                    <div className="flex-1">
                      <p className="text-[12px] font-semibold text-slate-200">{j.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{j.schedule}</p>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold text-emerald-400 border border-emerald-400/40 bg-emerald-400/10">
                      {j.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────
type ViewMode = 'workflow' | 'office'

interface ExchangeItem {
  from: string
  to: string
  topic: string
  message: string
  reply: string
  time: string
}

export type AgentTab = 'chat' | 'memory' | 'cron'

export default function AgentsPage() {
  const [view, setView] = useState<ViewMode>('workflow')
  const [chatAgent, setChatAgent] = useState<SubAgent | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [exchanges, setExchanges] = useState<ExchangeItem[]>([])
  const [ticking, setTicking] = useState(false)

  // ── Engine tukar pikiran: tick tiap 45 detik + feed live ──
  useEffect(() => {
    let alive = true
    const loadFeed = () => {
      fetch('/api/brain/exchange/recent')
        .then(r => r.json())
        .then(d => { if (alive) setExchanges(d.exchanges || []) })
        .catch(() => {})
    }
    const tick = () => {
      if (document.hidden) return // hemat kuota saat tab tidak aktif
      setTicking(true)
      fetch('/api/brain/exchange/tick', { method: 'POST' })
        .then(r => r.json())
        .then(() => { loadFeed(); setTicking(false) })
        .catch(() => setTicking(false))
    }
    loadFeed()
    tick() // langsung sekali saat buka
    const ivTick = setInterval(tick, 45000)
    const ivFeed = setInterval(loadFeed, 20000)
    return () => {
      alive = false
      clearInterval(ivTick)
      clearInterval(ivFeed)
    }
  }, [])

  const [agentTab, setAgentTab] = useState<AgentTab>('chat')

  const openAgent = (a: SubAgent) => {
    setSelectedId(a.id)
    setChatAgent(a)
    setAgentTab('chat')
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-black font-display">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-sky-100 to-white drop-shadow-[0_0_22px_rgba(125,211,252,0.7)]">
              Sub Agent Network
            </span>
            <Network className="inline-block text-cyan-200 ml-3 animate-pulse" size={28} />
          </h1>
          <p className="text-slate-400 text-sm font-mono mt-1 mb-4">Workflow orchestration • COZY = manager utama • klik agent untuk chat & assign task</p>
        </div>

        {/* view switcher — floating pill iOS ala Cozy Agentic */}
        <div
          className="inline-flex items-center gap-1 p-1.5 rounded-full self-start"
          style={{
            background: 'linear-gradient(160deg, rgba(16,28,52,0.97), rgba(7,14,30,0.99))',
            border: '1px solid rgba(96,140,220,0.22)',
            boxShadow: '0 10px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(140,180,255,0.08)'
          }}
        >
          {([
            { key: 'workflow', icon: LayoutGrid, label: 'Workflow Cards', hex: '#22d3ee' },
            { key: 'office', icon: Building2, label: 'Robot Office 3D', hex: '#a78bfa' },
          ] as { key: ViewMode; icon: typeof LayoutGrid; label: string; hex: string }[]).map(v => {
            const isActive = view === v.key
            return (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className="relative flex items-center gap-2 px-4 py-2.5 rounded-full transition-all"
              >
                {isActive && (
                  <motion.div
                    layoutId="agent-view-pill"
                    className="absolute inset-0 rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  >
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `linear-gradient(160deg, ${v.hex}E6, ${v.hex})`,
                        boxShadow: `inset 0 1px 1px rgba(255,255,255,0.35), inset 0 -2px 3px rgba(0,0,0,0.15), 0 4px 14px ${v.hex}55`
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
                <v.icon size={15} className={`relative z-10 ${isActive ? 'text-white' : 'text-slate-500'}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`relative z-10 text-[13px] font-semibold tracking-wide ${
                  isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}>
                  {v.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Active view */}
      <AnimatePresence mode="wait">
        {view === 'workflow'
          ? <WorkflowView key="wf" onOpen={openAgent} selectedId={selectedId} />
          : <OfficeView key="of" onOpen={openAgent} selectedId={selectedId} />}
      </AnimatePresence>

      {/* Chat session BELOW the layout */}
      <ChatSessionPanel
        agent={chatAgent}
        onClose={() => { setChatAgent(null); setSelectedId(null) }}
        tab={agentTab}
        onTabChange={setAgentTab}
      />

      {/* ═══ Live Thoughts — agent saling bertukar pikiran REAL ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(170deg, rgba(16,28,52,0.97), rgba(7,14,30,0.99))',
          border: '1px solid rgba(96,140,220,0.22)',
          boxShadow: '0 12px 36px rgba(0,0,0,0.45), inset 0 1px 0 rgba(140,180,255,0.08)'
        }}
      >
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/5">
          <motion.div
            animate={{ rotate: ticking ? 360 : 0 }}
            transition={{ duration: 1, repeat: ticking ? Infinity : 0, ease: 'linear' }}
          >
            <Brain size={16} className="text-sky-400" />
          </motion.div>
          <div className="flex-1">
            <p className="text-white font-bold text-sm">Live Thoughts — Agent Saling Bertukar Pikiran</p>
            <p className="text-[11px] text-slate-500 font-mono">tiap 45 detik · memori bertambah otomatis</p>
          </div>
          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${ticking ? 'text-emerald-400 border-emerald-400/40 bg-emerald-400/10' : 'text-slate-400 border-white/10 bg-white/5'}`}>
            {ticking ? '● berpikir...' : '● live'}
          </span>
        </div>
        <div className="max-h-80 overflow-y-auto p-4 space-y-3">
          {exchanges.length === 0 && (
            <p className="text-[12px] text-slate-500 font-mono px-1">Menunggu percakapan pertama antar agent...</p>
          )}
          {exchanges.map((ex, i) => {
            const a = AGENTS.find(x => x.id === ex.from)
            const b = AGENTS.find(x => x.id === ex.to)
            const ca = a?.color || '#94A3B8'
            const cb = b?.color || '#94A3B8'
            return (
              <motion.div
                key={`${i}-${ex.time}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl px-4 py-3 bg-white/[0.03] border border-white/5"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-black tracking-wide" style={{ color: ca }}>{ex.from.toUpperCase()}</span>
                  <span className="text-slate-500 text-[10px]">→</span>
                  <span className="text-[11px] font-black tracking-wide" style={{ color: cb }}>{ex.to.toUpperCase()}</span>
                  <span className="text-[9px] text-slate-600 font-mono ml-auto">{ex.time} · {ex.topic}</span>
                </div>
                <p className="text-[12px] text-slate-300 leading-snug">{ex.message}</p>
                <p className="text-[12px] text-slate-400 leading-snug mt-1.5 pl-3 border-l-2" style={{ borderColor: cb }}>
                  {ex.reply}
                </p>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
