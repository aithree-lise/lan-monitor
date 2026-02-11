import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use /app/data in Docker, ./data locally
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Load history from file
function loadHistory() {
  ensureDataDir();
  
  if (!fs.existsSync(HISTORY_FILE)) {
    return {};
  }
  
  try {
    const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load history:', error.message);
    return {};
  }
}

// Save history to file
function saveHistory(history) {
  ensureDataDir();
  
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save history:', error.message);
  }
}

// Log a service check result
export function logServiceCheck(serviceId, status, responseMs) {
  const history = loadHistory();
  
  if (!history[serviceId]) {
    history[serviceId] = [];
  }
  
  const entry = {
    timestamp: new Date().toISOString(),
    status,
    responseMs
  };
  
  history[serviceId].push(entry);
  
  // Keep only last 7 days of history (to prevent file bloat)
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  history[serviceId] = history[serviceId].filter(entry => {
    return new Date(entry.timestamp).getTime() > sevenDaysAgo;
  });
  
  saveHistory(history);
}

// Get service history for last N hours
export function getServiceHistory(serviceId, hours = 24) {
  const history = loadHistory();
  
  if (!history[serviceId]) {
    return [];
  }
  
  const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
  
  return history[serviceId].filter(entry => {
    return new Date(entry.timestamp).getTime() > cutoffTime;
  });
}

// Get all history (for debugging)
export function getAllHistory() {
  return loadHistory();
}

// Clear history for a service (for testing)
export function clearServiceHistory(serviceId) {
  const history = loadHistory();
  delete history[serviceId];
  saveHistory(history);
}
