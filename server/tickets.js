import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const TICKETS_FILE = path.join(DATA_DIR, 'tickets.json');
const AGENTS_FILE = path.join(DATA_DIR, 'agents.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// --- Tickets ---

function loadTickets() {
  ensureDataDir();
  if (!fs.existsSync(TICKETS_FILE)) return { nextId: 1, tickets: [] };
  try {
    return JSON.parse(fs.readFileSync(TICKETS_FILE, 'utf-8'));
  } catch { return { nextId: 1, tickets: [] }; }
}

function saveTickets(data) {
  ensureDataDir();
  fs.writeFileSync(TICKETS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function getAllTickets(lane, assignee) {
  const data = loadTickets();
  let tickets = data.tickets;
  if (lane) tickets = tickets.filter(t => t.status === lane);
  if (assignee) tickets = tickets.filter(t => t.assigned_to === assignee);
  return { tickets, total: tickets.length };
}

export function createTicket({ title, description, assigned_to, priority, status }) {
  const data = loadTickets();
  const id = `TASK-${String(data.nextId).padStart(3, '0')}`;
  const ticket = {
    id,
    title: title || 'Untitled',
    description: description || '',
    assigned_to: assigned_to || null,
    status: status || 'backlog',
    priority: priority || 'medium',
    branch: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  data.tickets.push(ticket);
  data.nextId++;
  saveTickets(data);
  return ticket;
}

export function updateTicket(id, updates) {
  const data = loadTickets();
  const idx = data.tickets.findIndex(t => t.id === id);
  if (idx === -1) return null;
  
  const allowed = ['title', 'description', 'assigned_to', 'status', 'priority', 'branch'];
  for (const key of allowed) {
    if (updates[key] !== undefined) data.tickets[idx][key] = updates[key];
  }
  data.tickets[idx].updatedAt = new Date().toISOString();
  saveTickets(data);
  return data.tickets[idx];
}

export function deleteTicket(id) {
  const data = loadTickets();
  const idx = data.tickets.findIndex(t => t.id === id);
  if (idx === -1) return false;
  data.tickets.splice(idx, 1);
  saveTickets(data);
  return true;
}

// --- Agent Status ---

function loadAgents() {
  ensureDataDir();
  if (!fs.existsSync(AGENTS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(AGENTS_FILE, 'utf-8'));
  } catch { return {}; }
}

function saveAgents(data) {
  ensureDataDir();
  fs.writeFileSync(AGENTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function getAgentStatus() {
  return loadAgents();
}

export function setAgentStatus(name, status) {
  const agents = loadAgents();
  agents[name] = {
    ...agents[name],
    ...status,
    name,
    updatedAt: new Date().toISOString()
  };
  saveAgents(agents);
  return agents[name];
}
