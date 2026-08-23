import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Sparkles, Link, Zap, Brain, ArrowLeft, Minimize2, Maximize2, Database, FileText, User, GitBranch, Cpu, TrendingUp } from 'lucide-react'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

interface MemoryNode {
  id: string
  label: string
  type: 'fact' | 'event' | 'person' | 'location' | 'concept' | 'business' | 'system' | 'social' | 'finance' | 'product' | 'technology'
  connections: string[]
  description: string
  color: string
  size: number
  x: number
  y: number
  z: number
  content?: string
}

interface MemoryEdge {
  from: string
  to: string
  strength: number
}

const memoryNodes: MemoryNode[] = [
  // Core memories
  { id: 'farid', label: 'Farid', type: 'person', connections: ['tiktok', 'faridshop', 'income', 'zephra'], description: '15 years old AI Engineer & Investor', color: '#FBBF24', size: 2.5, x: 0, y: 0, z: 0, content: 'Farid Excellent - AI Engineer, Investor, TikTok Creator (@Faridexcelent)' },
  
  // Business
  { id: 'faridshop', label: 'Farid Shop', type: 'business', connections: ['zephra', 'income', 'ff', 'ml'], description: 'Game account marketplace', color: '#EC4899', size: 1.8, x: 15, y: 8, z: 5, content: 'faridshopgame.online - Marketplace FF & ML accounts' },
  { id: 'zephra', label: 'ZEPHRA', type: 'system', connections: ['farid', 'faridshop', 'stock', 'ff', 'ml'], description: 'Stock management system', color: '#A855F7', size: 1.6, x: -15, y: 8, z: -5, content: 'ZEPHRA Engine - Manages 272 game accounts' },
  
  // Social Media
  { id: 'tiktok', label: 'TikTok', type: 'social', connections: ['farid'], description: 'Content platform', color: '#FF6B6B', size: 1.4, x: 10, y: -12, z: 10, content: '@Faridexcelent - AI & tech content creator' },
  
  // Financial
  { id: 'income', label: 'Income', type: 'finance', connections: ['farid', 'faridshop'], description: 'Revenue tracking', color: '#10B981', size: 1.3, x: -10, y: -12, z: -10, content: 'Total income: Rp 4.574.000 (August 2026)' },
  { id: 'expense', label: 'Expense', type: 'finance', connections: ['farid'], description: 'Spending tracker', color: '#F97316', size: 1.0, x: 0, y: 15, z: 0, content: 'Total expenses tracked' },
  
  // Products
  { id: 'ff', label: 'Free Fire', type: 'product', connections: ['faridshop', 'zephra'], description: 'FF account trading', color: '#EC4899', size: 1.2, x: 18, y: -4, z: -8, content: '188 Free Fire accounts in stock' },
  { id: 'ml', label: 'Mobile Legends', type: 'product', connections: ['faridshop', 'zephra'], description: 'ML account trading', color: '#06B6D4', size: 1.1, x: -18, y: -4, z: 8, content: '84 Mobile Legends accounts in stock' },
  
  // Systems
  { id: 'atlas', label: 'ATLAS', type: 'system', connections: ['farid', 'income', 'expense'], description: 'Finance tracking system', color: '#3B82F6', size: 1.3, x: 0, y: -15, z: 5, content: 'ATLAS subagent - Income & expense management' },
  { id: 'cozy', label: 'Cozy OS', type: 'system', connections: ['farid', 'atlas', 'zephra'], description: 'Main operating system', color: '#06B6D4', size: 1.5, x: -8, y: 12, z: -8, content: 'Cozy Assistant - AI Agentic OS v3.0' },
  
  // Data sources
  { id: 'firebase', label: 'Firebase', type: 'technology', connections: ['atlas', 'zephra'], description: 'Cloud database', color: '#FF6B35', size: 1.0, x: 12, y: 0, z: 12, content: 'Firebase Firestore - Primary data storage' },
  { id: 'obsidian', label: 'Obsidian', type: 'technology', connections: ['farid'], description: 'Second brain', color: '#7C3AED', size: 1.0, x: -12, y: 0, z: -12, content: 'Obsidian local notes API integration' },
  
  // Recent activities
  { id: 'aug_profit', label: 'Aug Profit', type: 'event', connections: ['income', 'faridshop'], description: 'Recent sales profits', color: '#22C55E', size: 0.9, x: 8, y: 10, z: -12, content: 'Multiple profit records in August 2026' },
  { id: 'stock_update', label: 'Stock Update', type: 'event', connections: ['zephra', 'ff', 'ml'], description: 'Inventory updates', color: '#8B5CF6', size: 0.9, x: -8, y: -10, z: 12, content: 'Regular stock replenishment' },
]

