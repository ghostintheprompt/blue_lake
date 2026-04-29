/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, ReactNode, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Tv, 
  Monitor, 
  Settings, 
  Shield, 
  ShieldAlert, 
  Volume2, 
  ArrowLeftRight, 
  Power, 
  X, 
  Maximize2, 
  ChevronRight,
  Clock,
  Wifi,
  Search,
  Play,
  Music,
  Video,
  Info,
  Package,
  Layers,
  Cpu,
  Terminal,
  Activity,
  Zap,
  Box,
  LayoutGrid
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { MediaItem, NetworkInfo, AppWindow, TVStatus, AppPackage, IPTVChannel, SystemHealth, PerformanceMark } from './types';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function App() {
  const [activeWindow, setActiveWindow] = useState<AppWindow>('none');
  const [isPrivacyActive, setIsPrivacyActive] = useState(true);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceMark[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [apps, setApps] = useState<AppPackage[]>([]);
  const [channels, setChannels] = useState<IPTVChannel[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [tvStatus, setTvStatus] = useState<TVStatus>({
    power: true,
    volume: 25,
    input: 'HDMI 1',
    currentApp: 'Fire TV'
  });
  const [time, setTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const netRes = await fetch(`/api/network?admin=${!isPrivacyActive}`);
      const netData = await netRes.json();
      setNetworkInfo(netData);

      const healthRes = await fetch('/api/system/health');
      const healthData = await healthRes.json();
      setSystemHealth(healthData);

      const historyRes = await fetch('/api/system/history');
      const historyData = await historyRes.json();
      setPerformanceHistory(historyData);

      const mediaRes = await fetch('/api/media');
      const mediaData = await mediaRes.json();
      setMedia(mediaData);

      const appRes = await fetch('/api/apps');
      const appData = await appRes.json();
      setApps(appData);

      const channelRes = await fetch('/api/iptv/channels');
      const channelData = await channelRes.json();
      setChannels(channelData);

      const alertsRes = await fetch('/api/alerts');
      const alertsData = await alertsRes.json();
      setAlerts(alertsData);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  }, [isPrivacyActive]);

  useEffect(() => {
    fetchData();
    const poll = setInterval(fetchData, 5000); // Poll health every 5s
    return () => clearInterval(poll);
  }, [fetchData]);

  const controlTV = async (action: string, value?: any) => {
    try {
      await fetch('/api/tv/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, value })
      });
      // Optimistic update
      if (action === 'power') setTvStatus(prev => ({ ...prev, power: !prev.power }));
      if (action === 'volume') setTvStatus(prev => ({ ...prev, volume: value }));
    } catch (err) {
      console.error('Control error:', err);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black font-mono text-emerald-500 selection:bg-emerald-500 selection:text-black">
      {/* CRT Scanline Effect */}
      <div className="crt-scanline" />

      {/* Lab Background Grid */}
      <div className="absolute inset-0 z-0 opacity-10" style={{ 
        backgroundImage: 'radial-gradient(circle at 1px 1px, #10b981 1px, transparent 0)',
        backgroundSize: '40px 40px' 
      }} />

      {/* Top Protocol Bar */}
      <nav className="absolute top-0 left-0 right-0 h-14 border-b border-emerald-500/20 bg-black/80 backdrop-blur-md flex items-center justify-between px-8 z-50 text-[12px] uppercase tracking-[0.3em] font-bold">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 text-emerald-400">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
            <span className="glitch-text font-display italic text-2xl lowercase tracking-tight normal-case pr-4 border-r border-emerald-500/20">blue lake</span>
            <span className="text-emerald-500/40">LAB // VER.2026.04</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-emerald-500/60">
            <button className="hover:text-white transition-colors">THROUGHPUT</button>
            <button className="hover:text-white transition-colors">DEVICES</button>
            <button className="hover:text-white transition-colors">INJECT_CMD</button>
          </nav>
        </div>

        <div className="flex items-center gap-10">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 text-emerald-500/60 font-mono">
              <Activity size={14} />
              <span>{systemHealth?.latency}</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-500/60 font-mono">
              <Zap size={14} />
              <span>{systemHealth?.throughput}</span>
            </div>
            <button 
              onClick={() => setIsPrivacyActive(!isPrivacyActive)}
              className={`flex items-center gap-2 px-5 py-1.5 border transition-all ${isPrivacyActive ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 'border-rose-500/50 text-rose-500 bg-rose-500/10'}`}
            >
              {isPrivacyActive ? <Shield size={14} /> : <ShieldAlert size={14} />}
              <span>SHIELD_{isPrivacyActive ? 'ON' : 'OFF'}</span>
            </button>
            <div className="flex flex-col items-end leading-none">
              <span className="text-white text-[14px]">{time.toLocaleTimeString([], { hour12: false })}</span>
              <span className="text-[10px] opacity-30 mt-1">UTC-4 // GHOST_WIRE</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Lab Interface */}
      <main className="relative z-10 w-full h-full pt-20 p-10 grid grid-cols-12 gap-10 items-start content-start overflow-hidden">
        
        {/* SIDEBAR PROTOCOL */}
        <div className="col-span-12 xl:col-span-3 space-y-10 h-full overflow-y-auto pr-2 custom-scrollbar">
          
          {/* SYSTEM MASTER CARD */}
          <div className="lab-card space-y-10 bg-black/40 p-6">
            <div className="flex items-center justify-between border-b border-emerald-500/10 pb-6">
              <h2 className="text-[13px] font-bold tracking-[0.4em] opacity-40 uppercase">MASTER_PROTOCOL</h2>
              <Monitor size={20} className="text-emerald-400" />
            </div>

            <div className="space-y-8">
              <div className="flex items-center justify-between group">
                <div className="space-y-2">
                  <span className="text-[12px] opacity-60 font-black uppercase tracking-widest block">SYSTEM_POWER</span>
                  <p className="text-[11px] opacity-30 italic">Target: SYSTEM_CORE_UNIT</p>
                </div>
                <button 
                  onClick={() => controlTV('power')}
                  className={`w-16 h-8 border p-1 transition-all flex items-center ${tvStatus.power ? 'border-emerald-400 bg-emerald-400/20' : 'border-white/10 bg-white/5'}`}
                >
                  <div className={`h-full bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.8)] transition-all ${tvStatus.power ? 'w-full' : 'w-0'}`} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-[12px] font-bold uppercase tracking-[0.2em]">
                  <span className="opacity-40">SIGNAL_PRESSURE</span>
                  <span className="text-emerald-400">{tvStatus.volume}%</span>
                </div>
                <div className="h-8 border border-emerald-500/10 p-1 relative flex items-center bg-emerald-500/5">
                   <div className="h-full bg-emerald-400/80 transition-all duration-300" style={{ width: `${tvStatus.volume}%` }} />
                   <div className="absolute inset-0 flex justify-between px-2 pointer-events-none opacity-20">
                      {Array.from({length: 12}).map((_,i) => <div key={i} className="w-[1px] h-full bg-emerald-500" />)}
                   </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-[11px] font-bold tracking-[0.2em] opacity-30 uppercase">THROUGHPUT_HISTOGRAM</h3>
                <div className="h-32 w-full">
                   <PerformanceGraph data={performanceHistory} />
                </div>
              </div>
            </div>
          </div>

          {/* TELEMETRY NODES */}
          <div className="lab-card space-y-6 p-6">
            <h2 className="text-[13px] font-bold tracking-[0.4em] opacity-40 uppercase">TELEMETRY_DUMP</h2>
            <div className="space-y-4 text-[12px] font-mono leading-relaxed">
              <div className="lab-row">
                <span className="opacity-30">ENCRYPTED_IP:</span> 
                <span className="text-emerald-300">{networkInfo?.ip}</span>
              </div>
              <div className="lab-row">
                <span className="opacity-30">SOC_ALERTS:</span> 
                <span className={alerts.length > 0 ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}>{alerts.length} ACTIVE</span>
              </div>
              {alerts.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-emerald-500/10 max-h-32 overflow-y-auto custom-scrollbar">
                  {alerts.slice(0, 5).map(alert => (
                    <div key={alert.id} className="text-[10px] text-rose-400/80 italic leading-tight pb-1 border-b border-rose-500/5 last:border-0">
                      !! {alert.name}
                    </div>
                  ))}
                </div>
              )}
              <div className="lab-row">
                <span className="opacity-30">CPU_LAB_TEMP:</span> 
                <span className="text-amber-500">{systemHealth?.cpu_temp}</span>
              </div>
              <div className="lab-row">
                <span className="opacity-30">RAM_RESERVE:</span> 
                <span>{systemHealth?.ram_usage}</span>
              </div>
              <div className="lab-row">
                <span className="opacity-30">UPTIME_CLOCK:</span> 
                <span className="text-sky-400">{systemHealth?.uptime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* PRIMARY LAB WORKSPACE */}
        <div className="col-span-12 xl:col-span-9 h-full flex flex-col gap-10">
          
          <div className="flex-1 grid grid-cols-12 gap-10 overflow-hidden">
            {/* INJECTION CONSOLE */}
            <div className="col-span-12 lg:col-span-8 lab-card flex flex-col p-0 border-emerald-500/30">
              <div className="p-6 border-b border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Terminal size={20} className="text-emerald-400" />
                  <span className="text-[14px] font-black tracking-[0.3em] uppercase">Blue Lake // System Console</span>
                </div>
                <div className="flex items-center gap-4 text-[12px] opacity-40 font-bold">
                  <span className="animate-pulse">● LIVE_FEED</span>
                  <div className="h-5 w-[1px] bg-emerald-500/20" />
                  <span>X.808_SYS</span>
                </div>
              </div>
              
              <AIConsole onAction={() => fetchData()} />
            </div>

            {/* PROTOCOL SELECTOR (GHOST STYLE) */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
              <h2 className="text-[13px] font-bold tracking-[0.4em] opacity-40 px-2 uppercase">Core Protocols</h2>
              
              <ProtocolButton 
                icon={<Tv size={40} />} 
                title="GHOST_IPTV" 
                desc="Intercept global node streams." 
                onClick={() => setActiveWindow('iptv')} 
              />
              
              <ProtocolButton 
                icon={<Package size={40} />} 
                title="APP_INJECTOR" 
                desc="Deploy Kodi & third-party pkgs." 
                onClick={() => setActiveWindow('apps')} 
              />
              
              <ProtocolButton 
                icon={<Layers size={40} />} 
                title="MEDIA_VAULT" 
                desc="Archive of independent assets." 
                onClick={() => setActiveWindow('media')} 
              />

              <div className="flex-1 lab-card bg-emerald-500/5 flex flex-col items-center justify-center text-center p-10 space-y-6 border-dashed border-emerald-500/10">
                 <Cpu size={48} className="text-emerald-500/20" />
                 <p className="text-[11px] opacity-30 italic leading-relaxed uppercase tracking-widest">System standby. Waiting for AI Core to synchronize with hardware Unit.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* SYSTEM DOCK */}
      <footer className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="flex items-center gap-3 p-2 border border-emerald-500/20 bg-black/90 backdrop-blur-3xl shadow-[0_0_50px_rgba(16,185,129,0.1)]"
        >
          <DockIcon icon={<LayoutGrid size={18} />} active={activeWindow === 'none'} onClick={() => setActiveWindow('none')} />
          <div className="w-[1px] h-6 bg-emerald-500/20 mx-1" />
          <DockIcon icon={<Tv size={18} />} active={activeWindow === 'iptv'} onClick={() => setActiveWindow('iptv')} />
          <DockIcon icon={<Package size={18} />} active={activeWindow === 'apps'} onClick={() => setActiveWindow('apps')} />
          <DockIcon icon={<Layers size={18} />} active={activeWindow === 'media'} onClick={() => setActiveWindow('media')} />
          <DockIcon icon={<Settings size={18} />} active={activeWindow === 'settings'} onClick={() => setActiveWindow('settings')} />
          <div className="w-[1px] h-6 bg-emerald-500/20 mx-1" />
          <button 
            onClick={() => setIsPrivacyActive(!isPrivacyActive)}
            className={`p-2 transition-colors ${isPrivacyActive ? 'text-emerald-500' : 'text-rose-500'}`}
          >
            <Shield size={18} />
          </button>
        </motion.div>
      </footer>

      {/* OVERLAY SYSTEM */}
      <AnimatePresence>
        {activeWindow === 'media' && (
          <LabOverlay title="MEDIA_VAULT" onClose={() => setActiveWindow('none')}>
            <MediaCenter media={media} />
          </LabOverlay>
        )}
        {activeWindow === 'apps' && (
          <LabOverlay title="APP_INJECTOR" onClose={() => setActiveWindow('none')}>
            <AppHub apps={apps} />
          </LabOverlay>
        )}
        {activeWindow === 'iptv' && (
          <LabOverlay title="IPTV_NODES" onClose={() => setActiveWindow('none')}>
            <IPTVCenter channels={channels} />
          </LabOverlay>
        )}
        {activeWindow === 'settings' && (
          <LabOverlay title="LOCAL_PROTOCOLS" onClose={() => setActiveWindow('none')}>
            <div className="p-20 text-center max-w-2xl mx-auto space-y-8">
              <Cpu size={60} className="mx-auto text-emerald-500/40" />
              <h2 className="text-3xl font-black italic tracking-tighter">OSINT COMMAND CENTER</h2>
              <p className="text-sm border-l-2 border-emerald-500/20 pl-6 text-left opacity-60 leading-relaxed italic">
                Blue Lake is an independent editorial lab interface. Configure your network proxies, ADB injection points, and AI system instructions here. This system follows the ghostintheprompt.com core directives.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button className="lab-card hover:bg-emerald-500/10 text-left transition-all">
                  <p className="text-[10px] font-bold">RE-KEY_SECURITY</p>
                  <p className="text-[9px] opacity-40">Update encryption strings.</p>
                </button>
                <button className="lab-card hover:bg-emerald-500/10 text-left transition-all">
                  <p className="text-[10px] font-bold">WIPE_TRAILS</p>
                  <p className="text-[9px] opacity-40">Clear system diagnostic logs.</p>
                </button>
              </div>
            </div>
          </LabOverlay>
        )}
      </AnimatePresence>
    </div>
  );
}

