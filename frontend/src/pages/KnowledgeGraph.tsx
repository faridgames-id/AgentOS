import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Sparkles, Link, Zap, Brain, ArrowLeft, Camera, Globe, Minimize2, Maximize2 } from 'lucide-react'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

interface GraphNode {
  id: string
  label: string
  type: 'agent' | 'system' | 'topic' | 'project'
  connections: string[]
  description: string
  color: string
  size: number
  x: number
  y: number
  z: number
}

interface GraphEdge {
  from: string
  to: string
}

const nodes: GraphNode[] = [
  // Core - Golden center
  { id: 'cozy', label: 'Cozy OS', type: 'system', connections: ['nova', 'atlas', 'zephra', 'memory'], description: 'Main agent system', color: '#FBBF24', size: 2.2, x: 0, y: 0, z: 0 },
  
  // AI Agents - Primary orbit
  { id: 'nova', label: 'NOVA', type: 'agent', connections: ['cozy', 'cipher', 'knowledge'], description: 'Research & Analysis', color: '#EC4899', size: 1.4, x: 14, y: 10, z: 0 },
  { id: 'cipher', label: 'CIPHER', type: 'agent', connections: ['cozy', 'nova'], description: 'Code & Development', color: '#10B981', size: 1.4, x: -14, y: 10, z: 0 },
  { id: 'atlas', label: 'ATLAS', type: 'agent', connections: ['cozy', 'finance', 'memory'], description: 'Finance & Tracking', color: '#F59E0B', size: 1.4, x: 0, y: 14, z: 0 },
  { id: 'pixel', label: 'PIXEL', type: 'agent', connections: ['cozy'], description: 'Image & Creative', color: '#06B6D4', size: 1.3, x: 18, y: -6, z: 0 },
  { id: 'oracle', label: 'ORACLE', type: 'agent', connections: ['cozy'], description: 'Insights & Predictions', color: '#8B5CF6', size: 1.3, x: -18, y: -6, z: 0 },
  { id: 'sentinel', label: 'SENTINEL', type: 'agent', connections: ['cozy'], description: 'Security & Monitoring', color: '#EF4444', size: 1.3, x: 10, y: -12, z: 0 },
  { id: 'aurora', label: 'AURORA', type: 'agent', connections: ['cozy'], description: 'Content & Writing', color: '#14B8A6', size: 1.3, x: -10, y: -12, z: 0 },
  { id: 'phoenix', label: 'PHOENIX', type: 'agent', connections: ['cozy'], description: 'Automation & Tasks', color: '#F97316', size: 1.2, x: 0, y: -14, z: 0 },
  { id: 'zephra', label: 'ZEPHRA', type: 'agent', connections: ['cozy', 'stock'], description: 'Stock & Shop Management', color: '#A855F7', size: 1.4, x: -12, y: 12, z: 5 },
  
  // Systems
  { id: 'memory', label: 'Memory', type: 'system', connections: ['cozy', 'atlas', 'knowledge'], description: 'Persistent memory', color: '#8B5CF6', size: 1.2, x: 8, y: 8, z: -10 },
  { id: 'knowledge', label: 'Knowledge', type: 'system', connections: ['memory', 'nova'], description: 'Knowledge graph', color: '#06B6D4', size: 1.2, x: -8, y: 8, z: 10 },
  { id: 'firebase', label: 'Firebase', type: 'system', connections: ['cozy', 'atlas', 'zephra'], description: 'Cloud database', color: '#FF6B35', size: 1.1, x: 0, y: 0, z: -14 },
  { id: 'obsidian', label: 'Obsidian', type: 'system', connections: ['memory'], description: 'Local notes API', color: '#7C3AED', size: 1.1, x: 10, y: -10, z: 12 },
  
  // Topics
  { id: 'finance', label: 'Finance', type: 'topic', connections: ['atlas', 'income', 'expense'], description: 'Income/expense tracking', color: '#10B981', size: 1.0, x: 12, y: -9, z: -6 },
  { id: 'stock', label: 'Stock', type: 'topic', connections: ['zephra', 'ff', 'ml'], description: 'FF & ML accounts', color: '#EC4899', size: 1.0, x: -14, y: -9, z: 6 },
  { id: 'income', label: 'Income', type: 'topic', connections: ['atlas'], description: 'Revenue tracking', color: '#22C55E', size: 0.8, x: 7, y: -14, z: 0 },
  { id: 'expense', label: 'Expense', type: 'topic', connections: ['atlas'], description: 'Spending tracking', color: '#F97316', size: 0.8, x: 14, y: -12, z: 0 },
  
  // Projects
  { id: 'ff', label: 'Free Fire', type: 'project', connections: ['stock', 'shop'], description: 'FF account trading', color: '#EC4899', size: 0.9, x: -18, y: -4, z: 0 },
  { id: 'ml', label: 'Mobile Legends', type: 'project', connections: ['stock', 'shop'], description: 'ML account trading', color: '#06B6D4', size: 0.8, x: -12, y: -14, z: 0 },
  { id: 'shop', label: 'Farid Shop', type: 'project', connections: ['stock', 'ff', 'ml'], description: 'Game marketplace', color: '#F59E0B', size: 1.1, x: -16, y: 0, z: -6 },
]

