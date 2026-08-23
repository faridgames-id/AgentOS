# ARCHITECTURE.md - Hermes Vision OS v3.0

## 🏗️ System Architecture

### **High-Level Overview**
```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   React     │  │  Three.js   │  │ Framer      │             │
│  │   Components│  │  3D Scenes  │  │ Motion      │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│         └────────────────┴────────────────┘                     │
│                          │                                     │
│                    ┌─────▼─────┐                               │
│                    │  State    │                               │
│                    │  Management│                              │
│                    │  (Zustand) │                              │
│                    └─────┬─────┘                               │
└──────────────────────────┼────────────────────────────────────┘
                           │
┌──────────────────────────┼────────────────────────────────────┐
│                      API LAYER                               │
│                      │                                      │
│         ┌────────────▼────────────┐                          │
│         │    FastAPI Backend      │                          │
│         │   (Python 3.12)         │                          │
│         └────────────┬────────────┘                          │
│                      │                                       │
└──────────────────────┼───────────────────────────────────────┘
                       │
┌──────────────────────┼───────────────────────────────────────┐
│                    DATA LAYER                                │
│        ┌─────────────┼─────────────┐                        │
│        ▼             ▼             ▼                        │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐                   │
│  │ Firebase│   │  SQLite │   │  Redis  │                   │
│  │ (Cloud) │   │ (Local) │   │ (Cache) │                   │
│  └────┬────┘   └────┬────┘   └────┬────┘                   │
│       │             │             │                         │
│       └─────────────┴─────────────┘                         │
│                      │                                      │
│              ┌───────▼───────┐                              │
│              │  File System  │                              │
│              │  (.hermes/)   │                              │
│              └───────────────┘                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
hermes-vision-os/
│
├── backend/                    # Python FastAPI Backend
│   ├── main.py                # Application entry point
│   ├── routers/               # API routes
│   │   ├── agents.py         # Agent management
│   │   ├── finance.py        # Financial data
│   │   ├── stock.py          # Stock/inventory
│   │   └── system.py         # System status
│   ├── database/              # Database clients
│   │   ├── firebase.py       # Firebase client
│   │   └── sqlite.py         # Local SQLite
│   └── utils/                 # Utility functions
│
├── frontend/                   # React + Three.js Frontend
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   │   ├── layout/        # Layout components
│   │   │   ├── cards/         # Card components
│   │   │   ├── buttons/       # Button components
│   │   │   └── effects/       # Visual effects
│   │   ├── pages/             # Page components
│   │   │   ├── Dashboard.tsx  # Command Center
│   │   │   ├── Chat.tsx       # Neural Link
│   │   │   ├── Agents.tsx     # Squad Bay
│   │   │   └── KnowledgeGraph.tsx  # Neural Network
│   │   ├── store/             # Zustand stores
│   │   ├── hooks/             # Custom hooks
│   │   ├── types/             # TypeScript types
│   │   └── utils/             # Utility functions
│   ├── public/                # Static assets
│   └── package.json
│
├── .hermes/                    # Hermes configuration
│   ├── firebase-credentials.json
│   ├── firebase-credentials-shop.json
│   ├── memories/              # Agent memories
│   └── scripts/               # Automation scripts
│
├── PRD.md                      # Product Requirements
├── AGENTS.md                   # Agent registry
├── DESIGN-SYSTEM.md            # Design tokens
├── ARCHITECTURE.md             # This file
└── README.md                   # Project overview
```

---

## 🔌 API Endpoints

### **Agents API**
```http
GET    /api/agents              # List all agents
GET    /api/agents/:id          # Get agent details
POST   /api/agents/:id/task     # Assign task
GET    /api/agents/:id/logs     # Agent activity logs
PUT    /api/agents/:id/status   # Update status
```

### **Finance API (ATLAS)**
```http
GET    /api/finance/monthly-summary      # Monthly overview
GET    /api/finance/transactions         # Transaction list
POST   /api/finance/income               # Add income
POST   /api/finance/expense              # Add expense
GET    /api/finance/stats                # Financial statistics
```

### **Stock API (ZEPHRA)**
```http
GET    /api/stock/summary                # Stock summary
GET    /api/stock/                       # All items
POST   /api/stock/                       # Add item
GET    /api/stock/:id                    # Item details
PUT    /api/stock/:id                    # Update item
DELETE /api/stock/:id                    # Delete item
```