function DockIcon({ icon, active, onClick }: { icon: ReactNode, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`p-2 transition-all hover:bg-emerald-500/10 ${active ? 'text-emerald-400 bg-emerald-500/10 border-b-2 border-emerald-500' : 'text-emerald-500/40 hover:text-emerald-500'}`}
    >
      {icon}
    </button>
  );
}

function ProtocolButton({ icon, title, desc, onClick }: { icon: ReactNode, title: string, desc: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="lab-card group hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-8 text-left border-emerald-500/10 hover:border-emerald-500/40 bg-emerald-500/[0.02] p-6">
      <div className="text-emerald-500/20 group-hover:text-emerald-400 group-hover:drop-shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all">
        {icon}
      </div>
      <div className="flex-1 space-y-2">
        <p className="text-[15px] font-black italic tracking-[0.2em] uppercase text-white group-hover:text-emerald-400 transition-colors">{title}</p>
        <p className="text-[11px] opacity-30 font-mono tracking-widest uppercase">{desc}</p>
      </div>
      <ChevronRight size={20} className="opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
    </button>
  );
}

function PerformanceGraph({ data }: { data: PerformanceMark[] }) {
  if (!data?.length) return <div className="h-full w-full bg-emerald-500/5 border border-emerald-500/10" />;
  
  const maxBitrate = Math.max(...data.map(d => d.bitrate));
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (d.bitrate / maxBitrate) * 80;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="h-full w-full relative">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
        <polyline
          fill="none"
          stroke="#10b981"
          strokeWidth="0.5"
          points={points}
          className="opacity-40"
        />
        <path
          d={`M 0,100 L ${points} L 100,100 Z`}
          fill="url(#gradient)"
          className="opacity-10"
        />
        <defs>
          <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>
      {/* Dynamic Data Points */}
      <div className="absolute top-0 right-0 p-2 text-[8px] opacity-30 font-mono">
         PKT_LOSS: 0.002%
      </div>
    </div>
  );
}

