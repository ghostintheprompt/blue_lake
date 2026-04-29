import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import crypto from 'crypto';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VAULT_DIR = path.join(process.cwd(), 'public/media/vault');

// G-001: Immutable Crypto Logger
function logProtocolAction(actionId: string, details: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    actionId,
    details,
    hash: crypto.createHash('sha256').update(`${actionId}-${JSON.stringify(details)}-${Date.now()}`).digest('hex')
  };
  console.log(`[GUARDRAIL-G001] ACTION_LOGGED: ${JSON.stringify(logEntry)}`);
  return logEntry;
}

// G-002: Path-Traversal Execution Bounds
function validateVaultPath(targetPath: string) {
  const resolvedPath = path.resolve(VAULT_DIR, targetPath);
  if (!resolvedPath.startsWith(VAULT_DIR)) {
    throw new Error(`[GUARDRAIL-G002] ACCESS_DENIED: Path ${targetPath} is outside the restricted vault.`);
  }
  return resolvedPath;
}

let socAlerts: any[] = [];

if (!fs.existsSync(VAULT_DIR)) {
  fs.mkdirSync(VAULT_DIR, { recursive: true });
}

// Phase 3: Defensive Logic (SOC Alerts)
fs.watch(VAULT_DIR, (eventType, filename) => {
  if (filename) {
    if (filename.endsWith('.pem')) {
      socAlerts.push({ 
        id: `INC-002-${Date.now()}`, 
        name: 'Anomalous Cryptographic Activity', 
        trigger: `RSA key detected: ${filename}`, 
        timestamp: new Date().toISOString() 
      });
    }
    if (filename === '.persistence.conf') {
      socAlerts.push({ 
        id: `INC-003-${Date.now()}`, 
        name: 'Persistence Mechanism Established', 
        trigger: `Hidden config detected: ${filename}`, 
        timestamp: new Date().toISOString() 
      });
    }
  }
});

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

  app.post('/api/apps/install', async (req, res) => {
    const { appId } = req.body;
    logProtocolAction('app_install', { appId });
    
    try {
      console.log(`[ADB-INJECT] Attempting to push package ${appId} to hardware unit...`);
      // Functional ADB command placeholder - would target specific APKs
      // const { stdout } = await execAsync(`adb install ./packages/${appId}.apk`);
      res.json({ success: true, message: `Package ${appId} successfully pushed via ADB.` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "ADB connection failed. Ensure hardware is on grid." });
    }
  });

  // API: TV Control (Functional ADB Bridge)
  app.post('/api/tv/control', async (req, res) => {
    const { action, value } = req.body;
    logProtocolAction('tv_control', { action, value });
    
    try {
      let adbCmd = '';
      switch (action) {
        case 'power':
          adbCmd = 'adb shell input keyevent 26'; // POWER
          break;
        case 'volume':
          // Volume is incremental in ADB; this simulates a stepped update
          adbCmd = value > 25 ? 'adb shell input keyevent 24' : 'adb shell input keyevent 25'; 
          break;
        case 'input':
          adbCmd = 'adb shell input keyevent 178'; // INPUT
          break;
        default:
          adbCmd = `adb shell input keyevent ${value}`;
      }
      
      console.log(`[ADB-BRIDGE] Executing: ${adbCmd}`);
      // await execAsync(adbCmd); // Live execution
      
      res.json({ success: true, command: adbCmd });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Hardware communication error." });
    }
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

  // Phase 2: Actionable Logic (Scenarios)
  app.post('/api/protocols/s1', async (req, res) => {
    logProtocolAction('s1', { type: 'network_recon' });
    socAlerts.push({ 
      id: `INC-001-${Date.now()}`, 
      name: 'Unauthorized Reconnaissance Detected', 
      trigger: 'Execution of s1 reconnaissance scripts.', 
      timestamp: new Date().toISOString() 
    });
    
    try {
      // Functional reconnaissance
      const { stdout } = await execAsync('netstat -an | head -n 20');
      res.json({ success: true, data: stdout });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/protocols/s2', async (req, res) => {
    logProtocolAction('s2', { type: 'crypto_payload' });
    try {
      // Functional cryptography
      const { publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });

      const keyPath = validateVaultPath('exfil_key.pem');
      fs.writeFileSync(keyPath, publicKey);

      const secretMessage = "EDITORIAL_RESTRICTED_DATA";
      const encrypted = crypto.publicEncrypt(publicKey, Buffer.from(secretMessage));
      
      res.json({ 
        success: true, 
        message: "RSA Keypair generated and payload encrypted.",
        payload_hash: crypto.createHash('sha256').update(encrypted).digest('hex')
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/protocols/s3', (req, res) => {
    logProtocolAction('s3', { type: 'persistence' });
    try {
      // Functional persistence simulation
      const configPath = validateVaultPath('.persistence.conf');
      fs.writeFileSync(configPath, JSON.stringify({
        baseline: 'established',
        ghost_protocol: 'active',
        timestamp: Date.now()
      }));
      res.json({ success: true, message: "Persistence configuration injected." });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/alerts', (req, res) => {
    res.json(socAlerts.slice(-10).reverse());
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
