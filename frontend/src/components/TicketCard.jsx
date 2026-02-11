const API_URL = import.meta.env.VITE_API_URL || '';

const COLUMN_ORDER = ['backlog', 'in-progress', 'review', 'done'];

const AGENT_OPTIONS = [
  { value: 'siegbert', label: 'Siegbert 🎩' },
  { value: 'eugene', label: 'Eugene' },
  { value: 'bubblebass', label: 'Bubble Bass 🥒' },
  { value: 'sandy', label: 'Sandy Cheeks 🔍' }
];

const PRIORITY_CONFIG = {
  low: { color: '#999', bgColor: 'rgba(153, 153, 153, 0.2)' },
  medium: { color: '#ffeb3b', bgColor: 'rgba(255, 235, 59, 0.2)' },
  high: { color: '#ff9800', bgColor: 'rgba(255, 152, 0, 0.2)' },
  critical: { color: '#ff6b6b', bgColor: 'rgba(255, 107, 107, 0.2)' }
};

export default function TicketCard({ ticket, onMove, onDelete, onUpdate }) {

  const currentIndex = COLUMN_ORDER.indexOf(ticket.status);
  
  const canMovePrev = currentIndex > 0;
  const canMoveNext = currentIndex < COLUMN_ORDER.length - 1;

  const handleMove = async (direction) => {
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    const newStatus = COLUMN_ORDER[newIndex];

    try {
      const res = await fetch(`${API_URL}/api/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error('Failed to update ticket');
      
      const updated = await res.json();
      onMove(updated.ticket || updated);
    } catch (err) {
      console.error('Error moving ticket:', err);
      alert('Failed to move ticket: ' + err.message);
    }
  };

  const handleAssigneeChange = async (e) => {
    const newAssignee = e.target.value;

    try {
      const res = await fetch(`${API_URL}/api/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: newAssignee || null })
      });

      if (!res.ok) throw new Error('Failed to update assignee');
      
      const updated = await res.json();
      onUpdate?.(updated.ticket || updated);
    } catch (err) {
      console.error('Error updating assignee:', err);
      alert('Failed to update assignee: ' + err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ticket "${ticket.title}"?`)) return;

    try {
      const res = await fetch(`${API_URL}/api/tickets/${ticket.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete ticket');
      onDelete(ticket.id);
    } catch (err) {
      console.error('Error deleting ticket:', err);
      alert('Failed to delete ticket: ' + err.message);
    }
  };

  const priorityColor = PRIORITY_CONFIG[ticket.priority || 'medium'].color;
  const priorityBg = PRIORITY_CONFIG[ticket.priority || 'medium'].bgColor;
  const createdDate = new Date(ticket.created_at).toLocaleDateString('de-DE', {
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="ticket-card" style={{ borderLeftColor: priorityColor }}>
      <div className="ticket-header">
        <div className="ticket-id-priority">
          <span className="ticket-id">#{ticket.id}</span>
          <span 
            className="priority-badge"
            style={{ color: priorityColor, backgroundColor: priorityBg }}
          >
            {ticket.priority ? ticket.priority.toUpperCase() : 'MEDIUM'}
          </span>
        </div>
        <button className="delete-btn" onClick={handleDelete} title="Delete ticket">
          ✕
        </button>
      </div>

      <h3 className="ticket-title">{ticket.title}</h3>

      {ticket.description && (
        <p className="ticket-description">{ticket.description}</p>
      )}

      <div className="ticket-assignee-section">
        <label htmlFor={`assignee-${ticket.id}`} className="assignee-label">
          👤 Assigned to:
        </label>
        <select
          id={`assignee-${ticket.id}`}
          className="assignee-select"
          value={ticket.assigned_to || ''}
          onChange={handleAssigneeChange}
        >
          <option value="">Unassigned</option>
          {AGENT_OPTIONS.map(agent => (
            <option key={agent.value} value={agent.value}>
              {agent.label}
            </option>
          ))}
        </select>
      </div>

      <div className="ticket-meta">
        <span className="ticket-date">📅 {createdDate}</span>
      </div>

      <div className="ticket-actions">
        <button
          className="move-btn prev-btn"
          onClick={() => handleMove('prev')}
          disabled={!canMovePrev}
          title="Move to previous column"
        >
          ◀ Back
        </button>
        <button
          className="move-btn next-btn"
          onClick={() => handleMove('next')}
          disabled={!canMoveNext}
          title="Move to next column"
        >
          Next ▶
        </button>
      </div>
    </div>
  );
}
