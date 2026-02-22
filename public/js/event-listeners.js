/**
 * event-listeners.js
 *
 * Centralizes all static onclick bindings for index.html so that
 * 'unsafe-inline' can eventually be removed from the Content Security Policy.
 *
 * Each binding uses getElementById (preferred) or querySelector as fallback.
 * This file is loaded LAST in index.html (after all feature JS files),
 * so all referenced functions are guaranteed to be defined.
 *
 * NOTE: Dynamic HTML built with template literals (route cards, stop rows, etc.)
 * still uses onclick — those require event delegation and will be addressed
 * in a follow-up refactor.
 */

/** Helper: wire a click listener if element exists */
function on(selectorOrId, handler) {
    // Try by ID first, then CSS selector
    const el = document.getElementById(selectorOrId) || document.querySelector(selectorOrId);
    if (el) el.addEventListener('click', handler);
}

document.addEventListener('DOMContentLoaded', () => {

    // ── Header ──────────────────────────────────────────────────────────────────

    // Profile button (could have id "headerProfileBtn" if ID was injected, or match by selector)
    on('headerProfileBtn', () => showProfile());
    // Also try selector fallback — button in header with flex+gap-2+bg-white/10
    const profileBtnFallback = document.querySelector('header button.bg-white\\/10');
    if (profileBtnFallback && !profileBtnFallback.id) {
        profileBtnFallback.addEventListener('click', () => showProfile());
    }

    // Logout button
    on('headerLogoutBtn', () => logout());

    // ── Sidebar ──────────────────────────────────────────────────────────────────

    // Sidebar overlay (click-outside to close)
    on('sidebarOverlay', () => toggleSidebar());

    // Sidebar close button (mobile X button inside sidebar header)
    on('sidebarCloseBtn', () => toggleSidebar());

    // ── Modal ─────────────────────────────────────────────────────────────────────

    // Modal close button (X in modal header)
    on('modalCloseBtn', () => closeModal());
    // Fallback: button inside modal header
    const modalHeader = document.querySelector('#modal .bg-gradient-to-r button');
    if (modalHeader && !modalHeader.id) {
        modalHeader.addEventListener('click', () => closeModal());
    }

    // ── Driver GPS controls ───────────────────────────────────────────────────────

    on('gpsTestBtn', () => testGPSConnection());
    on('startGpsBtn', () => toggleGPSTracking());
    on('overlayGpsBtn', () => toggleGPSTracking());
    on('mobileGpsStatusPill', () => toggleGPSTracking());

    // ── Driver active route controls ──────────────────────────────────────────────

    on('sidebarNavigateBtn', () => showActiveRouteNavigation());
    on('sidebarCompleteBtn', () => markRouteComplete(localStorage.getItem('activeRouteId')));
    on('overlayNavigateBtn', () => showActiveRouteNavigation());
    on('overlayCompleteBtn', () => markRouteComplete(localStorage.getItem('activeRouteId')));

    // ── Driver quick action buttons ────────────────────────────────────────────────

    on('sidebarInspectionBtn', () => showVehicleInspection());
    on('sidebarStatsBtn', () => showDriverStats());
    on('sidebarReportBtn', () => reportIncident());
    // viewDriverHistoryBtn — already had id, but no onclick now
    on('viewDriverHistoryBtn', () => showDriverHistory());

    on('overlayInspectionBtn', () => showVehicleInspection());
    on('overlayStatsBtn', () => showDriverStats());
    on('overlayReportBtn', () => reportIncident());
    on('overlayHistoryBtn', () => showDriverHistory());
    on('assignmentsToggleBtn', () => {
        const panel = document.getElementById('overlayAssignments');
        const icon = document.getElementById('assignmentsToggleIcon');
        if (panel) {
            const isHidden = panel.classList.toggle('hidden');
            if (icon) icon.style.transform = isHidden ? 'rotate(-90deg)' : '';
        }
    });

});
