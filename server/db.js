import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'lan-monitor.db');

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Initialize database
function initDb() {
  ensureDataDir();
  
  const db = new Database(DB_PATH);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'open',
      priority TEXT DEFAULT 'medium',
      assignee TEXT,
      branch TEXT,
      lane TEXT DEFAULT 'backlog',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    
    CREATE TABLE IF NOT EXISTS ideas (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'proposed',
      tags TEXT,
      submitted_by TEXT,
      converted_ticket_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (converted_ticket_id) REFERENCES tickets(id)
    );
    
    CREATE TABLE IF NOT EXISTS agents (
      name TEXT PRIMARY KEY,
      status TEXT DEFAULT 'offline',
      current_task TEXT,
      last_update TEXT DEFAULT (datetime('now'))
    );
    
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id TEXT NOT NULL,
      service_name TEXT,
      status TEXT,
      message TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  
  console.log(`📊 Database initialized at ${DB_PATH}`);
  
  return db;
}

export const db = initDb();

// Helper: Run query with error handling
export function query(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  } catch (error) {
    console.error('DB Query Error:', error.message);
    throw error;
  }
}

// Helper: Get single row
export function queryOne(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return stmt.get(...params);
  } catch (error) {
    console.error('DB Query Error:', error.message);
    throw error;
  }
}

// Helper: Run insert/update/delete
export function exec(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    return result;
  } catch (error) {
    console.error('DB Exec Error:', error.message);
    throw error;
  }
}