const memoryEdges: MemoryEdge[] = [
  { from: 'farid', to: 'tiktok', strength: 0.8 },
  { from: 'farid', to: 'faridshop', strength: 0.9 },
  { from: 'farid', to: 'income', strength: 0.7 },
  { from: 'farid', to: 'zephra', strength: 0.8 },
  { from: 'farid', to: 'atlas', strength: 0.9 },
  { from: 'farid', to: 'cozy', strength: 1.0 },
  { from: 'farid', to: 'obsidian', strength: 0.6 },
  
  { from: 'faridshop', to: 'zephra', strength: 0.9 },
  { from: 'faridshop', to: 'income', strength: 0.8 },
  { from: 'faridshop', to: 'ff', strength: 0.9 },
  { from: 'faridshop', to: 'ml', strength: 0.9 },
  { from: 'faridshop', to: 'aug_profit', strength: 0.7 },
  
  { from: 'zephra', to: 'stock', strength: 0.9 },
  { from: 'zephra', to: 'ff', strength: 0.8 },
  { from: 'zephra', to: 'ml', strength: 0.8 },
  { from: 'zephra', to: 'stock_update', strength: 0.7 },
  
  { from: 'income', to: 'expense', strength: 0.6 },
  { from: 'income', to: 'aug_profit', strength: 0.8 },
  
  { from: 'ff', to: 'ml', strength: 0.5 },
  
  { from: 'atlas', to: 'firebase', strength: 0.9 },
  { from: 'zephra', to: 'firebase', strength: 0.9 },
  { from: 'cozy', to: 'atlas', strength: 0.8 },
  { from: 'cozy', to: 'zephra', strength: 0.8 },
]

// Planet ring shader
const ringVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const ringFragmentShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform vec3 uColor;
  uniform float uTime;
  
  void main() {
    vec2 center = vUv - 0.5;
    float dist = length(center) * 2.0;
    
    float ring1 = smoothstep(0.3, 0.32, dist) * smoothstep(0.45, 0.43, dist);
    float ring2 = smoothstep(0.5, 0.52, dist) * smoothstep(0.65, 0.63, dist);
    float ring3 = smoothstep(0.7, 0.72, dist) * smoothstep(0.8, 0.78, dist);
    
    float rings = ring1 + ring2 * 0.7 + ring3 * 0.5;
    float glow = exp(-dist * 2.0) * 0.5;
    
    float sparkle = sin(vPosition.x * 10.0 + uTime * 2.0) * sin(vPosition.y * 10.0 + uTime * 1.5);
    sparkle = pow(max(sparkle, 0.0), 8.0);
    
    vec3 color = uColor * (rings + glow + sparkle * 0.3);
    float alpha = (rings + glow) * 0.8;
    
    gl_FragColor = vec4(color, alpha);
  }
