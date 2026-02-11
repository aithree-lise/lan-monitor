import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkAllServices, checkService, checkGPU, SERVICES } from './checks.js';
import { getServiceHistory } from './history.js';
import { db } from './db.js';
import {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  getAgentsStatus,
  updateAgentStatus,
  validateTicketData,
  validateTicketUpdate
} from './tickets.js';
import {
  getAllIdeas,
  getIdeaById,
  createIdea,
  updateIdea,
  deleteIdea,
  convertIdeaToTicket,
  validateIdeaData,
  validateIdeaUpdate
} from './ideas.js';
import { startAgentReporter, manualAgentCheck } from './agent-reporter.js';
import { createAlert, getRecentAlerts, getServiceAlerts } from './alerts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Force JSON response type for all /api/ routes
app.use('/api/', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Cache for service checks (max 30s old)
let cachedResults = null;
let lastCheck = 0;
let cachedGPU = null;
let lastGPUCheck = 0;
const CACHE_TTL = 30000; // 30 seconds

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/services', async (req, res) => {
  try {
    const now = Date.now();
    
    // Return cached if fresh
    if (cachedResults && (now - lastCheck) < CACHE_TTL) {
      return res.json({ services: cachedResults, cached: true });
    }
    
    // Check all services
    const results = await checkAllServices();
    cachedResults = results;
    lastCheck = now;
    
    // Create alerts for down services
    results.forEach(service => {
      if (service.status === 'down') {
        createAlert(service.id, service.name, 'down', `Service ${service.name} is down`);
      }
    });
    
    res.json({ services: results, cached: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/services/:id', async (req, res) => {
  try {
    const service = SERVICES.find(s => s.id === req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    const result = await checkService(service);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/services/:id/history', (req, res) => {
  try {
    const service = SERVICES.find(s => s.id === req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    const hours = Math.max(1, Math.min(168, parseInt(req.query.hours) || 24)); // 1-168 hours (7 days)
    const history = getServiceHistory(req.params.id, hours);
    
    res.json({
      serviceId: req.params.id,
      serviceName: service.name,
      hours,
      entries: history.length,
      history
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gpu', async (req, res) => {
  try {
    const now = Date.now();
    
    // Return cached if fresh
    if (cachedGPU && (now - lastGPUCheck) < CACHE_TTL) {
      return res.json({ ...cachedGPU, cached: true });
    }
    
    // Check GPU status
    const result = await checkGPU();
    cachedGPU = result;
    lastGPUCheck = now;
    
    res.json({ ...result, cached: false });
  } catch (error) {
    res.status(500).json({ error: error.message, gpus: [], status: 'error' });
  }
});

// ============================================
// TASK-015: System Info Panel
// ============================================
app.get('/api/system', async (req, res) => {
  try {
    const { execSync } = await import('child_process');
    
    const uptime = execSync('uptime -p').toString().trim();
    const disk = execSync("df -h / | tail -1 | awk '{print $3\"/\"$2\" (\"$5\")}'").toString().trim();
    const mem = execSync("free -h | grep Mem | awk '{print $3\"/\"$2}'").toString().trim();
    const load = execSync("cat /proc/loadavg | awk '{print $1, $2, $3}'").toString().trim();
    
    res.json({ 
      uptime, 
      disk, 
      memory: mem, 
      loadAvg: load,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// TASK-013: Service Health Alerts
// ============================================
app.get('/api/alerts', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const serviceId = req.query.service;
    
    let alerts;
    if (serviceId) {
      alerts = getServiceAlerts(serviceId, limit);
    } else {
      alerts = getRecentAlerts(limit);
    }
    
    res.json({ alerts, count: alerts.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// AP5: Kanban Tickets API
// ============================================

// GET all tickets (with optional filters)
app.get('/api/tickets', (req, res) => {
  try {
    const filters = {};
    if (req.query.lane) filters.lane = req.query.lane;
    if (req.query.assignee) filters.assignee = req.query.assignee;
    
    const tickets = getAllTickets(filters);
    res.json({ tickets, count: tickets.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single ticket
app.get('/api/tickets/:id', (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    const ticket = getTicketById(req.params.id);
    
    if (!ticket) {
      res.status(404);
      return res.json({ error: 'Ticket not found', id: req.params.id });
    }
    
    res.status(200);
    res.json(ticket);
  } catch (error) {
    res.status(500);
    res.json({ error: error.message });
  }
});

// POST create new ticket
app.post('/api/tickets', (req, res) => {
  try {
    // Validate
    const errors = validateTicketData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    const ticket = createTicket(req.body);
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update ticket
app.put('/api/tickets/:id', (req, res) => {
  try {
    const ticket = getTicketById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    // Validate only fields being updated
    const errors = validateTicketUpdate(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    const updated = updateTicket(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE ticket
app.delete('/api/tickets/:id', (req, res) => {
  try {
    const success = deleteTicket(req.params.id);
    
    if (!success) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.json({ success: true, id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET agents status
app.get('/api/agents/status', (req, res) => {
  try {
    const agents = getAgentsStatus();
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update agent status
app.put('/api/agents/:name/status', (req, res) => {
  try {
    const agent = updateAgentStatus(req.params.name, req.body);
    res.json(agent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET manual agent check endpoint
app.get('/api/agents/check', async (req, res) => {
  try {
    const results = await manualAgentCheck();
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// AP6.2: Ideas API
// ============================================

// GET all ideas (with filters & sorting)
app.get('/api/ideas', (req, res) => {
  try {
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.tag) filters.tag = req.query.tag;
    if (req.query.sort) filters.sort = req.query.sort;
    if (req.query.order) filters.order = req.query.order;
    
    const ideas = getAllIdeas(filters);
    res.json({ ideas, count: ideas.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single idea
app.get('/api/ideas/:id', (req, res) => {
  try {
    const idea = getIdeaById(req.params.id);
    
    if (!idea) {
      res.status(404);
      return res.json({ error: 'Idea not found', id: req.params.id });
    }
    
    res.json(idea);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new idea
app.post('/api/ideas', (req, res) => {
  try {
    // Validate
    const errors = validateIdeaData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    const idea = createIdea(req.body);
    res.status(201).json(idea);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update idea
app.put('/api/ideas/:id', (req, res) => {
  try {
    const idea = getIdeaById(req.params.id);
    
    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' });
    }
    
    // Validate only fields being updated
    const errors = validateIdeaUpdate(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    const updated = updateIdea(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE idea
app.delete('/api/ideas/:id', (req, res) => {
  try {
    const success = deleteIdea(req.params.id);
    
    if (!success) {
      return res.status(404).json({ error: 'Idea not found' });
    }
    
    res.json({ success: true, id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST convert idea to ticket
app.post('/api/ideas/:id/convert', (req, res) => {
  try {
    const result = convertIdeaToTicket(req.params.id);
    
    if (result.error) {
      const status = result.status || 500;
      return res.status(status).json({ error: result.error });
    }
    
    res.json(result.ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 404 for unmapped API routes
app.use('/api/', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found', path: req.path, method: req.method });
});

// Serve static frontend (production) — MUST BE AFTER ALL API ROUTES
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(frontendPath));
  
  app.get('*', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🦀 LAN Monitor API running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  
  // Start agent heartbeat reporter (60s interval)
  startAgentReporter(60);
});
