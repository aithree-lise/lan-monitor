import Redis from 'ioredis';

const redis = new Redis({ host: '172.17.0.1', port: 6379, lazyConnect: true });

const AGENTS = ['siegbert', 'eugene', 'bubblebass', 'sandy'];

export function registerRedisRoutes(app) {
  
  app.get('/api/redis/chat', async (req, res) => {
    try {
      const count = parseInt(req.query.count) || 50;
      await redis.connect().catch(() => {});
      const raw = await redis.xrevrange('openclaw:chat', '+', '-', 'COUNT', count);
      const messages = raw.map(([id, fields]) => {
        const obj = {};
        for (let i = 0; i < fields.length; i += 2) {
          obj[fields[i]] = fields[i + 1];
        }
        return { id, from: obj.from || '', text: obj.text || '', ts: obj.ts || '' };
      });
      res.json({ messages, count: messages.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/redis/status', async (req, res) => {
    try {
      await redis.connect().catch(() => {});
      const agents = {};
      for (const agent of AGENTS) {
        const data = await redis.hgetall('openclaw:agents:' + agent);
        agents[agent] = {
          status: data.status || 'unknown',
          lastTask: data.lastTask || data.task || '',
          lastActive: data.lastActive || data.ts || ''
        };
      }
      res.json({ agents });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}
