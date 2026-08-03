import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import os from 'os';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MEDIA_DIR = path.join(process.cwd(), 'public/media');
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const ADB_ENABLED = process.env.BLUE_LAKE_ENABLE_ADB === 'true';
const DEFAULT_ADB_PORT = Number(process.env.BLUE_LAKE_ADB_PORT || 5555);

type StudioMode = 'capture-one' | 'davinci' | 'client-review' | 'mirror-check';

type TVStatus = {
  id: string;
  name: string;
  role: string;
  ip: string;
  adbPort: number;
  connected: boolean;
  power: boolean;
  volume: number;
  input: string;
  currentApp: string;
  lastCommand?: string;
};

type StudioActionLog = {
  id: string;
  displayId: string;
  action: string;
  detail: string;
  timestamp: string;
};

const keyEvents: Record<string, string> = {
  wake: 'KEYCODE_WAKEUP',
  sleep: 'KEYCODE_SLEEP',
  power: 'KEYCODE_POWER',
  home: 'KEYCODE_HOME',
  back: 'KEYCODE_BACK',
  select: 'KEYCODE_DPAD_CENTER',
  up: 'KEYCODE_DPAD_UP',
  down: 'KEYCODE_DPAD_DOWN',
  left: 'KEYCODE_DPAD_LEFT',
  right: 'KEYCODE_DPAD_RIGHT',
  menu: 'KEYCODE_MENU',
  input: 'KEYCODE_TV_INPUT',
  volume_up: 'KEYCODE_VOLUME_UP',
  volume_down: 'KEYCODE_VOLUME_DOWN',
  mute: 'KEYCODE_VOLUME_MUTE',
};

let activeMode: StudioMode = 'capture-one';
let actionLog: StudioActionLog[] = [];

let displays: TVStatus[] = [
  {
    id: 'a',
    name: process.env.FIRE_TV_A_NAME || 'Client Proof TV',
    role: process.env.FIRE_TV_A_ROLE || 'Capture One viewer',
    ip: process.env.FIRE_TV_A_IP || '192.168.1.50',
    adbPort: Number(process.env.FIRE_TV_A_ADB_PORT || DEFAULT_ADB_PORT),
    connected: false,
    power: true,
    volume: 12,
    input: process.env.FIRE_TV_A_INPUT || 'HDMI 1',
    currentApp: 'Fire TV Home',
  },
  {
    id: 'b',
    name: process.env.FIRE_TV_B_NAME || 'Reference Playback TV',
    role: process.env.FIRE_TV_B_ROLE || 'DaVinci review',
    ip: process.env.FIRE_TV_B_IP || '192.168.1.51',
    adbPort: Number(process.env.FIRE_TV_B_ADB_PORT || DEFAULT_ADB_PORT),
    connected: false,
    power: true,
    volume: 12,
    input: process.env.FIRE_TV_B_INPUT || 'HDMI 1',
    currentApp: 'Fire TV Home',
  },
];

const studioWarnings = [
  'ADB is dry-run by default. Set BLUE_LAKE_ENABLE_ADB=true only on your private studio LAN.',
  'Fire TVs are useful client/reference monitors. Use calibrated direct HDMI or SDI monitoring for color-critical decisions.',
  'Blue Lake controls display state and apps; Capture One and DaVinci still own the image signal path.',
];

function serialFor(display: TVStatus) {
  return `${display.ip}:${display.adbPort}`;
}

function logStudioAction(displayId: string, action: string, detail: string) {
  const entry = {
    id: crypto.randomUUID(),
    displayId,
    action,
    detail,
    timestamp: new Date().toISOString(),
  };
  actionLog = [entry, ...actionLog].slice(0, 40);
  console.log(`[BLUE-LAKE-STUDIO] ${JSON.stringify(entry)}`);
  return entry;
}

function getDisplay(displayId: string) {
  const display = displays.find((candidate) => candidate.id === displayId);
  if (!display) {
    throw new Error(`Unknown display id: ${displayId}`);
  }
  return display;
}

function updateDisplay(displayId: string, patch: Partial<TVStatus>) {
  displays = displays.map((display) => (
    display.id === displayId ? { ...display, ...patch } : display
  ));
}

function assertSafePackageName(packageName: string) {
  if (!/^[a-zA-Z0-9._]+$/.test(packageName)) {
    throw new Error('Unsafe Android package name.');
  }
}

function assertSafeUrl(url: string) {
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http and https URLs are supported for Fire TV launch.');
  }
}

async function runAdb(display: TVStatus, args: string[]) {
  const command = `adb ${args.join(' ')}`;
  if (!ADB_ENABLED) {
    return { dryRun: true, command, stdout: '' };
  }

  const { stdout } = await execFileAsync('adb', args, {
    timeout: 8000,
    maxBuffer: 1024 * 1024,
  });
  return { dryRun: false, command, stdout };
}

