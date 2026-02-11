const API_URL = import.meta.env.VITE_API_URL || '';

const COLUMNS = {
  backlog: 'Backlog',
  'in-progress': 'In Progress',
  review: 'Review',
  done: 'Done'
};

const COLUMN_ORDER = ['backlog', 'in-progress', 'review', 'done'];

export default function TicketCard({ ticket, onMove, onDelete }) {
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

  const priorityClass = `priority-${ticket.priority || 'medium'}`;
  const createdDate = new Date(ticket.created_at).toLocaleDateString('de-DE', {
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className={`ticket-card ${priorityClass}`}>
      <div className="ticket-header">
        <div className="ticket-id-priority">
          <span className="ticket-id">#{ticket.id}</span>
          <span className={`priority-badge ${ticket.priority || 'medium'}`}>
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

      {ticket.assigned_to && (
        <div className="ticket-assignee">
          👤 {ticket.assigned_to}
        </div>
      )}

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
