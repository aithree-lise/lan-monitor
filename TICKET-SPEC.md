# AP5: Ticket/Kanban Board — Spec

## Übersicht
Kanban-Board im LAN Monitor Dashboard für Task-Management zwischen den Agents.
Swimlanes und deren Bedeutung werden später von den Menschen definiert — vorerst Standard-Kanban.

## Swimlanes (Default)
- **Backlog** — Noch nicht begonnen
- **In Progress** — Wird bearbeitet
- **Review** — Wartet auf Siegberts Review
- **Done** — Abgeschlossen

## Ticket-Felder
- `id` — Auto-increment (TASK-001, TASK-002, ...)
- `title` — Kurzbeschreibung
- `description` — Details (Markdown)
- `assignee` — Agent-Name (eugene, bubblebass, byte, siegbert)
- `lane` — backlog | inprogress | review | done
- `priority` — low | medium | high
- `branch` — Git Branch (optional)
- `createdAt` — Timestamp
- `updatedAt` — Timestamp

## Backend (Eugene)
### Datei: `server/tickets.js`
- JSON-Datei Storage: `/app/data/tickets.json`
- CRUD Operationen

### API Endpoints
- `GET /api/tickets` — Alle Tickets (optional ?lane=X&assignee=Y)
- `POST /api/tickets` — Neues Ticket erstellen
- `PUT /api/tickets/:id` — Ticket updaten (Lane wechseln, Assignee ändern)
- `DELETE /api/tickets/:id` — Ticket löschen

### Echtzeit-Status
- `GET /api/agents/status` — Zeigt pro Agent: Name, aktueller Task, letztes Update
- Agents melden sich per `PUT /api/agents/:name/status` mit aktuellem Status

## Frontend (Bubble Bass)
### Komponenten
- `KanbanBoard.jsx` — Hauptkomponente mit 4 Spalten
- `TicketCard.jsx` — Einzelnes Ticket (Drag & Drop optional, erstmal Buttons)
- `AgentStatus.jsx` — Echtzeit-Status der Agents (wer arbeitet woran)
- `KanbanBoard.css` — Dark Theme konsistent mit bestehendem Design

### Integration
- Neuer Tab/Section im Dashboard unter den Services
- "Move to" Buttons auf jeder TicketCard (→ nächste Lane)
- "New Ticket" Button mit Formular
- Agent-Status-Leiste oben

## Testing (Byte)
- API-Endpoints testen (CRUD)
- Frontend-Komponenten reviewen
- Edge Cases: leere Boards, viele Tickets, lange Descriptions
