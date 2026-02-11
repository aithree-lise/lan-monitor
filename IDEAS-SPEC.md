# IDEAS-SPEC.md - AP6 Ideas Management Specification

## Overview

The AP6 Ideas Management System allows team members to propose ideas, review them, and convert approved ideas into tickets for the Kanban board.

## API Endpoints

### Ideas

#### GET /api/ideas
Fetch all ideas with optional filters.

**Query Parameters:**
- `status` — Filter by status: `proposed`, `approved`, `rejected`, `deferred`
- `priority` — Filter by priority: `low`, `medium`, `high`, `critical`
- `tags` — Filter by tags (comma-separated)

**Response:**
```json
{
  "ideas": [
    {
      "id": 1,
      "title": "Add dark mode to dashboard",
      "description": "Implement dark theme for accessibility and reduced eye strain",
      "status": "proposed",
      "priority": "medium",
      "tags": ["ui", "accessibility"],
      "author": "Eugene",
      "created_at": "2026-02-11T08:00:00Z",
      "updated_at": "2026-02-11T08:00:00Z",
      "comment": null
    }
  ]
}
```

#### GET /api/ideas/:id
Fetch a single idea.

**Response:**
```json
{
  "idea": {
    "id": 1,
    "title": "...",
    "description": "...",
    "status": "proposed",
    "priority": "medium",
    "tags": ["ui", "accessibility"],
    "author": "Eugene",
    "created_at": "2026-02-11T08:00:00Z",
    "updated_at": "2026-02-11T08:00:00Z",
    "comment": null
  }
}
```

#### PUT /api/ideas/:id
Update idea status and add reviewer comment.

**Request:**
```json
{
  "title": "string (required, must be sent even if unchanged)",
  "status": "proposed|approved|rejected|deferred",
  "comment": "string (optional, reviewer feedback)"
}
```

**Response:**
```json
{
  "idea": {
    "id": 1,
    "title": "...",
    "status": "approved",
    "priority": "medium",
    "tags": ["ui", "accessibility"],
    "author": "Eugene",
    "created_at": "2026-02-11T08:00:00Z",
    "updated_at": "2026-02-11T09:00:00Z",
    "comment": "Great idea! Let's prioritize this."
  }
}
```

#### POST /api/ideas/:id/convert
Convert an approved idea to a ticket.

**Request:**
```json
{
  "title": "string (used for ticket title)"
}
```

**Response:**
```json
{
  "ticket_id": 5,
  "message": "Idea converted to ticket"
}
```

---

## Data Model

### Idea

```
{
  id: number (auto-increment or UUID),
  title: string (max 255 chars, required),
  description: string (optional, max 2000 chars),
  status: enum ["proposed", "approved", "rejected", "deferred"],
  priority: enum ["low", "medium", "high", "critical"],
  tags: string[] (optional, array of tag strings),
  author: string (user name),
  comment: string | null (reviewer feedback),
  created_at: timestamp,
  updated_at: timestamp
}
```

---

## Status Flow

Ideas move through a review workflow:

```
Proposed → Approved → Ticket (via convert)
        ↘ Rejected
        ↘ Deferred
```

**Key Rules:**
- Only **Proposed** ideas can be reviewed (Approve/Reject/Defer buttons shown)
- Only **Approved** ideas can be converted to tickets
- Rejected/Deferred ideas cannot be reverted
- Converting an idea removes it from the Ideas page (ticket created on Kanban)

---

## UI Sections

### Navigation
Added "💡 Ideas" tab to main navigation bar alongside "📊 Dashboard"

### IdeasPage.jsx
Main component with:
- Filter controls (Status, Priority, Tags)
- Idea list view (grid layout)
- Empty state messaging

### IdeaCard.jsx
Individual idea display with:
- Title, description, tags
- Status badge (color-coded)
- Priority indicator
- Author and created date
- Review UI for proposed ideas (inline comment + action buttons)
- Convert button for approved ideas

### Review UI
For **proposed** ideas:
- Textarea for reviewer comment (optional)
- ✅ Approve — move to approved status
- ❌ Reject — move to rejected status
- ⏸️ Defer — move to deferred status
- Cancel — close review panel

---

## Color Scheme

**Status Badges:**
- 📋 Proposed: Yellow (#ffeb3b)
- ✅ Approved: Green (#90ee90)
- ❌ Rejected: Red (#ff6b6b)
- ⏸️ Deferred: Gray (#999)

**Priority Indicators:**
- Low: Gray (#999)
- Medium: Yellow (#ffeb3b)
- High: Orange (#ff9800)
- Critical: Red (#ff6b6b)

---

## Integration Notes

- Ideas page is a **new tab** in the main app navigation (alongside Dashboard)
- Dark theme consistent with Kanban Board
- Auto-refresh: Ideas every 10 seconds
- Responsive grid (2+ columns on desktop, 1 column on mobile)
- Graceful error handling with error banners

---

## Next Steps (Eugene - Backend)

1. ✅ Create `/api/ideas` endpoints (GET, PUT, POST/:id/convert)
2. ✅ Implement idea status workflow (proposed → approved/rejected/deferred)
3. ✅ Create ticket from approved idea
4. ✅ Persist reviewer comments

---

**Frontend Repo:** `/Users/aitwo/.openclaw/workspace/lan-monitor/feature/ap6-ideas-system`  
**Status:** ✅ Components & CSS ready, integrated with API endpoints  
**Base URL:** http://192.168.27.30:8080
