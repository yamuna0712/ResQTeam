import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { AlertCircle, LifeBuoy, Navigation, ShieldCheck } from 'lucide-react';

// Custom SVG Icons for Leaflet to avoid broken default asset URLs
const createCustomIcon = (color, type = 'incident', isSelected = false) => {
  const iconHtml = type === 'responder'
    ? `<div style="
        background-color: #0284c7;
        border: 2px solid #38bdf8;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.6);
        font-size: 16px;
      ">🚤</div>`
    : `<div style="
        background-color: ${color};
        border: ${isSelected ? '3px solid #ffffff' : '2px solid white'};
        color: white;
        width: ${isSelected ? '38px' : '30px'};
        height: ${isSelected ? '38px' : '30px'};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: ${isSelected ? `0 0 24px 8px ${color}` : `0 0 12px ${color}`};
        font-weight: bold;
        font-size: ${isSelected ? '17px' : '14px'};
        transition: all 0.3s ease;
      ">🆘</div>`;

  return L.divIcon({
    html: iconHtml,
    className: 'custom-leaflet-marker',
    iconSize: isSelected ? [38, 38] : [32, 32],
    iconAnchor: isSelected ? [19, 19] : [16, 16],
    popupAnchor: [0, -18],
  });
};

const MapRecenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, 13.5, { duration: 1.0 });
    }
  }, [center, map]);
  return null;
};

export const IncidentMap = ({
  incidents = [],
  volunteers = [],
  selectedIncident = null,
  matchedResponders = [],
  onSelectIncident,
  onMatchResponders,
}) => {
  const defaultCenter = [19.0760, 72.8777]; // Default Mumbai / Urban Coastal center

  // Get active center
  const activeCenter = selectedIncident?.location?.coordinates
    ? [selectedIncident.location.coordinates[1], selectedIncident.location.coordinates[0]]
    : defaultCenter;

  const getIncidentColor = (incident) => {
    if (incident.status === 'RESOLVED') return '#10b981'; // Green
    if (incident.severity === 'CRITICAL') return '#ef4444'; // Red
    if (incident.severity === 'HIGH') return '#f97316'; // Orange
    if (incident.severity === 'MEDIUM') return '#eab308'; // Yellow
    return '#3b82f6'; // Blue
  };

  return (
    <div className="relative isolate z-0 w-full h-full min-h-[450px] rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <MapRecenter center={activeCenter} />

        {/* Dark Mode Map Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Render Rescue Volunteers / Responders */}
        {volunteers.map((vol) => {
          if (!vol.location?.coordinates) return null;
          const [lng, lat] = vol.location.coordinates;

          return (
            <React.Fragment key={vol._id}>
              <Marker
                position={[lat, lng]}
                icon={createCustomIcon('#0284c7', 'responder')}
              >
                <Popup>
                  <div className="p-1 text-slate-100 min-w-[180px]">
                    <div className="flex items-center space-x-1.5 font-bold text-sky-400 text-xs">
                      <span>🚤 {vol.teamType.replace('_', ' ')}</span>
                    </div>
                    <div className="font-extrabold text-sm text-white mt-1">{vol.name}</div>
                    <div className="text-xs text-slate-300 mt-1">📞 {vol.phone}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Capacity: {vol.capacity} people</div>
                    <div className="mt-2 text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded inline-block">
                      {vol.isAvailable ? 'READY FOR DISPATCH' : 'DEPLOYED ON MISSION'}
                    </div>
                  </div>
                </Popup>
              </Marker>

              {/* Coverage radius circle around responder unit */}
              <Circle
                center={[lat, lng]}
                radius={1200}
                pathOptions={{
                  color: '#0284c7',
                  fillColor: '#0284c7',
                  fillOpacity: 0.08,
                  weight: 1,
                  dashArray: '3 4',
                }}
              />
            </React.Fragment>
          );
        })}

        {/* Render SOS Distress Incidents */}
        {incidents.map((inc) => {
          if (!inc.location?.coordinates) return null;
          const [lng, lat] = inc.location.coordinates;
          const color = getIncidentColor(inc);

          const isSelected =
            (selectedIncident?._id && selectedIncident._id === inc._id) ||
            (selectedIncident?.clientRequestId && selectedIncident.clientRequestId === inc.clientRequestId);

          return (
            <Marker
              key={inc._id || inc.clientRequestId}
              position={[lat, lng]}
              icon={createCustomIcon(color, 'incident', isSelected)}
              eventHandlers={{
                click: () => onSelectIncident && onSelectIncident(inc),
              }}
            >
              <Popup>
                <div className="p-1 text-slate-100 min-w-[210px]">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span
                      className="px-1.5 py-0.5 rounded text-white"
                      style={{ backgroundColor: color }}
                    >
                      {inc.severity}
                    </span>
                    <span className="text-slate-400">{inc.emergencyType}</span>
                  </div>

                  <div className="font-bold text-sm text-white mt-1.5">{inc.citizenName}</div>
                  <div className="text-xs text-slate-300">{inc.addressText}</div>

                  <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                    <span>Stranded: <strong>{inc.peopleCount}</strong> people</span>
                    <span className="text-amber-400 font-semibold">
                      {inc.status}
                    </span>
                  </div>

                  {inc.notes && (
                    <div className="text-xs italic text-slate-300 mt-1 bg-slate-800/80 p-1.5 rounded">
                      "{inc.notes}"
                    </div>
                  )}

                  <div className="mt-3 pt-2 border-t border-slate-700 flex space-x-1">
                    <button
                      onClick={() => onMatchResponders && onMatchResponders(inc)}
                      className="w-full text-xs font-bold py-1.5 px-2 bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center justify-center space-x-1"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Find Closest Unit</span>
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Render Polyline matching lines between selected incident & matched responders */}
        {selectedIncident?.location?.coordinates &&
          matchedResponders.map((resp) => {
            if (!resp.location?.coordinates) return null;
            const incCoords = [
              selectedIncident.location.coordinates[1],
              selectedIncident.location.coordinates[0],
            ];
            const respCoords = [
              resp.location.coordinates[1],
              resp.location.coordinates[0],
            ];

            return (
              <Polyline
                key={resp._id}
                positions={[incCoords, respCoords]}
                pathOptions={{
                  color: '#f43f5e',
                  weight: 2,
                  dashArray: '6, 6',
                  opacity: 0.85,
                }}
              />
            );
          })}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[400] bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-3 text-[11px] space-y-1.5 text-slate-300 shadow-xl pointer-events-auto">
        <div className="font-bold text-white text-xs uppercase tracking-wider mb-1">
          Geospatial Tactical Map
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500"></span>
          <span>Critical / Trapped SOS</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-sm shadow-sky-500"></span>
          <span>Active Rescue Boat / Team</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500"></span>
          <span>Mission Resolved</span>
        </div>
      </div>
    </div>
  );
};
