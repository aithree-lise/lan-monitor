import { useState, useEffect } from 'react';
import ServiceCard from './ServiceCard';
import GpuCard from './GpuCard';
import KanbanBoard from './KanbanBoard';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function Dashboard() {
  const [services, setServices] = useState([]);
  const [gpus, setGpus] = useState([]);
  const [histories, setHistories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [refreshCountdown, setRefreshCountdown] = useState(30);

  const fetchData = async () => {
    try {
      const [servicesRes, gpuRes] = await Promise.all([
        fetch(`${API_URL}/api/services`),
        fetch(`${API_URL}/api/gpu`)
      ]);
      
      if (!servicesRes.ok) throw new Error('Failed to fetch services');
      
      const servicesData = await servicesRes.json();
      setServices(servicesData.services);
      
      if (gpuRes.ok) {
        const gpuData = await gpuRes.json();
        setGpus(gpuData.gpus || []);
      }

      // Fetch uptime history for each service
      const historyMap = {};
      await Promise.all(
        (servicesData.services || []).map(async (svc) => {
          try {
            const res = await fetch(`${API_URL}/api/services/${svc.id}/history?hours=24`);
            if (res.ok) {
              const data = await res.json();
              historyMap[svc.id] = data.history || data || [];
            }
          } catch {
            // History endpoint may not exist yet — ignore
          }
        })
      );
      setHistories(historyMap);
      
      setLastUpdate(new Date());
      setRefreshCountdown(30); // Reset countdown
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdate]); // Restart timer on each refresh

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

      {gpus.length > 0 && (
        <section className="gpu-section">
          <h2 className="section-title">🎮 GPU Status (DGX Spark)</h2>
          <div className="gpu-grid">
            {gpus.map(gpu => (
              <GpuCard key={gpu.id} gpu={gpu} />
            ))}
          </div>
        </section>
      )}

      <section className="kanban-section">
        <KanbanBoard />
      </section>

      <section className="services-section">
        <h2 className="section-title">🔧 Services</h2>
        <div className="services-grid">
          {services.map(service => (
            <ServiceCard key={service.id} service={service} history={histories[service.id]} />
          ))}
        </div>
      </section>

      <footer className="dashboard-footer">
        <span>Last update: {lastUpdate?.toLocaleTimeString()}</span>
        <div className="refresh-countdown">
          Next refresh in {refreshCountdown}s
          <div className="progress-bar" style={{ width: `${(refreshCountdown / 30) * 100}%` }}></div>
        </div>
        <button onClick={fetchData} className="refresh-button">
          🔄 Refresh
        </button>
      </footer>
    </div>
  );
}
