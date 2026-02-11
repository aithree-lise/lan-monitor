import { useState, useEffect } from 'react';

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
            <div key={agent.id} className={`agent-badge status-${agent.status}`}>
              <span className="agent-status-dot"></span>
              <span className="agent-name">{agent.name || agent.id}</span>
              {agent.workload && (
                <span className="agent-workload">{agent.workload}%</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
