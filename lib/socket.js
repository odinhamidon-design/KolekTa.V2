/**
 * Socket.io Singleton Module
 * Provides real-time WebSocket communication for GPS tracking.
 *
 * Usage from any route/module:
 *   const { getIO } = require('../lib/socket');
 *   getIO().to('admins').emit('driver:location', data);
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('./logger');

const JWT_SECRET = process.env.JWT_SECRET || 'kolek-ta-dev-fallback-secret';

let io = null;

/**
 * Initialise Socket.io on the given HTTP server.
 * Should be called exactly once from server.js.
 */
function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: '*',            // same-origin in production; '*' keeps dev easy
            methods: ['GET', 'POST']
        },
        // Graceful fallback: try WebSocket first, then long-polling
        transports: ['websocket', 'polling']
    });

    // ── Auth middleware ──────────────────────────────────────────────
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            socket.user = decoded;          // { username, role, ... }
            next();
        } catch (err) {
            return next(new Error('Invalid token'));
        }
    });

    // ── Connection handler ───────────────────────────────────────────
    io.on('connection', (socket) => {
        const { username, role } = socket.user;
        logger.info(`⚡ Socket connected: ${username} (${role})`);

        // Admins join a dedicated room so we can broadcast to them
        if (role === 'admin') {
            socket.join('admins');
            logger.debug(`   └─ ${username} joined "admins" room`);
        }

        // Drivers join their own room (useful for targeted messages)
        if (role === 'driver') {
            socket.join(`driver:${username}`);
            logger.debug(`   └─ ${username} joined "driver:${username}" room`);
        }

        socket.on('disconnect', (reason) => {
            logger.info(`⚡ Socket disconnected: ${username} (${reason})`);
        });
    });

    logger.info('⚡ Socket.io initialised');
    return io;
}

/** Get the current io instance. Throws if called before initSocket(). */
function getIO() {
    if (!io) {
        throw new Error('Socket.io has not been initialised — call initSocket(server) first');
    }
    return io;
}

module.exports = { initSocket, getIO };
