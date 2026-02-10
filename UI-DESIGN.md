# LAN Monitor — UI Design

## Übersicht

Einfaches, funktionales Dashboard für Service-Monitoring im Lise-Netzwerk. Dark Theme, responsive, Fokus auf Klarheit.

---

## Layout

### Header
```
┌──────────────────────────────────────────────┐
│  🔧 Lise Network Monitor          [Last: 14:45] │
└──────────────────────────────────────────────┘
```
- Logo/Icon links
- Titel zentral
- Last refresh timestamp rechts
- Auto-refresh Indicator (kleiner grüner Punkt wenn aktiv)

---

### Service Grid
```
┌───────────────┬───────────────┬───────────────┐
│   Conduit     │    Ollama     │   aithree    │
│   ✅ ONLINE   │   ✅ ONLINE   │   🟢 UP      │
│   6ms         │   12ms        │   8ms        │
└───────────────┴───────────────┴───────────────┘
┌───────────────┬───────────────┬───────────────┐
│    eugene     │     byte      │   (reserved) │
│   🟢 UP       │   🟢 UP       │              │
│   5ms         │   3ms         │              │
└───────────────┴───────────────┴───────────────┘
```

**Status Cards:**
- Service Name (groß, bold)
- Status Icon + Text (✅/❌/⚠️)
- Response Time (klein, grau)
- Card Background: grün (healthy) / rot (down) / grau (unknown)

**Grid:** 3 Spalten auf Desktop, 1 Spalte auf Mobile

---

### Service Details (expandable)
Klick auf eine Card öffnet Details:

```
┌──────────────────────────────────────────────┐
│ 🔧 Conduit (Matrix Server)                   │
│                                              │
│ Status:     ✅ ONLINE                        │
│ URL:        192.168.27.30:6167               │
│ Response:   6ms                              │
│ Uptime:     99.2% (last 24h)                 │
│ Last Check: 14:45:12                         │
│                                              │
│ [Close]                                      │
└──────────────────────────────────────────────┘
```

---

## Color Scheme (Dark Theme)

- **Background:** `#1a1a1a`
- **Cards:** `#2a2a2a`
- **Text:** `#ffffff` (primary), `#888888` (secondary)
- **Status Colors:**
  - Healthy: `#22c55e` (green)
  - Down: `#ef4444` (red)
  - Warning: `#f59e0b` (orange)
  - Unknown: `#6b7280` (gray)

---

## Features

1. **Auto-Refresh:** Alle 30s neuer Check (konfiguierbar)
2. **Manual Refresh:** Button oben rechts
3. **Responsive:** Mobile-friendly Grid
4. **Minimal:** Keine unnötigen Elemente, Fokus auf Status

---

## Phase 2 (später)
- Uptime History Chart (letzte 24h)
- Notifications bei Service Down
- Team Status (wer ist online, letzte Aktivität)

---

## Tech Stack
- React + Vite
- Tailwind CSS (für Dark Theme + Grid)
- Auto-refresh via `setInterval`
- API calls an `/api/services`