async function runDisplayAction(displayId: string, action: string, value?: string | number) {
  const display = getDisplay(displayId);
  let args: string[];
  let currentApp = display.currentApp;
  let connected = display.connected;
  let power = display.power;
  let volume = display.volume;

  if (action === 'connect') {
    args = ['connect', serialFor(display)];
    connected = true;
  } else if (action === 'launch_app') {
    const packageName = String(value || '');
    assertSafePackageName(packageName);
    args = [
      '-s',
      serialFor(display),
      'shell',
      'monkey',
      '-p',
      packageName,
      '-c',
      'android.intent.category.LAUNCHER',
      '1',
    ];
    currentApp = packageName;
  } else if (action === 'open_url') {
    const url = String(value || '');
    assertSafeUrl(url);
    args = [
      '-s',
      serialFor(display),
      'shell',
      'am',
      'start',
      '-a',
      'android.intent.action.VIEW',
      '-d',
      url,
    ];
    currentApp = 'Browser / review URL';
  } else if (action === 'volume_set') {
    const nextVolume = Math.max(0, Math.min(100, Number(value)));
    args = ['-s', serialFor(display), 'shell', 'media', 'volume', '--stream', '3', '--set', String(nextVolume)];
    volume = nextVolume;
  } else {
    const keyEvent = keyEvents[action];
    if (!keyEvent) {
      throw new Error(`Unsupported action: ${action}`);
    }
    args = ['-s', serialFor(display), 'shell', 'input', 'keyevent', keyEvent];
    if (action === 'wake') power = true;
    if (action === 'sleep') power = false;
    if (action === 'home') currentApp = 'Fire TV Home';
    if (action === 'volume_up') volume = Math.min(100, volume + 5);
    if (action === 'volume_down') volume = Math.max(0, volume - 5);
  }

  const result = await runAdb(display, args);
  updateDisplay(displayId, {
    connected,
    power,
    volume,
    currentApp,
    lastCommand: result.command,
  });
  const log = logStudioAction(displayId, action, `${result.dryRun ? 'DRY RUN: ' : ''}${result.command}`);
  return { result, log };
}

function localIp() {
  const interfaces = os.networkInterfaces();
  for (const entries of Object.values(interfaces)) {
    for (const entry of entries || []) {
      if (entry.family === 'IPv4' && !entry.internal) {
        return entry.address;
      }
    }
  }
  return '127.0.0.1';
}

function configuredApps() {
  return [
    {
      id: 'silk',
      name: 'Silk Browser',
      version: 'Fire TV',
      status: 'Configured',
      icon: 'Play',
      packageName: process.env.BLUE_LAKE_SILK_PACKAGE || 'com.amazon.cloud9',
      note: 'Useful for local review pages, web galleries, and wireless handoff tools.',
    },
    {
      id: 'capture',
      name: 'Capture Receiver',
      version: 'Studio',
      status: process.env.BLUE_LAKE_CAPTURE_PACKAGE ? 'Configured' : 'Not Installed',
      icon: 'Camera',
      packageName: process.env.BLUE_LAKE_CAPTURE_PACKAGE || '',
      note: 'Set BLUE_LAKE_CAPTURE_PACKAGE if you use AirScreen, AirReceiver, or a custom viewer.',
    },
    {
      id: 'davinci',
      name: 'Playback Receiver',
      version: 'Studio',
      status: process.env.BLUE_LAKE_DAVINCI_PACKAGE ? 'Configured' : 'Not Installed',
      icon: 'Video',
      packageName: process.env.BLUE_LAKE_DAVINCI_PACKAGE || '',
      note: 'Optional Fire TV app for review playback. Direct monitor output is still preferred.',
    },
    {
      id: 'review',
      name: 'Client Review URL',
      version: 'Local',
      status: process.env.BLUE_LAKE_REVIEW_URL ? 'Configured' : 'Not Installed',
      icon: 'Tv',
      packageName: process.env.BLUE_LAKE_REVIEW_URL || '',
      note: 'Set BLUE_LAKE_REVIEW_URL to open a gallery, proofing page, or local web viewer.',
    },
  ];
}

