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
  power: boolean;
  volume: number;
  input: string;
  currentApp: string;
};

export type AppWindow = 'none' | 'media' | 'tv' | 'settings' | 'browser' | 'apps' | 'iptv';

export type AppPackage = {
  id: string;
  name: string;
  version: string;
  status: 'Installed' | 'Not Installed' | 'Updates Available';
  icon: string;
  cpu?: string;
  ram?: string;
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

export type IPTVChannel = {
  id: string;
  name: string;
  category: string;
  status: 'LIVE' | 'OFFLINE';
  url: string;
};