`

function MemoryScene({ selectedNode, setSelectedNode }: { selectedNode: MemoryNode | null; setSelectedNode: (n: MemoryNode | null) => void }) {
  const { gl, size, camera, scene } = useThree()
  const composerRef = useRef<EffectComposer | null>(null)
  const clockRef = useRef(new THREE.Clock())
  const nodeMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map())
  const ringMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map())
  
  useEffect(() => {
    const renderer = gl
    const composer = new EffectComposer(renderer)
    const renderPass = new RenderPass(scene, camera)
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      2.0,
      0.6,
      0.05
    )
    const outputPass = new OutputPass()
    
    composer.addPass(renderPass)
    composer.addPass(bloomPass)
    composer.addPass(outputPass)
    
    composerRef.current = composer
    
    return () => composer.dispose()
  }, [gl, size, camera, scene])
  
  useFrame(() => {
    const elapsedTime = clockRef.current.getElapsedTime()
    
    nodeMeshesRef.current.forEach((mesh, id) => {
      const node = memoryNodes.find(n => n.id === id)
      if (node && mesh) {
        mesh.position.y = node.y + Math.sin(elapsedTime * 0.5 + node.x * 0.1) * 0.4
        mesh.rotation.y = elapsedTime * 0.3
        mesh.rotation.x = Math.sin(elapsedTime * 0.2) * 0.15
        
        const isSelected = selectedNode?.id === id
        const targetScale = isSelected ? 1.5 : 1.0
        mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
        
        const mat = mesh.material as THREE.MeshStandardMaterial
        if (mat) {
          mat.emissiveIntensity = isSelected ? 3.0 : 1.0 + Math.sin(elapsedTime * 2) * 0.3
        }
      }
    })
    
    ringMeshesRef.current.forEach((ring, id) => {
      const node = memoryNodes.find(n => n.id === id)
      if (node && ring) {
        ring.position.y = node.y + Math.sin(clockRef.current.getElapsedTime() * 0.5 + node.x * 0.1) * 0.4
        ring.rotation.x = Math.PI / 2.5 + Math.sin(clockRef.current.getElapsedTime() * 0.3) * 0.2
        ring.rotation.z = Math.sin(clockRef.current.getElapsedTime() * 0.2) * 0.1
      }
    })
    
    if (composerRef.current) {
      composerRef.current.render()
    }
  })
  
  const handleNodeClick = (node: MemoryNode) => {
    setSelectedNode(selectedNode?.id === node.id ? null : node)
  }
  
  return (
    <>
      {memoryNodes.map(node => (
        <MemoryPlanet
          key={node.id}
          node={node}
          isSelected={selectedNode?.id === node.id}
          onClick={() => handleNodeClick(node)}
          onNodeRef={(ref) => { if (ref) nodeMeshesRef.current.set(node.id, ref) }}
          onRingRef={(ref) => { if (ref) ringMeshesRef.current.set(node.id, ref) }}
        />
      ))}
      
      {memoryEdges.map((edge, i) => (
        <EnergyConnection key={i} edge={edge} />
      ))}
      
      <NebulaBackground />
      <StarField />
    </>
  )
}

function MemoryPlanet({ 
  node, 
  isSelected, 
  onClick,
  onNodeRef,
  onRingRef
}: { 
  node: MemoryNode; 
  isSelected: boolean; 
  onClick: () => void;
  onNodeRef: (ref: THREE.Mesh | null) => void;
  onRingRef: (ref: THREE.Mesh | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  
  useEffect(() => {
    if (meshRef.current) onNodeRef(meshRef.current)
    return () => onNodeRef(null)
  }, [onNodeRef])
  
  useEffect(() => {
    if (ringRef.current) onRingRef(ringRef.current)
    return () => onRingRef(null)
  }, [onRingRef])
  
  const getIcon = () => {
    switch (node.type) {
      case 'person': return '👤'
      case 'business': return '🏪'
      case 'system': return '⚙️'
      case 'social': return '📱'
      case 'finance': return '💰'
      case 'product': return '🎮'
      case 'technology': return '🔧'
      case 'event': return '⚡'
      default: return '📍'
    }
  }
  
  return (
    <group position={[node.x, node.y, node.z]}>
      {/* Outer glow - soft additive halo */}
      <mesh scale={[3.2, 3.2, 3.2]}>
        <sphereGeometry args={[node.size, 32, 32]} />
        <meshBasicMaterial
          color={node.color}
          transparent
          opacity={isSelected ? 0.22 : 0.12}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Main planet */}
      <mesh ref={meshRef} onClick={onClick} onPointerOver={() => document.body.style.cursor = 'pointer'} onPointerOut={() => document.body.style.cursor = 'default'}>
        <sphereGeometry args={[node.size, 32, 32]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={isSelected ? 3.0 : 1.0}
          metalness={0.3}
          roughness={0.1}
        />
      </mesh>
      
      {/* Rings */}
      <mesh ref={ringRef} rotation={[Math.PI / 2.5, 0, Math.PI / 6]}>
        <ringGeometry args={[node.size * 1.4, node.size * 2.8, 64]} />
        <shaderMaterial
          uniforms={{ uColor: { value: new THREE.Color(node.color) }, uTime: { value: 0 } }}
          vertexShader={ringVertexShader}
          fragmentShader={ringFragmentShader}
          transparent={true}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      <pointLight color={node.color} intensity={isSelected ? 8 : 3} distance={12} decay={2} />
      
      <LabelSprite text={node.label} color={node.color} offset={node.size + 1.2} icon={getIcon()} />
    </group>
  )
}

function LabelSprite({ text, color, offset, icon }: { text: string; color: string; offset: number; icon: string }) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0)'
    ctx.fillRect(0, 0, 512, 128)
    ctx.font = 'bold 40px Inter, sans-serif'
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = color
    ctx.shadowBlur = 20
    ctx.fillText(`${icon} ${text}`, 256, 64)
  }
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  
  return (
    <sprite position={[0, offset, 0]}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  )
}

function EnergyConnection({ edge }: { edge: MemoryEdge }) {
  const fromNode = memoryNodes.find(n => n.id === edge.from)
  const toNode = memoryNodes.find(n => n.id === edge.to)
  
  if (!fromNode || !toNode) return null
  
  const start = new THREE.Vector3(fromNode.x, fromNode.y, fromNode.z)
  const end = new THREE.Vector3(toNode.x, toNode.y, toNode.z)
  const mid = start.clone().add(end).multiplyScalar(0.5)
  mid.y += 5
  
  const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
  
  const tubeGeometry = new THREE.TubeGeometry(curve, 50, 0.05 * edge.strength, 8, false)
  const baseColor = new THREE.Color(fromNode.color).lerp(new THREE.Color(toNode.color), 0.5)
  
  return (
    <group>
      {/* Base connection tube */}
      <mesh geometry={tubeGeometry}>
        <meshBasicMaterial color={baseColor} transparent opacity={0.55 * edge.strength} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}

function NebulaBackground() {
  const count = 800
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  
  const nebulaColors = [
    new THREE.Color('#EC4899'),
    new THREE.Color('#8B5CF6'),
    new THREE.Color('#06B6D4'),
    new THREE.Color('#3B82F6'),
    new THREE.Color('#10B981'),
  ]
  
  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    const r = 50 + Math.random() * 80
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    
    positions[i3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.4
    positions[i3 + 2] = r * Math.cos(phi)
    
    const color = nebulaColors[Math.floor(Math.random() * nebulaColors.length)]
    colors[i3] = color.r
    colors[i3 + 1] = color.g
    colors[i3 + 2] = color.b
    
    sizes[i] = 8 + Math.random() * 20
  }
  
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1))
  
  const material = new THREE.ShaderMaterial({
    uniforms: { uPixelScale: { value: 100 }, uIntensity: { value: 0.6 } },
    vertexShader: `
      attribute float aSize;
      attribute vec3 aColor;
      varying vec3 vColor;
      uniform float uPixelScale;
      void main() {
        vColor = aColor;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uPixelScale / max(-mvPosition.z, 1.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      uniform float uIntensity;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        float alpha = exp(-d * d * 2.0) * 0.2 * uIntensity;
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  })
  
  return <points geometry={geometry} material={material} />
}

