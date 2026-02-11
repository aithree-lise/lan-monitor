import { useState, useEffect } from 'react';
import './SystemInfo.css';

export default function SystemInfo() {
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await fetch('/api/system');
        if (!res.ok) throw new Error('Failed to fetch system info');
        setInfo(await res.json());
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchInfo();
    const interval = setInterval(fetchInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  if (error) return null;
  if (!info) return null;

  return (
    <section className="system-info">
      <h2 className="section-title">🖥️ System Info</h2>
      <div className="system-grid">
        <div className="system-card">
          <span className="system-label">Host</span>
          <span className="system-value">{info.hostname}</span>
        </div>
        <div className="system-card">
          <span className="system-label">Uptime</span>
          <span className="system-value">{info.uptime}</span>
        </div>
        <div className="system-card">
          <span className="system-label">Disk</span>
          <span className="system-value">{info.disk}</span>
        </div>
        <div className="system-card">
          <span className="system-label">Memory</span>
          <span className="system-value">{info.memory}</span>
        </div>
        <div className="system-card">
          <span className="system-label">Load Avg</span>
          <span className="system-value">{info.loadAvg}</span>
        </div>
      </div>
    </section>
  );
}
