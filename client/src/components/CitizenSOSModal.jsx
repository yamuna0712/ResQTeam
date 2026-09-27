import React, { useState, useEffect } from 'react';

import {
  X,
  MapPin,
  AlertOctagon,
  Users,
  HeartPulse,
  Send,
  CheckCircle2,
  Database,
  Navigation,
  Loader2,
} from 'lucide-react';

import { v4 as uuidv4 } from 'uuid';
import { submitSOS } from '../services/api.js';
import { triggerSMSApp } from '../utils/smsHelper.js';

export const CitizenSOSModal = ({
  isOpen,
  onClose,
  isOnline,
  onSOSLogged,
}) => {
  const [formData, setFormData] = useState({
    citizenName: '',
    contactNumber: '',
    latitude: 19.0760,
    longitude: 72.8777,
    addressText: '',
    emergencyType: 'TRAPPED',
    severity: 'CRITICAL',
    peopleCount: 1,
    infants: 0,
    elderly: 0,
    injured: 0,
    notes: '',
  });

  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState(null);

  // Stores the SOS data so that it can also be sent through SMS
  const [lastSOSPayload, setLastSOSPayload] = useState(null);

  // Auto-fetch GPS on opening
  useEffect(() => {
    if (isOpen) {
      setSubmissionFeedback(null);
      setLastSOSPayload(null);
      detectGPSLocation();
    }
  }, [isOpen]);

  const detectGPSLocation = () => {
    if ('geolocation' in navigator) {
      setIsLocating(true);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData((prev) => ({
            ...prev,
            latitude: Number(pos.coords.latitude.toFixed(5)),
            longitude: Number(pos.coords.longitude.toFixed(5)),
            addressText:
              prev.addressText ||
              `GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
          }));

          setIsLocating(false);
        },

        (err) => {
          console.warn(
            '[Geolocation] GPS unavailable or permission denied:',
            err.message
          );

          setIsLocating(false);
        },

        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 30000,
        }
      );
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);

    const clientRequestId = uuidv4();

    const payload = {
      clientRequestId,

      citizenName: formData.citizenName || 'Stranded Citizen',

      contactNumber: formData.contactNumber,

      latitude: Number(formData.latitude),

      longitude: Number(formData.longitude),

      location: {
        type: 'Point',
        coordinates: [
          Number(formData.longitude),
          Number(formData.latitude),
        ],
      },

      addressText:
        formData.addressText ||
        `${formData.latitude}, ${formData.longitude}`,

      emergencyType: formData.emergencyType,

      severity: formData.severity,

      peopleCount: Number(formData.peopleCount),

      vulnerableDetails: {
        infants: Number(formData.infants),
        elderly: Number(formData.elderly),
        injured: Number(formData.injured),
      },

      notes: formData.notes,

      offlineCreatedAt: new Date().toISOString(),

      status: 'PENDING',
    };

    // Save the complete SOS information for SMS fallback
    setLastSOSPayload(payload);

    try {
      const response = await submitSOS(payload, isOnline);

      setSubmissionFeedback(response);

      if (onSOSLogged) {
        onSOSLogged(response);
      }

      setIsSubmitting(false);

      // Online SOS can close normally after showing success
      // Offline SOS stays open so the user can press SMS button
      if (isOnline) {
        setTimeout(() => {
          onClose();
        }, 2200);
      }
    } catch (err) {
      console.error('[SOS Modal] Submission failed:', err);

      setIsSubmitting(false);
    }
  };

  // Open the phone's default SMS/Messages application
  const handleEmergencySMS = () => {
    if (!lastSOSPayload) {
      console.warn('[SMS Fallback] No SOS payload available.');
      return;
    }

    triggerSMSApp('112', lastSOSPayload);
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">

      <div className="relative z-[10000] bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-200 my-auto">

        {/* Header */}
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">

          <div className="flex items-center space-x-3">

            <div className="p-2 rounded-lg bg-red-600/20 border border-red-500/40 text-red-500">
              <AlertOctagon className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>EMERGENCY SOS BROADCAST</span>
              </h2>

              <p className="text-xs text-slate-400">
                {isOnline
                  ? 'Active Grid: Transmitting directly to Incident Command'
                  : 'Zero Signal: Cached in device IndexedDB (Auto-syncs on reconnection)'}
              </p>
            </div>

          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

        </div>

        {/* Form Body */}
        {submissionFeedback ? (

          <div className="p-8 text-center space-y-4">

            <div className="flex justify-center">

              {submissionFeedback.queuedOffline ? (

                <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500 text-amber-400 flex items-center justify-center animate-bounce">
                  <Database className="w-8 h-8" />
                </div>

              ) : (

                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

              )}

            </div>

            <h3 className="text-xl font-extrabold text-white">

              {submissionFeedback.queuedOffline
                ? 'CACHED OFFLINE IN INDEXEDDB'
                : 'SOS TRANSMITTED SUCCESSFULLY'}

            </h3>

            <p className="text-sm text-slate-300">

              {submissionFeedback.queuedOffline
                ? 'Your emergency signal is safely locked on your local device. As soon as cell service or Wi-Fi reconnects, the bulk-sync engine will forward it immediately.'
                : 'Incident Command has registered your coordinates. Closest rescue responders are being calculated.'}

            </p>

            {/* SMS FALLBACK BUTTON */}
            {submissionFeedback.queuedOffline && lastSOSPayload && (

              <div className="pt-2 space-y-3">

                <div className="text-xs text-amber-300 bg-amber-950/40 border border-amber-800/70 rounded-lg p-3">
                  No internet? Send the SOS through your phone's SMS app.
                </div>

                <button
                  type="button"
                  onClick={handleEmergencySMS}
                  className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-extrabold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-green-600/30 transition"
                >
                  <span className="text-lg">📱</span>
                  <span>SEND EMERGENCY SMS</span>
                </button>

              </div>

            )}

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition text-sm"
            >
              CLOSE
            </button>

          </div>

        ) : (

          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
          >

            {/* Offline notification badge */}
            {!isOnline && (

              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/70 text-amber-300 text-xs flex items-center space-x-2.5">

                <Database className="w-4 h-4 flex-shrink-0 text-amber-400" />

                <span>
                  <strong>Store-and-Forward Active:</strong> Network offline.
                  This request will be indexed locally and queued for burst
                  transmission.
                </span>

              </div>

            )}

            {/* Emergency Type Selection */}
            <div>

              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Distress Category *
              </label>

              <div className="grid grid-cols-2 gap-2">

                {[
                  {
                    id: 'TRAPPED',
                    label: 'Trapped / Structural',
                    color: 'border-red-500 bg-red-950/30',
                  },
                  {
                    id: 'FLOOD_RISING',
                    label: 'Flood / Water Rising',
                    color: 'border-blue-500 bg-blue-950/30',
                  },
                  {
                    id: 'MEDICAL_CRITICAL',
                    label: 'Critical Medical',
                    color: 'border-purple-500 bg-purple-950/30',
                  },
                  {
                    id: 'FOOD_WATER',
                    label: 'Food & Clean Water',
                    color: 'border-amber-500 bg-amber-950/30',
                  },
                ].map((type) => (

                  <button
                    key={type.id}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        emergencyType: type.id,
                      })
                    }
                    className={`text-left p-3 rounded-xl border text-xs font-bold transition ${
                      formData.emergencyType === type.id
                        ? `${type.color} text-white ring-2 ring-red-500/50`
                        : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {type.label}
                  </button>

                ))}

              </div>

            </div>

            {/* Severity Level */}
            <div>

              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Urgency Severity *
              </label>

              <div className="grid grid-cols-4 gap-2">

                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (

                  <button
                    key={lvl}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        severity: lvl,
                      })
                    }
                    className={`py-2 rounded-lg text-xs font-extrabold border text-center transition ${
                      formData.severity === lvl
                        ? lvl === 'CRITICAL'
                          ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30'
                          : lvl === 'HIGH'
                          ? 'bg-orange-600 text-white border-orange-500'
                          : lvl === 'MEDIUM'
                          ? 'bg-yellow-600 text-slate-950 border-yellow-500'
                          : 'bg-blue-600 text-white border-blue-500'
                        : 'border-slate-800 bg-slate-800/60 text-slate-400'
                    }`}
                  >
                    {lvl}
                  </button>

                ))}

              </div>

            </div>

            {/* Coordinates & Location Detection */}
            <div className="space-y-2">

              <div className="flex items-center justify-between">

                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Location Coordinates (GeoJSON Point) *
                </label>

                <button
                  type="button"
                  onClick={detectGPSLocation}
                  disabled={isLocating}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center space-x-1"
                >
                  <Navigation
                    className={`w-3 h-3 ${
                      isLocating ? 'animate-spin' : ''
                    }`}
                  />

                  <span>
                    {isLocating
                      ? 'Acquiring GPS...'
                      : 'Auto-Detect GPS'}
                  </span>

                </button>

              </div>

              <div className="grid grid-cols-2 gap-2">

                <div>

                  <span className="text-[10px] text-slate-400">
                    Latitude
                  </span>

                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        latitude:
                          parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />

                </div>

                <div>

                  <span className="text-[10px] text-slate-400">
                    Longitude
                  </span>

                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        longitude:
                          parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />

                </div>

              </div>

              <input
                type="text"
                placeholder="Physical Landmark / Building description (e.g. Near Water Tank, Flat 3B)"
                value={formData.addressText}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    addressText: e.target.value,
                  })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />

            </div>

            {/* People Count & Vulnerable Groups */}
            <div className="grid grid-cols-2 gap-3 pt-1">

              <div>

                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1">

                  <Users className="w-3.5 h-3.5 text-slate-400" />

                  <span>Total People Stranded</span>

                </label>

                <input
                  type="number"
                  min="1"
                  required
                  value={formData.peopleCount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      peopleCount:
                        parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />

              </div>

              <div>

                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1">

                  <HeartPulse className="w-3.5 h-3.5 text-red-400" />

                  <span>Critically Injured</span>

                </label>

                <input
                  type="number"
                  min="0"
                  value={formData.injured}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      injured:
                        parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />

              </div>

            </div>

            {/* Citizen Name & Phone */}
            <div className="grid grid-cols-2 gap-2">

              <input
                type="text"
                placeholder="Contact Name (Optional)"
                value={formData.citizenName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    citizenName: e.target.value,
                  })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />

              <input
                type="text"
                placeholder="Contact Phone (Optional)"
                value={formData.contactNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactNumber: e.target.value,
                  })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />

            </div>

            {/* Notes */}
            <textarea
              rows="2"
              placeholder="Critical details (e.g. Inflow of water fast, roof access available, no insulin)"
              value={formData.notes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  notes: e.target.value,
                })
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 resize-none"
            />

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-red-600/40 transition disabled:opacity-50"
            >

              {isSubmitting ? (

                <>
                  <Loader2 className="w-4 h-4 animate-spin" />

                  <span>COMMITTING SIGNAL...</span>
                </>

              ) : (

                <>
                  <Send className="w-4 h-4" />

                  <span>
                    {isOnline
                      ? 'BROADCAST EMERGENCY SOS'
                      : 'CACHE SOS OFFLINE (STORE & FORWARD)'}
                  </span>
                </>

              )}

            </button>

          </form>

        )}

      </div>

    </div>
  );
};