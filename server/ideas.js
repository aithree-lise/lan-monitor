import { query, queryOne, exec } from './db.js';
import { createTicket } from './tickets.js';

// Get all ideas with filters & sorting
export function getAllIdeas(filters = {}) {
  let sql = 'SELECT * FROM ideas WHERE 1=1';
  const params = [];
  
  if (filters.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }
  
  if (filters.tag) {
    sql += " AND tags LIKE ?";
    params.push(`%${filters.tag}%`);
  }
  
  const sortBy = filters.sort || 'created_at';
  const order = (filters.order || 'desc').toUpperCase();
  
  // Whitelist sort columns to prevent SQL injection
  const validSortColumns = ['id', 'title', 'status', 'created_at', 'updated_at'];
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
  
  sql += ` ORDER BY ${sortColumn} ${order}`;
  
  return query(sql, params);
}

// Get single idea
export function getIdeaById(id) {
  return queryOne('SELECT * FROM ideas WHERE id = ?', [id]);
}

// Create new idea
export function createIdea(data) {
  const now = new Date().toISOString();
  
  const result = exec(
    `INSERT INTO ideas (title, description, tags, status, submitted_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title,
      data.description || '',
      data.tags || '',
      data.status || 'proposed',
      data.submitted_by || 'anonymous',
      now,
      now
    ]
  );
  
  return getIdeaById(result.lastInsertRowid);
}

// Update idea
export function updateIdea(id, data) {
  const idea = getIdeaById(id);
  if (!idea) return null;
  
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
  if (data.tags !== undefined) {
    updates.push('tags = ?');
    params.push(data.tags);
  }
  if (data.status !== undefined) {
    updates.push('status = ?');
    params.push(data.status);
  }
  if (data.submitted_by !== undefined) {
    updates.push('submitted_by = ?');
    params.push(data.submitted_by);
  }
  
  updates.push('updated_at = datetime("now")');
  params.push(id);
  
  exec(
    `UPDATE ideas SET ${updates.join(', ')} WHERE id = ?`,
    params
  );
  
  return getIdeaById(id);
}

// Delete idea
export function deleteIdea(id) {
  const result = exec('DELETE FROM ideas WHERE id = ?', [id]);
  return result.changes > 0;
}

// Convert idea to ticket
export function convertIdeaToTicket(ideaId) {
  const idea = getIdeaById(ideaId);
  
  if (!idea) return { error: 'Idea not found', status: 404 };
  
  if (idea.status === 'converted') {
    return { error: 'Idea already converted', status: 409 };
  }
  
  if (idea.converted_ticket_id) {
    return { error: 'Idea already has associated ticket', status: 409 };
  }
  
  // Create ticket from idea
  try {
    const ticketData = {
      title: idea.title,
      description: idea.description,
      priority: 'medium',
      assignee: 'unassigned',
      lane: 'backlog'
    };
    
    const ticket = createTicket(ticketData);
    
    // Update idea: set status to converted + store ticket ID
    exec(
      'UPDATE ideas SET status = ?, converted_ticket_id = ?, updated_at = datetime("now") WHERE id = ?',
      ['converted', ticket.id, ideaId]
    );
    
    return { ticket, error: null };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

// Validation
const VALID_IDEA_STATUSES = ['proposed', 'approved', 'rejected', 'converted'];

export function validateIdeaData(data) {
  const errors = [];
  
  if (!data.title || typeof data.title !== 'string') {
    errors.push('Title is required and must be a string');
  } else if (data.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters');
  }
  
  if (data.status && !VALID_IDEA_STATUSES.includes(data.status)) {
    errors.push(`Status must be one of: ${VALID_IDEA_STATUSES.join(', ')}`);
  }
  
  return errors;
}
