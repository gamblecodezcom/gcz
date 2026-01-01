/**
 * Check if an entry source is allowed for a raffle
 * @param {Object} raffle - Raffle object with entry_sources field
 * @param {string} source - Entry source to check ('daily_checkin', 'wheel', 'wheel_spin', 'secret_code', 'manual')
 * @returns {boolean} - True if source is allowed, false otherwise
 */
export function isEntrySourceAllowed(raffle, source) {
  if (!raffle || !source) {
    return false;
  }
  
  // Parse entry_sources if it's a string
  let entrySources = raffle.entry_sources;
  if (typeof entrySources === 'string') {
    try {
      entrySources = JSON.parse(entrySources || '[]');
    } catch (e) {
      console.error('Error parsing entry_sources:', e);
      return false;
    }
  }
  
  if (!Array.isArray(entrySources)) {
    return false;
  }
  
  // Handle wheel_spin as an alias for wheel
  if (source === 'wheel_spin') {
    return entrySources.includes('wheel') || entrySources.includes('wheel_spin');
  }
  
  return entrySources.includes(source);
}
