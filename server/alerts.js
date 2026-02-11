import { exec, queryOne, query } from './db.js';

// Store a new alert when a service goes down
export function createAlert(serviceId, serviceName, status, message) {
  try {
    exec(
      `INSERT INTO alerts (service_id, service_name, status, message, created_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [serviceId, serviceName, status, message]
    );
    return true;
  } catch (error) {
    console.error('Error creating alert:', error);
    return false;
  }
}

// Get last N alerts (default 50)
export function getRecentAlerts(limit = 50) {
  try {
    const alerts = query(
      'SELECT id, service_id, service_name, status, message, created_at FROM alerts ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    return alerts;
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return [];
  }
}

// Get alerts for a specific service
export function getServiceAlerts(serviceId, limit = 50) {
  try {
    const alerts = query(
      'SELECT id, service_id, service_name, status, message, created_at FROM alerts WHERE service_id = ? ORDER BY created_at DESC LIMIT ?',
      [serviceId, limit]
    );
    return alerts;
  } catch (error) {
    console.error('Error fetching service alerts:', error);
    return [];
  }
}

// Clear old alerts (older than N days)
export function clearOldAlerts(daysOld = 7) {
  try {
    const result = exec(
      `DELETE FROM alerts WHERE created_at < datetime('now', '-' || ? || ' days')`,
      [daysOld]
    );
    return result.changes;
  } catch (error) {
    console.error('Error clearing old alerts:', error);
    return 0;
  }
}
