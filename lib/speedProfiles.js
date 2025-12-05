/**
 * Speed Profiles Configuration
 * Defines different speed profiles for various collection scenarios
 */

const SPEED_PROFILES = {
  // Standard urban waste collection profile
  urban_collection: {
    name: 'Urban Collection',
    description: 'Standard waste collection in urban/suburban areas',
    baseSpeed: 20, // km/h average driving speed in collection mode
    stopTime: 3, // minutes per stop (approach, collect, depart)
    loadingTime: 1.5, // additional minutes based on bin fill level
    trafficFactor: {
      early_morning: 1.2, // 5-7 AM: light traffic
      morning_rush: 0.65, // 7-9 AM: heavy traffic
      midday: 0.9, // 9 AM - 4 PM: moderate traffic
      evening_rush: 0.6, // 4-7 PM: heavy traffic
      evening: 1.0, // 7-10 PM: normal
      night: 1.3 // 10 PM - 5 AM: light traffic
    }
  },

  // Rural/highway transfer between areas
  highway_transfer: {
    name: 'Highway Transfer',
    description: 'Traveling between collection areas or to depot',
    baseSpeed: 50, // km/h average on highways/main roads
    stopTime: 0,
    loadingTime: 0,
    trafficFactor: {
      early_morning: 1.1,
      morning_rush: 0.75,
      midday: 0.95,
      evening_rush: 0.7,
      evening: 1.0,
      night: 1.15
    }
  },

  // Dense commercial/downtown areas
  downtown_collection: {
    name: 'Downtown Collection',
    description: 'Collection in dense commercial/downtown areas',
    baseSpeed: 12, // km/h - slower due to traffic, pedestrians
    stopTime: 4, // longer stops in busy areas
    loadingTime: 2,
    trafficFactor: {
      early_morning: 1.4, // best time for downtown collection
      morning_rush: 0.5, // avoid if possible
      midday: 0.7,
      evening_rush: 0.45,
      evening: 0.85,
      night: 1.5
    }
  },

  // Residential subdivision collection
  residential: {
    name: 'Residential',
    description: 'Collection in residential subdivisions',
    baseSpeed: 18,
    stopTime: 2.5, // shorter stops, more accessible
    loadingTime: 1,
    trafficFactor: {
      early_morning: 1.1,
      morning_rush: 0.8, // some traffic as people leave for work
      midday: 1.0,
      evening_rush: 0.85,
      evening: 1.0,
      night: 1.2
    }
  }
};

// Default waste density for weight estimation (kg per liter)
const WASTE_DENSITY = {
  general: 0.25, // Mixed municipal waste: ~200-300 kg/m³
  recyclable: 0.15, // Paper, plastic, etc: lighter
  organic: 0.35, // Food waste: heavier, more dense
  default: 0.25
};

/**
 * Get time period based on hour
 * @param {number} hour - Hour of day (0-23)
 * @returns {string} Time period key
 */
function getTimePeriod(hour) {
  if (hour >= 5 && hour < 7) return 'early_morning';
  if (hour >= 7 && hour < 9) return 'morning_rush';
  if (hour >= 9 && hour < 16) return 'midday';
  if (hour >= 16 && hour < 19) return 'evening_rush';
  if (hour >= 19 && hour < 22) return 'evening';
  return 'night';
}

/**
 * Get time period from time string
 * @param {string} timeStr - Time in "HH:MM" format
 * @returns {string} Time period key
 */
function getTimePeriodFromString(timeStr) {
  if (!timeStr) return 'midday';
  const [hours] = timeStr.split(':').map(Number);
  return getTimePeriod(hours);
}

/**
 * Calculate estimated time for a route segment
 * @param {Object} options
 * @param {number} options.distance - Distance in km
 * @param {number} options.osrmDuration - Duration from OSRM in seconds (optional)
 * @param {number} options.numStops - Number of stops
 * @param {number} options.avgFillLevel - Average fill level (0-1)
 * @param {string} options.timeOfDay - Time period or "HH:MM" string
 * @param {string} options.profile - Speed profile key
 * @returns {Object} Time breakdown
 */
function estimateRouteTime(options = {}) {
  const {
    distance = 0,
    osrmDuration = null,
    numStops = 0,
    avgFillLevel = 0.5,
    timeOfDay = 'midday',
    profile = 'urban_collection'
  } = options;

  const speedProfile = SPEED_PROFILES[profile] || SPEED_PROFILES.urban_collection;

  // Determine time period
  const timePeriod = timeOfDay.includes(':')
    ? getTimePeriodFromString(timeOfDay)
    : timeOfDay;

  const trafficFactor = speedProfile.trafficFactor[timePeriod] || 1.0;

  // Calculate travel time
  let travelMinutes;
  if (osrmDuration !== null) {
    // Use OSRM's calculated duration, adjusted for traffic
    travelMinutes = (osrmDuration / 60) / trafficFactor;
  } else {
    // Fallback to speed-based calculation
    const effectiveSpeed = speedProfile.baseSpeed * trafficFactor;
    travelMinutes = (distance / effectiveSpeed) * 60;
  }

  // Calculate stop time
  const stopMinutes = numStops * speedProfile.stopTime;

  // Calculate loading time (varies by fill level)
  const loadMinutes = numStops * speedProfile.loadingTime * avgFillLevel;

  const totalMinutes = travelMinutes + stopMinutes + loadMinutes;

  return {
    travelMinutes: Math.round(travelMinutes),
    stopMinutes: Math.round(stopMinutes),
    loadMinutes: Math.round(loadMinutes),
    totalMinutes: Math.round(totalMinutes),
    formatted: formatDuration(totalMinutes),
    breakdown: {
      travel: formatDuration(travelMinutes),
      stops: formatDuration(stopMinutes),
      loading: formatDuration(loadMinutes)
    },
    factors: {
      profile: speedProfile.name,
      timePeriod,
      trafficFactor,
      usedOsrm: osrmDuration !== null
    }
  };
}

/**
 * Estimate bin weight based on capacity and fill level
 * @param {Object} bin - Bin object with capacity, currentLevel, binType
 * @returns {number} Estimated weight in kg
 */
function estimateBinWeight(bin) {
  const capacity = bin.capacity || 100; // liters
  const fillLevel = (bin.currentLevel || 0) / 100; // convert percentage to decimal
  const binType = bin.binType || 'general';
  const density = WASTE_DENSITY[binType] || WASTE_DENSITY.default;

  return Math.round(capacity * fillLevel * density * 10) / 10; // kg, 1 decimal
}

/**
 * Format duration in minutes to human readable string
 * @param {number} minutes
 * @returns {string}
 */
function formatDuration(minutes) {
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;

  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

/**
 * Get all available speed profiles
 * @returns {Object} All speed profiles
 */
function getProfiles() {
  return Object.keys(SPEED_PROFILES).map(key => ({
    key,
    ...SPEED_PROFILES[key]
  }));
}

/**
 * Get a specific speed profile
 * @param {string} profileKey
 * @returns {Object|null}
 */
function getProfile(profileKey) {
  return SPEED_PROFILES[profileKey] || null;
}

module.exports = {
  SPEED_PROFILES,
  WASTE_DENSITY,
  getTimePeriod,
  getTimePeriodFromString,
  estimateRouteTime,
  estimateBinWeight,
  formatDuration,
  getProfiles,
  getProfile
};
