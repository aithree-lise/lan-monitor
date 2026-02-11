# TICKET-SPEC.md - AP5 Kanban Board Specification

## Overview

The AP5 Kanban Board provides a visual task management interface with real-time agent status tracking. Tickets flow through four columns: **Backlog** → **In Progress** → **Review** → **Done**.

## API Endpoints

### Tickets

#### GET /api/tickets
Fetch all tickets.

**Response:**
```json
{
  "tickets": [
    {
      "id": 1,
      "title": "Fix login flow",
      "description": "Users report 401 errors on password reset",
      "status": "in-progress",
      "priority": "high",
      "assigned_to": "Eugene",
      "created_at": "2026-02-11T09:00:00Z",
      "updated_at": "2026-02-11T10:30:00Z"
    }
  ]
}
```

#### POST /api/tickets
Create a new ticket (always starts in **backlog**).

**Request:**
```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "priority": "low|medium|high|critical (default: medium)",
  "assigned_to": "string (optional, agent name)",
  "status": "backlog (always)"
}
```

**Response:**
```json
{
  "ticket": {
    "id": 2,
    "title": "...",
    "description": "...",
    "status": "backlog",
    "priority": "medium",
    "assigned_to": null,
    "created_at": "2026-02-11T09:30:00Z",
    "updated_at": "2026-02-11T09:30:00Z"
  }
}
```

#### PUT /api/tickets/:id
Update ticket status and metadata.

**Request:**
```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "status": "backlog|in-progress|review|done (optional)",
  "priority": "low|medium|high|critical (optional)",
  "assigned_to": "string (optional)"
}
```

**Response:**
```json
{
  "ticket": {
    "id": 1,
    "title": "...",
    "description": "...",
    "status": "review",
    "priority": "high",
    "assigned_to": "Eugene",
    "created_at": "2026-02-11T09:00:00Z",
    "updated_at": "2026-02-11T10:45:00Z"
  }
}
```

#### DELETE /api/tickets/:id
Delete a ticket.

**Response:**
```json
{
  "message": "Ticket deleted",
  "id": 1
}
```

### Agent Status

#### GET /api/agents/status
Fetch real-time agent status.

**Response:**
```json
{
  "agents": [
    {
      "id": "agent-1",
      "name": "Eugene",
      "status": "online",
      "workload": 65
    },
    {
      "id": "agent-2",
      "name": "Bubble Bass",
      "status": "online",
      "workload": 42
    }
  ]
}
```

**Status Values:**
- `online` — Agent is active and processing
- `idle` — Agent is ready but not active
- `offline` — Agent is disconnected

**Workload:** 0-100 percentage (optional field)

---

## Data Model

### Ticket

```
{
  id: number (auto-increment or UUID),
  title: string (max 255 chars, required),
  description: string (optional, max 2000 chars),
  status: enum ["backlog", "in-progress", "review", "done"],
  priority: enum ["low", "medium", "high", "critical"],
  assigned_to: string | null (agent name),
  created_at: timestamp,
  updated_at: timestamp
}
```

### Agent

```
{
  id: string (unique identifier),
  name: string (display name),
  status: enum ["online", "idle", "offline"],
  workload: number (0-100, optional)
}
```

---

## Status Flow

Tickets **must** move linearly through columns:

```
Backlog → In Progress → Review → Done
```

Tickets **cannot** skip columns or go backward. The UI enforces this with disabled buttons:
- **Backlog**: "Next" button only
- **In Progress**: "Back" and "Next" buttons
- **Review**: "Back" and "Next" buttons
- **Done**: "Back" button only

---

## UI Sections

### KanbanBoard.jsx
Main component. Includes:
- Header with title and "+ New Ticket" button
- AgentStatus bar (shows online agents)
- 4-column kanban grid (Backlog, In Progress, Review, Done)
- New Ticket form (expandable)

### TicketCard.jsx
Individual ticket card. Shows:
- Ticket ID and priority badge
- Title and optional description
- Assigned agent (if any)
- Creation date
- Move buttons (◀ Back / Next ▶) with disabled states
- Delete button (✕)

### AgentStatus.jsx
Real-time agent display bar. Shows:
- Agent name
- Status indicator (green/yellow/red dot)
- Workload percentage (optional)
- Auto-refreshes every 5 seconds

---

## Error Handling

- **Missing title on create:** Alert "Title is required"
- **Network error:** Show error banner with message
- **Failed move/delete:** Alert with error details

Graceful fallback: If `/api/agents/status` fails, AgentStatus shows error message but doesn't block the kanban board.

---

## Integration Notes

- Kanban board is a **new section** in Dashboard (above Services section)
- Dark theme consistent with existing components
- Responsive grid (4 columns on desktop, adaptable to mobile)
- Auto-refresh: Tickets every 10 seconds, Agents every 5 seconds
- No external libraries required (vanilla React + CSS Grid)

---

## Next Steps (Eugene)

1. ✅ Create `/api/tickets` endpoints (GET, POST, PUT, DELETE)
2. ✅ Create `/api/agents/status` endpoint
3. ✅ Implement agent status tracking (real-time or polling)
4. ✅ Connect to backend data persistence (DB, JSON file, etc.)
5. Test with frontend components

---

**Frontend Repo:** `/Users/aitwo/.openclaw/workspace/lan-monitor/feature/ap5-kanban`  
**Status:** ✅ Components & CSS ready, awaiting API endpoints