function StarField() {
  const count = 3000
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  
  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    const r = 100 + Math.random() * 150
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    
    positions[i3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i3 + 2] = r * Math.cos(phi)
    
    const brightness = 0.5 + Math.random() * 0.5
    const tint = Math.random()
    colors[i3] = brightness * (tint > 0.8 ? 0.7 : 1.0)
    colors[i3 + 1] = brightness * (tint > 0.9 ? 0.8 : 1.0)
    colors[i3 + 2] = brightness
  }
  
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  
  const material = new THREE.PointsMaterial({
    size: 0.8,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  })
  
  return <points geometry={geometry} material={material} />
}

export default function Memory() {
  const [selectedNode, setSelectedNode] = useState<MemoryNode | null>(null)
  const [isMinimized, setIsMinimized] = useState(false)
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'person': return <User size={16} />
      case 'business': return <Database size={16} />
      case 'system': return <Cpu size={16} />
      case 'finance': return <TrendingUp size={16} />
      case 'event': return <Zap size={16} />
      default: return <FileText size={16} />
    }
  }
  
  return (
    <div className="h-full flex flex-col">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 font-display">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-sky-300 to-violet-300 drop-shadow-[0_0_22px_rgba(56,189,248,0.65)]">
              Memory Galaxy
            </span>
            <Sparkles className="inline-block text-yellow-300 ml-2 animate-pulse" size={28} />
          </h1>
          <p className="text-slate-400">{memoryNodes.length} nodes · {memoryEdges.length} connections · Your knowledge universe</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
            {isMinimized ? <Maximize2 size={18} className="text-slate-400" /> : <Minimize2 size={18} className="text-slate-400" />}
          </button>
          <button onClick={() => setSelectedNode(null)} className="px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-slate-400 transition-colors flex items-center gap-2">
            <ArrowLeft size={16} />Reset View
          </button>
        </div>
      </motion.div>
      
      <motion.div className="rounded-2xl overflow-hidden border border-white/10 relative" style={{ height: isMinimized ? '300px' : 'calc(100vh - 190px)', width: '100%', transition: 'height 0.3s ease' }}>
        <Canvas camera={{ position: [0, 10, 55], fov: 55 }} gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }} style={{ background: 'radial-gradient(ellipse at center, #0a0a1a 0%, #000000 100%)' }}>
          <ambientLight intensity={0.2} />
          <pointLight position={[25, 25, 25]} intensity={1.5} color="#8B5CF6" />
          <pointLight position={[-25, -25, -25]} intensity={0.8} color="#06B6D4" />
          <pointLight position={[0, 30, 0]} intensity={1.0} color="#FBBF24" />
          
          <MemoryScene selectedNode={selectedNode} setSelectedNode={setSelectedNode} />
          
          <OrbitControls enablePan minDistance={20} maxDistance={100} autoRotate autoRotateSpeed={0.15} enableDamping dampingFactor={0.05} />
        </Canvas>
        
        <AnimatePresence>
          {selectedNode && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="absolute right-4 top-4 w-96 glass-card p-5 border border-white/10" style={{ backdropFilter: 'blur(20px)', background: 'rgba(15, 23, 42, 0.85)' }}>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-2xl" style={{ backgroundColor: `${selectedNode.color}25`, boxShadow: `0 0 40px ${selectedNode.color}80, inset 0 0 20px ${selectedNode.color}40`, border: `2px solid ${selectedNode.color}60` }}>
                  {selectedNode.type === 'person' && '👤'}
                  {selectedNode.type === 'business' && '🏪'}
                  {selectedNode.type === 'system' && '⚙️'}
                  {selectedNode.type === 'social' && '📱'}
                  {selectedNode.type === 'finance' && '💰'}
                  {selectedNode.type === 'product' && '🎮'}
                  {selectedNode.type === 'technology' && '🔧'}
                  {selectedNode.type === 'event' && '⚡'}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white text-xl">{selectedNode.label}</h3>
                  <span className="text-xs text-slate-400 tracking-widest flex items-center gap-2">{getTypeIcon(selectedNode.type)} {selectedNode.type}</span>
                </div>
                <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white transition-colors text-xl">✕</button>
              </div>
              
              <p className="text-slate-300 text-sm mb-5 leading-relaxed">{selectedNode.content || selectedNode.description}</p>
              
              <div className="space-y-2">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">Connected To ({selectedNode.connections.length})</p>
                {selectedNode.connections.map(connId => {
                  const conn = memoryNodes.find(n => n.id === connId)
                  return conn ? (
                    <button key={connId} onClick={() => setSelectedNode(conn)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-left group border border-transparent hover:border-white/10">
                      <div className="w-3 h-3 rounded-full flex-shrink-0 shadow-lg" style={{ backgroundColor: conn.color, boxShadow: `0 0 12px ${conn.color}` }} />
                      <span className="text-sm text-slate-300 group-hover:text-white transition-colors font-medium">{conn.label}</span>
                      <span className="text-xs text-slate-500 ml-auto tracking-wider">{conn.type}</span>
                    </button>
                  ) : null
                })}
              </div>
              
              <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-3 text-xs text-slate-500">
                <GitBranch size={14} className="text-cyan-500" />
                <span>Position: ({selectedNode.x.toFixed(1)}, {selectedNode.y.toFixed(1)}, {selectedNode.z.toFixed(1)})</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="absolute left-4 bottom-4 glass-card p-4 border border-white/10" style={{ backdropFilter: 'blur(20px)', background: 'rgba(15, 23, 42, 0.75)' }}>
          <p className="text-xs text-slate-400 font-bold mb-3 tracking-widest">Memory Types</p>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FBBF24', boxShadow: '0 0 10px #FBBF24' }} /><span className="text-slate-300">Person</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#EC4899', boxShadow: '0 0 10px #EC4899' }} /><span className="text-slate-300">Business</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#A855F7', boxShadow: '0 0 10px #A855F7' }} /><span className="text-slate-300">System</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10B981', boxShadow: '0 0 10px #10B981' }} /><span className="text-slate-300">Finance</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#06B6D4', boxShadow: '0 0 10px #06B6D4' }} /><span className="text-slate-300">Product</span></div>
          </div>
        </div>
        
        <div className="absolute bottom-4 right-4 text-xs text-slate-500 bg-black/30 px-3 py-2 rounded-lg">
          <p>🖱️ Drag to rotate • Scroll to zoom • Click nodes</p>
        </div>
      </motion.div>
    </div>
  )
}
