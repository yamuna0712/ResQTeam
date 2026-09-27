import React from 'react';
import {
  AlertCircle,
  Users,
  CheckCircle2,
  LifeBuoy,
  Zap,
  HardDrive,
} from 'lucide-react';

export const AnalyticsBanner = ({ telemetry, pendingQueueCount, lastSyncStats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
      {/* Total Incidents */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-md flex items-center space-x-3">
        <div className="p-2 rounded-lg bg-red-950/60 text-red-400 border border-red-800/40">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400">Total SOS</div>
          <div className="text-lg font-extrabold text-white">
            {telemetry?.totalIncidents ?? 0}
          </div>
        </div>
      </div>

      {/* Critical Active */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-md flex items-center space-x-3">
        <div className="p-2 rounded-lg bg-orange-950/60 text-orange-400 border border-orange-800/40">
          <Zap className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400">Critical Priority</div>
          <div className="text-lg font-extrabold text-orange-400">
            {telemetry?.criticalIncidents ?? 0}
          </div>
        </div>
      </div>

      {/* People Stranded */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-md flex items-center space-x-3">
        <div className="p-2 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-800/40">
          <Users className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400">People Stranded</div>
          <div className="text-lg font-extrabold text-amber-300">
            {telemetry?.strandedPeopleCount ?? 0}
          </div>
        </div>
      </div>

      {/* Rescued */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-md flex items-center space-x-3">
        <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400">Lives Saved</div>
          <div className="text-lg font-extrabold text-emerald-400">
            {telemetry?.rescuedPeopleCount ?? 0}
          </div>
        </div>
      </div>

      {/* Active Rescue Units */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-md flex items-center space-x-3">
        <div className="p-2 rounded-lg bg-sky-950/60 text-sky-400 border border-sky-800/40">
          <LifeBuoy className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400">Ready Boats</div>
          <div className="text-lg font-extrabold text-sky-400">
            {telemetry?.activeResponders ?? 0}
          </div>
        </div>
      </div>

      {/* Offline Ingestion Status */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-md flex items-center space-x-3">
        <div className="p-2 rounded-lg bg-purple-950/60 text-purple-400 border border-purple-800/40">
          <HardDrive className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400">IDB Queue</div>
          <div className="text-lg font-extrabold text-purple-300">
            {pendingQueueCount} <span className="text-xs font-normal text-slate-400">buffered</span>
          </div>
        </div>
      </div>
    </div>
  );
};
