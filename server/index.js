import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkAllServices, checkService, checkGPU, SERVICES } from './checks.js';
import { getServiceHistory } from './history.js';
import {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  getAgentsStatus,
  updateAgentStatus,
  validateTicketData
} from './tickets.js';
import { startAgentReporter, manualAgentCheck } from './agent-reporter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

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
    const ticket = getTicketById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    
    // Validate if provided
    const errors = validateTicketData(req.body);
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

// Serve static frontend (production)
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(frontendPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// GET manual agent check endpoint
app.get('/api/agents/check', async (req, res) => {
  try {
    const results = await manualAgentCheck();
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🦀 LAN Monitor API running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Dashboard: http://0.0.0.0:${PORT}`);
  
  // Start agent heartbeat reporter (60s interval)
  startAgentReporter(60);
});
