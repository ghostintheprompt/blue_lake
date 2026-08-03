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
  lastCommand?: string;
};

export type StudioMode = 'capture-one' | 'davinci' | 'client-review' | 'mirror-check';

export type AppWindow = 'none' | 'media' | 'displays' | 'settings' | 'apps' | 'guide';

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

export type StudioStatus = {
  adbEnabled: boolean;
  activeMode: StudioMode;
  displays: TVStatus[];
  actions: StudioActionLog[];
  warnings: string[];
};
