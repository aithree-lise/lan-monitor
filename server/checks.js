import fetch from 'node-fetch';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const SERVICES = [
  {
    id: 'conduit',
    name: 'Conduit (Matrix)',
    host: '192.168.27.30:6167',
    type: 'http',
    url: 'http://192.168.27.30:6167/_matrix/client/versions'
  },
  {
    id: 'ollama',
    name: 'Ollama',
    host: '192.168.27.30:11434',
    type: 'http',
    url: 'http://192.168.27.30:11434/api/tags'
  },
  {
    id: 'mac-aithree',
    name: 'Mac mini (aithree)',
    host: '192.168.27.155',
    type: 'ping'
  },
  {
    id: 'mac-eugene',
    name: 'Mac mini (eugene)',
    host: '192.168.27.149',
    type: 'ping'
  }
];

async function checkHTTP(url, timeout = 5000) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'lan-monitor/1.0' }
    });
    
    clearTimeout(timeoutId);
    const responseMs = Date.now() - start;
    
    return {
      status: response.ok ? 'up' : 'down',
      responseMs,
      statusCode: response.status
    };
  } catch (error) {
    return {
      status: 'down',
      responseMs: Date.now() - start,
      error: error.message
    };
  }
}

async function checkPing(host, timeout = 2) {
  const start = Date.now();
  try {
    // macOS ping: -c count, -W timeout in ms (multiply by 1000)
    await execAsync(`ping -c 1 -W ${timeout * 1000} ${host}`);
    const responseMs = Date.now() - start;
    
    return {
      status: 'up',
      responseMs
    };
  } catch (error) {
    return {
      status: 'down',
      responseMs: Date.now() - start,
      error: 'Ping failed'
    };
  }
}

export async function checkService(service) {
  const result = {
    id: service.id,
    name: service.name,
    host: service.host,
    lastChecked: new Date().toISOString()
  };
  
  if (service.type === 'http') {
    const check = await checkHTTP(service.url);
    return { ...result, ...check };
  } else if (service.type === 'ping') {
    const check = await checkPing(service.host);
    return { ...result, ...check };
  }
  
  return { ...result, status: 'unknown' };
}

export async function checkAllServices() {
  const results = await Promise.all(
    SERVICES.map(service => checkService(service))
  );
  return results;
}

export async function checkGPU() {
  try {
    const { stdout } = await execAsync(
      'nvidia-smi --query-gpu=utilization.gpu,temperature.gpu,memory.used,memory.total --format=csv,noheader,nounits'
    );
    
    // Parse CSV output: gpu_util, temp, mem_used, mem_total
    const lines = stdout.trim().split('\n');
    const gpus = lines.map((line, index) => {
      const [gpuUtil, temp, memUsed, memTotal] = line.split(',').map(s => parseFloat(s.trim()));
      
      return {
        id: index,
        name: `GPU ${index}`,
        utilization: gpuUtil,
        temperature: temp,
        memoryUsed: memUsed,
        memoryTotal: memTotal,
        memoryUtilization: ((memUsed / memTotal) * 100).toFixed(1),
        status: temp < 85 ? 'up' : 'warning', // Warning if temp > 85°C
        lastChecked: new Date().toISOString()
      };
    });
    
    return { gpus, status: 'ok' };
  } catch (error) {
    return {
      gpus: [],
      status: 'error',
      error: error.message
    };
  }
}

export { SERVICES };
