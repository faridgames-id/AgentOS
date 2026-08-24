import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html, RoundedBox, Text } from '@react-three/drei'
import {
  Flame, Code, BarChart3, Palette, Eye, Shield, PenTool, Bird, Gamepad2,
  Network, X, Send, Zap, MessageSquare, Cpu, Activity, ListTodo,
  LayoutGrid, Building2, Brain
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
function Robot({
  agent, position, rotationY, onClick, isSelected
}: {
  agent: SubAgent
  position: [number, number, number]
  rotationY: () => number
  onClick: () => void
  isSelected: boolean
}) {
  const group = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const armL = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)
  const screenMat = useRef<THREE.MeshStandardMaterial>(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (!group.current) return

    switch (agent.status) {
      case 'working': {
        if (armL.current) armL.current.rotation.x = Math.sin(t * 8) * 0.5 - 0.9
        if (armR.current) armR.current.rotation.x = Math.sin(t * 8 + Math.PI) * 0.5 - 0.9
        if (head.current) {
          head.current.rotation.y = Math.sin(t * 0.8) * 0.15
          head.current.rotation.x = 0.25
        }
        if (screenMat.current) screenMat.current.emissiveIntensity = 1.2 + Math.sin(t * 6) * 0.5
        break
      }
      case 'sleeping': {
        if (armL.current) armL.current.rotation.x = -0.2
        if (armR.current) armR.current.rotation.x = -0.2
        if (head.current) { head.current.rotation.x = 0.7; head.current.rotation.y = 0 }
        group.current.position.y = position[1] + Math.sin(t * 1.2) * 0.02
        if (screenMat.current) screenMat.current.emissiveIntensity = 0.15 + Math.sin(t * 1.2) * 0.1
        break
      }
      case 'break': {
        if (armL.current) armL.current.rotation.x = -1.8
        if (armR.current) armR.current.rotation.x = -0.3
        if (head.current) { head.current.rotation.x = -0.15; head.current.rotation.y = Math.sin(t * 0.5) * 0.3 }
        group.current.rotation.z = Math.sin(t * 0.8) * 0.03
        if (screenMat.current) screenMat.current.emissiveIntensity = 0.8 + Math.sin(t * 2) * 0.3
        break
      }
      default: {
        if (armL.current) armL.current.rotation.x = Math.sin(t * 1.5) * 0.08
        if (armR.current) armR.current.rotation.x = Math.sin(t * 1.5 + 1) * 0.08
        if (head.current) head.current.rotation.y = Math.sin(t * 0.6) * 0.4
        group.current.position.y = position[1] + Math.abs(Math.sin(t * 1)) * 0.03
        if (screenMat.current) screenMat.current.emissiveIntensity = 0.6 + Math.sin(t * 1.5) * 0.2
      }
    }

    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, rotationY(), 0.05)
  })

  const c = new THREE.Color(agent.status === 'sleeping' ? '#3B82F6' : agent.color)
  // unique face per agent: eye offset + mouth curve seed
  const seed = agent.id.length + agent.name.charCodeAt(0)
  const eyeSpread = 0.05 + (seed % 3) * 0.012
  const mouthY = -0.035 + (seed % 2) * 0.012

  return (
    <group ref={group} position={position} onClick={(e) => { e.stopPropagation(); onClick() }}>
      {/* legs */}
      {[-0.09, 0.09].map((dx, i) => (
        <mesh key={i} position={[dx, 0.16, 0]}>
          <cylinderGeometry args={[0.045, 0.055, 0.32, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.35} />
        </mesh>
      ))}
      {/* body */}
      <RoundedBox args={[0.42, 0.5, 0.3]} radius={0.08} position={[0, 0.58, 0]} castShadow>
        <meshStandardMaterial color={c.getStyle()} metalness={0.55} roughness={0.3} />
      </RoundedBox>
      {/* chest light */}
      <mesh position={[0, 0.62, 0.16]}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" emissive={c} emissiveIntensity={agent.status === 'working' ? 1.5 : 0.4} />
      </mesh>
      {/* head */}
      <group ref={head} position={[0, 1.02, 0]}>
        <RoundedBox args={[0.4, 0.32, 0.34]} radius={0.09}>
          <meshStandardMaterial color="#E2E8F0" metalness={0.4} roughness={0.35} />
        </RoundedBox>

        {/* ── FACE: eyes + happy smile (unique per agent) ── */}
        {/* eyes */}
        {[-eyeSpread, eyeSpread].map((ex, i) => (
          <mesh key={i} position={[ex, 0.03, 0.172]}>
            <circleGeometry args={[0.028, 16]} />
            <meshBasicMaterial color="#0B1120" />
          </mesh>
        ))}
        {/* eye highlights */}
        {[-eyeSpread, eyeSpread].map((ex, i) => (
          <mesh key={`hl-${i}`} position={[ex + 0.008, 0.04, 0.174]}>
            <circleGeometry args={[0.008, 8]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
        ))}
        {/* happy smile — curved using torus arc */}
        <mesh position={[0, mouthY, 0.17]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.045, 0.008, 8, 16, Math.PI]} />
          <meshBasicMaterial color="#0B1120" />
        </mesh>
        {/* blush dots */}
        {[-0.12, 0.12].map((bx, i) => (
          <mesh key={`bl-${i}`} position={[bx, -0.02, 0.171]}>
            <circleGeometry args={[0.016, 10]} />
            <meshBasicMaterial color={c.getStyle()} transparent opacity={0.55} />
          </mesh>
        ))}
        {/* sleeping: closed eyes (lines over eyes) */}
        {agent.status === 'sleeping' && [-eyeSpread, eyeSpread].map((ex, i) => (
          <mesh key={`sl-${i}`} position={[ex, 0.03, 0.175]}>
            <planeGeometry args={[0.062, 0.008]} />
            <meshBasicMaterial color="#0B1120" />
          </mesh>
        ))}

        {/* antenna */}
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.14, 8]} />
          <meshStandardMaterial color="#94A3B8" />
        </mesh>
        <mesh position={[0, 0.31, 0]}>
          <sphereGeometry args={[0.032, 12, 12]} />
          <meshStandardMaterial color={c.getStyle()} emissive={c} emissiveIntensity={2} />
        </mesh>
        {/* sleeping Zzz label */}
        {agent.status === 'sleeping' && (
          <Html center position={[0.35, 0.35, 0]} distanceFactor={4}>
            <div style={{ fontSize: 14, userSelect: 'none' }}>
              <motion.span animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}>💤</motion.span>
            </div>
          </Html>
        )}
      </group>
      {/* arms */}
      <group ref={armL} position={[-0.26, 0.72, 0.05]}>
        <mesh position={[0, -0.12, 0]}>
          <capsuleGeometry args={[0.04, 0.18, 6, 12]} />
          <meshStandardMaterial color={c.getStyle()} metalness={0.5} roughness={0.4} />
        </mesh>
      </group>
      <group ref={armR} position={[0.26, 0.72, 0.05]}>
        <mesh position={[0, -0.12, 0]}>
          <capsuleGeometry args={[0.04, 0.18, 6, 12]} />
          <meshStandardMaterial color={c.getStyle()} metalness={0.5} roughness={0.4} />
        </mesh>
      </group>
      {/* coffee cup for break status */}
      {agent.status === 'break' && (
        <mesh position={[0.3, 0.62, 0.12]}>
          <cylinderGeometry args={[0.045, 0.04, 0.08, 12]} />
          <meshStandardMaterial color="#F8FAFC" />
        </mesh>
      )}
      {/* selection halo */}
      {isSelected && (
        <mesh position={[0, 0.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.45, 0.55, 32]} />
          <meshBasicMaterial color={c.getStyle()} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
      {/* floating name tag */}
      <Html center position={[0, 1.55, 0]} distanceFactor={6} zIndexRange={[20, 10]}>
        <button
          onClick={(e) => { e.stopPropagation(); onClick() }}
          className="px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer transition-transform hover:scale-105"
          style={{
            background: 'rgba(10,15,30,0.92)',
            border: `1px solid ${c.getStyle()}`,
            color: c.getStyle(),
            boxShadow: `0 0 12px ${c.getStyle()}44`,
            fontFamily: 'JetBrains Mono, monospace'
          }}
        >
          {agent.name} · {STATUS_META[agent.status].label}
        </button>
      </Html>
    </group>
  )
}

