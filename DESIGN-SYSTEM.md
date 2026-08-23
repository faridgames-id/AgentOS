# DESIGN SYSTEM - Hermes Vision OS v3.0

## 🎨 Color Palette

### **Primary Colors**
```css
:root {
  /* Cyberpunk Neon */
  --neon-cyan: #00D4FF;
  --neon-purple: #8B5CF6;
  --neon-pink: #EC4899;
  --neon-green: #10B981;
  --neon-orange: #F97316;
  --neon-yellow: #FBBF24;
  
  /* Deep Space */
  --space-black: #050508;
  --space-navy: #0A0F1E;
  --space-blue: #1E293B;
  
  /* Holographic */
  --holo-cyan: rgba(0, 212, 255, 0.1);
  --holo-purple: rgba(139, 92, 246, 0.1);
  --holo-pink: rgba(236, 72, 153, 0.1);
}
```

### **Color Usage Guide**

| Element | Color | Usage |
|---------|-------|-------|
| Background | `#050508` | Main canvas, deep space |
| Card Surface | `rgba(30, 41, 59, 0.7)` | Glassmorphism cards |
| Border Glow | `var(--neon-cyan)` | Active elements |
| Text Primary | `#FFFFFF` | Main content |
| Text Secondary | `rgba(255,255,255,0.7)` | Subtitles, hints |
| Accent | `var(--neon-purple)` | Highlights |
| Success | `var(--neon-green)` | Online status |
| Warning | `var(--neon-orange)` | Alerts |
| Error | `var(--neon-pink)` | Errors |

---

## 🔤 Typography

### **Font Stack**
```css
:root {
  --font-display: 'Orbitron', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-casual: 'Dancing Script', cursive;
}
```

### **Type Scale**
```css
.text-hero {
  font-family: var(--font-display);
  font-size: 4rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.text-display {
  font-family: var(--font-display);
  font-size: 2.5rem;
  font-weight: 700;
}

.text-heading {
  font-family: var(--font-body);
  font-size: 1.5rem;
  font-weight: 600;
}

.text-body {
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.6;
}

.text-code {
  font-family: var(--font-mono);
  font-size: 0.875rem;
}

.text-accent {
  font-family: var(--font-casual);
  font-size: 1.25rem;
}
```

---

## 📐 Spacing System

```css
:root {
  --space-xs: 0.25rem;    /* 4px */
  --space-sm: 0.5rem;     /* 8px */
  --space-md: 1rem;       /* 16px */
  --space-lg: 1.5rem;     /* 24px */
  --space-xl: 2rem;       /* 32px */
  --space-2xl: 3rem;      /* 48px */
  --space-3xl: 4rem;      /* 64px */
  --space-4xl: 6rem;      /* 96px */
}
```

---

## 🎭 Components

### **1. Holographic Card**
```tsx
// Usage
<HoloCard 
  glowColor="cyan"
  title="System Status"
  children={...}
/>
```

**Properties:**
- Glassmorphism background
- Neon border glow
- Hover lift effect
- Animated shine overlay

### **2. Neon Button**
```tsx
<NeonButton variant="primary" onClick={() => {}}>
  Execute
</NeonButton>
```

**Variants:**
- `primary` - Cyan glow
- `secondary` - Purple glow
- `success` - Green glow
- `warning` - Orange glow
- `danger` - Pink glow

### **3. Status Indicator**
```tsx
<StatusIndicator status="online" label="Active" />
```

**States:**
- `online` - Pulsing green dot
- `offline` - Gray static dot
- `warning` - Blinking orange dot
- `error` - Red flashing dot

### **4. Progress Ring**
```tsx
<ProgressRing 
  percentage={75}
  color="cyan"
  size={120}
/>
```

### **5. Data Stream**
```tsx
<DataStream 
  data={activityLog}
  speed="normal"
/>
```

---

## ✨ Animations

### **Animation Library**
```typescript
interface Animations {
  // Page transitions
  pageIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut" }
  };
  
  // Element hover
  hoverLift: {
    y: -8,
    transition: { duration: 0.3 }
  };
  
  // Pulse effect
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: { duration: 2, repeat: Infinity }
  };
  
  // Scan line
  scanline: {
    y: [-100, 110],
    transition: { duration: 3, repeat: Infinity }
  };
}
```

### **CSS Animations**
```css
@keyframes neonPulse {
  0%, 100% { box-shadow: 0 0 5px var(--neon-cyan), 0 0 10px var(--neon-cyan); }
  50% { box-shadow: 0 0 20px var(--neon-cyan), 0 0 30px var(--neon-cyan); }
}

@keyframes scanline {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes glitch {
  0% { transform: translate(0); }
  20% { transform: translate(-2px, 2px); }
  40% { transform: translate(-2px, -2px); }
  60% { transform: translate(2px, 2px); }
  80% { transform: translate(2px, -2px); }
  100% { transform: translate(0); }
}
```

---

## 🖼️ Visual Effects

### **1. Bloom/Glow**
```javascript
// Three.js post-processing
const bloomPass = new UnrealBloomPass(
  new Vector2(width, height),
  1.5,    // strength
  0.4,    // radius
  0.1     // threshold
);
```

### **2. Scanlines**
```css
.scanlines::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    to bottom,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.1) 2px,
    rgba(0, 0, 0, 0.1) 4px
  );
  pointer-events: none;
}
```

### **3. Particle System**
```javascript
// Floating data particles
const particles = new THREE.Points(
  particleGeometry,
  new THREE.PointsMaterial({
    size: 0.5,
    color: 0x00D4FF,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
  })
);
```

---

## 📱 Responsive Breakpoints

```css
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}
```

---

## 🎯 Accessibility

| Criterion | Target |
|-----------|--------|
| Color Contrast | 4.5:1 minimum |
| Focus Indicators | Visible outlines |
| Keyboard Navigation | Full support |
| Screen Readers | ARIA labels |
| Motion Reduction | Respect prefers-reduced-motion |

---

## 📦 Asset Library

### **Icons**
- Lucide Icons (primary)
- Custom SVG icons (futuristic set)
- Emoji fallbacks

### **Textures**
- Grid patterns
- Noise overlays
- Gradient meshes

### **Sound Effects**
- Click sounds
- Hover whooshes
- Success chimes
- Error buzzers

---

## 🔄 State Management

```typescript
// Zustand store
interface AppState {
  // UI State
  theme: 'cyberpunk' | 'dark' | 'light';
  sidebarOpen: boolean;
  currentPage: string;
  
  // Agent State
  agents: Agent[];
  selectedAgent: Agent | null;
  
  // System State
  systemStatus: 'online' | 'offline' | 'warning';
  notifications: Notification[];
  
  // Methods
  setTheme: (theme: string) => void;
  navigate: (page: string) => void;
  selectAgent: (agent: Agent) => void;
}
```

---

*Design System v3.0*
*Created: 2026-08-22*
