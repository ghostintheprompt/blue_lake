/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  Cable,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clapperboard,
  Eye,
  ExternalLink,
  Home,
  Info,
  Layers,
  LayoutGrid,
  Monitor,
  Package,
  Play,
  Power,
  RefreshCw,
  Settings,
  Shield,
  ShieldAlert,
  SlidersHorizontal,
  Tv,
  Video,
  Volume2,
  VolumeX,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import {
  AppPackage,
  AppWindow,
  MediaItem,
  NetworkInfo,
  PerformanceMark,
  StudioActionLog,
  StudioMode,
  StudioStatus,
  SystemHealth,
  TVStatus,
} from './types';

const modeDetails: Record<StudioMode, { title: string; label: string; body: string; move: string }> = {
  'capture-one': {
    title: 'Capture One',
    label: 'Photo tether',
    body: 'Use TV A as the client proofing viewer while the calibrated desk display remains your color decision surface.',
    move: 'Wake both TVs, return home, mute distractions.',
  },
  davinci: {
    title: 'DaVinci',
    label: 'Video review',
    body: 'Use TV B for playback/reference checks while Resolve keeps the grading path on a proper monitor or direct output.',
    move: 'Wake both TVs, return home, mute room audio.',
  },
  'client-review': {
    title: 'Client Review',
    label: 'Room share',
    body: 'Open the room for proofing, selects, reels, or a local web gallery without hunting for remotes.',
    move: 'Wake displays and prepare launch targets.',
  },
  'mirror-check': {
    title: 'Mirror Check',
    label: 'Signal sanity',
    body: 'Quickly verify both screens are reachable before a client walks in or a tether session starts.',
    move: 'Wake displays and park them at Home.',
  },
};

