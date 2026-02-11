import { query, queryOne, exec } from './db.js';
import { createTicket } from './tickets.js';

// Generate next idea ID (auto-increment with prefix)
function getNextIdeaId() {
  // Check for IDEA-XXX format first
  const ideaResult = queryOne("SELECT id FROM ideas WHERE id LIKE 'IDEA-%' ORDER BY CAST(SUBSTR(id, 6) AS INTEGER) DESC LIMIT 1");
  
  if (ideaResult) {
    const match = ideaResult.id.match(/IDEA-(\d+)/);
    const nextNum = match ? parseInt(match[1]) + 1 : 1;
    return `IDEA-${String(nextNum).padStart(3, '0')}`;
  }
  
  // Fallback: check for highest numeric ID (old format)
  const numResult = queryOne("SELECT id FROM ideas WHERE id REGEXP '^[0-9]+$' ORDER BY CAST(id AS INTEGER) DESC LIMIT 1");
  
  if (numResult) {
    const nextNum = parseInt(numResult.id) + 1;
    return `IDEA-${String(nextNum).padStart(3, '0')}`;
  }
  
  return 'IDEA-001';
}

// Helper: serialize tags (array → JSON string)
function serializeTags(tags) {
  if (Array.isArray(tags)) {
    return JSON.stringify(tags);
  }
  if (typeof tags === 'string' && tags.length > 0) {
    return JSON.stringify(tags.split(',').map(t => t.trim()));
  }
  return JSON.stringify([]);
}

// Helper: deserialize tags (JSON string → array)
function deserializeTags(tagsJson) {
  if (!tagsJson) return [];
  try {
    const parsed = JSON.parse(tagsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Format idea response (deserialize tags)
function formatIdea(rawIdea) {
  if (!rawIdea) return null;
  return {
    ...rawIdea,
    tags: deserializeTags(rawIdea.tags)
  };
}

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
  
  const ideas = query(sql, params);
  return ideas.map(formatIdea);
}

// Get single idea
export function getIdeaById(id) {
  const idea = queryOne('SELECT * FROM ideas WHERE id = ?', [id]);
  return formatIdea(idea);
}

// Create new idea
export function createIdea(data) {
  const id = getNextIdeaId();
  const now = new Date().toISOString();
  
  // Handle both camelCase (submittedBy) and snake_case (submitted_by)
  const submittedBy = data.submitted_by || data.submittedBy || 'anonymous';
  
  const result = exec(
    `INSERT INTO ideas (id, title, description, tags, status, submitted_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.title,
      data.description || '',
      serializeTags(data.tags),
      data.status || 'proposed',
      submittedBy,
      now,
      now
    ]
  );
  
  return getIdeaById(id);
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
    params.push(serializeTags(data.tags));
  }
  if (data.status !== undefined) {
    updates.push('status = ?');
    params.push(data.status);
  }
  if (data.submitted_by !== undefined) {
    updates.push('submitted_by = ?');
    params.push(data.submitted_by);
  }
  
  updates.push('updated_at = datetime(\'now\')');
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
      'UPDATE ideas SET status = ?, converted_ticket_id = ?, updated_at = datetime(\'now\') WHERE id = ?',
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
