import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkAllServices, checkService, checkGPU, SERVICES } from './checks.js';

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

// Serve static frontend (production)
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(frontendPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🦀 LAN Monitor API running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Dashboard: http://0.0.0.0:${PORT}`);
});
