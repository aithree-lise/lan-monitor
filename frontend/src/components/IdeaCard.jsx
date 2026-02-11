import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const STATUS_COLORS = {
  proposed: { bg: 'rgba(255, 235, 59, 0.2)', text: '#ffeb3b', label: '📋 Proposed' },
  approved: { bg: 'rgba(144, 238, 144, 0.2)', text: '#90ee90', label: '✅ Approved' },
  rejected: { bg: 'rgba(255, 107, 107, 0.2)', text: '#ff6b6b', label: '❌ Rejected' },
  deferred: { bg: 'rgba(153, 153, 153, 0.2)', text: '#999', label: '⏸️ Deferred' }
};

const PRIORITY_COLORS = {
  low: '#999',
  medium: '#ffeb3b',
  high: '#ff9800',
  critical: '#ff6b6b'
};

export default function IdeaCard({ idea, onReview, onConvert }) {
  const [isReviewing, setIsReviewing] = useState(false);
  const [comment, setComment] = useState('');
  const [isConverting, setIsConverting] = useState(false);

  const statusColor = STATUS_COLORS[idea.status] || STATUS_COLORS.proposed;

  const handleReview = async (newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/ideas/${idea.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          title: idea.title,
          comment: comment || undefined
        })
      });

      if (!res.ok) throw new Error('Failed to update idea');

      const updated = await res.json();
      onReview(updated.idea || updated);
      setIsReviewing(false);
      setComment('');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleConvert = async () => {
    if (!window.confirm(`Convert "${idea.title}" to ticket?`)) return;

    setIsConverting(true);
    try {
      const res = await fetch(`${API_URL}/api/ideas/${idea.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: idea.title })
      });

      if (!res.ok) throw new Error('Failed to convert idea');

      const result = await res.json();
      onConvert(idea.id);
      alert(`✅ Ticket #${result.ticket_id} created!`);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsConverting(false);
    }
  };

  const createdDate = new Date(idea.created_at).toLocaleDateString('de-DE', {
    month: 'short',
    day: 'numeric',
    year: '2-digit'
  });

  return (
    <div className="idea-card">
      <div className="idea-header">
        <div className="idea-title-section">
          <h3 className="idea-title">{idea.title}</h3>
          <span
            className="status-badge"
            style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
          >
            {statusColor.label}
          </span>
        </div>

        {idea.priority && (
          <span
            className="priority-badge"
            style={{ color: PRIORITY_COLORS[idea.priority] }}
          >
            {idea.priority.toUpperCase()}
          </span>
        )}
      </div>

      {idea.description && (
        <p className="idea-description">{idea.description}</p>
      )}

      {idea.tags && idea.tags.length > 0 && (
        <div className="idea-tags">
          {idea.tags.map((tag, idx) => (
            <span key={idx} className="tag">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="idea-meta">
        <span className="idea-date">📅 {createdDate}</span>
        {idea.submitted_by && <span className="idea-author">👤 {idea.submitted_by}</span>}
      </div>

      {idea.status === 'proposed' && (
        <>
          {!isReviewing ? (
            <div className="idea-actions">
              <button
                className="review-btn"
                onClick={() => setIsReviewing(true)}
              >
                🔍 Review
              </button>
            </div>
          ) : (
            <div className="review-panel">
              <textarea
                className="review-comment"
                placeholder="Add a comment (optional)..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="3"
              />

              <div className="review-actions">
                <button
                  className="review-action approve"
                  onClick={() => handleReview('approved')}
                >
                  ✅ Approve
                </button>
                <button
                  className="review-action reject"
                  onClick={() => handleReview('rejected')}
                >
                  ❌ Reject
                </button>
                <button
                  className="review-action defer"
                  onClick={() => handleReview('deferred')}
                >
                  ⏸️ Defer
                </button>
                <button
                  className="review-action cancel"
                  onClick={() => {
                    setIsReviewing(false);
                    setComment('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {idea.status === 'approved' && (
        <div className="idea-actions">
          <button
            className="convert-btn"
            onClick={handleConvert}
            disabled={isConverting}
          >
            {isConverting ? '⏳ Converting...' : '🎫 Convert to Ticket'}
          </button>
        </div>
      )}

      {idea.comment && (
        <div className="idea-comment">
          <span className="comment-label">💬 Feedback:</span>
          <p className="comment-text">{idea.comment}</p>
        </div>
      )}
    </div>
  );
}
