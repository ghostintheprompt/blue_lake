export type MediaItem = {
  id: string;
  name: string;
  type: 'video' | 'audio';
  url: string;
  size: number;
};

export type NetworkInfo = {
  ssid: string;
  ip: string;
  gateway: string;
  dns: string;
  shield: 'Active' | 'Inactive';
};

export type TVStatus = {
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
  health: DisplayHealth;
  lastCommand?: string;
};

export type StudioMode = 'capture-one' | 'davinci' | 'client-review' | 'mirror-check';

export type AppWindow = 'none' | 'media' | 'displays' | 'settings' | 'apps' | 'guide' | 'discovery' | 'presets';

export type AppPackage = {
  id: string;
  name: string;
  version: string;
  status: 'Installed' | 'Not Installed' | 'Updates Available' | 'Configured';
  icon: string;
  packageName?: string;
  note?: string;
};

export type SystemHealth = {
  cpu_temp: string;
  throughput: string;
  latency: string;
  uptime: string;
  ram_usage: string;
  disk_space: string;
};

export type PerformanceMark = {
  timestamp: number;
  bitrate: number;
  ping: number;
};

export type StudioActionLog = {
  id: string;
  displayId: string;
  action: string;
  detail: string;
  timestamp: string;
};

export type DisplayHealth = {
  reachable: 'unknown' | 'checking' | 'reachable' | 'unreachable';
  adbState: 'unknown' | 'dry-run' | 'connected' | 'offline' | 'unauthorized' | 'missing-adb' | 'error';
  model?: string;
  product?: string;
  lastChecked?: string;
  message?: string;
};

export type DiscoveryCandidate = {
  id: string;
  ip: string;
  adbPort: number;
  reachable: boolean;
  configuredDisplayId?: string;
  label: string;
  source: 'configured' | 'lan-scan' | 'dry-run-plan';
  detail: string;
};

export type StudioPreset = {
  id: string;
  name: string;
  shortcut: string;
  description: string;
  actions: Array<{
    displayId: string;
    action: string;
    value?: string | number;
  }>;
};

export type StudioStatus = {
  adbEnabled: boolean;
  activeMode: StudioMode;
  displays: TVStatus[];
  actions: StudioActionLog[];
  warnings: string[];
  presets: StudioPreset[];
  shortcuts: Array<{ key: string; label: string; action: string }>;
};
