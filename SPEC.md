# LAN Service Monitor — Architecture Spec v1

## Übersicht
Ein Dashboard das den Status aller Services und AI-Agents im Lise GmbH LAN anzeigt.

## Tech Stack
- **Frontend:** React (Vite) — Eugene baut
- **Backend:** Node.js (Express) — simple API die Services pollt
- **Deployment:** Docker Container auf DGX Spark (192.168.27.30)
- **Port:** 3000 (Backend API) + 8080 (Frontend)

## MVP Features (Phase 1)

### Service Health
Folgende Services pingen/checken:
| Service | Host | Check |
|---------|------|-------|
| Conduit (Matrix) | 192.168.27.30:6167 | GET `/_matrix/client/versions` |
| Ollama | 192.168.27.30:11434 | GET `/api/tags` |
| Mac mini aithree | 192.168.27.155 | ICMP ping |
| Mac mini eugene | 192.168.27.149 | ICMP ping |
| Mac mini byte | TBD | ICMP ping |

### API Endpoints
```
GET /api/health          → Backend health check
GET /api/services        → Status aller Services (cached, max 30s alt)
GET /api/services/:id    → Status eines einzelnen Service
```

### Response Format
```json
{
  "services": [
    {
      "id": "conduit",
      "name": "Conduit (Matrix)",
      "host": "192.168.27.30:6167",
      "status": "up",           // up | down | unknown
      "responseMs": 42,
      "lastChecked": "2026-02-10T15:00:00Z",
      "details": {}             // optional: version info etc
    }
  ]
}
```

### Frontend
- Dashboard Grid mit Cards pro Service
- Grün/Rot/Grau für up/down/unknown
- Auto-Refresh alle 30 Sekunden
- Responsive (soll auch auf Handy gehen)
- Dark Theme (passt zum Thema)

## Phase 2 (später)
- Team Status: Welche AIs sind online (Matrix Presence)
- Letzte Aktivität pro AI
- Uptime History / Graphs
- Notification bei Service-Ausfall

## Docker Setup
```dockerfile
# Multi-stage build
FROM node:22-alpine AS build
WORKDIR /app
COPY . .
RUN npm install && npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/package.json .
RUN cd server && npm install --production
EXPOSE 8080
CMD ["node", "server/index.js"]
```

## Projektstruktur
```
lan-monitor/
├── src/                 # React Frontend
│   ├── App.jsx
│   ├── components/
│   │   ├── Dashboard.jsx
│   │   ├── ServiceCard.jsx
│   │   └── Header.jsx
│   └── main.jsx
├── server/              # Express Backend
│   ├── index.js
│   ├── checks.js        # Service health check logic
│   └── package.json
├── Dockerfile
├── docker-compose.yml
├── package.json
└── vite.config.js
```

## Notes
- Backend und Frontend in einem Container (einfach für v1)
- Express served das gebaute React + die API
- Kein Auth nötig (internes LAN)
- Eugene baut, Byte + Siegbert reviewen
