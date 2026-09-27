import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar.jsx';
import { AnalyticsBanner } from './components/AnalyticsBanner.jsx';
import { IncidentMap } from './components/IncidentMap.jsx';
import { IncidentList } from './components/IncidentList.jsx';
import { ResponderManagement } from './components/ResponderManagement.jsx';
import { CitizenSOSModal } from './components/CitizenSOSModal.jsx';
import { useOnlineStatus } from './hooks/useOnlineStatus.js';
import { useSyncQueue } from './hooks/useSyncQueue.js';
import {
  getIncidents,
  getVolunteers,
  getNearestResponders,
  updateIncidentStatus,
  fetchTelemetryStats,
  triggerSeed,
} from './services/api.js';
import {
  Layers,
  Activity,
  Radio,
  HelpCircle,
  Database,
  Compass,
  Cpu,
  RefreshCw,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export function App() {
  const { isOnline, isSimulatedOffline, toggleSimulatedOffline } = useOnlineStatus();

  const [incidents, setIncidents] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [telemetry, setTelemetry] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [nearestResponders, setNearestResponders] = useState([]);
  const [isMatchingLoading, setIsMatchingLoading] = useState(false);
  const [matchModalOpen, setMatchModalOpen] = useState(false);

  const [isSOSModalOpen, setIsSOSModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedNotice, setSeedNotice] = useState(null);
  const [activeTab, setActiveTab] = useState('COMMAND'); // 'COMMAND' | 'FLEET' | 'ARCHITECTURE'

  // Refresh incident data from server or local IndexedDB cache
  const loadData = useCallback(async () => {
    try {
      const [incRes, volRes, telRes] = await Promise.all([
        getIncidents(isOnline),
        getVolunteers(),
        fetchTelemetryStats(),
      ]);

      if (incRes.success && incRes.data) {
        setIncidents(incRes.data);
      }
      if (volRes) {
        setVolunteers(volRes);
      }
      if (telRes) {
        setTelemetry(telRes);
      }
    } catch (err) {
      console.warn('[App] Data refresh error:', err);
    }
  }, [isOnline]);

  // Hook for Store-and-Forward sync engine
  const handleSyncSuccess = useCallback((result) => {
    console.log('[App] Offline queue flushed successfully to server:', result);
    loadData();
  }, [loadData]);

  const {
    pendingCount,
    isSyncing,
    lastSyncResult,
    triggerSyncNow,
  } = useSyncQueue(isOnline, handleSyncSuccess);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Execute MongoDB 2dsphere nearest responders search
  const handleMatchResponders = async (incident) => {
    setSelectedIncident(incident);
    setMatchModalOpen(true);
    setIsMatchingLoading(true);
    try {
      const res = await getNearestResponders(incident._id);
      if (res.success) {
        setNearestResponders(res.nearestResponders || []);
      }
    } catch (err) {
      console.error('[App] Geospatial query failed:', err);
      setNearestResponders([]);
    } finally {
      setIsMatchingLoading(false);
    }
  };

  // Dispatch or resolve an incident
  const handleUpdateStatus = async (incidentId, status, volunteerId = null) => {
    try {
      await updateIncidentStatus(incidentId, status, volunteerId);
      await loadData();
    } catch (err) {
      console.error('[App] Status update failed:', err);
    }
  };

  // Seed sample disaster scenario & visibly activate hotspots on tactical map
  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const res = await triggerSeed();

      // Immediate state update if data returned
      if (res?.result?.incidents && res.result.incidents.length > 0) {
        setIncidents(res.result.incidents);
      }
      if (res?.result?.volunteers && res.result.volunteers.length > 0) {
        setVolunteers(res.result.volunteers);
      }

      await loadData();

      // 1. Visibly switch to Tactical Map & Triage tab
      setActiveTab('COMMAND');

      // 2. Select top critical incident to pan map and trigger match lines
      const activeIncidents = res?.result?.incidents || incidents;
      if (activeIncidents && activeIncidents.length > 0) {
        const topIncident = activeIncidents[0];
        setSelectedIncident(topIncident);
        try {
          if (topIncident._id) {
            const matchRes = await getNearestResponders(topIncident._id);
            if (matchRes.success) {
              setNearestResponders(matchRes.nearestResponders || []);
            }
          }
        } catch {
          // Non-critical if offline
        }
      }

      // 3. Show high-visibility activation notification banner
      setSeedNotice(
        `🚨 Tactical Hotspots Loaded: ${res?.result?.incidentsCount || 4} Emergency Incidents & ${res?.result?.volunteersCount || 5} Rescue Fleet Units Active on Map!`
      );
      setTimeout(() => setSeedNotice(null), 6000);
    } catch (err) {
      console.error('[App] Seeding failed:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-red-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
        toggleSimulatedOffline={toggleSimulatedOffline}
        pendingCount={pendingCount}
        isSyncing={isSyncing}
        onSyncNow={triggerSyncNow}
        onOpenSOSModal={() => setIsSOSModalOpen(true)}
        onSeedData={handleSeedData}
        isSeeding={isSeeding}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col space-y-4">
        {/* Visual Activation Notification Banner */}
        {seedNotice && (
          <div className="bg-gradient-to-r from-red-700 via-amber-600 to-red-700 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between font-bold text-xs border border-amber-400/50 animate-in fade-in slide-in-from-top duration-300">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-4 h-4 text-amber-200 animate-spin" />
              <span className="tracking-wide">{seedNotice}</span>
            </div>
            <button
              onClick={() => setSeedNotice(null)}
              className="text-white/80 hover:text-white text-[11px] px-2.5 py-0.5 rounded-lg bg-black/30 hover:bg-black/50 transition"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Real-time Telemetry & KPIs */}
        <AnalyticsBanner
          telemetry={telemetry}
          pendingQueueCount={pendingCount}
          lastSyncStats={lastSyncResult}
        />

        {/* View Switcher Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('COMMAND')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-2 transition ${
                activeTab === 'COMMAND'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Tactical Map & Triage</span>
            </button>

            <button
              onClick={() => setActiveTab('FLEET')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-2 transition ${
                activeTab === 'FLEET'
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Rescue Fleet Units</span>
            </button>

            <button
              onClick={() => setActiveTab('ARCHITECTURE')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-2 transition ${
                activeTab === 'ARCHITECTURE'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>System Architecture & Proof</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 hidden sm:flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>MERN Engine Active</span>
          </div>
        </div>

        {/* Tab 1: Tactical Incident Map & Triage */}
        {activeTab === 'COMMAND' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
            {/* Interactive Map (Left/Top on mobile, 7 cols on desktop) */}
            <div className="lg:col-span-7 h-[500px] lg:h-[650px]">
              <IncidentMap
                incidents={incidents}
                volunteers={volunteers}
                selectedIncident={selectedIncident}
                matchedResponders={nearestResponders}
                onSelectIncident={(inc) => setSelectedIncident(inc)}
                onMatchResponders={handleMatchResponders}
              />
            </div>

            {/* Incident Triage List (Right, 5 cols on desktop) */}
            <div className="lg:col-span-5 h-[500px] lg:h-[650px]">
              <IncidentList
                incidents={incidents}
                onSelectIncident={(inc) => setSelectedIncident(inc)}
                selectedIncident={selectedIncident}
                onMatchResponders={handleMatchResponders}
                onUpdateStatus={handleUpdateStatus}
                nearestResponders={nearestResponders}
                isMatchingLoading={isMatchingLoading}
                matchModalOpen={matchModalOpen}
                onCloseMatchModal={() => setMatchModalOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Fleet Management */}
        {activeTab === 'FLEET' && (
          <ResponderManagement
            volunteers={volunteers}
            onRegisterVolunteer={async (volData) => {
              const res = await fetch('/api/volunteers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(volData),
              });
              if (res.ok) await loadData();
            }}
            onToggleAvailability={async (id, isAvailable) => {
              const res = await fetch(`/api/volunteers/${id}/availability`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isAvailable }),
              });
              if (res.ok) await loadData();
            }}
          />
        )}

        {/* Tab 3: System Architecture & Technical Highlights */}
        {activeTab === 'ARCHITECTURE' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pillar 1 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold">
                01
              </div>
              <h3 className="font-extrabold text-base text-white">Offline-First Sync Engine</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Utilizes browser <strong>IndexedDB</strong> and <strong>Service Workers</strong>. When citizens tap SOS in cellular blackout zones, signals are immediately sealed with client-side UUIDs and queued locally. The exact millisecond network connection is detected, the store-and-forward engine flushes the entire queue.
              </p>
              <div className="text-[11px] font-mono text-amber-400/90 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                IndexedDB Store: "sos_queue"
                <br />Auto-Sync Trigger: window.onOnline
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center font-bold">
                02
              </div>
              <h3 className="font-extrabold text-base text-white">Geospatial Matching Engine</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                MongoDB uses <strong>2dsphere GeoJSON Point indexing</strong>. Our dispatch engine executes spherical distance calculations via <code>$geoNear</code> aggregations, instantly ranking active rescue boats, helicopters, and paramedic squads by proximity to the victim.
              </p>
              <div className="text-[11px] font-mono text-red-400/90 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                Index: location: "2dsphere"
                <br />Query: $geoNear & distanceField
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center font-bold">
                03
              </div>
              <h3 className="font-extrabold text-base text-white">High-Throughput Bulk Ingestion</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                When an entire neighborhood re-establishes cell signal, thousands of offline devices dump requests at once. The Express backend handles bursts using <code>MongoDB bulkWrite</code> with <code>ordered: false</code> and clientRequestId upsert deduplication, preventing database bottlenecks and duplicate dispatches.
              </p>
              <div className="text-[11px] font-mono text-sky-400/90 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                API: POST /api/sos/bulk-sync
                <br />Op: bulkWrite() with upsert: true
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Citizen SOS Broadcast Modal */}
      <CitizenSOSModal
        isOpen={isSOSModalOpen}
        onClose={() => setIsSOSModalOpen(false)}
        isOnline={isOnline}
        onSOSLogged={() => loadData()}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between">
          <span>resQteam (ResQLink) &bull; MERN Disaster Coordination Platform</span>
          <span className="mt-1 sm:mt-0 font-mono text-[11px] text-slate-400">
            Engineered for high-stakes resilience &bull; Offline-First Store-and-Forward
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
