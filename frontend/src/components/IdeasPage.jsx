import { useState, useEffect } from 'react';
import IdeaCard from './IdeaCard';
import './IdeasPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const STATUS_OPTIONS = ['proposed', 'approved', 'rejected', 'deferred'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'];

export default function IdeasPage() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'proposed',
    priority: '',
    tags: ''
  });

  useEffect(() => {
    fetchIdeas();
    const interval = setInterval(fetchIdeas, 10000);
    return () => clearInterval(interval);
  }, [filters.status]);

  const fetchIdeas = async () => {
    try {
      let url = `${API_URL}/api/ideas?status=${filters.status}`;
      if (filters.priority) url += `&priority=${filters.priority}`;
      if (filters.tags) url += `&tags=${filters.tags}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch ideas');
      const data = await res.json();
      setIdeas(data.ideas || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      setIdeas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleReview = (updatedIdea) => {
    setIdeas(ideas.map(i => i.id === updatedIdea.id ? updatedIdea : i));
  };

  const handleConvert = (ideaId) => {
    setIdeas(ideas.filter(i => i.id !== ideaId));
  };

  if (loading) {
    return (
      <div className="ideas-page loading">
        <div className="ideas-spinner">💡</div>
        <p>Loading ideas...</p>
      </div>
    );
  }

  return (
    <div className="ideas-container">
      <header className="ideas-header">
        <h2>💡 Ideas Management (AP6)</h2>
      </header>

      <div className="ideas-filters">
        <div className="filter-group">
          <label htmlFor="status-filter">Status</label>
          <select
            id="status-filter"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="priority-filter">Priority</label>
          <select
            id="priority-filter"
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
          >
            <option value="">All Priorities</option>
            {PRIORITY_OPTIONS.map(priority => (
              <option key={priority} value={priority}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="tags-filter">Tags</label>
          <input
            id="tags-filter"
            type="text"
            placeholder="Search tags..."
            value={filters.tags}
            onChange={(e) => handleFilterChange('tags', e.target.value)}
          />
        </div>

        <button
          className="clear-filters-btn"
          onClick={() => setFilters({ status: 'proposed', priority: '', tags: '' })}
        >
          Clear Filters
        </button>
      </div>

      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

      <div className="ideas-list">
        {ideas.length === 0 ? (
          <div className="no-ideas">
            <div className="no-ideas-icon">🌙</div>
            <p>No ideas found. Check back soon!</p>
          </div>
        ) : (
          ideas.map(idea => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onReview={handleReview}
              onConvert={handleConvert}
            />
          ))
        )}
      </div>
    </div>
  );
}
