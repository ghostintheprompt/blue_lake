import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API: Get Media
  app.get('/api/media', (req, res) => {
    // For demo purposes, we scan a 'public/media' folder or similar
    // We'll look for media files in the project to show something
    const mediaDir = path.join(process.cwd(), 'public/media');
    
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true });
    }

    const files = fs.readdirSync(mediaDir);
    const media = files
      .filter(f => /\.(mp4|mkv|webm|mp3|wav)$/i.test(f))
      .map((f, i) => ({
        id: `m-${i}`,
        name: f,
        type: f.endsWith('.mp3') || f.endsWith('.wav') ? 'audio' : 'video',
        url: `/api/stream/${encodeURIComponent(f)}`,
        size: fs.statSync(path.join(mediaDir, f)).size
      }));

    res.json(media);
  });

  // API: Stream with Range Support
  app.get('/api/stream/:filename', (req, res) => {
    const filename = decodeURIComponent(req.params.filename);
    const filePath = path.join(process.cwd(), 'public/media', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found');
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': filename.endsWith('.mp4') ? 'video/mp4' : 'application/octet-stream',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': filename.endsWith('.mp4') ? 'video/mp4' : 'application/octet-stream',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  });

  // API: App Hub (Mock installations)
  app.get('/api/apps', (req, res) => {
    res.json([
      { id: 'app-1', name: 'Kodi', version: '21.0', status: 'Installed', icon: 'Box', cpu: '12%', ram: '240MB' },
      { id: 'app-2', name: 'Smart IPTV', version: '1.7.2', status: 'Updates Available', icon: 'Tv', cpu: '5%', ram: '110MB' },
      { id: 'app-3', name: 'Stremio', version: '1.6.4', status: 'Not Installed', icon: 'Play', cpu: '0%', ram: '0MB' },
      { id: 'app-4', name: 'VLC', version: '3.5.4', status: 'Installed', icon: 'Video', cpu: '2%', ram: '85MB' }
    ]);
  });

  // API: System Metrics (Throughput, Temp, etc)
  app.get('/api/system/health', (req, res) => {
    res.json({
      cpu_temp: `${42 + Math.floor(Math.random() * 10)}°C`,
      throughput: `${(150 + Math.random() * 20).toFixed(2)} Mbps`,
      latency: `${(15 + Math.random() * 5).toFixed(0)}ms`,
      uptime: '14d 06h 22m',
      ram_usage: '1.4GB / 4.0GB',
      disk_space: '42GB / 128GB'
    });
  });

  // API: Signal Stability Graph Data
  app.get('/api/system/history', (req, res) => {
    const history = Array.from({ length: 20 }, (_, i) => ({
      timestamp: Date.now() - (19 - i) * 1000,
      bitrate: 140 + Math.floor(Math.random() * 40),
      ping: 15 + Math.floor(Math.random() * 10)
    }));
    res.json(history);
  });

  app.post('/api/apps/install', (req, res) => {
    const { appId } = req.body;
    console.log(`[SYS] Installing app package: ${appId}`);
    res.json({ success: true, message: `Package ${appId} injected into TV system.` });
  });

  // API: TV Control
  app.post('/api/tv/control', (req, res) => {
    const { action, value } = req.body;
    console.log(`[TV-CONTROL] Action: ${action}, Value: ${value}`);
    res.json({ success: true });
  });

  // API: IPTV (Mock channels)
  app.get('/api/iptv/channels', (req, res) => {
    res.json([
      { id: 'ch-1', name: 'GHOST_NEWS_WIRE', category: 'News', status: 'LIVE', url: 'rtmp://ghost/live' },
      { id: 'ch-2', name: 'TECH_LEAKS_INT', category: 'Tech', status: 'LIVE', url: 'rtmp://tech/leaks' },
      { id: 'ch-3', name: 'SURVEILLANCE_OSINT', category: 'Security', status: 'OFFLINE', url: 'rtmp://osint/feed' }
    ]);
  });

  // API: AI Injection / Command Processing
  app.post('/api/ai/inject', (req, res) => {
    const { prompt } = req.body;
    console.log(`[AI-INJECT] ${prompt}`);
    // Simulate AI system modification
    res.json({ success: true, patchNote: "System invariants updated. New permissions injected." });
  });

  // API: Network Info (Privacy Focused)
  app.get('/api/network', (req, res) => {
    const isAdmin = req.query.admin === 'true';
    if (isAdmin) {
      res.json({
        ssid: 'IsolaTiberina',
        ip: '192.168.1.153',
        gateway: '192.168.1.1',
        dns: '1.1.1.1',
        shield: 'Inactive'
      });
    } else {
      res.json({
        ssid: '••••••••••••••',
        ip: '•••.•••.•••.•••',
        gateway: '•••.•••.•••.•••',
        dns: '•••.•••.•••.•••',
        shield: 'Active'
      });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Blue Lake OS Server running on http://localhost:${PORT}`);
  });
}

startServer();
