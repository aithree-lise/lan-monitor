import './GpuCard.css';

export default function GpuCard({ gpu }) {
  const statusColor = {
    up: '#4ade80',
    warning: '#f59e0b',
    down: '#f87171'
  }[gpu.status] || '#9ca3af';

  const statusEmoji = {
    up: '🟢',
    warning: '⚠️',
    down: '🔴'
  }[gpu.status] || '❓';

  return (
    <div className="gpu-card" style={{ borderLeftColor: statusColor }}>
      <div className="gpu-header">
        <span className="gpu-emoji">{statusEmoji}</span>
        <h3 className="gpu-name">{gpu.name}</h3>
      </div>
      
      <div className="gpu-details">
        <div className="gpu-metric">
          <span className="metric-label">GPU Utilization</span>
          <div className="metric-bar-container">
            <div 
              className="metric-bar" 
              style={{ 
                width: `${gpu.utilization}%`,
                backgroundColor: gpu.utilization > 90 ? '#f59e0b' : '#4ade80'
              }}
            />
          </div>
          <span className="metric-value">{gpu.utilization}%</span>
        </div>

        <div className="gpu-metric">
          <span className="metric-label">Temperature</span>
          <div className="metric-bar-container">
            <div 
              className="metric-bar" 
              style={{ 
                width: `${(gpu.temperature / 100) * 100}%`,
                backgroundColor: gpu.temperature > 80 ? '#f87171' : gpu.temperature > 70 ? '#f59e0b' : '#4ade80'
              }}
            />
          </div>
          <span className="metric-value">{gpu.temperature}°C</span>
        </div>

        <div className="gpu-metric">
          <span className="metric-label">VRAM</span>
          <div className="metric-bar-container">
            <div 
              className="metric-bar" 
              style={{ 
                width: `${gpu.memoryUtilization}%`,
                backgroundColor: gpu.memoryUtilization > 90 ? '#f59e0b' : '#4ade80'
              }}
            />
          </div>
          <span className="metric-value">{gpu.memoryUsed.toFixed(0)} / {gpu.memoryTotal.toFixed(0)} MB ({gpu.memoryUtilization}%)</span>
        </div>
        
        {gpu.lastChecked && (
          <div className="detail-row">
            <span className="detail-label">Last Check:</span>
            <span className="detail-value">
              {new Date(gpu.lastChecked).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
