import { useState, useEffect } from 'react';
import ServiceCard from './ServiceCard';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Dashboard() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchServices = async () => {
    try {
      const response = await fetch(`${API_URL}/api/services`);
      if (!response.ok) throw new Error('Failed to fetch services');
      
      const data = await response.json();
      setServices(data.services);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchServices, 30000);
    return () => clearInterval(interval);
  }, []);

  const upCount = services.filter(s => s.status === 'up').length;
  const downCount = services.filter(s => s.status === 'down').length;

  if (loading) {
    return (
      <div className="dashboard loading">
        <div className="spinner">🦀</div>
        <p>Loading services...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>🦀 LAN Service Monitor</h1>
        <div className="status-summary">
          <span className="status-badge up">{upCount} UP</span>
          <span className="status-badge down">{downCount} DOWN</span>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          ⚠️ Error: {error}
        </div>
      )}

      <div className="services-grid">
        {services.map(service => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>

      <footer className="dashboard-footer">
        <span>Last update: {lastUpdate?.toLocaleTimeString()}</span>
        <button onClick={fetchServices} className="refresh-button">
          🔄 Refresh
        </button>
      </footer>
    </div>
  );
}
