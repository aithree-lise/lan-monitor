import fetch from 'node-fetch';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logServiceCheck } from './history.js';

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
    type: 'ollama',
    url: 'http://192.168.27.30:11434/api/tags',
    psUrl: 'http://192.168.27.30:11434/api/ps'
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
    // Linux ping: -c count, -W timeout in seconds
    await execAsync(`ping -c 1 -W ${timeout} ${host}`);
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

async function checkOllama(service, timeout = 5000) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Check health
    const healthResponse = await fetch(service.url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'lan-monitor/1.0' }
    });
    
    clearTimeout(timeoutId);
    const responseMs = Date.now() - start;
    
    if (!healthResponse.ok) {
      return {
        status: 'down',
        responseMs,
        statusCode: healthResponse.status
      };
    }
    
    // Fetch running models
    let models = [];
    try {
      const psResponse = await fetch(service.psUrl, {
        headers: { 'User-Agent': 'lan-monitor/1.0' }
      });
      
      if (psResponse.ok) {
        const psData = await psResponse.json();
        models = (psData.models || []).map(m => ({
          name: m.name,
          size: m.size,
          sizeGB: (m.size / (1024 * 1024 * 1024)).toFixed(2)
        }));
      }
    } catch (err) {
      // Ignore model fetch errors
    }
    
    return {
      status: 'up',
      responseMs,
      statusCode: healthResponse.status,
      models
    };
  } catch (error) {
    return {
      status: 'down',
      responseMs: Date.now() - start,
      error: error.message
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
  
  let check;
  
  if (service.type === 'http') {
    check = await checkHTTP(service.url);
  } else if (service.type === 'ping') {
    check = await checkPing(service.host);
  } else if (service.type === 'ollama') {
    check = await checkOllama(service);
  } else {
    return { ...result, status: 'unknown' };
  }
  
  const finalResult = { ...result, ...check };
  
  // Log the check result to history
  logServiceCheck(service.id, finalResult.status, finalResult.responseMs);
  
  return finalResult;
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
      'nvidia-smi --query-gpu=name,utilization.gpu,utilization.memory,temperature.gpu,memory.used,memory.total,power.draw --format=csv,noheader,nounits'
    );
    
    // Parse CSV output: name, gpu_util, mem_util, temp, mem_used, mem_total, power
    // Note: DGX Spark (GB10/Blackwell) uses unified memory — memory.used/total return [N/A]
    const lines = stdout.trim().split('\n');
    const gpus = lines.map((line, index) => {
      const parts = line.split(',').map(s => s.trim());
      const name = parts[0];
      const gpuUtil = parseFloat(parts[1]);
      const memUtil = parseFloat(parts[2]);
      const temp = parseFloat(parts[3]);
      const memUsed = parts[4] === '[N/A]' ? null : parseFloat(parts[4]);
      const memTotal = parts[5] === '[N/A]' ? null : parseFloat(parts[5]);
      const power = parts[6] === '[N/A]' ? null : parseFloat(parts[6]);
      
      return {
        id: index,
        name: name || `GPU ${index}`,
        utilization: isNaN(gpuUtil) ? null : gpuUtil,
        memoryUtilization: isNaN(memUtil) ? null : memUtil,
        temperature: isNaN(temp) ? null : temp,
        memoryUsed: memUsed,
        memoryTotal: memTotal,
        powerDraw: power,
        status: temp != null && temp < 85 ? 'up' : temp != null ? 'warning' : 'up',
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