function LabOverlay({ title, children, onClose }: { title: string, children: ReactNode, onClose: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
      animate={{ opacity: 1, backdropFilter: 'blur(10px)' }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 bg-black/80 p-12"
    >
      <div className="w-full h-full border border-emerald-500/20 bg-black flex flex-col relative overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)]">
        <div className="h-12 border-b border-emerald-500/20 bg-emerald-500/5 px-6 flex items-center justify-between">
          <div className="flex gap-2">
            <div className="w-3 h-3 border border-rose-500/50 cursor-pointer" onClick={onClose} />
            <div className="w-3 h-3 border border-emerald-500/20" />
            <div className="w-3 h-3 border border-emerald-500/20" />
          </div>
          <span className="text-[11px] font-black tracking-[0.4em] text-emerald-500/60 font-mono italic">{title}</span>
          <button onClick={onClose} className="text-emerald-500/40 hover:text-emerald-500 uppercase text-[10px] tracking-widest font-bold">
            [CLOSE]
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-[linear-gradient(rgba(16,185,129,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.02)_1px,transparent_1px)] bg-[size:100px_100px]">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

function MediaCenter({ media }: { media: MediaItem[] }) {
  return (
    <div className="p-16 space-y-16 max-w-7xl mx-auto">
      <div className="space-y-6">
        <h1 className="editorial-header text-white text-7xl">The_Lake_Archive</h1>
        <p className="text-[13px] opacity-30 uppercase tracking-[0.5em] font-mono pl-1">Node storage for independent editorial assets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {media.map((item) => (
          <div key={item.id} className="lab-card group hover:bg-emerald-500/5 transition-all flex items-center gap-10 p-8">
            <div className="w-24 h-24 border border-emerald-500/20 flex items-center justify-center text-emerald-500/40 group-hover:text-emerald-500 transition-all group-hover:border-emerald-500/40 group-hover:scale-105">
              {item.type === 'video' ? <Video size={48} strokeWidth={1} /> : <Music size={48} strokeWidth={1} />}
            </div>
            <div className="flex-1 space-y-3">
              <p className="text-lg font-black text-white italic tracking-widest">{item.name}</p>
              <div className="flex items-center gap-6 text-[11px] opacity-40 uppercase tracking-widest font-mono italic">
                <span className="bg-emerald-500/10 px-3 py-1">{item.type}</span>
                <span>{(item.size / 1024 / 1024).toFixed(1)} MB</span>
              </div>
            </div>
            <button className="lab-button opacity-0 group-hover:opacity-100 transition-opacity">ACQUIRE</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AppHub({ apps }: { apps: AppPackage[] }) {
  const [installing, setInstalling] = useState<string | null>(null);

  const injectApp = async (id: string) => {
    setInstalling(id);
    await fetch('/api/apps/install', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appId: id }) });
    setTimeout(() => {
      setInstalling(null);
    }, 2000);
  };

  return (
    <div className="p-16 space-y-20 max-w-7xl mx-auto">
       <div className="space-y-8">
        <h1 className="editorial-header text-white uppercase italic text-7xl">Package_Injector</h1>
        <p className="text-[13px] opacity-30 uppercase tracking-[0.5em] font-mono pl-1">Force injection of Kodi & IPTV protocols onto target Unit.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {apps.map((app) => (
          <div key={app.id} className="lab-card space-y-10 p-10 hover:bg-emerald-500/5 transition-all">
            <div className="flex items-center gap-8">
              <div className="w-20 h-20 border border-emerald-500/20 flex items-center justify-center bg-emerald-500/5 text-emerald-400">
                {app.icon === 'Box' ? <Box size={32} /> : app.icon === 'Tv' ? <Tv size={32} /> : <Play size={32} />}
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-2xl font-black text-white italic tracking-tighter uppercase">{app.name}</p>
                <div className="flex gap-6">
                  <p className="text-[11px] opacity-40 italic font-bold">STDLIB_V. {app.version}</p>
                  <p className="text-[11px] text-emerald-500/60 font-bold uppercase tracking-widest">CPU: {app.cpu}</p>
                </div>
              </div>
              <div className={`px-4 py-1.5 text-[10px] uppercase tracking-[0.3em] font-black border transition-all ${app.status === 'Installed' ? 'border-emerald-500/40 text-emerald-500 bg-emerald-500/5' : 'border-amber-500/40 text-amber-500 bg-amber-500/5'}`}>
                {app.status}
              </div>
            </div>
            
            <button 
              onClick={() => injectApp(app.id)}
              disabled={installing === app.id}
              className={`w-full lab-button h-16 flex items-center justify-center text-sm tracking-[0.5em] ${installing === app.id ? 'opacity-50 cursor-wait' : ''}`}
            >
              {installing === app.id ? 'INJECTING_PAYLOAD...' : '[ INJECT_PACKAGE ]'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function IPTVCenter({ channels }: { channels: IPTVChannel[] }) {
  return (
    <div className="p-16 space-y-20 max-w-7xl mx-auto">
      <div className="space-y-8">
        <h1 className="editorial-header text-white uppercase italic text-7xl">Feed_Nodes</h1>
        <p className="text-[13px] opacity-30 uppercase tracking-[0.5em] font-mono pl-1">Synchronized OSINT data streams from the global grid.</p>
      </div>

      <div className="space-y-2">
        {channels.map((ch) => (
          <div key={ch.id} className="lab-row p-8 px-10 group">
            <div className="flex items-center gap-10">
              <div className={`w-4 h-4 rounded-full ${ch.status === 'LIVE' ? 'bg-emerald-500 animate-[pulse_1s_infinite]' : 'bg-rose-500/40 opacity-50'}`} />
              <div className="space-y-2">
                <p className="text-xl font-black text-white tracking-[0.2em] italic uppercase group-hover:text-emerald-400 transition-colors">{ch.name}</p>
                <p className="text-[11px] opacity-30 uppercase tracking-[0.4em] font-bold">{ch.category} // GRID_ID: {ch.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-10">
               <span className="text-[12px] text-emerald-500/30 italic font-mono hidden xl:inline lowercase tracking-widest">{ch.url}</span>
               <button className="lab-button min-w-[180px] h-12" disabled={ch.status === 'OFFLINE'}>
                 {ch.status === 'LIVE' ? 'ACQUIRE_FEED' : 'NODE_OFFLINE'}
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIConsole({ onAction }: { onAction: () => void }) {
  const [value, setValue] = useState("");
  const [logs, setLogs] = useState<{ id: number, text: string, type: 'in' | 'out' | 'sys' }[]>([
    { id: 1, text: "System baseline established.", type: 'sys' },
    { id: 2, text: "Ghost in the prompt directive active.", type: 'sys' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    const newLogs = [...logs, { id: Date.now(), text: value, type: 'in' as const }];
    setLogs(newLogs);
    setValue("");
    setIsTyping(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are the Blue Lake System AI, an independent editorial lab agent derived from ghostintheprompt.com. 
        A user has sent you this command/input: "${value}".
        Respond in a cool, hacker-lab, technical, slightly cynical but highly capable tone. 
        If they ask to "install" something, say you are injecting the packages now. 
        Be professional but with that independent editorial system vibe. Keep it concise (max 3 lines).`,
      });

      const reply = response.text || "System silence. Check buffer.";
      setLogs(prev => [...prev, { id: Date.now() + 1, text: reply, type: 'out' }]);

      // Check for actions in text
      if (value.toLowerCase().includes('sync') || value.toLowerCase().includes('refresh')) {
        onAction();
      }

      if (value.toLowerCase().startsWith('exec s')) {
        const scenario = value.toLowerCase().split(' ')[1];
        try {
          const res = await fetch(`/api/protocols/${scenario}`, { method: 'POST' });
          const data = await res.json();
          setLogs(prev => [...prev, { 
            id: Date.now() + 5, 
            text: `[RESTORED_LOGIC] ${scenario.toUpperCase()} executed. ${JSON.stringify(data.message || data.data || data).slice(0, 100)}...`, 
            type: 'sys' 
          }]);
          onAction(); // Refresh data/alerts
        } catch (e) {
          setLogs(prev => [...prev, { id: Date.now() + 6, text: `[RESTORE_ERROR] Failed to execute ${scenario}`, type: 'sys' }]);
        }
      }

      if (value.toLowerCase().includes('install') || value.toLowerCase().includes('inject')) {
         await fetch('/api/ai/inject', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: value }) });
         setLogs(prev => [...prev, { id: Date.now() + 2, text: "AI Core successfully injected system patches.", type: 'sys' }]);
      }

    } catch (e) {
      setLogs(prev => [...prev, { id: Date.now() + 3, text: "Buffer overrun. AI offline.", type: 'sys' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-8 space-y-6 font-mono text-[13px] leading-relaxed">
        {logs.map((log) => (
          <div key={log.id} className={`flex gap-4 ${log.type === 'in' ? 'text-white' : log.type === 'sys' ? 'text-emerald-500/40 italic' : 'text-emerald-400'}`}>
            <span className="opacity-40 min-w-[80px] font-bold">{log.type === 'in' ? 'USR>' : log.type === 'sys' ? 'SYS*' : 'GHOST_AI>'}</span>
            <span className="flex-1 whitespace-pre-wrap">{log.text}</span>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-4 text-emerald-400 animate-pulse">
            <span className="opacity-40 min-w-[80px] font-bold">GHOST_AI&gt;</span>
            <span>Decrypting system buffer...</span>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="p-6 border-t border-emerald-500/10 bg-emerald-500/5 relative">
        <div className="flex items-center gap-4">
          <ChevronRight size={20} className="text-emerald-500 animate-pulse" />
          <input 
            type="text" 
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="INJECT COMMAND..."
            className="flex-1 bg-transparent border-none outline-none text-white text-[13px] font-bold placeholder:text-emerald-500/20"
          />
        </div>
      </form>
    </>
  );
}
