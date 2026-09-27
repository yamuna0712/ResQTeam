/**
 * Client-side SMS Fallback Utility for resQteam
 * Formats emergency distress signals and constructs standard sms: URIs
 * Enables zero-data emergency dispatch over 2G GSM cellular networks
 */

export const DEFAULT_EMERGENCY_NUMBER = '112'; // Universal emergency number (GSM standard)

/**
 * Format SOS data into a concise, human- and dispatcher-readable text message
 */
export const formatSOSText = (sosData = {}) => {
  const coords =
    sosData.location?.coordinates ||
    (sosData.latitude && sosData.longitude ? [sosData.longitude, sosData.latitude] : null);

  const latStr = coords ? Number(coords[1]).toFixed(5) : 'N/A';
  const lngStr = coords ? Number(coords[0]).toFixed(5) : 'N/A';

  const parts = [
    `🚨 [resQteam EMERGENCY SOS]`,
    `TYPE: ${sosData.emergencyType || 'TRAPPED'}`,
    `SEVERITY: ${sosData.severity || 'CRITICAL'}`,
    `PEOPLE: ${sosData.peopleCount || 1}`,
    `GPS: ${latStr}, ${lngStr}`,
  ];

  if (sosData.addressText) {
    parts.push(`LOC: ${sosData.addressText}`);
  }

  if (sosData.citizenName && sosData.citizenName !== 'Stranded Citizen' && sosData.citizenName !== 'Anonymous Citizen') {
    parts.push(`NAME: ${sosData.citizenName}`);
  }

  if (sosData.contactNumber) {
    parts.push(`TEL: ${sosData.contactNumber}`);
  }

  if (sosData.notes) {
    parts.push(`DETAILS: ${sosData.notes}`);
  }

  if (sosData.clientRequestId) {
    parts.push(`REF: #${sosData.clientRequestId.slice(0, 8)}`);
  }

  return parts.join('\n');
};

/**
 * Construct cross-platform sms: URI
 * Supports both iOS (&body=) and Android/Desktop (?body=) schemes
 */
export const buildSMSUri = (emergencyNumber = DEFAULT_EMERGENCY_NUMBER, sosData = {}) => {
  const bodyText = formatSOSText(sosData);
  const isIOS =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !window.MSStream;

  const separator = isIOS ? '&' : '?';
  const cleanNumber = (emergencyNumber || DEFAULT_EMERGENCY_NUMBER).trim();

  return `sms:${cleanNumber}${separator}body=${encodeURIComponent(bodyText)}`;
};

/**
 * Trigger device's default Messages app with pre-filled number and body
 */
export const triggerSMSApp = (emergencyNumber = DEFAULT_EMERGENCY_NUMBER, sosData = {}) => {
  const uri = buildSMSUri(emergencyNumber, sosData);
  console.log(`[SMS Fallback] Launching SMS app with URI:`, uri);

  // Attempt window.location navigation to trigger native scheme
  window.location.href = uri;
  return uri;
};
