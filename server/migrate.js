// Migration script: JSON → SQLite
// Run once: node server/migrate.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, exec, queryOne } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OLD_TICKETS_FILE = path.join(__dirname, '..', 'data', 'tickets.json');
const OLD_AGENTS_FILE = path.join(__dirname, '..', 'data', 'agents.json');

console.log('🔄 Starting migration: JSON → SQLite');

// Migrate tickets
if (fs.existsSync(OLD_TICKETS_FILE)) {
  console.log('📋 Migrating tickets...');
  
  try {
    const data = fs.readFileSync(OLD_TICKETS_FILE, 'utf-8');
    const tickets = JSON.parse(data);
    
    let migrated = 0;
    for (const ticket of tickets) {
      const existing = queryOne('SELECT id FROM tickets WHERE id = ?', [ticket.id]);
      
      if (!existing) {
        exec(
          `INSERT INTO tickets (id, title, description, status, priority, assignee, branch, lane, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            ticket.id,
            ticket.title,
            ticket.description || '',
            ticket.status || 'open',
            ticket.priority || 'medium',
            ticket.assignee || 'unassigned',
            ticket.branch || null,
            ticket.lane || 'backlog',
            ticket.createdAt || new Date().toISOString(),
            ticket.updatedAt || new Date().toISOString()
          ]
        );
        migrated++;
      }
    }
    
    console.log(`✅ Migrated ${migrated} tickets`);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
  }
} else {
  console.log('⚠️  No old tickets.json found, skipping');
}

// Migrate agents
if (fs.existsSync(OLD_AGENTS_FILE)) {
  console.log('👥 Migrating agents...');
  
  try {
    const data = fs.readFileSync(OLD_AGENTS_FILE, 'utf-8');
    const agents = JSON.parse(data);
    
    let migrated = 0;
    for (const [name, agent] of Object.entries(agents)) {
      const existing = queryOne('SELECT name FROM agents WHERE name = ?', [name]);
      
      if (!existing) {
        exec(
          'INSERT INTO agents (name, status, current_task) VALUES (?, ?, ?)',
          [name, agent.status || 'offline', agent.currentTask || null]
        );
        migrated++;
      }
    }
    
    console.log(`✅ Migrated ${migrated} agents`);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
  }
} else {
  console.log('⚠️  No old agents.json found, skipping');
}

console.log('🎉 Migration complete!');
process.exit(0);
