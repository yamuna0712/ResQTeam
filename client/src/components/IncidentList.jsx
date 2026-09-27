import React, { useState } from 'react';
import {
  Users,
  Clock,
  MapPin,
  Navigation,
  CheckCircle,
  AlertTriangle,
  Send,
  Database,
  Shield,
  X,
  Radio,
} from 'lucide-react';

export const IncidentList = ({
  incidents = [],
  onSelectIncident,
  selectedIncident,
  onMatchResponders,
  onUpdateStatus,
  nearestResponders = [],
  isMatchingLoading,
  matchModalOpen,
  onCloseMatchModal,
}) => {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  const filteredIncidents = incidents.filter((inc) => {
    if (filterStatus !== 'ALL' && inc.status !== filterStatus) return false;
    if (filterSeverity !== 'ALL' && inc.severity !== filterSeverity) return false;
    return true;
  });

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-950/80 text-red-400 border-red-700/80';
      case 'HIGH':
        return 'bg-orange-950/80 text-orange-400 border-orange-700/80';
      case 'MEDIUM':
        return 'bg-yellow-950/80 text-yellow-400 border-yellow-700/80';
      default:
        return 'bg-blue-950/80 text-blue-400 border-blue-700/80';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col h-full shadow-xl">
      {/* Header & Filters */}
      <div className="flex flex-col space-y-3 pb-3 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-red-500" />
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">
              Emergency Incident Triage ({filteredIncidents.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">Sorted by Severity</span>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {['ALL', 'PENDING', 'DISPATCHED', 'RESOLVED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] ${
                filterStatus === st
                  ? 'bg-slate-100 text-slate-950 shadow'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents List Container */}
      <div className="flex-1 overflow-y-auto space-y-3 pt-3 pr-1">
        {filteredIncidents.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No incidents found matching the selected filter.
          </div>
        ) : (
          filteredIncidents.map((inc) => {
            const isSelected = selectedIncident?._id === inc._id || selectedIncident?.clientRequestId === inc.clientRequestId;
            const isOfflineQueued = inc.synced === false;

            return (
              <div
                key={inc._id || inc.clientRequestId}
                onClick={() => onSelectIncident(inc)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 border-red-500 ring-1 ring-red-500/60 shadow-lg'
                    : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/70 hover:border-slate-700'
                }`}
              >
                {/* Status bar */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded border ${getSeverityBadge(
                        inc.severity
                      )}`}
                    >
                      {inc.severity}
                    </span>
                    <span className="text-xs font-bold text-slate-300">
                      {inc.emergencyType.replace('_', ' ')}
                    </span>
                  </div>

                  {isOfflineQueued ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/70 border border-amber-700 text-amber-300 flex items-center space-x-1">
                      <Database className="w-2.5 h-2.5" />
                      <span>OFFLINE QUEUE</span>
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        inc.status === 'RESOLVED'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                          : inc.status === 'DISPATCHED'
                          ? 'bg-sky-950/60 text-sky-400 border border-sky-800'
                          : 'bg-amber-950/60 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {inc.status}
                    </span>
                  )}
                </div>

                {/* Citizen Details & Address */}
                <div className="font-bold text-sm text-white">{inc.citizenName}</div>
                <div className="text-xs text-slate-400 mt-1 flex items-start space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{inc.addressText}</span>
                </div>

                {/* Counts & Notes */}
                <div className="mt-2.5 flex items-center space-x-4 text-xs text-slate-400">
                  <div className="flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      <strong>{inc.peopleCount}</strong> stranded
                    </span>
                  </div>
                  {inc.contactNumber && (
                    <span className="text-slate-400">📞 {inc.contactNumber}</span>
                  )}
                </div>

                {inc.notes && (
                  <div className="mt-2 text-xs italic text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-800/80">
                    "{inc.notes}"
                  </div>
                )}

                {/* Assigned Volunteer Info */}
                {inc.assignedVolunteer && (
                  <div className="mt-2 text-xs bg-sky-950/40 border border-sky-800/60 rounded p-2 text-sky-300 flex items-center justify-between">
                    <div>
                      <span className="font-bold">Dispatched: </span>
                      <span>{inc.assignedVolunteer.name || 'Rescue Team'}</span>
                    </div>
                    <span>{inc.assignedVolunteer.phone}</span>
                  </div>
                )}

                {/* Action Toolbar */}
                <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMatchResponders(inc);
                    }}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white flex items-center space-x-1.5 transition"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Geospatial Match</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    {inc.status !== 'RESOLVED' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(inc._id, 'RESOLVED');
                        }}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 font-bold transition flex items-center space-x-1"
                        title="Mark as rescued"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>Resolve</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Geospatial Nearest Responders Modal */}
      {matchModalOpen && selectedIncident && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="relative z-[10000] bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-extrabold text-base text-white flex items-center space-x-2">
                  <Navigation className="w-4 h-4 text-red-500" />
                  <span>MongoDB 2dsphere Geospatial Match</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Target: {selectedIncident.citizenName} ({selectedIncident.addressText})
                </p>
              </div>
              <button
                onClick={onCloseMatchModal}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isMatchingLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Calculating spherical distances using MongoDB $geoNear...
              </div>
            ) : nearestResponders.length === 0 ? (
              <div className="py-8 text-center text-xs text-amber-400">
                No available rescue units found within radius range.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto">
                <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                  Closest Active Rescue Units (Sorted by Distance)
                </div>
                {nearestResponders.map((res, index) => (
                  <div
                    key={res._id}
                    className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between hover:border-sky-500 transition"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="font-bold text-sm text-white">{res.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-400 font-semibold">
                          {res.teamType}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center space-x-3">
                        <span>📞 {res.phone}</span>
                        <span>Capacity: {res.capacity} people</span>
                      </div>
                    </div>

                    <div className="text-right space-y-1.5">
                      <div className="text-xs font-black text-emerald-400">
                        {res.distanceKm < 1
                          ? `${Math.round(res.distanceMeters)} m`
                          : `${res.distanceKm} km`}
                      </div>
                      <button
                        onClick={() => {
                          onUpdateStatus(selectedIncident._id, 'DISPATCHED', res._id);
                          onCloseMatchModal();
                        }}
                        className="text-xs px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition"
                      >
                        Dispatch
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
