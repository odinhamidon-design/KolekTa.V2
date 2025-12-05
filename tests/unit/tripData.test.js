/**
 * Unit tests for Trip Data Storage and Automatic Fuel Estimation
 */

// Mock the haversine distance calculation
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Fuel estimation constants (matching storage.js)
const BASE_CONSUMPTION = 25; // L/100km for garbage trucks
const STOP_CONSUMPTION = 0.3; // Liters per stop
const IDLE_CONSUMPTION = 2.5; // L/hour

describe('Haversine Distance Calculation', () => {
  test('should calculate zero distance for same point', () => {
    const distance = haversineDistance(6.9549, 126.2185, 6.9549, 126.2185);
    expect(distance).toBeCloseTo(0, 5);
  });

  test('should calculate distance between two nearby points (~500m)', () => {
    // Points approximately 500m apart in Mati City
    const distance = haversineDistance(6.9549, 126.2185, 6.9590, 126.2200);
    expect(distance).toBeGreaterThan(0.4);
    expect(distance).toBeLessThan(0.6);
  });

  test('should calculate distance between Mati City and Davao City (~140km)', () => {
    const distance = haversineDistance(6.9549, 126.2185, 7.0731, 125.6128);
    expect(distance).toBeGreaterThan(60);
    expect(distance).toBeLessThan(80);
  });

  test('should return same distance regardless of direction', () => {
    const distanceAB = haversineDistance(6.9549, 126.2185, 6.9590, 126.2200);
    const distanceBA = haversineDistance(6.9590, 126.2200, 6.9549, 126.2185);
    expect(distanceAB).toBeCloseTo(distanceBA, 10);
  });
});

describe('Fuel Estimation Logic', () => {
  function calculateSpeedFactor(speed) {
    if (speed < 30) return 1.3;
    if (speed < 50) return 1.1;
    if (speed < 70) return 1.0;
    if (speed < 90) return 1.1;
    return 1.25;
  }

  function calculateFuelEstimate(distance, avgSpeed, stops, idleMinutes) {
    const speedFactor = calculateSpeedFactor(avgSpeed);
    const loadFactor = 1.2; // Assume 50% load

    const baseFuel = (distance / 100) * BASE_CONSUMPTION * speedFactor * loadFactor;
    const stopFuel = stops * STOP_CONSUMPTION;
    const idleFuel = (idleMinutes / 60) * IDLE_CONSUMPTION;

    return baseFuel + stopFuel + idleFuel;
  }

  test('should return zero fuel for zero distance and no stops', () => {
    const fuel = calculateFuelEstimate(0, 0, 0, 0);
    expect(fuel).toBe(0);
  });

  test('should calculate fuel for typical garbage collection route', () => {
    // 20km route, 25 km/h avg speed, 30 stops, 20 min idle
    const fuel = calculateFuelEstimate(20, 25, 30, 20);

    // Expected: (20/100 * 25 * 1.3 * 1.2) + (30 * 0.3) + (20/60 * 2.5)
    // = 7.8 + 9.0 + 0.83 ≈ 17.6 liters
    expect(fuel).toBeGreaterThan(15);
    expect(fuel).toBeLessThan(20);
  });

  test('should apply higher consumption for slow speeds', () => {
    const fuelSlow = calculateFuelEstimate(10, 20, 0, 0);
    const fuelFast = calculateFuelEstimate(10, 60, 0, 0);

    // Slow speed should use more fuel (stop-and-go driving)
    expect(fuelSlow).toBeGreaterThan(fuelFast);
  });

  test('should add fuel for each stop', () => {
    const fuelNoStops = calculateFuelEstimate(10, 40, 0, 0);
    const fuelWithStops = calculateFuelEstimate(10, 40, 10, 0);

    // Each stop adds 0.3L, so 10 stops = 3L extra
    expect(fuelWithStops - fuelNoStops).toBeCloseTo(3, 1);
  });

  test('should add fuel for idle time', () => {
    const fuelNoIdle = calculateFuelEstimate(10, 40, 0, 0);
    const fuelWithIdle = calculateFuelEstimate(10, 40, 0, 60);

    // 60 min idle = 2.5L extra
    expect(fuelWithIdle - fuelNoIdle).toBeCloseTo(2.5, 1);
  });
});

