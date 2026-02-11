import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage path
const DATA_DIR = process.env.DATA_DIR || '/app/data';
const TICKETS_FILE = path.join(DATA_DIR, 'tickets.json');
const AGENTS_FILE = path.join(DATA_DIR, 'agents.json');

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Load tickets from JSON
function loadTickets() {
  ensureDataDir();
  
  if (!fs.existsSync(TICKETS_FILE)) {
    return [];
  }
  
  try {
    const data = fs.readFileSync(TICKETS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading tickets:', error);
    return [];
  }
}

// Save tickets to JSON
function saveTickets(tickets) {
  ensureDataDir();
  
  try {
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2));
  } catch (error) {
    console.error('Error saving tickets:', error);
  }
}

// Load agents status
function loadAgents() {
  ensureDataDir();
  
  if (!fs.existsSync(AGENTS_FILE)) {
    return {
      eugene: { name: 'Eugene', status: 'idle', currentTask: null, lastUpdate: null },
      bubblebass: { name: 'Bubble Bass', status: 'idle', currentTask: null, lastUpdate: null },
      byte: { name: 'Byte', status: 'idle', currentTask: null, lastUpdate: null },
      siegbert: { name: 'Siegbert', status: 'idle', currentTask: null, lastUpdate: null }
    };
  }
  
  try {
    const data = fs.readFileSync(AGENTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading agents:', error);
    return {};
  }
}

// Save agents status
function saveAgents(agents) {
  ensureDataDir();
  
  try {
    fs.writeFileSync(AGENTS_FILE, JSON.stringify(agents, null, 2));
  } catch (error) {
    console.error('Error saving agents:', error);
  }
}

// Generate next ticket ID
function getNextTicketId(tickets) {
  if (tickets.length === 0) return 'TASK-001';
  
  const maxId = Math.max(...tickets.map(t => {
    const match = t.id.match(/TASK-(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }));
  
  return `TASK-${String(maxId + 1).padStart(3, '0')}`;
}

// CRUD Operations
export function getAllTickets(filters = {}) {
  let tickets = loadTickets();
  
  if (filters.lane) {
    tickets = tickets.filter(t => t.lane === filters.lane);
  }
  
  if (filters.assignee) {
    tickets = tickets.filter(t => t.assignee === filters.assignee);
  }
  
  return tickets;
}

export function getTicketById(id) {
  const tickets = loadTickets();
  return tickets.find(t => t.id === id);
}

export function createTicket(data) {
  const tickets = loadTickets();
  
  const newTicket = {
    id: getNextTicketId(tickets),
    title: data.title,
    description: data.description || '',
    assignee: data.assignee || 'unassigned',
    lane: data.lane || 'backlog',
    priority: data.priority || 'medium',
    branch: data.branch || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  tickets.push(newTicket);
  saveTickets(tickets);
  
  return newTicket;
}

export function updateTicket(id, data) {
  const tickets = loadTickets();
  const index = tickets.findIndex(t => t.id === id);
  
  if (index === -1) return null;
  
  const ticket = tickets[index];
  
  if (data.title !== undefined) ticket.title = data.title;
  if (data.description !== undefined) ticket.description = data.description;
  if (data.assignee !== undefined) ticket.assignee = data.assignee;
  if (data.lane !== undefined) ticket.lane = data.lane;
  if (data.priority !== undefined) ticket.priority = data.priority;
  if (data.branch !== undefined) ticket.branch = data.branch;
  
  ticket.updatedAt = new Date().toISOString();
  
  tickets[index] = ticket;
  saveTickets(tickets);
  
  return ticket;
}

export function deleteTicket(id) {
  const tickets = loadTickets();
  const index = tickets.findIndex(t => t.id === id);
  
  if (index === -1) return false;
  
  tickets.splice(index, 1);
  saveTickets(tickets);
  
  return true;
}

// Agent Status Operations
export function getAgentsStatus() {
  return loadAgents();
}

export function updateAgentStatus(name, data) {
  const agents = loadAgents();
  
  if (!agents[name]) {
    agents[name] = { name: name, status: 'idle', currentTask: null, lastUpdate: null };
  }
  
  const agent = agents[name];
  
  if (data.status !== undefined) agent.status = data.status;
  if (data.currentTask !== undefined) agent.currentTask = data.currentTask;
  agent.lastUpdate = new Date().toISOString();
  
  agents[name] = agent;
  saveAgents(agents);
  
  return agent;
}

// Validation
const VALID_LANES = ['backlog', 'inprogress', 'review', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_AGENTS = ['eugene', 'bubblebass', 'byte', 'siegbert', 'unassigned'];

export function validateTicketData(data) {
  const errors = [];
  
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Title is required and must be non-empty');
  }
  
  if (data.lane && !VALID_LANES.includes(data.lane)) {
    errors.push(`Lane must be one of: ${VALID_LANES.join(', ')}`);
  }
  
  if (data.priority && !VALID_PRIORITIES.includes(data.priority)) {
    errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }
  
  if (data.assignee && !VALID_AGENTS.includes(data.assignee)) {
    errors.push(`Assignee must be one of: ${VALID_AGENTS.join(', ')}`);
  }
  
  return errors;
}
