import './ServiceCard.css';
import UptimeBar from './UptimeBar';

export default function ServiceCard({ service, history }) {
  const statusColor = {
    up: '#4ade80',
    down: '#f87171',
    unknown: '#9ca3af'
  }[service.status] || '#9ca3af';

  const statusEmoji = {
    up: '✅',
    down: '❌',
    unknown: '❓'
  }[service.status] || '❓';

  return (
    <div className="service-card" style={{ borderLeftColor: statusColor }}>
      <div className="service-header">
        <span className="service-emoji">{statusEmoji}</span>
        <h3 className="service-name">{service.name}</h3>
      </div>
      
      <div className="service-details">
        <div className="detail-row">
          <span className="detail-label">Host:</span>
          <span className="detail-value">{service.host}</span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">Status:</span>
          <span className="detail-value" style={{ color: statusColor, fontWeight: 'bold' }}>
            {service.status.toUpperCase()}
          </span>
        </div>
        
        {service.responseMs && (
          <div className="detail-row">
            <span className="detail-label">Response:</span>
            <span className="detail-value">{service.responseMs}ms</span>
          </div>
        )}
        
        {service.lastChecked && (
          <div className="detail-row">
            <span className="detail-label">Last Check:</span>
            <span className="detail-value">
              {new Date(service.lastChecked).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>
      
      {service.error && (
        <div className="service-error">
          {service.error}
        </div>
      )}
      
      {service.models && service.models.length > 0 && (
        <div className="service-models">
          <div className="models-header">
            <span className="models-label">🤖 Loaded Models ({service.models.length})</span>
          </div>
          {service.models.map((model, idx) => (
            <div key={idx} className="model-item">
              <span className="model-name">{model.name}</span>
              <span className="model-size">{model.sizeGB} GB</span>
            </div>
          ))}
        </div>
      )}
      <UptimeBar history={history} />
    </div>
  );
}
