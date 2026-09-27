import React from 'react';
import {
  Radio,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  PlusCircle,
  Database,
  Sparkles,
} from 'lucide-react';

export const Navbar = ({
  isOnline,
  isSimulatedOffline,
  toggleSimulatedOffline,
  pendingCount,
  isSyncing,
  onSyncNow,
  onOpenSOSModal,
  onSeedData,
  isSeeding,
}) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Logo */}
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/20 text-red-500 border border-red-500/40">
              <Radio className="w-5 h-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white">
                  res<span className="text-red-500">Q</span>team
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800/60">
                  ResQLink Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Offline-First Disaster Coordination Network
              </p>
            </div>
          </div>

          {/* Center / Network & Queue Indicators */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Live Connection Badge */}
            <div
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                isOnline
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                  : 'bg-amber-950/50 text-amber-300 border-amber-800/60 animate-pulse'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>GRID ONLINE</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>OFFLINE MODE (IndexedDB Active)</span>
                </>
              )}
            </div>

            {/* Offline Queue Badge & Sync Button */}
            {pendingCount > 0 && (
              <button
                onClick={onSyncNow}
                disabled={!isOnline || isSyncing}
                title={isOnline ? 'Flush offline queue to server' : 'Connect to grid to sync'}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-red-950/70 border border-red-700 text-red-300 text-xs font-bold hover:bg-red-900/80 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{pendingCount} Pending Sync</span>
              </button>
            )}

            {/* Offline Simulator Switch */}
            <button
              onClick={toggleSimulatedOffline}
              className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition hidden md:flex items-center space-x-1.5 ${
                isSimulatedOffline
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="Simulate cellular grid collapse for testing store-and-forward syncing without cutting off Wi-Fi"
            >
              <Database className="w-3 h-3" />
              <span>{isSimulatedOffline ? 'Resume Network' : 'Simulate Offline'}</span>
            </button>

            {/* Seed Demo Scenario Button */}
            <button
              onClick={onSeedData}
              disabled={isSeeding}
              className="text-xs px-3 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 text-amber-200 border border-amber-600/60 flex items-center space-x-1.5 transition disabled:opacity-50 shadow-sm shadow-amber-950"
              title="Activate predefined disaster emergency hotspots and rescue fleet units"
            >
              <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${isSeeding ? 'animate-spin' : ''}`} />
              <span>{isSeeding ? 'Activating Hotspots...' : 'Demo Hotspots'}</span>
            </button>

            {/* Emergency SOS Button */}
            <button
              onClick={onOpenSOSModal}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="tracking-wide">LOG SOS</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
