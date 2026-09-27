import React, { useState } from 'react';
import {
  LifeBuoy,
  Phone,
  Shield,
  Navigation,
  CheckCircle2,
  XCircle,
  Plus,
  Loader2,
  X,
} from 'lucide-react';

export const ResponderManagement = ({
  volunteers = [],
  onRegisterVolunteer,
  onToggleAvailability,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    teamType: 'BOAT_RESCUE',
    latitude: 19.0760,
    longitude: 72.8777,
    capacity: 6,
    equipmentText: 'Life vests, First Aid, Inflatable Raft',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onRegisterVolunteer({
        name: formData.name,
        phone: formData.phone,
        teamType: formData.teamType,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        capacity: parseInt(formData.capacity) || 4,
        equipment: formData.equipmentText.split(',').map((s) => s.trim()),
      });
      setShowAddModal(false);
      setFormData({
        name: '',
        phone: '',
        teamType: 'BOAT_RESCUE',
        latitude: 19.0760,
        longitude: 72.8777,
        capacity: 6,
        equipmentText: '',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <LifeBuoy className="w-4 h-4 text-sky-400" />
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">
            Active Rescue Fleet ({volunteers.length})
          </h3>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="text-xs px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg flex items-center space-x-1 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Unit</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-3">
        {volunteers.map((vol) => (
          <div
            key={vol._id}
            className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition"
          >
            <div className="flex items-center justify-between">
              <div className="font-bold text-sm text-white">{vol.name}</div>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-sky-950/80 text-sky-400 border border-sky-800/60">
                {vol.teamType.replace('_', ' ')}
              </span>
            </div>

            <div className="text-xs text-slate-400 mt-2 space-y-1">
              <div className="flex items-center space-x-1">
                <Phone className="w-3 h-3 text-slate-500" />
                <span>{vol.phone}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Shield className="w-3 h-3 text-slate-500" />
                <span>Evacuation Capacity: <strong>{vol.capacity}</strong></span>
              </div>
              {vol.location?.coordinates && (
                <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                  <Navigation className="w-3 h-3 text-slate-500" />
                  <span>
                    Beacon: [{vol.location.coordinates[1].toFixed(4)}, {vol.location.coordinates[0].toFixed(4)}]
                  </span>
                </div>
              )}
            </div>

            {/* Equipment list */}
            {vol.equipment && vol.equipment.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1">
                {vol.equipment.slice(0, 3).map((eq, i) => (
                  <span
                    key={i}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    {eq}
                  </span>
                ))}
              </div>
            )}

            {/* Availability status */}
            <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
              <span
                className={`font-bold text-[11px] flex items-center space-x-1 ${
                  vol.isAvailable ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {vol.isAvailable ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>ON PATROL / READY</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3" />
                    <span>ASSIGNED / BUSY</span>
                  </>
                )}
              </span>

              <button
                onClick={() => onToggleAvailability(vol._id, !vol.isAvailable)}
                className="text-[10px] text-slate-400 hover:text-white underline"
              >
                {vol.isAvailable ? 'Set Busy' : 'Set Available'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Register Unit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="relative z-[10000] bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-extrabold text-base text-white">Register Rescue Field Unit</h4>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Unit / Team Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Coastal Lifeboat Squadron 03"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contact Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98000 00000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Unit Type *</label>
                  <select
                    value={formData.teamType}
                    onChange={(e) => setFormData({ ...formData, teamType: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="BOAT_RESCUE">Boat Rescue</option>
                    <option value="MEDICAL">Medical Team</option>
                    <option value="EVACUATION">Evacuation Truck</option>
                    <option value="AIRLIFT">Airlift Squadron</option>
                    <option value="DRONE_SURVEILLANCE">Drone Recon</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Capacity (Pax)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Equipment</label>
                  <input
                    type="text"
                    placeholder="Comma separated"
                    value={formData.equipmentText}
                    onChange={(e) => setFormData({ ...formData, equipmentText: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl mt-2 flex items-center justify-center space-x-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Register Unit</span>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
