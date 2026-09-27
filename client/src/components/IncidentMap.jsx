
import React, { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { Navigation } from 'lucide-react';

// Default map location: Mumbai
const DEFAULT_CENTER = [19.0760, 72.8777];

// Custom icons for SOS and rescue teams
const createCustomIcon = (color, type = 'incident', isSelected = false) => {
  const iconHtml =
    type === 'responder'
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
          border: ${isSelected ? '3px solid white' : '2px solid white'};
          color: white;
          width: ${isSelected ? '38px' : '30px'}px;
          height: ${isSelected ? '38px' : '30px'}px;
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

// Recenter the map without resetting the user's zoom
const MapRecenter = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    if (
      center &&
      Number.isFinite(center[0]) &&
      Number.isFinite(center[1])
    ) {
      map.flyTo(center, map.getZoom(), {
        duration: 1.0,
      });
    }
  }, [center, map]);

  return null;
};

// GPS location button
const LocateMe = ({ onLocationFound }) => {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const locateUser = () => {
    if (!navigator.geolocation) {
      alert('Your browser does not support GPS location.');
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const userPosition = [lat, lng];

        onLocationFound(userPosition);

        // Move to user's location at zoom level 16
        map.flyTo(userPosition, 16, {
          duration: 1.5,
        });

        setLocating(false);
      },
      (error) => {
        setLocating(false);

        if (error.code === error.PERMISSION_DENIED) {
          alert(
            'Location permission denied. Please allow location access in your browser.'
          );
        } else if (error.code === error.TIMEOUT) {
          alert('Location request timed out. Please try again.');
        } else {
          alert(
            'Unable to get your location. Please check your GPS or internet connection.'
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  return (
    <button
      type="button"
      onClick={locateUser}
      disabled={locating}
      className="absolute top-4 right-4 z-[1000] bg-white text-slate-900 px-4 py-2.5 rounded-xl shadow-lg font-semibold text-sm hover:bg-slate-100 disabled:opacity-60"
    >
      {locating ? 'Locating...' : '📍 My Location'}
    </button>
  );
};

// Main Incident Map
export const IncidentMap = ({
  incidents = [],
  volunteers = [],
  selectedIncident = null,
  matchedResponders = [],
  onSelectIncident,
  onMatchResponders,
}) => {
  const [userLocation, setUserLocation] = useState(null);

  // Selected incident takes priority, then GPS, then default location
  const activeCenter = selectedIncident?.location?.coordinates
    ? [
        selectedIncident.location.coordinates[1],
        selectedIncident.location.coordinates[0],
      ]
    : userLocation || DEFAULT_CENTER;

  const getIncidentColor = (incident) => {
    if (incident.status === 'RESOLVED') return '#10b981';
    if (incident.severity === 'CRITICAL') return '#ef4444';
    if (incident.severity === 'HIGH') return '#f97316';
    if (incident.severity === 'MEDIUM') return '#eab308';
    return '#3b82f6';
  };

  return (
    <div className="relative isolate z-0 w-full h-full min-h-[450px] rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950">

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={13}
        minZoom={3}
        maxZoom={19}
        zoomSnap={0.5}
        zoomDelta={1}
        wheelPxPerZoomLevel={120}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        touchZoom={true}
        zoomControl={true}
        className="w-full h-full"
      >
        {/* OpenStreetMap street tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* GPS location button */}
        <LocateMe onLocationFound={setUserLocation} />

        {/* Recenter without overriding manual zoom */}
        <MapRecenter center={activeCenter} />

        {/* User's current location marker */}
        {userLocation && (
          <>
            <Circle
              center={userLocation}
              radius={50}
              pathOptions={{
                color: '#2563eb',
                fillColor: '#3b82f6',
                fillOpacity: 0.15,
                weight: 2,
              }}
            />

            <Marker
              position={userLocation}
              icon={L.divIcon({
                className: 'user-location-marker',
                html: `
                  <div style="
                    width: 22px;
                    height: 22px;
                    background: #2563eb;
                    border: 4px solid white;
                    border-radius: 50%;
                    box-shadow: 0 0 12px rgba(37,99,235,0.7);
                  "></div>
                `,
                iconSize: [22, 22],
                iconAnchor: [11, 11],
              })}
            >
              <Popup>
                <div className="font-bold text-blue-600">
                  You are here
                </div>
                <div className="text-xs">
                  Your current GPS location
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {/* Rescue Volunteers / Responders */}
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
                  <div className="p-1 min-w-[180px]">
                    <div className="font-bold text-sky-600 text-xs">
                      🚤 {vol.teamType?.replace('_', ' ')}
                    </div>

                    <div className="font-extrabold text-sm mt-1">
                      {vol.name}
                    </div>

                    <div className="text-xs mt-1">
                      📞 {vol.phone}
                    </div>

                    <div className="text-xs mt-1">
                      Capacity: {vol.capacity} people
                    </div>

                    <div className="mt-2 text-[10px] uppercase font-bold text-emerald-600">
                      {vol.isAvailable
                        ? 'READY FOR DISPATCH'
                        : 'DEPLOYED ON MISSION'}
                    </div>
                  </div>
                </Popup>
              </Marker>

              {/* Rescue team coverage radius */}
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

        {/* SOS Distress Incidents */}
        {incidents.map((inc) => {
          if (!inc.location?.coordinates) return null;

          const [lng, lat] = inc.location.coordinates;
          const color = getIncidentColor(inc);

          const isSelected =
            (selectedIncident?._id &&
              selectedIncident._id === inc._id) ||
            (selectedIncident?.clientRequestId &&
              selectedIncident.clientRequestId ===
                inc.clientRequestId);

          return (
            <Marker
              key={inc._id || inc.clientRequestId}
              position={[lat, lng]}
              icon={createCustomIcon(color, 'incident', isSelected)}
              eventHandlers={{
                click: () =>
                  onSelectIncident && onSelectIncident(inc),
              }}
            >
              <Popup>
                <div className="p-1 min-w-[210px]">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span
                      className="px-1.5 py-0.5 rounded text-white"
                      style={{ backgroundColor: color }}
                    >
                      {inc.severity}
                    </span>

                    <span>{inc.emergencyType}</span>
                  </div>

                  <div className="font-bold text-sm mt-1.5">
                    {inc.citizenName}
                  </div>

                  <div className="text-xs">
                    {inc.addressText}
                  </div>

                  <div className="text-xs mt-1 flex items-center justify-between">
                    <span>
                      Stranded: <strong>{inc.peopleCount}</strong> people
                    </span>

                    <span className="text-amber-600 font-semibold">
                      {inc.status}
                    </span>
                  </div>

                  {inc.notes && (
                    <div className="text-xs italic mt-1 p-1.5 rounded bg-slate-100">
                      "{inc.notes}"
                    </div>
                  )}

                  <div className="mt-3 pt-2 border-t flex">
                    <button
                      type="button"
                      onClick={() =>
                        onMatchResponders &&
                        onMatchResponders(inc)
                      }
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

        {/* Lines connecting SOS incidents to matched rescue teams */}
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

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-[400] bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-3 text-[11px] space-y-1.5 text-slate-300 shadow-xl pointer-events-auto">

        <div className="font-bold text-white text-xs uppercase tracking-wider mb-1">
          ResQTeam Live Map
        </div>

        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span>Critical / Trapped SOS</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
          <span>Active Rescue Boat / Team</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Mission Resolved</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white"></span>
          <span>Your GPS Location</span>
        </div>

      </div>
    </div>
  );
};

export default IncidentMap;