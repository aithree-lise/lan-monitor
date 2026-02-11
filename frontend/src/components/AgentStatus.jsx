import { useState, useEffect } from 'react';
import './AgentStatus.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function AgentStatus() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch(`${API_URL}/api/agents/status`);
        if (!res.ok) throw new Error('Failed to fetch agent status');
        const data = await res.json();
        setAgents(data.agents || []);
        setError(null);
      } catch (err) {
        setError(err.message);
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
    
    // Real-time updates every 5 seconds
    const interval = setInterval(fetchAgents, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#90ee90';
      case 'idle': return '#ffeb3b';
      case 'offline': return '#ff6b6b';
      default: return '#999';
    }
  };

  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return 'never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return 'just now';
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    return `${Math.floor(diffSecs / 3600)}h ago`;
  };

  if (loading) {
    return (
      <div className="agent-status loading">
        <div className="agent-spinner">⚙️</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="agent-status error">
        <span className="agent-error-icon">⚠️</span>
        <span className="agent-error-text">{error}</span>
      </div>
    );
  }

  return (
    <div className="agent-status">
      <div className="agent-status-title">👥 Active Agents</div>
      <div className="agent-list">
        {agents.length === 0 ? (
          <div className="no-agents">No agents online</div>
        ) : (
          agents.map(agent => (
            <div key={agent.id} className={`agent-card status-${agent.status}`}>
              <div className="agent-header">
                <div className="agent-info">
                  <span 
                    className="agent-status-dot" 
                    style={{ backgroundColor: getStatusColor(agent.status) }}
                  ></span>
                  <div className="agent-names">
                    <span className="agent-name">{agent.name || agent.id}</span>
                    <span className="agent-status-text">{agent.status}</span>
                  </div>
                </div>
                {agent.workload !== undefined && (
                  <span className="agent-workload">{agent.workload}%</span>
                )}
              </div>
              
              {agent.current_task && (
                <div className="agent-task">
                  <span className="task-icon">📋</span>
                  <span className="task-text">{agent.current_task}</span>
                </div>
              )}
              
              {agent.last_update && (
                <div className="agent-meta">
                  <span className="update-time">Last: {formatLastUpdate(agent.last_update)}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