const edges: GraphEdge[] = [
  { from: 'cozy', to: 'nova' }, { from: 'cozy', to: 'cipher' },
  { from: 'cozy', to: 'atlas' }, { from: 'cozy', to: 'pixel' },
  { from: 'cozy', to: 'oracle' }, { from: 'cozy', to: 'sentinel' },
  { from: 'cozy', to: 'aurora' }, { from: 'cozy', to: 'phoenix' },
  { from: 'cozy', to: 'zephra' }, { from: 'cozy', to: 'memory' },
  { from: 'nova', to: 'cipher' }, { from: 'nova', to: 'knowledge' },
  { from: 'atlas', to: 'finance' }, { from: 'atlas', to: 'memory' },
  { from: 'zephra', to: 'stock' }, { from: 'stock', to: 'shop' },
  { from: 'shop', to: 'ff' }, { from: 'shop', to: 'ml' },
  { from: 'memory', to: 'knowledge' }, { from: 'finance', to: 'income' },
  { from: 'finance', to: 'expense' }, { from: 'firebase', to: 'atlas' },
  { from: 'firebase', to: 'zephra' }, { from: 'obsidian', to: 'memory' },
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
    
    // Ring pattern
    float ring1 = smoothstep(0.3, 0.32, dist) * smoothstep(0.45, 0.43, dist);
    float ring2 = smoothstep(0.5, 0.52, dist) * smoothstep(0.65, 0.63, dist);
    float ring3 = smoothstep(0.7, 0.72, dist) * smoothstep(0.8, 0.78, dist);
    
    float rings = ring1 + ring2 * 0.7 + ring3 * 0.5;
    
    // Glow effect
    float glow = exp(-dist * 2.0) * 0.5;
    
    // Animated sparkle
    float sparkle = sin(vPosition.x * 10.0 + uTime * 2.0) * sin(vPosition.y * 10.0 + uTime * 1.5);
    sparkle = pow(max(sparkle, 0.0), 8.0);
    
    vec3 color = uColor * (rings + glow + sparkle * 0.3);
    float alpha = (rings + glow) * 0.8;
    
    gl_FragColor = vec4(color, alpha);
  }
`

// Energy flow shader for connections
const energyVertexShader = `
  attribute float aOffset;
  attribute float aSpeed;
  varying float vAlpha;
  uniform float uTime;
  
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Calculate alpha based on position along the line
    vAlpha = sin(aOffset * 3.14159 * 2.0 - uTime * aSpeed) * 0.5 + 0.5;
    vAlpha = pow(vAlpha, 2.0);
  }
`

const energyFragmentShader = `
  varying float vAlpha;
  uniform vec3 uColor;
  
  void main() {
    gl_FragColor = vec4(uColor, vAlpha * 0.9);
  }
