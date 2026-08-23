# README.md - Hermes Vision OS v3.0

<div align="center">

![Hermes Vision OS](https://img.shields.io/badge/Hermes-Vision_OS-v3.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Status-Active-success)

**Futuristic AI Agentic Operating System**

*Powered by Cozy Assistant & NOVA-ZEPHRA Agents*

</div>

---

## 🌟 Overview

Hermes Vision OS v3.0 is a next-generation AI operating system interface featuring:

- 🤖 **9 AI Agents** - NOVA, CIPHER, ATLAS, PIXEL, ORACLE, SENTINEL, AURORA, PHOENIX, ZEPHRA
- 📊 **Real-time Dashboards** - Financial tracking, stock management, agent monitoring
- 🌌 **3D Knowledge Galaxy** - Interactive neural network visualization
- 💬 **Cozy Agentic Chat** - Terminal-style AI interface
- 🔮 **Futuristic UI** - Cyberpunk aesthetic with holographic effects

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.12+
- Firebase account

### Installation

```bash
# Clone the repository
git clone https://github.com/faridgames-id/hermes-vision-os.git
cd hermes-vision-os

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
pip install -r requirements.txt

# Setup Firebase credentials
cp ~/.hermes/firebase-credentials.json backend/
cp ~/.hermes/firebase-credentials-shop.json backend/

# Start development servers
npm run dev          # Frontend (port 3000)
python main.py       # Backend (port 8000)
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 📁 Project Structure

```
hermes-vision-os/
├── backend/                # Python FastAPI backend
│   ├── main.py            # Application entry
│   ├── routers/           # API endpoints
│   └── database/          # Database clients
│
├── frontend/              # React + Three.js frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand state management
│   │   └── utils/         # Helper functions
│   └── public/            # Static assets
│
├── .hermes/               # Hermes configuration
│   ├── firebase-credentials.json
│   └── memories/
│
├── PRD.md                 # Product Requirements
├── AGENTS.md             # Agent registry
├── DESIGN-SYSTEM.md      # Design tokens
├── ARCHITECTURE.md       # System architecture
└── IMPLEMENTATION-ROADMAP.md  # Development roadmap
```

---

## 🤖 Agents

| Agent | Role | Status | Model |
|-------|------|--------|-------|
| 🌟 NOVA | Research & Analysis | 🟢 Online | Claude Sonnet 4 |
| 💻 CIPHER | Code & Development | 🟢 Online | Claude Sonnet 4 |
| 📊 ATLAS | Finance & Tracking | 🟢 Online | GPT-4 |
| 🎨 PIXEL | Image & Creative | 🟢 Online | DALL-E 3 |
| 👁️ ORACLE | Insights & Predictions | 🟢 Online | Gemini Pro |
| 🛡️ SENTINEL | Security & Monitoring | 🟢 Online | Claude Sonnet 4 |
| 🌅 AURORA | Content & Writing | 🟢 Online | GPT-4 |
| 🦅 PHOENIX | Automation & Tasks | 🟢 Online | Claude Sonnet 4 |
| 🎮 ZEPHRA | Stock & Commerce | 🟢 Online | Claude Sonnet 4 |

---

## 🎨 Features

### Dashboard - Command Center
- Real-time system statistics
- Task flow monitoring
- Resource usage visualization
- Agent performance metrics
- Model status dashboard

### Cozy Agentic - Neural Link
- Terminal-style chat interface
- Session management
- Memory matrix visualization
- Voice input support
- Quick task templates

### Agents - Squad Bay
- 3D holographic agent cards
- Real-time status indicators
- Skill tree visualization
- Performance analytics
- Task assignment interface

### Knowledge Galaxy - Neural Network
- 3D planet-style nodes
- Energy flow connections
- Interactive exploration
- 3000+ star particles
- Nebula background effects

---

## 🔌 API Endpoints

### Agents
```http
GET    /api/agents              # List all agents
POST   /api/agents/:id/task     # Assign task
GET    /api/agents/:id/logs     # Activity logs
```

### Finance (ATLAS)
```http
GET    /api/finance/monthly-summary
POST   /api/finance/income
POST   /api/finance/expense
```

### Stock (ZEPHRA)
```http
GET    /api/stock/summary
POST   /api/stock/
GET    /api/stock/?status=Ready
```

### System
```http
GET    /api/system/status
GET    /api/system/performance
```

---

## 🛠️ Tech Stack

### Frontend
- **React 18** + TypeScript
- **Three.js** + React Three Fiber
- **Framer Motion** (animations)
- **Tailwind CSS** (styling)
- **Zustand** (state management)
- **Recharts** (charts)

### Backend
- **Python 3.12**
- **FastAPI** (API framework)
- **Firebase Admin SDK** (database)
- **SQLite** (local storage)
- **Redis** (caching)

### DevOps
- **Vercel** (frontend hosting)
- **AWS EC2** (backend hosting)
- **GitHub Actions** (CI/CD)

---

## 📊 Firebase Projects

| Project | Purpose | UID |
|---------|---------|-----|
| farid-tracker-skuyy | ATLAS (Finance) | nNK0Dh9LJQcvBULiY83DP4hu8CH3 |
| farid-shop-enterprise | ZEPHRA (Stock) | Same user |

---

## 🔐 Security

- Firebase Authentication
- API key authentication
- Role-based access control
- Encrypted data at rest
- TLS in transit
- Rate limiting

---

## 📈 Performance

| Metric | Target | Current |
|--------|--------|---------|
| Lighthouse | >90 | 85 |
| First Contentful Paint | <1.5s | 1.2s |
| Time to Interactive | <3s | 2.5s |
| 3D FPS | 60 | 58 |
| API Response | <200ms | 150ms |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details

---

## 👥 Team

| Role | Name |
|------|------|
| Project Owner | Farid Excellent |
| AI Partner | Cozy Assistant |
| Agents | NOVA-ZEPHRA Squad |

---

## 🔗 Links

- **Live Demo**: http://43.129.51.147:3000
- **GitHub**: https://github.com/faridgames-id/hermes-vision-os
- **Documentation**: See `/docs` folder

---

<div align="center">

**Built with ❤️ by Cozy Assistant & Farid Excellent**

*Version 3.0.0 | Last Updated: 2026-08-22*

</div>
