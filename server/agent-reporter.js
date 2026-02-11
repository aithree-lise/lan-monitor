import http from 'http';
import { updateAgentStatus } from './tickets.js';

// Agent definitions: {name, ip, gatewayPort}
const AGENTS = [
  { name: 'siegbert', ip: '192.168.27.155', gatewayPort: 18789 },
  { name: 'eugene', ip: '192.168.27.149', gatewayPort: 18789 },
  { name: 'bubblebass', ip: '192.168.27.64', gatewayPort: 18789 },
  { name: 'byte', ip: '192.168.27.79', gatewayPort: 18789 }
];

// Check if agent is reachable (HTTP health ping)
function checkAgentHealth(agent) {
  return new Promise((resolve) => {
    const url = `http://${agent.ip}:${agent.gatewayPort}/status`;
    const timeout = setTimeout(() => {
      resolve({ reachable: false, error: 'timeout' });
    }, 3000); // 3s timeout per agent

    http.get(url, (res) => {
      clearTimeout(timeout);
      // Any successful response = online
      resolve({ reachable: res.statusCode < 500, status: res.statusCode });
    }).on('error', (error) => {
      clearTimeout(timeout);
      resolve({ reachable: false, error: error.message });
    });
  });
}

// Update agent status in tickets database
async function updateAgentHeartbeat(agent, isReachable) {
  const status = isReachable ? 'online' : 'offline';
  const currentTask = isReachable ? 'standby' : null;

  try {
    updateAgentStatus(agent.name, {
      status: status,
      currentTask: currentTask
    });
    console.log(`[Agent] ${agent.name} → ${status}`);
  } catch (error) {
    console.error(`[Agent] Error updating ${agent.name}:`, error.message);
  }
}

// Check all agents
export async function checkAllAgents() {
  const results = {};

  for (const agent of AGENTS) {
    const health = await checkAgentHealth(agent);
    results[agent.name] = {
      ip: agent.ip,
      port: agent.gatewayPort,
      reachable: health.reachable,
      lastCheck: new Date().toISOString()
    };

    await updateAgentHeartbeat(agent, health.reachable);
  }

  return results;
}

// Start periodic heartbeat check (60 seconds)
export function startAgentReporter(intervalSeconds = 60) {
  console.log(`🔄 Agent reporter started (check every ${intervalSeconds}s)`);

  // Initial check
  checkAllAgents().catch(error => {
    console.error('Initial agent check failed:', error.message);
  });

  // Periodic checks
  const intervalMs = intervalSeconds * 1000;
  const intervalId = setInterval(() => {
    checkAllAgents().catch(error => {
      console.error('Agent heartbeat check failed:', error.message);
    });
  }, intervalMs);

  return intervalId;
}

// For testing: manual check
export async function manualAgentCheck() {
  console.log('[Manual] Running agent health check...');
  const results = await checkAllAgents();
  return results;
}
