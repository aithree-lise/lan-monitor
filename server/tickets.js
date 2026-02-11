import { db, query, queryOne, exec } from './db.js';

// Get next ticket ID (auto-increment)
function getNextTicketId() {
  const result = queryOne('SELECT id FROM tickets ORDER BY SUBSTR(id, 6) DESC LIMIT 1');
  
  if (!result) return 'TASK-001';
  
  const match = result.id.match(/TASK-(\d+)/);
  const nextNum = match ? parseInt(match[1]) + 1 : 1;
  
  return `TASK-${String(nextNum).padStart(3, '0')}`;
}

// CRUD Operations for Tickets
export function getAllTickets(filters = {}) {
  let sql = 'SELECT * FROM tickets WHERE 1=1';
  const params = [];
  
  if (filters.lane) {
    sql += ' AND lane = ?';
    params.push(filters.lane);
  }
  
  if (filters.assignee) {
    sql += ' AND assignee = ?';
    params.push(filters.assignee);
  }
  
  if (filters.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  return query(sql, params);
}

export function getTicketById(id) {
  return queryOne('SELECT * FROM tickets WHERE id = ?', [id]);
}

export function createTicket(data) {
  const id = getNextTicketId();
  const now = new Date().toISOString();
  
  exec(
    `INSERT INTO tickets (id, title, description, assignee, lane, priority, branch, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.title,
      data.description || '',
      data.assignee || 'unassigned',
      data.lane || 'backlog',
      data.priority || 'medium',
      data.branch || null,
      data.status || 'open',
      now,
      now
    ]
  );
  
  return getTicketById(id);
}

export function updateTicket(id, data) {
  const ticket = getTicketById(id);
  if (!ticket) return null;
  
  const updates = [];
  const params = [];
  
  if (data.title !== undefined) {
    updates.push('title = ?');
    params.push(data.title);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    params.push(data.description);
  }
  if (data.assignee !== undefined) {
    updates.push('assignee = ?');
    params.push(data.assignee);
  }
  if (data.lane !== undefined) {
    updates.push('lane = ?');
    params.push(data.lane);
  }
  if (data.priority !== undefined) {
    updates.push('priority = ?');
    params.push(data.priority);
  }
  if (data.branch !== undefined) {
    updates.push('branch = ?');
    params.push(data.branch);
  }
  if (data.status !== undefined) {
    updates.push('status = ?');
    params.push(data.status);
  }
  
  updates.push('updated_at = datetime(\'now\')');
  params.push(id);
  
  exec(
    `UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`,
    params
  );
  
  return getTicketById(id);
}

export function deleteTicket(id) {
  const result = exec('DELETE FROM tickets WHERE id = ?', [id]);
  return result.changes > 0;
}

// Agent Status Operations
export function getAgentsStatus() {
  const agents = query('SELECT * FROM agents');
  
  // Convert array to object keyed by name
  const result = {};
  agents.forEach(agent => {
    result[agent.name] = {
      name: agent.name,
      status: agent.status,
      currentTask: agent.current_task,
      lastUpdate: agent.last_update
    };
  });
  
  return result;
}

export function updateAgentStatus(name, data) {
  // Check if agent exists
  const existing = queryOne('SELECT * FROM agents WHERE name = ?', [name]);
  
  if (!existing) {
    // Insert new agent
    exec(
      'INSERT INTO agents (name, status, current_task) VALUES (?, ?, ?)',
      [name, data.status || 'idle', data.currentTask || null]
    );
  } else {
    // Update existing
    const updates = [];
    const params = [];
    
    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
    }
    if (data.currentTask !== undefined) {
      updates.push('current_task = ?');
      params.push(data.currentTask);
    }
    
    updates.push('last_update = datetime(\'now\')');
    params.push(name);
    
    exec(
      `UPDATE agents SET ${updates.join(', ')} WHERE name = ?`,
      params
    );
  }
  
  const agent = queryOne('SELECT * FROM agents WHERE name = ?', [name]);
  return {
    name: agent.name,
    status: agent.status,
    currentTask: agent.current_task,
    lastUpdate: agent.last_update
  };
}

// Validation
const VALID_LANES = ['backlog', 'inprogress', 'review', 'done'];
const VALID_STATUSES = ['open', 'in-progress', 'done', 'blocked'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];
const VALID_AGENTS = ['eugene', 'bubblebass', 'byte', 'siegbert', 'unassigned'];

export function validateTicketData(data) {
  const errors = [];
  
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Title is required and must be non-empty');
  }
  
  if (data.lane && !VALID_LANES.includes(data.lane)) {
    errors.push(`Lane must be one of: ${VALID_LANES.join(', ')}`);
  }
  
  if (data.status && !VALID_STATUSES.includes(data.status)) {
    errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
  
  if (data.priority && !VALID_PRIORITIES.includes(data.priority)) {
    errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }
  
  if (data.assignee && !VALID_AGENTS.includes(data.assignee)) {
    errors.push(`Assignee must be one of: ${VALID_AGENTS.join(', ')}`);
  }
  
  return errors;
}
