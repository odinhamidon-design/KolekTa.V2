/**
 * Unit tests for Route Optimizer Library
 * Tests: haversineDistance, calculateTotalDistance, nearestNeighbor, twoOptImprovement
 */

const {
  haversineDistance,
  calculateTotalDistance,
  nearestNeighbor,
  twoOptImprovement,
  formatTime,
  estimateTime,
  DEFAULT_DEPOT
} = require('../../lib/routeOptimizer');

describe('Route Optimizer - Haversine Distance', () => {
  test('should calculate distance between same point as 0', () => {
    const point = { lat: 6.9551, lng: 126.2166 };
    const distance = haversineDistance(point, point);
    expect(distance).toBe(0);
  });

  test('should calculate correct distance between Mati City and Davao City', () => {
    const matiCity = { lat: 6.9551, lng: 126.2166 };
    const davaoCity = { lat: 7.0731, lng: 125.6128 };
    const distance = haversineDistance(matiCity, davaoCity);
    // Approximately 68-70 km
    expect(distance).toBeGreaterThan(65);
    expect(distance).toBeLessThan(75);
  });

  test('should return same distance regardless of direction', () => {
    const point1 = { lat: 6.9551, lng: 126.2166 };
    const point2 = { lat: 7.0731, lng: 125.6128 };
    const dist1 = haversineDistance(point1, point2);
    const dist2 = haversineDistance(point2, point1);
    expect(dist1).toBeCloseTo(dist2, 10);
  });

  test('should handle small distances accurately', () => {
    const point1 = { lat: 6.9551, lng: 126.2166 };
    const point2 = { lat: 6.9561, lng: 126.2176 }; // ~150m away
    const distance = haversineDistance(point1, point2);
    expect(distance).toBeGreaterThan(0.1);
    expect(distance).toBeLessThan(0.3);
  });
});

describe('Route Optimizer - Calculate Total Distance', () => {
  const depot = { lat: 6.9551, lng: 126.2166 };

  test('should return 0 for empty locations array', () => {
    const distance = calculateTotalDistance([], depot);
    expect(distance).toBe(0);
  });

  test('should calculate round trip for single location', () => {
    const locations = [{ lat: 6.9600, lng: 126.2200 }];
    const distance = calculateTotalDistance(locations, depot);
    // Should be approximately 2x the one-way distance
    const oneWay = haversineDistance(depot, locations[0]);
    expect(distance).toBeCloseTo(oneWay * 2, 1);
  });

  test('should calculate correct distance for multiple locations', () => {
    const locations = [
      { lat: 6.9600, lng: 126.2200 },
      { lat: 6.9650, lng: 126.2250 },
      { lat: 6.9700, lng: 126.2300 }
    ];
    const distance = calculateTotalDistance(locations, depot);
    expect(distance).toBeGreaterThan(0);
    expect(typeof distance).toBe('number');
  });

  test('should use default depot if not provided', () => {
    const locations = [{ lat: 6.9600, lng: 126.2200 }];
    const distance = calculateTotalDistance(locations);
    expect(distance).toBeGreaterThan(0);
  });
});

describe('Route Optimizer - Nearest Neighbor Algorithm', () => {
  const depot = { lat: 6.9551, lng: 126.2166 };

  test('should handle empty locations', () => {
    const result = nearestNeighbor([], depot);
    expect(result.optimizedOrder).toHaveLength(0);
    expect(result.originalDistance).toBe(0);
    expect(result.optimizedDistance).toBe(0);
  });

  test('should handle single location', () => {
    const locations = [{ lat: 6.9600, lng: 126.2200, name: 'Stop 1' }];
    const result = nearestNeighbor(locations, depot);
    expect(result.optimizedOrder).toHaveLength(1);
    expect(result.distanceSaved).toBe(0);
  });

  test('should optimize route with multiple locations', () => {
    const locations = [
      { lat: 6.9800, lng: 126.2400, name: 'Far Stop' },
      { lat: 6.9560, lng: 126.2180, name: 'Near Stop 1' },
      { lat: 6.9700, lng: 126.2300, name: 'Medium Stop' },
      { lat: 6.9570, lng: 126.2190, name: 'Near Stop 2' }
    ];
    const result = nearestNeighbor(locations, depot);

    expect(result.optimizedOrder).toHaveLength(4);
    expect(result.optimizedDistance).toBeLessThanOrEqual(result.originalDistance);
    expect(result.percentageSaved).toBeGreaterThanOrEqual(0);
    expect(result.depot).toEqual(depot);
  });

  test('should include estimated time in result', () => {
    const locations = [
      { lat: 6.9600, lng: 126.2200 },
      { lat: 6.9650, lng: 126.2250 }
    ];
    const result = nearestNeighbor(locations, depot);
    expect(result.estimatedTime).toBeDefined();
    expect(result.estimatedTime.travelMinutes).toBeGreaterThanOrEqual(0);
  });
});

describe('Route Optimizer - 2-opt Improvement', () => {
  const depot = { lat: 6.9551, lng: 126.2166 };

  test('should handle small routes (<=3 locations)', () => {
    const locations = [
      { lat: 6.9600, lng: 126.2200 },
      { lat: 6.9650, lng: 126.2250 }
    ];
    const result = twoOptImprovement(locations, depot);
    expect(result.optimizedOrder).toHaveLength(2);
  });

  test('should improve upon nearest neighbor for larger routes', () => {
    const locations = [
      { lat: 6.9800, lng: 126.2400 },
      { lat: 6.9560, lng: 126.2180 },
      { lat: 6.9700, lng: 126.2300 },
      { lat: 6.9570, lng: 126.2190 },
      { lat: 6.9650, lng: 126.2250 }
    ];
    const result = twoOptImprovement(locations, depot);

    expect(result.optimizedOrder).toHaveLength(5);
    expect(result.optimizedDistance).toBeLessThanOrEqual(result.originalDistance);
    expect(result.iterations).toBeDefined();
  });
});

describe('Route Optimizer - Time Utilities', () => {
  test('formatTime should format minutes correctly', () => {
    expect(formatTime(30)).toBe('30 min');
    expect(formatTime(60)).toBe('1h');
    expect(formatTime(90)).toBe('1h 30min');
    expect(formatTime(120)).toBe('2h');
    expect(formatTime(145)).toBe('2h 25min');
  });

  test('estimateTime should calculate travel time', () => {
    const result = estimateTime(25); // 25 km at 25 km/h = 60 min
    expect(result.travelMinutes).toBe(60);
    expect(result.formatted).toBe('1h');
  });

  test('estimateTime should handle zero distance', () => {
    const result = estimateTime(0);
    expect(result.travelMinutes).toBe(0);
  });
});

describe('Route Optimizer - Default Depot', () => {
  test('DEFAULT_DEPOT should be Mati City Hall area', () => {
    expect(DEFAULT_DEPOT.lat).toBeCloseTo(6.9551, 3);
    expect(DEFAULT_DEPOT.lng).toBeCloseTo(126.2166, 3);
    expect(DEFAULT_DEPOT.name).toContain('Mati');
  });
});