export default function App() {
  const [activeWindow, setActiveWindow] = useState<AppWindow>('none');
  const [isPrivacyActive, setIsPrivacyActive] = useState(true);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceMark[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [apps, setApps] = useState<AppPackage[]>([]);
  const [displays, setDisplays] = useState<TVStatus[]>([]);
  const [actions, setActions] = useState<StudioActionLog[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [adbEnabled, setAdbEnabled] = useState(false);
  const [activeMode, setActiveMode] = useState<StudioMode>('capture-one');
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const absorbStudioStatus = useCallback((status: Partial<StudioStatus>) => {
    if (typeof status.adbEnabled === 'boolean') setAdbEnabled(status.adbEnabled);
    if (status.activeMode) setActiveMode(status.activeMode);
    if (status.displays) setDisplays(status.displays);
    if (status.actions) setActions(status.actions);
    if (status.warnings) setWarnings(status.warnings);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [studioRes, netRes, healthRes, historyRes, mediaRes, appRes] = await Promise.all([
        fetch('/api/studio/status'),
        fetch(`/api/network?admin=${!isPrivacyActive}`),
        fetch('/api/system/health'),
        fetch('/api/system/history'),
        fetch('/api/media'),
        fetch('/api/apps'),
      ]);

      absorbStudioStatus(await studioRes.json());
      setNetworkInfo(await netRes.json());
      setSystemHealth(await healthRes.json());
      setPerformanceHistory(await historyRes.json());
      setMedia(await mediaRes.json());
      setApps(await appRes.json());
    } catch (err) {
      console.error('Fetch error:', err);
    }
  }, [absorbStudioStatus, isPrivacyActive]);

  useEffect(() => {
    fetchData();
    const poll = setInterval(fetchData, 5000);
    return () => clearInterval(poll);
  }, [fetchData]);

  const controlDisplay = async (displayId: string, action: string, value?: string | number) => {
    const busyId = `${displayId}:${action}`;
    setBusyAction(busyId);
    try {
      const response = await fetch(`/api/studio/display/${displayId}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, value }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Display command failed.');
      absorbStudioStatus(data);
    } catch (err) {
      console.error('Display control error:', err);
    } finally {
      setBusyAction(null);
    }
  };

  const applyMode = async (mode: StudioMode) => {
    setBusyAction(`mode:${mode}`);
    try {
      const response = await fetch('/api/studio/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Studio mode failed.');
      absorbStudioStatus(data);
    } catch (err) {
      console.error('Mode error:', err);
    } finally {
      setBusyAction(null);
    }
  };

  const launchApp = async (displayId: string, app: AppPackage) => {
    if (!app.packageName) return;
    setBusyAction(`${displayId}:${app.id}`);
    try {
      const response = await fetch('/api/apps/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayId,
          packageName: app.packageName,
          url: app.packageName.startsWith('http') ? app.packageName : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Launch failed.');
      absorbStudioStatus(data);
    } catch (err) {
      console.error('Launch error:', err);
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050706] font-sans text-slate-100 selection:bg-emerald-400 selection:text-black">
      <div className="studio-scanline" />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.12),transparent_26%),linear-gradient(135deg,rgba(59,130,246,0.08),transparent_38%)]" />

      <nav className="relative z-20 border-b border-emerald-400/15 bg-black/80 px-5 py-4 backdrop-blur-xl md:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
              <Monitor size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase text-white">Blue Lake Studio</h1>
              <p className="text-xs text-emerald-200/55">Local Fire TV monitor control for photo and video rooms</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <StatusPill icon={<Wifi size={14} />} label={networkInfo?.ip || 'masked'} tone="neutral" />
            <StatusPill icon={<Zap size={14} />} label={systemHealth?.latency || 'polling'} tone="neutral" />
            <StatusPill
              icon={adbEnabled ? <AlertTriangle size={14} /> : <Shield size={14} />}
              label={adbEnabled ? 'ADB armed local' : 'ADB dry run'}
              tone={adbEnabled ? 'warn' : 'safe'}
            />
            <button
              onClick={() => setIsPrivacyActive((value) => !value)}
              className={`studio-button h-9 ${isPrivacyActive ? 'text-emerald-300' : 'text-amber-300'}`}
              title="Toggle local network detail masking"
            >
              {isPrivacyActive ? <Shield size={16} /> : <ShieldAlert size={16} />}
              {isPrivacyActive ? 'Privacy on' : 'Local detail'}
            </button>
            <div className="font-mono text-slate-400">{time.toLocaleTimeString([], { hour12: false })}</div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 grid min-h-[calc(100vh-74px)] grid-cols-12 gap-5 overflow-y-auto p-5 md:p-8">
        <aside className="col-span-12 space-y-5 xl:col-span-4 2xl:col-span-3">
          <WarningStrip adbEnabled={adbEnabled} warnings={warnings} />

          <section className="studio-card p-5">
            <div className="mb-5 flex items-center justify-between">
              <SectionTitle icon={<Tv size={18} />} label="Displays" title="Studio Monitors" />
              <button onClick={fetchData} className="icon-button" title="Refresh studio status">
                <RefreshCw size={16} />
              </button>
            </div>
            <div className="space-y-4">
              {displays.map((display) => (
                <div key={display.id}>
                  <DisplayCard
                    display={display}
                    busyAction={busyAction}
                    onControl={controlDisplay}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="studio-card p-5">
            <SectionTitle icon={<Activity size={18} />} label="Room" title="Signal Pulse" />
            <div className="mt-5 h-28">
              <PerformanceGraph data={performanceHistory} />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
              <Metric label="Throughput" value={systemHealth?.throughput || 'waiting'} />
              <Metric label="Memory" value={systemHealth?.ram_usage || 'waiting'} />
            </div>
          </section>
        </aside>

        <section className="col-span-12 space-y-5 xl:col-span-8 2xl:col-span-9">
          <section className="studio-card p-5 md:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <SectionTitle
                icon={<SlidersHorizontal size={18} />}
                label="Mode"
                title={modeDetails[activeMode].title}
                caption={modeDetails[activeMode].body}
              />
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setActiveWindow('guide')} className="studio-button h-10" title="Open setup guide">
                  <Info size={16} />
                  Setup
                </button>
                <button onClick={() => setActiveWindow('apps')} className="studio-button h-10" title="Open app launcher">
                  <Package size={16} />
                  Apps
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-4">
              <ModeButton
                mode="capture-one"
                activeMode={activeMode}
                busy={busyAction === 'mode:capture-one'}
                icon={<Camera size={22} />}
                onClick={applyMode}
              />
              <ModeButton
                mode="davinci"
                activeMode={activeMode}
                busy={busyAction === 'mode:davinci'}
                icon={<Clapperboard size={22} />}
                onClick={applyMode}
              />
              <ModeButton
                mode="client-review"
                activeMode={activeMode}
                busy={busyAction === 'mode:client-review'}
                icon={<Eye size={22} />}
                onClick={applyMode}
              />
              <ModeButton
                mode="mirror-check"
                activeMode={activeMode}
                busy={busyAction === 'mode:mirror-check'}
                icon={<Cable size={22} />}
                onClick={applyMode}
              />
            </div>
          </section>

          <div className="grid grid-cols-1 gap-5 2xl:grid-cols-2">
            <section className="studio-card p-5 md:p-6">
              <SectionTitle icon={<Monitor size={18} />} label="Workflow" title="Best Signal Path" />
              <div className="mt-6 space-y-4">
                <WorkflowStep
                  icon={<Camera size={18} />}
                  title="Capture One"
                  body="Use Capture One dual monitor: calibrated main display for edits, TV A for client proofing or large viewer."
                />
                <WorkflowStep
                  icon={<Clapperboard size={18} />}
                  title="DaVinci Resolve"
                  body="Use direct HDMI, UltraStudio, DeckLink, or a calibrated reference monitor for judging color. Fire TV is for room review."
                />
                <WorkflowStep
                  icon={<Tv size={18} />}
                  title="Fire TV role"
                  body="Blue Lake wakes displays, launches receivers, handles volume, and keeps the room ready without touching your grading pipeline."
                />
              </div>
            </section>

            <section className="studio-card p-5 md:p-6">
              <SectionTitle icon={<Activity size={18} />} label="Log" title="Recent Display Actions" />
              <div className="mt-6 max-h-80 space-y-3 overflow-y-auto pr-2">
                {actions.length === 0 && (
                  <p className="text-sm text-slate-500">No actions yet. Wake a display or apply a studio mode.</p>
                )}
                {actions.map((action) => (
                  <div key={action.id} className="border border-white/10 bg-white/[0.03] p-3">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-bold uppercase text-emerald-300">{action.displayId}</span>
                      <span className="font-mono text-slate-500">{new Date(action.timestamp).toLocaleTimeString([], { hour12: false })}</span>
                    </div>
                    <p className="mt-2 text-sm text-white">{action.action}</p>
                    <p className="mt-1 break-all font-mono text-xs text-slate-500">{action.detail}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="studio-card p-5 md:p-6">
            <SectionTitle icon={<Layers size={18} />} label="Library" title="Local Media Shelf" />
            <MediaStrip media={media} onOpen={() => setActiveWindow('media')} />
          </section>
        </section>
      </main>

      <footer className="fixed bottom-5 left-1/2 z-30 -translate-x-1/2">
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          className="flex items-center gap-2 border border-emerald-400/20 bg-black/90 p-2 shadow-2xl backdrop-blur-2xl"
        >
          <DockIcon icon={<LayoutGrid size={18} />} active={activeWindow === 'none'} onClick={() => setActiveWindow('none')} label="Home" />
          <DockIcon icon={<Tv size={18} />} active={activeWindow === 'displays'} onClick={() => setActiveWindow('displays')} label="Displays" />
          <DockIcon icon={<Package size={18} />} active={activeWindow === 'apps'} onClick={() => setActiveWindow('apps')} label="Apps" />
          <DockIcon icon={<Layers size={18} />} active={activeWindow === 'media'} onClick={() => setActiveWindow('media')} label="Media" />
          <DockIcon icon={<Info size={18} />} active={activeWindow === 'guide'} onClick={() => setActiveWindow('guide')} label="Guide" />
          <DockIcon icon={<Settings size={18} />} active={activeWindow === 'settings'} onClick={() => setActiveWindow('settings')} label="Settings" />
        </motion.div>
      </footer>

      <AnimatePresence>
        {activeWindow === 'media' && (
          <StudioOverlay title="Local Media Shelf" onClose={() => setActiveWindow('none')}>
            <MediaCenter media={media} />
          </StudioOverlay>
        )}
        {activeWindow === 'displays' && (
          <StudioOverlay title="Display Control" onClose={() => setActiveWindow('none')}>
            <DisplayConsole displays={displays} busyAction={busyAction} onControl={controlDisplay} />
          </StudioOverlay>
        )}
        {activeWindow === 'apps' && (
          <StudioOverlay title="App Launcher" onClose={() => setActiveWindow('none')}>
            <AppLauncher apps={apps} displays={displays} busyAction={busyAction} onLaunch={launchApp} />
          </StudioOverlay>
        )}
        {activeWindow === 'guide' && (
          <StudioOverlay title="Studio Setup Guide" onClose={() => setActiveWindow('none')}>
            <SetupGuide adbEnabled={adbEnabled} />
          </StudioOverlay>
        )}
        {activeWindow === 'settings' && (
          <StudioOverlay title="Local Configuration" onClose={() => setActiveWindow('none')}>
            <SettingsPanel networkInfo={networkInfo} adbEnabled={adbEnabled} />
          </StudioOverlay>
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionTitle({ icon, label, title, caption }: { icon: ReactNode; label: string; title: string; caption?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 flex h-8 w-8 items-center justify-center border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold uppercase text-emerald-300/60">{label}</p>
        <h2 className="text-lg font-black uppercase text-white">{title}</h2>
        {caption && <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">{caption}</p>}
      </div>
    </div>
  );
}

function StatusPill({ icon, label, tone }: { icon: ReactNode; label: string; tone: 'safe' | 'warn' | 'neutral' }) {
  const toneClass = tone === 'safe'
    ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200'
    : tone === 'warn'
      ? 'border-amber-400/30 bg-amber-400/10 text-amber-200'
      : 'border-white/10 bg-white/[0.04] text-slate-300';
  return (
    <div className={`flex h-9 items-center gap-2 border px-3 ${toneClass}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

function WarningStrip({ adbEnabled, warnings }: { adbEnabled: boolean; warnings: string[] }) {
  return (
    <section className={`border p-4 ${adbEnabled ? 'border-amber-400/30 bg-amber-400/10' : 'border-emerald-400/20 bg-emerald-400/10'}`}>
      <div className="flex items-start gap-3">
        {adbEnabled ? <AlertTriangle className="mt-0.5 text-amber-300" size={18} /> : <Shield className="mt-0.5 text-emerald-300" size={18} />}
        <div className="space-y-2">
          <p className="text-sm font-bold uppercase text-white">{adbEnabled ? 'Armed local control' : 'Dry-run studio control'}</p>
          <p className="text-sm leading-6 text-slate-300">
            {adbEnabled
              ? 'Buttons send real ADB commands to configured Fire TVs on your local network.'
              : 'Buttons preview the exact ADB commands. Enable real control only after your TV IPs are correct.'}
          </p>
          {warnings.slice(0, 2).map((warning) => (
            <p key={warning} className="text-xs leading-5 text-slate-500">{warning}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

function DisplayCard({ display, busyAction, onControl }: {
  display: TVStatus;
  busyAction: string | null;
  onControl: (displayId: string, action: string, value?: string | number) => void;
}) {
  const busy = (action: string) => busyAction === `${display.id}:${action}`;
  return (
    <div className="border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {display.connected ? <CheckCircle2 size={16} className="text-emerald-300" /> : <AlertTriangle size={16} className="text-amber-300" />}
            <h3 className="font-black uppercase text-white">{display.name}</h3>
          </div>
          <p className="mt-1 text-sm text-slate-400">{display.role}</p>
          <p className="mt-2 font-mono text-xs text-slate-500">{display.ip}:{display.adbPort} | {display.input}</p>
        </div>
        <div className={`px-2 py-1 text-xs font-bold uppercase ${display.power ? 'bg-emerald-400/10 text-emerald-200' : 'bg-slate-500/10 text-slate-400'}`}>
          {display.power ? 'awake' : 'sleep'}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        <MiniControl icon={<Wifi size={15} />} label="Connect" busy={busy('connect')} onClick={() => onControl(display.id, 'connect')} />
        <MiniControl icon={<Power size={15} />} label="Wake" busy={busy('wake')} onClick={() => onControl(display.id, 'wake')} />
        <MiniControl icon={<Home size={15} />} label="Home" busy={busy('home')} onClick={() => onControl(display.id, 'home')} />
        <MiniControl icon={<VolumeX size={15} />} label="Mute" busy={busy('mute')} onClick={() => onControl(display.id, 'mute')} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
        <button className="icon-button" title="Volume down" onClick={() => onControl(display.id, 'volume_down')} disabled={busy('volume_down')}>
          <Volume2 size={15} />
        </button>
        <div className="h-2 flex-1 bg-white/10">
          <div className="h-full bg-emerald-300" style={{ width: `${display.volume}%` }} />
        </div>
        <button className="icon-button" title="Volume up" onClick={() => onControl(display.id, 'volume_up')} disabled={busy('volume_up')}>
          <Volume2 size={15} />
        </button>
        <span className="w-9 text-right font-mono text-xs text-slate-500">{display.volume}</span>
      </div>

      {display.lastCommand && (
        <p className="mt-3 break-all font-mono text-xs text-slate-600">{display.lastCommand}</p>
      )}
    </div>
  );
}

function MiniControl({ icon, label, busy, onClick }: { icon: ReactNode; label: string; busy: boolean; onClick: () => void }) {
  return (
    <button className="studio-button h-10 justify-center text-xs" title={label} disabled={busy} onClick={onClick}>
      {busy ? <RefreshCw size={15} className="animate-spin" /> : icon}
      <span className="hidden 2xl:inline">{label}</span>
    </button>
  );
}

function ModeButton({ mode, activeMode, busy, icon, onClick }: {
  mode: StudioMode;
  activeMode: StudioMode;
  busy: boolean;
  icon: ReactNode;
  onClick: (mode: StudioMode) => void;
}) {
  const details = modeDetails[mode];
  const active = activeMode === mode;
  return (
    <button
      onClick={() => onClick(mode)}
      disabled={busy}
      className={`group border p-4 text-left transition-all ${active ? 'border-emerald-300 bg-emerald-300/10' : 'border-white/10 bg-white/[0.03] hover:border-emerald-300/40 hover:bg-emerald-300/[0.06]'}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className={active ? 'text-emerald-200' : 'text-slate-400'}>{busy ? <RefreshCw size={22} className="animate-spin" /> : icon}</div>
        <ChevronRight size={16} className="text-slate-600 transition-transform group-hover:translate-x-1" />
      </div>
      <p className="mt-4 text-sm font-black uppercase text-white">{details.title}</p>
      <p className="mt-1 text-xs uppercase text-emerald-300/60">{details.label}</p>
      <p className="mt-3 text-sm leading-6 text-slate-400">{details.move}</p>
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-sm text-white">{value}</p>
    </div>
  );
}

function WorkflowStep({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-4 border border-white/10 bg-white/[0.03] p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-emerald-300/10 text-emerald-200">{icon}</div>
      <div>
        <p className="font-bold uppercase text-white">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-400">{body}</p>
      </div>
    </div>
  );
}

function PerformanceGraph({ data }: { data: PerformanceMark[] }) {
  if (!data?.length) return <div className="h-full w-full border border-emerald-400/10 bg-emerald-400/5" />;
  const maxBitrate = Math.max(...data.map((point) => point.bitrate));
  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - (point.bitrate / maxBitrate) * 82;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
        <polyline fill="none" stroke="#34d399" strokeWidth="0.75" points={points} opacity="0.75" />
        <path d={`M 0,100 L ${points} L 100,100 Z`} fill="#34d399" opacity="0.08" />
      </svg>
      <div className="absolute right-2 top-2 font-mono text-xs text-slate-600">LAN pulse</div>
    </div>
  );
}

function MediaStrip({ media, onOpen }: { media: MediaItem[]; onOpen: () => void }) {
  return (
    <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
        {(media.length ? media.slice(0, 3) : [
          { id: 'empty-1', name: 'Drop MP4/MOV files into public/media', type: 'video' as const, url: '', size: 0 },
          { id: 'empty-2', name: 'Use this for local review reels', type: 'video' as const, url: '', size: 0 },
          { id: 'empty-3', name: 'Fire TV playback is reference only', type: 'video' as const, url: '', size: 0 },
        ]).map((item) => (
          <div key={item.id} className="border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center gap-3">
              <Video size={16} className="text-emerald-300" />
              <p className="truncate text-sm text-white">{item.name}</p>
            </div>
          </div>
        ))}
      </div>
      <button onClick={onOpen} className="studio-button h-10" title="Open media shelf">
        <Layers size={16} />
        Open shelf
      </button>
    </div>
  );
}

function DockIcon({ icon, active, onClick, label }: { icon: ReactNode; active?: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`p-2 transition-colors ${active ? 'bg-emerald-400/15 text-emerald-200' : 'text-slate-500 hover:bg-white/10 hover:text-white'}`}
      title={label}
    >
      {icon}
    </button>
  );
}

function StudioOverlay({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
      animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-black/80 p-4 md:p-8"
    >
      <div className="flex h-full flex-col overflow-hidden border border-emerald-400/20 bg-[#050706] shadow-2xl">
        <div className="flex h-12 items-center justify-between border-b border-emerald-400/15 bg-emerald-400/[0.04] px-4 md:px-6">
          <span className="text-sm font-black uppercase text-emerald-200">{title}</span>
          <button onClick={onClose} className="icon-button" title="Close">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </motion.div>
  );
}

function DisplayConsole({ displays, busyAction, onControl }: {
  displays: TVStatus[];
  busyAction: string | null;
  onControl: (displayId: string, action: string, value?: string | number) => void;
}) {
  const navActions = [
    ['up', 'Up'],
    ['left', 'Left'],
    ['select', 'Select'],
    ['right', 'Right'],
    ['down', 'Down'],
    ['back', 'Back'],
  ];

  return (
    <div className="grid gap-5 p-5 lg:grid-cols-2">
      {displays.map((display) => (
        <section key={display.id} className="studio-card p-5">
          <DisplayCard display={display} busyAction={busyAction} onControl={onControl} />
          <div className="mt-5 grid grid-cols-3 gap-2">
            {navActions.map(([action, label]) => (
              <button key={action} className="studio-button h-11 justify-center" onClick={() => onControl(display.id, action)} title={label}>
                {label}
              </button>
            ))}
          </div>
          <div className="mt-5 flex gap-2">
            <button className="studio-button h-11 flex-1 justify-center" onClick={() => onControl(display.id, 'input')} title="Cycle input">
              <Cable size={16} />
              Input
            </button>
            <button className="studio-button h-11 flex-1 justify-center" onClick={() => onControl(display.id, 'sleep')} title="Sleep display">
              <Power size={16} />
              Sleep
            </button>
          </div>
        </section>
      ))}
    </div>
  );
}

function AppLauncher({ apps, displays, busyAction, onLaunch }: {
  apps: AppPackage[];
  displays: TVStatus[];
  busyAction: string | null;
  onLaunch: (displayId: string, app: AppPackage) => void;
}) {
  return (
    <div className="space-y-5 p-5">
      <div className="max-w-3xl">
        <p className="text-sm leading-6 text-slate-400">
          Configure package names in `.env`, then launch receivers or review URLs on each Fire TV.
          Blue Lake stays dry-run until `BLUE_LAKE_ENABLE_ADB=true`.
        </p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {apps.map((app) => (
          <section key={app.id} className="studio-card p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-emerald-300/10 text-emerald-200">
                {app.icon === 'Camera' ? <Camera size={20} /> : app.icon === 'Video' ? <Video size={20} /> : app.icon === 'Tv' ? <Tv size={20} /> : <Play size={20} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black uppercase text-white">{app.name}</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">{app.note}</p>
                {app.packageName && <p className="mt-2 break-all font-mono text-xs text-slate-500">{app.packageName}</p>}
              </div>
              <span className={`px-2 py-1 text-xs uppercase ${app.status === 'Configured' ? 'bg-emerald-300/10 text-emerald-200' : 'bg-slate-500/10 text-slate-400'}`}>
                {app.status}
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {displays.map((display) => (
                <button
                  key={display.id}
                  onClick={() => onLaunch(display.id, app)}
                  disabled={!app.packageName || busyAction === `${display.id}:${app.id}`}
                  className="studio-button h-10"
                  title={`Launch ${app.name} on ${display.name}`}
                >
                  {busyAction === `${display.id}:${app.id}` ? <RefreshCw size={16} className="animate-spin" /> : <ExternalLink size={16} />}
                  {display.name}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function MediaCenter({ media }: { media: MediaItem[] }) {
  return (
    <div className="p-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {media.length === 0 && (
          <div className="studio-card p-8 md:col-span-2">
            <Video className="text-emerald-300/50" size={36} />
            <h2 className="mt-5 text-xl font-black uppercase text-white">No local media yet</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Drop review files into `public/media`. Blue Lake streams local video with range support for quick studio playback checks.
            </p>
          </div>
        )}
        {media.map((item) => (
          <a key={item.id} href={item.url} className="studio-card block p-5 transition-colors hover:border-emerald-300/40 hover:bg-emerald-300/[0.06]">
            <Video size={28} className="text-emerald-300" />
            <p className="mt-5 truncate font-black uppercase text-white">{item.name}</p>
            <p className="mt-2 text-sm text-slate-500">{item.type} | {(item.size / 1024 / 1024).toFixed(1)} MB</p>
          </a>
        ))}
      </div>
    </div>
  );
}

function SetupGuide({ adbEnabled }: { adbEnabled: boolean }) {
  return (
    <div className="grid gap-5 p-5 xl:grid-cols-2">
      <section className="studio-card p-6">
        <SectionTitle icon={<Camera size={18} />} label="Capture One" title="Photo Monitor Path" />
        <ol className="mt-5 space-y-4 text-sm leading-6 text-slate-400">
          <li>1. Put your calibrated editing display on the Mac/PC running Capture One.</li>
          <li>2. Use Capture One dual monitor mode for a large viewer or browser on a second display.</li>
          <li>3. Use a Fire TV for client proofing, selects, or room presence, not final color decisions.</li>
          <li>4. Let Blue Lake handle wake, home, volume, and receiver launch before the client enters.</li>
        </ol>
      </section>
      <section className="studio-card p-6">
        <SectionTitle icon={<Clapperboard size={18} />} label="DaVinci" title="Video Monitor Path" />
        <ol className="mt-5 space-y-4 text-sm leading-6 text-slate-400">
          <li>1. Prefer direct HDMI, SDI, UltraStudio, DeckLink, or a calibrated reference monitor for grading.</li>
          <li>2. Use Fire TV for playback review, client comfort, or big-room checks.</li>
          <li>3. Keep Resolve clean feed and Fire TV casting separate in your notes so the room stays predictable.</li>
        </ol>
      </section>
      <section className="studio-card p-6">
        <SectionTitle icon={<Tv size={18} />} label="Fire TV" title="ADB Setup" />
        <ol className="mt-5 space-y-4 text-sm leading-6 text-slate-400">
          <li>1. Enable developer options and ADB debugging on each Fire TV.</li>
          <li>2. Find each TV IP address in Fire TV network settings.</li>
          <li>3. Put those IPs in `.env` as `FIRE_TV_A_IP` and `FIRE_TV_B_IP`.</li>
          <li>4. Test in dry-run, then set `BLUE_LAKE_ENABLE_ADB=true` when you are ready for real local control.</li>
        </ol>
      </section>
      <section className={`studio-card p-6 ${adbEnabled ? 'border-amber-300/40' : ''}`}>
        <SectionTitle icon={<Shield size={18} />} label="Safety" title={adbEnabled ? 'Armed Right Now' : 'Dry-Run Right Now'} />
        <p className="mt-5 text-sm leading-6 text-slate-400">
          {adbEnabled
            ? 'This instance can send real ADB commands to your configured TVs. Use only on devices you own in your private studio.'
            : 'This instance previews commands and logs actions without controlling hardware. This is the recommended setup mode.'}
        </p>
      </section>
    </div>
  );
}

function SettingsPanel({ networkInfo, adbEnabled }: { networkInfo: NetworkInfo | null; adbEnabled: boolean }) {
  return (
    <div className="grid gap-5 p-5 xl:grid-cols-2">
      <section className="studio-card p-6">
        <SectionTitle icon={<Settings size={18} />} label="Environment" title="Two-TV Config" />
        <pre className="mt-5 overflow-auto border border-white/10 bg-black p-4 font-mono text-xs leading-6 text-slate-300">{`BLUE_LAKE_ENABLE_ADB=${adbEnabled ? 'true' : 'false'}
FIRE_TV_A_NAME=Client Proof TV
FIRE_TV_A_IP=192.168.1.50
FIRE_TV_A_ROLE=Capture One viewer

FIRE_TV_B_NAME=Reference Playback TV
FIRE_TV_B_IP=192.168.1.51
FIRE_TV_B_ROLE=DaVinci review`}</pre>
      </section>
      <section className="studio-card p-6">
        <SectionTitle icon={<Wifi size={18} />} label="Local" title="Network Snapshot" />
        <div className="mt-5 space-y-3 text-sm">
          <Metric label="Visible IP" value={networkInfo?.ip || 'masked'} />
          <Metric label="SSID" value={networkInfo?.ssid || 'masked'} />
          <Metric label="Gateway" value={networkInfo?.gateway || 'masked'} />
        </div>
      </section>
    </div>
  );
}