### **System API**
```http
GET    /api/system/status                # System health
GET    /api/system/performance           # Performance metrics
GET    /api/system/logs                  # System logs
POST   /api/system/restart               # Restart services
```

---

## 🗄️ Database Schema

### **Firebase Collections**

#### **users/{uid}/transactions**
```typescript
interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  createdAt: Timestamp;
}
```

#### **users/{uid}/accounts** (ZEPHRA)
```typescript
interface Account {
  id: string;
  email: string;
  namaPenjual: string;
  game: 'Free Fire' | 'Mobile Legends';
  hargaBeli: number;
  targetJual: number;
  hargaJual: number;
  status: 'Ready' | 'Terjual' | 'Cicilan';
  spec: string;
  device: string;
  rank: string;
  password: string;
  loginVia: string;
  tanggalMasuk: string;
  catatan: string;
}
```

#### **agents/**
```typescript
interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'offline' | 'working';
  model: string;
  tasks_completed: number;
  efficiency: number;
  current_task?: string;
}
```

---

## 🔐 Security Architecture

### **Authentication**
- Firebase Authentication (primary)
- API Key authentication (backend)
- Session management (JWT)

### **Authorization**
- Role-based access control (RBAC)
- Resource-level permissions
- Audit logging

### **Data Protection**
- Encryption at rest (Firebase)
- TLS in transit
- API key rotation
- Rate limiting

---

## 🚀 Deployment Architecture

### **Development**
```
Local Development Server
├── Frontend: Vite (port 3000)
├── Backend: FastAPI (port 8000)
└── Database: Firebase Emulator
```

### **Production**
```
Vercel (Frontend)
├── CDN: Global edge network
├── Build: Optimized bundles
└── Environment: Production vars

AWS EC2 (Backend)
├── Instance: t3.medium
├── OS: Ubuntu 22.04
├── Runtime: Python 3.12
└── Process: systemd

Firebase (Database)
├── Firestore: Primary DB
├── Auth: User management
└── Storage: File assets
```

---

## 📊 Performance Optimization

### **Frontend**
- Code splitting (React.lazy)
- Image optimization (WebP)
- Lazy loading (Intersection Observer)
- Bundle analysis (webpack-bundle-analyzer)

### **Backend**
- Response caching (Redis)
- Database indexing
- Query optimization
- Connection pooling

### **3D Rendering**
- Instanced rendering
- Level of detail (LOD)
- Frustum culling
- Texture atlasing

---

## 🔄 Data Flow

### **Real-time Updates**
```
Firebase Listener → Zustand Store → React Components
       ↓
   WebSocket (optional)
       ↓
   SSE (Server-Sent Events)
```

### **API Request Flow**
```
User Action
    ↓
React Component
    ↓
Zustand Action
    ↓
API Call (Axios)
    ↓
FastAPI Endpoint
    ↓
Database Query
    ↓
Response
    ↓
State Update
    ↓
UI Re-render
```

---

## 🧩 Integration Points

### **External Services**
| Service | Purpose | Integration |
|---------|---------|-------------|
| Firebase | Database & Auth | SDK v10 |
| Google AI | Chat responses | API |
| Obsidian | Second brain | REST API |
| MCP Server | Tool execution | Local HTTP |

### **Internal Services**
| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 3000 | React + Vite |
| Backend | 8000 | FastAPI |
| MCP | 27124 | Tool server |
| Obsidian | 27125 | Note API |

---

## 📈 Scalability Plan

### **Current Capacity**
- 9 Agents
- 1 User
- 2 Firebase Projects
- ~500 transactions/month

### **Growth Targets**
| Timeline | Users | Agents | Transactions |
|----------|-------|--------|--------------|
| Month 1 | 1 | 9 | 500 |
| Month 3 | 5 | 15 | 2,000 |
| Month 6 | 20 | 25 | 10,000 |
| Month 12 | 100 | 50 | 50,000 |

### **Scaling Strategy**
- Horizontal scaling (multiple EC2 instances)
- Database sharding (by user)
- CDN for static assets
- Load balancing (ALB)

---

*Architecture Document v3.0*
*Created: 2026-08-22*
