import { useState, useEffect } from 'react';
import TicketCard from './TicketCard';
import AgentStatus from './AgentStatus';
import './KanbanBoard.css';

const API_URL = import.meta.env.VITE_API_URL || '';

const COLUMNS = {
  backlog: { title: 'Backlog', emoji: '📋' },
  'in-progress': { title: 'In Progress', emoji: '⚙️' },
  review: { title: 'Review', emoji: '👀' },
  done: { title: 'Done', emoji: '✅' }
};

export default function KanbanBoard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assigned_to: ''
  });

  // Fetch tickets
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await fetch(`${API_URL}/api/tickets`);
        if (!res.ok) throw new Error('Failed to fetch tickets');
        const data = await res.json();
        setTickets(data.tickets || []);
        setError(null);
      } catch (err) {
        setError(err.message);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchTickets, 10000);
    return () => clearInterval(interval);
  }, []);

  // Handle new ticket
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          assigned_to: formData.assigned_to || null,
          status: 'backlog'
        })
      });

      if (!res.ok) throw new Error('Failed to create ticket');
      
      const data = await res.json();
      setTickets([...tickets, data.ticket || data]);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        assigned_to: ''
      });
      setShowNewForm(false);
    } catch (err) {
      alert('Failed to create ticket: ' + err.message);
    }
  };

  // Handle ticket move
  const handleMove = (updatedTicket) => {
    setTickets(tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t));
  };

  // Handle ticket delete
  const handleDelete = (ticketId) => {
    setTickets(tickets.filter(t => t.id !== ticketId));
  };

  // Group tickets by status
  const ticketsByStatus = {
    backlog: tickets.filter(t => t.status === 'backlog'),
    'in-progress': tickets.filter(t => t.status === 'in-progress'),
    review: tickets.filter(t => t.status === 'review'),
    done: tickets.filter(t => t.status === 'done')
  };

  if (loading) {
    return (
      <div className="kanban-board loading">
        <div className="kanban-spinner">📊</div>
        <p>Loading tickets...</p>
      </div>
    );
  }

  return (
    <div className="kanban-container">
      <header className="kanban-header">
        <h2>📊 Ticket Board (AP5)</h2>
        <button
          className="new-ticket-btn"
          onClick={() => setShowNewForm(!showNewForm)}
          title="Create new ticket"
        >
          {showNewForm ? '✕ Close' : '+ New Ticket'}
        </button>
      </header>

      <AgentStatus />

      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

      {showNewForm && (
        <div className="new-ticket-form-container">
          <form onSubmit={handleSubmit} className="new-ticket-form">
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                id="title"
                type="text"
                placeholder="Ticket title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                placeholder="Ticket description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="assigned_to">Assigned To</label>
                <input
                  id="assigned_to"
                  type="text"
                  placeholder="Agent name (optional)"
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">✅ Create</button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setShowNewForm(false);
                  setFormData({
                    title: '',
                    description: '',
                    priority: 'medium',
                    assigned_to: ''
                  });
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="kanban-board">
        {Object.entries(COLUMNS).map(([key, column]) => (
          <div key={key} className="kanban-column">
            <div className="column-header">
              <h3>
                {column.emoji} {column.title}
              </h3>
              <span className="ticket-count">{ticketsByStatus[key].length}</span>
            </div>
            <div className="column-tickets">
              {ticketsByStatus[key].length === 0 ? (
                <div className="empty-column">No tickets</div>
              ) : (
                ticketsByStatus[key].map(ticket => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onMove={handleMove}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
