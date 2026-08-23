import { motion } from 'framer-motion'
import { Flame, Code, BarChart3, Palette, Eye, Shield, PenTool, Bird, Brain, CheckCircle, Star, Zap, TrendingUp, Activity, Cpu, Radio, Wifi } from 'lucide-react'
import { Agent } from '../types'

const iconMap: Record<string, typeof Flame> = {
  flame: Flame,
  code: Code,
  chart: BarChart3,
  palette: Palette,
  crystal: Eye,
  shield: Shield,
  pen: PenTool,
  bird: Bird,
  brain: Brain,
  gamepad: Flame,
}

interface AgentCardProps {
  agent: Agent
  onClick?: (agent: Agent) => void
}

export default function AgentCard({ agent, onClick }: AgentCardProps) {
  const Icon = iconMap[agent.icon] || Brain
  const isWorking = agent.status === 'working'
  
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onClick?.(agent)}
      className="relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-500 group"
      style={{
        background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        border: `1px solid ${agent.avatar_color}20`,
        boxShadow: `0 10px 40px -10px ${agent.avatar_color}20, 0 0 0 1px rgba(255,255,255,0.8) inset`
      }}
    >
      {/* Animated background gradient */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, ${agent.avatar_color}10 0%, transparent 50%, ${agent.avatar_color}05 100%)`
        }}
      />
      
      {/* Top accent line with animation */}
      <div 
        className="h-1 w-full rounded-t-3xl relative overflow-hidden"
        style={{ background: `linear-gradient(90deg, ${agent.avatar_color}, ${agent.avatar_color}60)` }}
      >
        <div className="absolute inset-0 bg-white/30 animate-pulse" />
      </div>
      
      {/* Scanning line effect */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-50"
        style={{
          animation: 'scan 3s linear infinite',
          boxShadow: `0 0 20px ${agent.avatar_color}`
        }}
      />
      
      <div className="p-6 relative">
        {/* Header with floating icon */}
        <div className="flex items-start justify-between mb-5">
          {/* Icon with pulse ring */}
          <div className="relative">
            {/* Outer ring */}
            <div 
              className="absolute inset-0 rounded-2xl blur-lg opacity-30"
              style={{ background: agent.avatar_color }}
            />
            {/* Main icon container */}
            <div 
              className="relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
              style={{
                background: `linear-gradient(135deg, ${agent.avatar_color}30, ${agent.avatar_color}10)`,
                border: `2px solid ${agent.avatar_color}40`,
              }}
            >
              <Icon size={32} style={{ color: agent.avatar_color }} />
            </div>
            {/* Status dot */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: isWorking ? '#10B981' : '#94A3B8' }}
            >
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          </div>
          
          {/* Status & Metrics */}
          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 backdrop-blur-sm ${
              isWorking 
                ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
                : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
            }`}>
              {isWorking && (
                <Radio size={12} className="animate-pulse" />
              )}
              {isWorking ? 'ONLINE' : 'STANDBY'}
            </span>
          </div>
        </div>
        
        {/* Content */}
        <div className="mb-5">
          {/* Agent name with gradient */}
          <h3 
            className="text-2xl font-black mb-1 transition-all duration-300 group-hover:scale-105"
            style={{ 
              background: `linear-gradient(135deg, ${agent.avatar_color}, ${agent.avatar_color}80)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            {agent.name}
          </h3>
          
          {/* Role */}
          <p className="text-sm font-semibold text-slate-700 mb-2">{agent.role}</p>
          
          {/* Description */}
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{agent.description}</p>
        </div>
        
        {/* Model badge */}
        {agent.model && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 mb-4 hover:border-slate-200 transition-colors">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: agent.avatar_color }} />
            <span className="text-xs text-slate-600 font-semibold">{agent.model}</span>
          </div>
        )}
        
        {/* Current task */}
        {agent.current_task && (
          <div 
            className="p-3 rounded-2xl mb-4 border"
            style={{ 
              background: `${agent.avatar_color}08`,
              borderColor: `${agent.avatar_color}20`
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Activity size={14} style={{ color: agent.avatar_color }} className="animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: agent.avatar_color }}>Current Task</span>
            </div>
            <p className="text-sm font-medium text-slate-700">{agent.current_task}</p>
          </div>
        )}
        
        {/* Footer stats */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50">
              <CheckCircle size={14} className="text-green-500" />
              <span className="text-xs font-bold text-slate-600">{agent.tasks_completed}</span>
              <span className="text-xs text-slate-400">tasks</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors group/btn">
              <Star size={16} className="text-yellow-400 fill-current group-hover/btn:scale-110 transition-transform" />
            </button>
            <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors group/btn">
              <Zap size={16} className="text-slate-400 group-hover/btn:text-blue-500 transition-colors group-hover/btn:scale-110" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Corner decorations */}
      <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-slate-200" />
      <div className="absolute bottom-3 left-3 w-1 h-1 rounded-full bg-slate-200" />
      
      {/* Hover glow effect */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${agent.avatar_color}10, transparent 70%)`
        }}
      />
    </motion.div>
  )
}