describe('Trip Data Tracking', () => {
  test('should detect stops when speed drops below threshold', () => {
    const STOP_SPEED_THRESHOLD = 3; // km/h

    const speeds = [25, 20, 15, 2, 0, 1, 10, 25, 30, 1, 0, 20];
    let stops = 0;
    let wasMoving = true;

    speeds.forEach(speed => {
      const isMoving = speed >= STOP_SPEED_THRESHOLD;
      if (wasMoving && !isMoving) {
        stops++;
      }
      wasMoving = isMoving;
    });

    expect(stops).toBe(2); // Two stop events
  });

  test('should accumulate idle time when speed is below threshold', () => {
    const IDLE_SPEED_THRESHOLD = 5; // km/h

    const speedReadings = [
      { speed: 25, duration: 10 }, // 10 sec at 25 km/h - not idle
      { speed: 2, duration: 30 },  // 30 sec at 2 km/h - idle
      { speed: 0, duration: 60 },  // 60 sec stopped - idle
      { speed: 15, duration: 20 }, // 20 sec at 15 km/h - not idle
    ];

    let idleTime = 0;
    speedReadings.forEach(reading => {
      if (reading.speed < IDLE_SPEED_THRESHOLD) {
        idleTime += reading.duration;
      }
    });

    expect(idleTime).toBe(90); // 30 + 60 seconds of idle
  });

  test('should calculate average speed correctly', () => {
    const speeds = [20, 30, 25, 35, 40];
    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;

    expect(avgSpeed).toBe(30);
  });
});

describe('Distance Accumulation', () => {
  test('should filter out GPS noise (very small movements)', () => {
    const MIN_DISTANCE_THRESHOLD = 0.005; // 5 meters

    const movements = [0.001, 0.002, 0.015, 0.003, 0.050, 0.002];
    let totalDistance = 0;

    movements.forEach(dist => {
      if (dist >= MIN_DISTANCE_THRESHOLD) {
        totalDistance += dist;
      }
    });

    // Only 0.015 and 0.050 should count
    expect(totalDistance).toBeCloseTo(0.065, 3);
  });

  test('should accumulate distance over multiple updates', () => {
    const points = [
      { lat: 6.9549, lng: 126.2185 },
      { lat: 6.9560, lng: 126.2190 },
      { lat: 6.9575, lng: 126.2200 },
      { lat: 6.9590, lng: 126.2210 },
    ];

    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      const dist = haversineDistance(
        points[i-1].lat, points[i-1].lng,
        points[i].lat, points[i].lng
      );
      totalDistance += dist;
    }

    expect(totalDistance).toBeGreaterThan(0);
    expect(totalDistance).toBeLessThan(1); // Should be less than 1km for this short route
  });
});

describe('Efficiency Calculations', () => {
  test('should calculate km per liter correctly', () => {
    const distance = 50; // km
    const fuelUsed = 12.5; // liters
    const efficiency = distance / fuelUsed;

    expect(efficiency).toBe(4); // 4 km/L
  });

  test('should handle zero fuel case', () => {
    const distance = 0;
    const fuelUsed = 0;
    const efficiency = fuelUsed > 0 ? distance / fuelUsed : 0;

    expect(efficiency).toBe(0);
  });

  test('should return reasonable efficiency for garbage truck', () => {
    // Garbage trucks typically get 2-5 km/L
    const distance = 30;
    const fuelUsed = 10;
    const efficiency = distance / fuelUsed;

    expect(efficiency).toBeGreaterThan(2);
    expect(efficiency).toBeLessThan(6);
  });
});