/** Desk with glowing monitor + office chair */
function Workstation({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      {/* tabletop */}
      <mesh position={[0, 0.78, 0]} receiveShadow>
        <boxGeometry args={[1.15, 0.05, 0.55]} />
        <meshStandardMaterial color="#1E293B" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* desk legs */}
      {[[-0.5, -0.24], [0.5, -0.24]].map(([dx, dz], i) => (
        <mesh key={i} position={[dx, 0.39, dz]}>
          <boxGeometry args={[0.05, 0.78, 0.05]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      ))}
      {/* monitor stand */}
      <mesh position={[0, 0.86, -0.12]}>
        <cylinderGeometry args={[0.03, 0.05, 0.12, 10]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      {/* monitor */}
      <mesh position={[0, 1.08, -0.16]}>
        <boxGeometry args={[0.62, 0.4, 0.03]} />
        <meshStandardMaterial color="#0B1120" />
      </mesh>
      <mesh position={[0, 1.08, -0.142]}>
        <planeGeometry args={[0.56, 0.34]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} />
      </mesh>
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

function OfficeScene({ onOpen, selectedId }: { onOpen: (a: SubAgent) => void; selectedId: string | null }) {
  // two rows of workstations facing camera
  const layout: { id: string; pos: [number, number, number]; rot: number }[] = [
    { id: 'nova',     pos: [-4.2, 0, 1.2],  rot: 0.35 },
    { id: 'cipher',   pos: [-2.1, 0, 0.2],  rot: 0.15 },
    { id: 'atlas',    pos: [0, 0, -0.2],    rot: 0 },
    { id: 'pixel',    pos: [2.1, 0, 0.2],   rot: -0.15 },
    { id: 'oracle',   pos: [4.2, 0, 1.2],   rot: -0.35 },
    { id: 'sentinel', pos: [-3.15, 0, 3.6], rot: 0.25 },
    { id: 'aurora',   pos: [-1.05, 0, 3.0], rot: 0.1 },
    { id: 'phoenix',  pos: [1.05, 0, 3.0],  rot: -0.1 },
    { id: 'zephra',   pos: [3.15, 0, 3.6],  rot: -0.25 },
  ]

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[6, 10, 6]} intensity={0.9} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <pointLight position={[0, 6, 4]} intensity={0.6} color="#00D4FF" />
      <pointLight position={[-8, 4, 6]} intensity={0.4} color="#8B5CF6" />
      <pointLight position={[8, 4, 6]} intensity={0.4} color="#FBBF24" />

      <OfficeFloor />

      {layout.map((slot) => {
        const agent = AGENTS.find(a => a.id === slot.id)!
        return (
          <group key={slot.id}>
            {/* desk in front of robot (robots face camera, monitor between robot & camera) */}
            <Workstation position={[slot.pos[0], 0, slot.pos[2] + 0.75]} color={agent.color} />
            {/* chair behind robot */}
            <OfficeChair position={[slot.pos[0], 0, slot.pos[2] - 0.45]} color={agent.color} />
            <Robot
              agent={agent}
              position={slot.pos}
              rotationY={() => slot.rot}
              onClick={() => onOpen(agent)}
              isSelected={selectedId === slot.id}
            />
            {/* status floor glow */}
            <mesh position={[slot.pos[0], 0.002, slot.pos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.55, 32]} />
              <meshBasicMaterial color={STATUS_META[agent.status].dot} transparent opacity={agent.status === 'working' ? 0.18 : 0.08} />
            </mesh>
          </group>
        )
      })}

      {/* COZY manager at the back center */}
      <group position={[0, 0, -4.5]}>
        <Workstation position={[0, 0, 0.75]} color="#FBBF24" />
        <OfficeChair position={[0, 0, -0.45]} color="#FBBF24" />
        <Robot
          agent={AGENTS.find(a => a.id === 'cozy')!}
          position={[0, 0.25, 0]}
          rotationY={() => 0}
          onClick={() => onOpen(AGENTS.find(a => a.id === 'cozy')!)}
          isSelected={selectedId === 'cozy'}
        />
        <Text
          position={[0, 2.6, 0]}
          fontSize={0.32}
          color="#FBBF24"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
          letterSpacing={0.04}
        >
          COZY — Manager
        </Text>
      </group>
    </>
  )
}

function OfficeView({ onOpen, selectedId }: { onOpen: (a: SubAgent) => void; selectedId: string | null }) {
  return (
    <motion.div
      key="office"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="relative rounded-3xl overflow-hidden"
      style={{
        height: '62vh', minHeight: 520,
        background: 'linear-gradient(180deg, #0B1226 0%, #05070F 100%)',
        border: '1px solid rgba(148,163,184,0.12)',
        boxShadow: '0 0 40px rgba(0,212,255,0.07)'
      }}
    >
      <Canvas shadows camera={{ position: [0, 3.4, 9.5], fov: 46 }} gl={{ antialias: true }}>
        <color attach="background" args={['#070B18']} />
        <OfficeScene onOpen={onOpen} selectedId={selectedId} />
        <OrbitControls
          target={[0, 1, 0]}
          minDistance={5} maxDistance={16}
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
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────
// Chat session panel — BELOW the 3D/card layout
// ─────────────────────────────────────────────────────────
function ChatSessionPanel({ agent, onClose }: { agent: SubAgent | null; onClose: () => void }) {
  const [chat, setChat] = useState<{ role: 'user' | 'agent'; text: string }[]>([])
  const [memories, setMemories] = useState<{ id: number; content: string; time: string }[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [showMemory, setShowMemory] = useState(true)
  const [agentId, setAgentId] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

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
          {/* panel header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${agent.color}18`, border: `1px solid ${agent.color}55` }}>
              <agent.icon size={16} style={{ color: agent.color }} />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">
                Otak {agent.name} — <span style={{ color: agent.color }}>REAL LLM + Memory</span>
              </p>
              <p className="text-[11px] text-slate-500">{agent.role} · {agent.model}</p>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-full font-bold border"
              style={{ color: STATUS_META[agent.status].dot, borderColor: `${STATUS_META[agent.status].dot}55` }}>
              {STATUS_META[agent.status].label}
            </span>
            <button onClick={onClose} className="text-slate-500 hover:text-white ml-2"><X size={16} /></button>
          </div>

          <div className="flex flex-col md:flex-row">
            {/* ═══ Memori (kiri) ═══ */}
            <div className="md:w-72 border-b md:border-b-0 md:border-r border-white/5 flex flex-col">
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

            {/* ═══ Chat (kanan) ═══ */}
            <div className="flex-1 flex flex-col">
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
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────
type ViewMode = 'workflow' | 'office'

export default function AgentsPage() {
  const [view, setView] = useState<ViewMode>('workflow')
  const [chatAgent, setChatAgent] = useState<SubAgent | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const openAgent = (a: SubAgent) => {
    setSelectedId(a.id)
    setChatAgent(a)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-4xl font-black font-display">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-sky-100 to-white drop-shadow-[0_0_22px_rgba(125,211,252,0.7)]">
              Sub Agent Network
            </span>
            <Network className="inline-block text-cyan-200 ml-3 animate-pulse" size={28} />
          </h1>
          <p className="text-slate-400 text-sm font-mono mt-1">Workflow orchestration • COZY = manager utama • klik agent untuk chat & assign task</p>
        </div>

        {/* view switcher */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/[0.04] border border-white/10">
          {([
            { key: 'workflow', icon: LayoutGrid, label: 'Workflow Cards' },
            { key: 'office', icon: Building2, label: 'Robot Office 3D' },
          ] as { key: ViewMode; icon: typeof LayoutGrid; label: string }[]).map(v => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === v.key ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {view === v.key && (
                <motion.div layoutId="agent-view-pill" className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25" />
              )}
              <v.icon size={15} className="relative z-10" />
              <span className="relative z-10">{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active view */}
      <AnimatePresence mode="wait">
        {view === 'workflow'
          ? <WorkflowView key="wf" onOpen={openAgent} selectedId={selectedId} />
          : <OfficeView key="of" onOpen={openAgent} selectedId={selectedId} />}
      </AnimatePresence>

      {/* Chat session BELOW the layout */}
      <ChatSessionPanel agent={chatAgent} onClose={() => { setChatAgent(null); setSelectedId(null) }} />
    </div>
  )
}
