import './UptimeBar.css';

/**
 * Mini uptime bar chart showing service status over time.
 * Expects history as array of { timestamp, status } entries (oldest first).
 * Renders as a row of colored segments: green=up, red=down, gray=unknown.
 */
export default function UptimeBar({ history = [], hours = 24 }) {
  if (!history.length) {
    return (
      <div className="uptime-bar-container">
        <span className="uptime-label">Uptime {hours}h</span>
        <div className="uptime-bar">
          <div className="uptime-empty">No data</div>
        </div>
      </div>
    );
  }

  const statusColor = {
    up: '#4ade80',
    down: '#f87171',
    warning: '#f59e0b',
    unknown: '#4b5563'
  };

  // Calculate uptime percentage
  const upCount = history.filter(h => h.status === 'up').length;
  const uptimePercent = ((upCount / history.length) * 100).toFixed(1);

  // Group consecutive same-status entries into segments for cleaner rendering
  const segments = [];
  let current = null;

  for (const entry of history) {
    if (current && current.status === entry.status) {
      current.count++;
    } else {
      if (current) segments.push(current);
      current = { status: entry.status, count: 1 };
    }
  }
  if (current) segments.push(current);

  const total = history.length;

  return (
    <div className="uptime-bar-container">
      <div className="uptime-header">
        <span className="uptime-label">Uptime {hours}h</span>
        <span className="uptime-percent" style={{ 
          color: uptimePercent >= 99 ? '#4ade80' : uptimePercent >= 95 ? '#f59e0b' : '#f87171' 
        }}>
          {uptimePercent}%
        </span>
      </div>
      <div className="uptime-bar" title={`${uptimePercent}% uptime over ${hours}h (${history.length} checks)`}>
        {segments.map((seg, i) => (
          <div
            key={i}
            className="uptime-segment"
            style={{
              width: `${(seg.count / total) * 100}%`,
              backgroundColor: statusColor[seg.status] || statusColor.unknown,
            }}
            title={`${seg.status} (${seg.count} checks)`}
          />
        ))}
      </div>
    </div>
  );
}
