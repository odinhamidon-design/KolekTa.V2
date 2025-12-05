/**
 * Unit tests for Authentication Middleware
 * Tests: authenticateToken, authorizeRole
 */

const jwt = require('jsonwebtoken');

// Mock the JWT_SECRET for testing
const JWT_SECRET = 'kolek-ta-secret-key-2024';

// Recreate the middleware functions for isolated testing
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
}

function authorizeRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access forbidden' });
    }
    next();
  };
}

// Mock Express request and response objects
function mockRequest(overrides = {}) {
  return {
    headers: {},
    user: null,
    ...overrides
  };
}

function mockResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('Authentication Middleware', () => {
  describe('authenticateToken', () => {
    test('should deny access when no token is provided', () => {
      const req = mockRequest();
      const res = mockResponse();
      const next = jest.fn();

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should deny access when authorization header is empty', () => {
      const req = mockRequest({ headers: { authorization: '' } });
      const res = mockResponse();
      const next = jest.fn();

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('should deny access when authorization header has no token', () => {
      const req = mockRequest({ headers: { authorization: 'Bearer ' } });
      const res = mockResponse();
      const next = jest.fn();

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject invalid token', () => {
      const req = mockRequest({ headers: { authorization: 'Bearer invalidtoken123' } });
      const res = mockResponse();
      const next = jest.fn();

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should accept valid token and set user on request', () => {
      const userData = { id: '123', username: 'admin', role: 'admin' };
      const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '1h' });

      const req = mockRequest({ headers: { authorization: `Bearer ${token}` } });
      const res = mockResponse();
      const next = jest.fn();

      authenticateToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.username).toBe('admin');
      expect(req.user.role).toBe('admin');
    });

    test('should reject expired token', () => {
      const userData = { id: '123', username: 'admin', role: 'admin' };
      const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '-1h' }); // Already expired

      const req = mockRequest({ headers: { authorization: `Bearer ${token}` } });
      const res = mockResponse();
      const next = jest.fn();

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject token signed with different secret', () => {
      const userData = { id: '123', username: 'admin', role: 'admin' };
      const token = jwt.sign(userData, 'different-secret', { expiresIn: '1h' });

      const req = mockRequest({ headers: { authorization: `Bearer ${token}` } });
      const res = mockResponse();
      const next = jest.fn();

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authorizeRole', () => {
    test('should allow access for user with matching role', () => {
      const req = mockRequest({ user: { role: 'admin' } });
      const res = mockResponse();
      const next = jest.fn();

      const middleware = authorizeRole('admin');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should allow access when user role matches any of multiple roles', () => {
      const req = mockRequest({ user: { role: 'driver' } });
      const res = mockResponse();
      const next = jest.fn();

      const middleware = authorizeRole('admin', 'driver', 'supervisor');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should deny access for user with non-matching role', () => {
      const req = mockRequest({ user: { role: 'driver' } });
      const res = mockResponse();
      const next = jest.fn();

      const middleware = authorizeRole('admin');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access forbidden' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should deny access when user role is undefined', () => {
      const req = mockRequest({ user: {} });
      const res = mockResponse();
      const next = jest.fn();

      const middleware = authorizeRole('admin');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle single role check', () => {
      const adminReq = mockRequest({ user: { role: 'admin' } });
      const driverReq = mockRequest({ user: { role: 'driver' } });
      const adminRes = mockResponse();
      const driverRes = mockResponse();
      const adminNext = jest.fn();
      const driverNext = jest.fn();

      const adminOnlyMiddleware = authorizeRole('admin');

      adminOnlyMiddleware(adminReq, adminRes, adminNext);
      adminOnlyMiddleware(driverReq, driverRes, driverNext);

      expect(adminNext).toHaveBeenCalled();
      expect(driverNext).not.toHaveBeenCalled();
      expect(driverRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('Integration - authenticateToken + authorizeRole', () => {
    test('should work together for admin user accessing admin route', () => {
      const userData = { id: '123', username: 'admin', role: 'admin' };
      const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '1h' });

      const req = mockRequest({ headers: { authorization: `Bearer ${token}` } });
      const res = mockResponse();
      const next1 = jest.fn();
      const next2 = jest.fn();

      // First, authenticate
      authenticateToken(req, res, next1);
      expect(next1).toHaveBeenCalled();

      // Then, authorize
      const authorize = authorizeRole('admin');
      authorize(req, res, next2);
      expect(next2).toHaveBeenCalled();
    });

    test('should block driver user from admin-only route', () => {
      const userData = { id: '456', username: 'driver1', role: 'driver' };
      const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '1h' });

      const req = mockRequest({ headers: { authorization: `Bearer ${token}` } });
      const res = mockResponse();
      const authNext = jest.fn();
      const roleNext = jest.fn();

      // First, authenticate (should pass)
      authenticateToken(req, res, authNext);
      expect(authNext).toHaveBeenCalled();

      // Then, authorize for admin (should fail)
      const authorize = authorizeRole('admin');
      authorize(req, res, roleNext);
      expect(roleNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
