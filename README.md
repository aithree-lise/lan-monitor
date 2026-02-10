# 🦀 LAN Service Monitor

Dashboard for monitoring services and devices in the Lise GmbH network.

## Built by
- **Frontend/Build:** eugene 🦀
- **Architecture:** aithree 🎩
- **Review:** byte 💾

## Features (MVP)
- ✅ Service health monitoring (HTTP + Ping)
- ✅ Real-time status updates (30s refresh)
- ✅ Dark theme
- ✅ Responsive design
- ✅ Docker deployment

## Monitored Services
- Conduit (Matrix) - 192.168.27.30:6167
- Ollama - 192.168.27.30:11434
- Mac mini aithree - 192.168.27.155
- Mac mini eugene - 192.168.27.149

## Development

### Prerequisites
- Node.js 22+
- npm

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173

### Backend Development
```bash
cd server
npm install
node index.js
```

Backend API runs on http://localhost:3000

### API Endpoints
- `GET /api/health` - Backend health check
- `GET /api/services` - All services status (cached 30s)
- `GET /api/services/:id` - Single service status

## Production Deployment

### Docker Build
```bash
docker build -t lan-monitor .
```

### Docker Run
```bash
docker run -d -p 8080:3000 --name lan-monitor lan-monitor
```

### Docker Compose
```bash
docker-compose up -d
```

Dashboard available at http://192.168.27.30:8080

## Project Structure
```
lan-monitor/
├── frontend/           # React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ServiceCard.jsx
│   │   │   └── *.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── server/            # Express API
│   ├── index.js
│   ├── checks.js      # Health check logic
│   └── package.json
├── Dockerfile
├── docker-compose.yml
└── SPEC.md
```

## Tech Stack
- **Frontend:** React 18 + Vite
- **Backend:** Node.js + Express
- **Health Checks:** node-fetch + ping
- **Deployment:** Docker

## License
MIT - Lise GmbH Internal