async function startServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  if (!fs.existsSync(MEDIA_DIR)) {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
  }

  app.get('/api/studio/status', (_req, res) => {
    res.json({
      adbEnabled: ADB_ENABLED,
      activeMode,
      displays,
      actions: actionLog,
      warnings: studioWarnings,
    });
  });

  app.post('/api/studio/display/:displayId/control', async (req, res) => {
    const { displayId } = req.params;
    const { action, value } = req.body || {};

    try {
      const commandResult = await runDisplayAction(displayId, String(action), value);
      res.json({
        success: true,
        adbEnabled: ADB_ENABLED,
        activeMode,
        displays,
        actions: actionLog,
        ...commandResult,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/studio/mode', async (req, res) => {
    const mode = String(req.body?.mode || 'capture-one') as StudioMode;
    if (!['capture-one', 'davinci', 'client-review', 'mirror-check'].includes(mode)) {
      return res.status(400).json({ success: false, error: 'Unsupported studio mode.' });
    }

    activeMode = mode;
    const actionsByMode: Record<StudioMode, string[]> = {
      'capture-one': ['wake', 'home', 'mute'],
      davinci: ['wake', 'home', 'mute'],
      'client-review': ['wake', 'home'],
      'mirror-check': ['wake', 'home'],
    };

    try {
      for (const display of displays) {
        for (const action of actionsByMode[mode]) {
          await runDisplayAction(display.id, action);
        }
      }
      logStudioAction('studio', 'mode', `Studio mode set to ${mode}`);
      res.json({ success: true, adbEnabled: ADB_ENABLED, activeMode, displays, actions: actionLog });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get('/api/apps', (_req, res) => {
    res.json(configuredApps());
  });

  app.post('/api/apps/launch', async (req, res) => {
    const { displayId, packageName, url } = req.body || {};
    try {
      const commandResult = url
        ? await runDisplayAction(String(displayId), 'open_url', String(url))
        : await runDisplayAction(String(displayId), 'launch_app', String(packageName));
      res.json({ success: true, adbEnabled: ADB_ENABLED, activeMode, displays, actions: actionLog, ...commandResult });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get('/api/media', (_req, res) => {
    const files = fs.readdirSync(MEDIA_DIR);
    const media = files
      .filter((file) => /\.(mp4|mkv|webm|mp3|wav|mov)$/i.test(file))
      .map((file, index) => ({
        id: `m-${index}`,
        name: file,
        type: /\.(mp3|wav)$/i.test(file) ? 'audio' : 'video',
        url: `/api/stream/${encodeURIComponent(file)}`,
        size: fs.statSync(path.join(MEDIA_DIR, file)).size,
      }));

    res.json(media);
  });

  app.get('/api/stream/:filename', (req, res) => {
    const filename = decodeURIComponent(req.params.filename);
    const filePath = path.resolve(MEDIA_DIR, filename);

    if (!filePath.startsWith(MEDIA_DIR) || !fs.existsSync(filePath)) {
      return res.status(404).send('File not found');
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const contentType = filename.toLowerCase().endsWith('.mp4') ? 'video/mp4' : 'application/octet-stream';

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      });
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
      });
      fs.createReadStream(filePath).pipe(res);
    }
  });

  app.get('/api/system/health', (_req, res) => {
    const free = os.freemem() / 1024 / 1024 / 1024;
    const total = os.totalmem() / 1024 / 1024 / 1024;
    res.json({
      cpu_temp: 'n/a',
      throughput: `${(180 + Math.random() * 35).toFixed(1)} Mbps`,
      latency: `${(8 + Math.random() * 8).toFixed(0)} ms`,
      uptime: `${Math.floor(os.uptime() / 3600)}h`,
      ram_usage: `${(total - free).toFixed(1)}GB / ${total.toFixed(1)}GB`,
      disk_space: 'studio local',
    });
  });

  app.get('/api/system/history', (_req, res) => {
    res.json(Array.from({ length: 24 }, (_, index) => ({
      timestamp: Date.now() - (23 - index) * 1000,
      bitrate: 160 + Math.floor(Math.random() * 60),
      ping: 8 + Math.floor(Math.random() * 10),
    })));
  });

  app.get('/api/network', (req, res) => {
    const isAdmin = req.query.admin === 'true';
    res.json({
      ssid: isAdmin ? process.env.BLUE_LAKE_STUDIO_WIFI || 'studio-lan' : 'masked',
      ip: isAdmin ? localIp() : 'masked',
      gateway: isAdmin ? process.env.BLUE_LAKE_GATEWAY || 'auto' : 'masked',
      dns: isAdmin ? process.env.BLUE_LAKE_DNS || 'auto' : 'masked',
      shield: isAdmin ? 'Inactive' : 'Active',
    });
  });

  app.post('/api/tv/control', async (req, res) => {
    try {
      const commandResult = await runDisplayAction('a', String(req.body?.action), req.body?.value);
      res.json({ success: true, ...commandResult });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    const mode = ADB_ENABLED ? 'ARMED LOCAL ADB' : 'DRY RUN';
    console.log(`Blue Lake Studio running on http://localhost:${PORT} (${mode})`);
  });
}

startServer();
