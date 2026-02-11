# AP6.1: JSON → SQLite Migration

## Setup

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Initialize Database
The database is automatically created on first startup at `data/lan-monitor.db`.

```sql
-- Schema is auto-created by db.js on startup
-- Tables: tickets, ideas, agents
```

### 3. Migrate Old Data (Optional)
If you have existing `data/tickets.json` and `data/agents.json`:

```bash
node server/migrate.js
```

This will:
- Read old JSON files
- Insert data into SQLite (skip duplicates)
- Leave JSON files untouched

### 4. Start Server
```bash
npm start
```

The server now uses SQLite for all data persistence.

## What Changed

### For API Users
- No changes! All endpoints work exactly as before
- `GET /api/tickets` — Still returns same JSON structure
- `GET /api/tickets/:id` — Still returns single ticket
- `POST /api/tickets` — Still creates tickets
- `PUT /api/tickets/:id` — Still updates tickets
- `DELETE /api/tickets/:id` — Still deletes tickets
- `GET /api/agents/status` — Still returns agent status

### Internally
- JSON files replaced with SQLite database
- Better performance for large datasets
- Transactions & referential integrity
- Foundation for AP6.2 (Ideas system)

## Database File
- Location: `data/lan-monitor.db`
- In Docker: Mounted as volume for persistence
- Can be inspected with: `sqlite3 data/lan-monitor.db`

## Schema Changes (AP6.2)
If you have an old database with the integer `ideas.id` column, you need to migrate:

```sql
-- Backup old data
CREATE TABLE ideas_old AS SELECT * FROM ideas;

-- Drop old table
DROP TABLE ideas;

-- Create new table (will be done by db.js on restart)
-- Restart the server to auto-create new schema

-- Restore data with new ID format (optional):
-- INSERT INTO ideas (id, title, description, status, tags, submitted_by, created_at, updated_at)
-- SELECT 'IDEA-' || PRINTF('%03d', id), title, description, status, tags, submitted_by, created_at, updated_at
-- FROM ideas_old;
```

Or simply delete the database file and it will be recreated:
```bash
rm data/lan-monitor.db
```

## Rollback (if needed)
Keep old `tickets.json` and `agents.json` files. Migration is non-destructive.
