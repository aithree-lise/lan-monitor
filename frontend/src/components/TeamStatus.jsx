import { useState, useEffect } from 'react';
import './TeamStatus.css';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function TeamStatus() {
  const [agents, setAgents] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/redis/status`);
      if (!res.ok) throw new Error('Failed to fetch status');
      const data = await res.json();
      setAgents(data.agents || {});
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusEmoji = (status) => {
    switch (status) {
      case 'active': return '🟢';
      case 'standby': return '🟡';
      case 'paused': return '🔴';
      default: return '⚪';
    }
  };

  if (loading) return <div>Loading team status...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="team-status">
      <h3>Team Status</h3>
      <div className="status-badges">
        {Object.entries(agents).map(([name, info]) => (
          <div key={name} className="status-badge">
            {getStatusEmoji(info.status)} {name} ({info.status})
            {info.lastTask && <span> - {info.lastTask}</span>}
            <span> Last: {new Date(info.lastActive).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