`

function GalaxyScene({ selectedNode, setSelectedNode }: { selectedNode: GraphNode | null; setSelectedNode: (n: GraphNode | null) => void }) {
  const { gl, size, camera, scene } = useThree()
  const composerRef = useRef<EffectComposer | null>(null)
  const clockRef = useRef(new THREE.Clock())
  const nodeMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map())
  const ringMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map())
  
  // Setup post-processing
  useEffect(() => {
    const renderer = gl
    const composer = new EffectComposer(renderer)
    const renderPass = new RenderPass(scene, camera)
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      2.0,    // strength - increased
      0.6,    // radius
      0.05    // threshold - lower for more bloom
    )
    const outputPass = new OutputPass()
    
    composer.addPass(renderPass)
    composer.addPass(bloomPass)
    composer.addPass(outputPass)
    
    composerRef.current = composer
    
    return () => {
      composer.dispose()
    }
  }, [gl, size, camera, scene])
  
  // Animation loop
  useFrame(() => {
    const elapsedTime = clockRef.current.getElapsedTime()
    
    // Animate nodes and rings
    nodeMeshesRef.current.forEach((mesh, id) => {
      const node = nodes.find(n => n.id === id)
      if (node && mesh) {
        // Gentle float animation
        mesh.position.y = node.y + Math.sin(elapsedTime * 0.5 + node.x * 0.1) * 0.4
        
        // Rotation
        mesh.rotation.y = elapsedTime * 0.3
        mesh.rotation.x = Math.sin(elapsedTime * 0.2) * 0.15
        
        // Pulse effect for selected node
        const isSelected = selectedNode?.id === id
        const targetScale = isSelected ? 1.5 : 1.0
        mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
        
        // Emissive intensity
        const mat = mesh.material as THREE.MeshStandardMaterial
        if (mat) {
          mat.emissiveIntensity = isSelected ? 3.0 : 0.8 + Math.sin(elapsedTime * 2) * 0.3
        }
      }
    })
    
    // Animate rings
    ringMeshesRef.current.forEach((ring, id) => {
      const node = nodes.find(n => n.id === id)
      if (node && ring) {
        ring.position.y = node.y + Math.sin(clockRef.current.getElapsedTime() * 0.5 + node.x * 0.1) * 0.4
        ring.rotation.x = Math.PI / 2.5 + Math.sin(clockRef.current.getElapsedTime() * 0.3) * 0.2
        ring.rotation.z = Math.sin(clockRef.current.getElapsedTime() * 0.2) * 0.1
      }
    })
    
    // Render with composer
    if (composerRef.current) {
      composerRef.current.render()
    }
  })
  
  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(selectedNode?.id === node.id ? null : node)
  }
  
  return (
    <>
      {/* Nodes with Rings */}
      {nodes.map(node => (
        <PlanetNode
          key={node.id}
          node={node}
          isSelected={selectedNode?.id === node.id}
          onClick={() => handleNodeClick(node)}
          onNodeRef={(ref) => {
            if (ref) nodeMeshesRef.current.set(node.id, ref)
          }}
          onRingRef={(ref) => {
            if (ref) ringMeshesRef.current.set(node.id, ref)
          }}
        />
      ))}
      
      {/* Energy Connections */}
      {edges.map((edge, i) => (
        <EnergyConnection key={i} edge={edge} />
      ))}
      
      {/* Nebula Background */}
      <NebulaBackground />
      
      {/* Star Field */}
      <StarField />
    </>
  )
}

function PlanetNode({ 
  node, 
  isSelected, 
  onClick,
  onNodeRef,
  onRingRef
}: { 
  node: GraphNode; 
  isSelected: boolean; 
  onClick: () => void;
  onNodeRef: (ref: THREE.Mesh | null) => void;
  onRingRef: (ref: THREE.Mesh | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const outerGlowRef = useRef<THREE.Mesh>(null)
  
  useEffect(() => {
    if (meshRef.current) onNodeRef(meshRef.current)
    return () => onNodeRef(null)
  }, [onNodeRef])
  
  useEffect(() => {
    if (ringRef.current) onRingRef(ringRef.current)
    return () => onRingRef(null)
  }, [onRingRef])
  
  return (
    <group position={[node.x, node.y, node.z]}>
      {/* Outer glow sphere - large and transparent */}
      <mesh ref={outerGlowRef} scale={[4, 4, 4]}>
        <sphereGeometry args={[node.size, 32, 32]} />
        <meshBasicMaterial 
          color={node.color} 
          transparent 
          opacity={isSelected ? 0.15 : 0.08} 
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Main planet sphere */}
      <mesh 
        ref={meshRef} 
        onClick={onClick}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'default'}
      >
        <sphereGeometry args={[node.size, 32, 32]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={isSelected ? 3.0 : 1.0}
          metalness={0.3}
          roughness={0.1}
        />
      </mesh>
      
      {/* Planet rings - tilted like Saturn */}
      <mesh ref={ringRef} rotation={[Math.PI / 2.5, 0, Math.PI / 6]}>
        <ringGeometry args={[node.size * 1.4, node.size * 2.8, 64]} />
        <shaderMaterial
          uniforms={{
            uColor: { value: new THREE.Color(node.color) },
            uTime: { value: 0 }
          }}
          vertexShader={ringVertexShader}
          fragmentShader={ringFragmentShader}
          transparent={true}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Second ring - thinner and different angle */}
      <mesh rotation={[Math.PI / 2.2, Math.PI / 4, -Math.PI / 8]} scale={[0.9, 0.9, 0.9]}>
        <ringGeometry args={[node.size * 1.6, node.size * 2.5, 64]} />
        <shaderMaterial
          uniforms={{
            uColor: { value: new THREE.Color(node.color) },
            uTime: { value: 0 }
          }}
          vertexShader={ringVertexShader}
          fragmentShader={ringFragmentShader}
          transparent={true}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Point light */}
      <pointLight 
        color={node.color} 
        intensity={isSelected ? 8 : 3} 
        distance={12}
        decay={2}
      />
      
      {/* Label sprite */}
      <LabelSprite text={node.label} color={node.color} offset={node.size + 1.2} />
    </group>
  )
}

function LabelSprite({ text, color, offset }: { text: string; color: string; offset: number }) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0)'
    ctx.fillRect(0, 0, 512, 128)
    ctx.font = 'bold 48px Inter, sans-serif'
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = color
    ctx.shadowBlur = 20
    ctx.fillText(text, 256, 64)
  }
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  
  return (
    <sprite position={[0, offset, 0]}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  )
}

function EnergyConnection({ edge }: { edge: GraphEdge }) {
  const fromNode = nodes.find(n => n.id === edge.from)
  const toNode = nodes.find(n => n.id === edge.to)
  
  if (!fromNode || !toNode) return null
  
  // Create curved path with control point
  const start = new THREE.Vector3(fromNode.x, fromNode.y, fromNode.z)
  const end = new THREE.Vector3(toNode.x, toNode.y, toNode.z)
  const mid = start.clone().add(end).multiplyScalar(0.5)
  
  // Add curvature
  const offset = new THREE.Vector3(
    (Math.random() - 0.5) * 5,
    5 + Math.random() * 3,
    (Math.random() - 0.5) * 5
  )
  mid.add(offset)
  
  const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
  const points = curve.getPoints(50)
  
  // Create tube geometry for glowing connection
  const tubeGeometry = new THREE.TubeGeometry(curve, 50, 0.08, 8, false)
  
  // Create energy particles along the path
  const particleCount = 20
  const particlePositions = new Float32Array(particleCount * 3)
  const particleOffsets = new Float32Array(particleCount)
  const particleSpeeds = new Float32Array(particleCount)
  
  for (let i = 0; i < particleCount; i++) {
    const t = i / particleCount
    const point = curve.getPoint(t)
    particlePositions[i * 3] = point.x
    particlePositions[i * 3 + 1] = point.y
    particlePositions[i * 3 + 2] = point.z
    particleOffsets[i] = t
    particleSpeeds[i] = 0.5 + Math.random() * 0.5
  }
  
  const particleGeometry = new THREE.BufferGeometry()
  particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3))
  particleGeometry.setAttribute('aOffset', new THREE.Float32BufferAttribute(particleOffsets, 1))
  particleGeometry.setAttribute('aSpeed', new THREE.Float32BufferAttribute(particleSpeeds, 1))
  
  const baseColor = new THREE.Color(fromNode.color).lerp(new THREE.Color(toNode.color), 0.5)
  
  return (
    <group>
      {/* Base connection line - subtle glow */}
      <line>
        <bufferGeometry>
          <float32BufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array(points.map(p => [p.x, p.y, p.z]).flat()),
              3
            ]}
          />
        </bufferGeometry>
        <lineBasicMaterial 
          color={baseColor} 
          transparent 
          opacity={0.3} 
        />
      </line>
      
      {/* Glowing tube */}
      <mesh geometry={tubeGeometry}>
        <meshBasicMaterial 
          color={baseColor} 
          transparent 
          opacity={0.15} 
        />
      </mesh>
      
      {/* Energy particles */}
      <points geometry={particleGeometry}>
        <pointsMaterial
          size={0.3}
          color={baseColor}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  )
}

function NebulaBackground() {
  const count = 800
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  
  const nebulaColors = [
    new THREE.Color('#EC4899'), // Pink
    new THREE.Color('#8B5CF6'), // Purple
    new THREE.Color('#06B6D4'), // Cyan
    new THREE.Color('#3B82F6'), // Blue
    new THREE.Color('#10B981'), // Green
  ]
  
  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    const r = 50 + Math.random() * 80
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    
    positions[i3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.4 // Flattened
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
    uniforms: {
      uPixelScale: { value: 100 },
      uIntensity: { value: 0.6 }
    },
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
  const sizes = new Float32Array(count)
  
  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    const r = 100 + Math.random() * 150
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    
    positions[i3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i3 + 2] = r * Math.cos(phi)
    
    // White to blue-ish stars with varying sizes
    const brightness = 0.5 + Math.random() * 0.5
    const tint = Math.random()
    colors[i3] = brightness * (tint > 0.8 ? 0.7 : 1.0)
    colors[i3 + 1] = brightness * (tint > 0.9 ? 0.8 : 1.0)
    colors[i3 + 2] = brightness
    
    sizes[i] = 0.5 + Math.random() * 2.0
  }
  
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1))
  
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

export default function KnowledgeGraph() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [isMinimized, setIsMinimized] = useState(false)
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-4xl font-black text-white mb-2 font-display">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500">
              Knowledge Galaxy
            </span>
            <Sparkles className="inline-block text-yellow-400 ml-2 animate-pulse" size={28} />
          </h1>
          <p className="text-slate-400">{nodes.length} nodes · {edges.length} connections</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMinimized(!isMinimized)} 
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
          >
            {isMinimized ? <Maximize2 size={18} className="text-slate-400" /> : <Minimize2 size={18} className="text-slate-400" />}
          </button>
          <button 
            onClick={() => setSelectedNode(null)} 
            className="px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-slate-400 transition-colors flex items-center gap-2"
          >
            <ArrowLeft size={16} />Reset View
          </button>
        </div>
      </motion.div>
      
      {/* 3D Canvas */}
      <motion.div 
        className="rounded-2xl overflow-hidden border border-white/10 relative" 
        style={{ 
          height: isMinimized ? '300px' : 'calc(100vh - 80px)', 
          width: '100%',
          transition: 'height 0.3s ease'
        }}
      >
        <Canvas 
          camera={{ position: [0, 10, 55], fov: 55 }}
          gl={{ 
            antialias: true, 
            alpha: true, 
            toneMapping: THREE.ACESFilmicToneMapping, 
            toneMappingExposure: 1.0 
          }}
          style={{ background: 'radial-gradient(ellipse at center, #0a0a1a 0%, #000000 100%)' }}
        >
          {/* Lighting */}
          <ambientLight intensity={0.2} />
          <pointLight position={[25, 25, 25]} intensity={1.5} color="#8B5CF6" />
          <pointLight position={[-25, -25, -25]} intensity={0.8} color="#06B6D4" />
          <pointLight position={[0, 30, 0]} intensity={1.0} color="#FBBF24" />
          
          {/* Scene */}
          <GalaxyScene 
            selectedNode={selectedNode} 
            setSelectedNode={setSelectedNode} 
          />
          
          {/* Controls */}
          <OrbitControls 
            enablePan 
            minDistance={20} 
            maxDistance={100} 
            autoRotate 
            autoRotateSpeed={0.15}
            enableDamping
            dampingFactor={0.05}
          />
        </Canvas>
        
        {/* Node Info Panel */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute right-4 top-4 w-80 glass-card p-5 border border-white/10"
              style={{ backdropFilter: 'blur(20px)', background: 'rgba(15, 23, 42, 0.85)' }}
            >
              <div className="flex items-start gap-3 mb-4">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-2xl"
                  style={{ 
                    backgroundColor: `${selectedNode.color}25`, 
                    boxShadow: `0 0 40px ${selectedNode.color}80, inset 0 0 20px ${selectedNode.color}40`,
                    border: `2px solid ${selectedNode.color}60`
                  }}
                >
                  {selectedNode.type === 'agent' && '🤖'}
                  {selectedNode.type === 'system' && '⚙️'}
                  {selectedNode.type === 'topic' && '💡'}
                  {selectedNode.type === 'project' && '🚀'}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white text-xl">{selectedNode.label}</h3>
                  <span className="text-xs text-slate-400 uppercase tracking-widest">{selectedNode.type}</span>
                </div>
                <button 
                  onClick={() => setSelectedNode(null)} 
                  className="text-slate-400 hover:text-white transition-colors text-xl"
                >
                  ✕
                </button>
              </div>
              
              <p className="text-slate-300 text-sm mb-5 leading-relaxed">{selectedNode.description}</p>
              
              <div className="space-y-2">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">
                  Connections ({selectedNode.connections.length})
                </p>
                {selectedNode.connections.map(connId => {
                  const conn = nodes.find(n => n.id === connId)
                  return conn ? (
                    <button 
                      key={connId} 
                      onClick={() => setSelectedNode(conn)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-left group border border-transparent hover:border-white/10"
                    >
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0 shadow-lg"
                        style={{ backgroundColor: conn.color, boxShadow: `0 0 12px ${conn.color}` }}
                      />
                      <span className="text-sm text-slate-300 group-hover:text-white transition-colors font-medium">{conn.label}</span>
                      <span className="text-xs text-slate-500 ml-auto uppercase tracking-wider">{conn.type}</span>
                    </button>
                  ) : null
                })}
              </div>
              
              <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-3 text-xs text-slate-500">
                <Zap size={14} className="text-yellow-500" />
                <span>Position: ({selectedNode.x.toFixed(1)}, {selectedNode.y.toFixed(1)}, {selectedNode.z.toFixed(1)})</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Legend */}
        <div 
          className="absolute left-4 bottom-4 glass-card p-4 border border-white/10"
          style={{ backdropFilter: 'blur(20px)', background: 'rgba(15, 23, 42, 0.75)' }}
        >
          <p className="text-xs text-slate-400 font-bold mb-3 uppercase tracking-widest">Legend</p>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#EC4899', boxShadow: '0 0 10px #EC4899' }} />
              <span className="text-slate-300">AI Agent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#6366F1', boxShadow: '0 0 10px #6366F1' }} />
              <span className="text-slate-300">System</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10B981', boxShadow: '0 0 10px #10B981' }} />
              <span className="text-slate-300">Topic</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F59E0B', boxShadow: '0 0 10px #F59E0B' }} />
              <span className="text-slate-300">Project</span>
            </div>
          </div>
        </div>
        
        {/* Controls hint */}
        <div className="absolute bottom-4 right-4 text-xs text-slate-500 bg-black/30 px-3 py-2 rounded-lg">
          <p>🖱️ Drag to rotate • Scroll to zoom</p>
        </div>
      </motion.div>
    </div>
  )
}
