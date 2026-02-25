/**
 * Socket.io Client — connects to the server for real-time GPS push updates.
 * Loaded on both admin and driver pages.
 *
 * Exposes:
 *   window.kolektaSocket  — the connected socket instance
 */
(function () {
    'use strict';

    let socket = null;

    function initSocketClient() {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('🔌 Socket: no auth token, skipping connection');
            return;
        }

        // Socket.io client is auto-served at /socket.io/socket.io.js
        if (typeof io === 'undefined') {
            console.warn('🔌 Socket.io client library not loaded');
            return;
        }

        socket = io({
            auth: { token },
            transports: ['websocket', 'polling'],  // prefer WebSocket
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000
        });

        socket.on('connect', () => {
            console.log('⚡ Socket connected:', socket.id);
        });

        socket.on('disconnect', (reason) => {
            console.log('⚡ Socket disconnected:', reason);
        });

        socket.on('connect_error', (err) => {
            console.warn('⚡ Socket connection error:', err.message);
        });

        // Expose globally
        window.kolektaSocket = socket;
    }

    // Initialise after DOM is ready and user is authenticated
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(initSocketClient, 500));
    } else {
        setTimeout(initSocketClient, 500);
    }
})();
