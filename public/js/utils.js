/**
 * Kolek-Ta Shared UI Utilities
 * escapeHtml, loading overlay, toast, alert/confirm modals, page/modal system, getTimeAgo
 */
(function() {
  'use strict';

  // ============================================
  // SECURITY: HTML ESCAPING UTILITY
  // ============================================

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ============================================
  // PAGE LOADING OVERLAY
  // ============================================

  function showPageLoading(text = 'Loading...') {
    const overlay = document.getElementById('pageLoadingOverlay');
    const loadingText = document.getElementById('loadingText');
    if (overlay) {
      if (loadingText) loadingText.textContent = text;
      overlay.style.display = 'flex';
      overlay.style.opacity = '1';
    }
  }

  function hidePageLoading() {
    const overlay = document.getElementById('pageLoadingOverlay');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 300);
    }
  }

  // ============================================
  // TOAST NOTIFICATION SYSTEM
  // ============================================

  function ensureToastContainer() {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-sm';
      document.body.appendChild(container);
    }
    return container;
  }

  function showToast(message, type = 'info', duration = 4000) {
    const container = ensureToastContainer();

    const icons = {
      success: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>',
      error: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>',
      warning: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>',
      info: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
    };

    const colors = {
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800'
    };

    const iconColors = {
      success: 'text-green-500',
      error: 'text-red-500',
      warning: 'text-yellow-500',
      info: 'text-blue-500'
    };

    const toast = document.createElement('div');
    toast.className = `flex items-start gap-3 p-4 rounded-xl border shadow-lg ${colors[type]} animate-slide-in`;
    toast.innerHTML = `
      <span class="${iconColors[type]} flex-shrink-0 mt-0.5">${icons[type]}</span>
      <p class="text-sm font-medium flex-1">${message.replace(/\n/g, '<br>')}</p>
      <button onclick="this.parentElement.remove()" class="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    `;

    container.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }

    return toast;
  }

  // ============================================
  // ALERT MODAL
  // ============================================

  function showAlertModal(title, message, type = 'info', onClose = null, autoClose = true) {
    const config = {
      success: {
        icon: 'check-circle',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        buttonBg: 'bg-green-500 hover:bg-green-600 active:bg-green-700',
        headerBg: 'bg-gradient-to-r from-green-500 to-green-400',
        autoCloseDelay: 2500
      },
      error: {
        icon: 'x-circle',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        buttonBg: 'bg-red-500 hover:bg-red-600 active:bg-red-700',
        headerBg: 'bg-gradient-to-r from-red-500 to-red-400',
        autoCloseDelay: 0
      },
      warning: {
        icon: 'alert-triangle',
        iconBg: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
        buttonBg: 'bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700',
        headerBg: 'bg-gradient-to-r from-yellow-500 to-yellow-400',
        autoCloseDelay: 0
      },
      info: {
        icon: 'info',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        buttonBg: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700',
        headerBg: 'bg-gradient-to-r from-blue-500 to-blue-400',
        autoCloseDelay: 3000
      }
    };

    const cfg = config[type] || config.info;

    const existingModal = document.getElementById('alertModal');
    if (existingModal) existingModal.remove();

    const overlay = document.createElement('div');
    overlay.id = 'alertModal';
    overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in';

    overlay.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-scale-in">
        <div class="${cfg.headerBg} p-6 text-center">
          <div class="w-16 h-16 ${cfg.iconBg} rounded-full flex items-center justify-center mx-auto shadow-lg">
            <i data-lucide="${cfg.icon}" class="w-8 h-8 ${cfg.iconColor}"></i>
          </div>
        </div>
        <div class="p-6 text-center">
          <h3 class="text-xl font-bold text-gray-800 mb-2">${title}</h3>
          <p class="text-gray-600 text-sm whitespace-pre-line leading-relaxed">${message}</p>
          ${autoClose && cfg.autoCloseDelay > 0 ? `
            <div class="mt-4 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
              <div class="alert-progress h-full ${cfg.buttonBg.split(' ')[0]} transition-all duration-[${cfg.autoCloseDelay}ms]" style="width: 100%"></div>
            </div>
          ` : ''}
        </div>
        <div class="px-6 pb-6">
          <button id="alertModalClose" class="w-full ${cfg.buttonBg} text-white font-semibold py-3 rounded-xl transition-all transform active:scale-95 flex items-center justify-center gap-2">
            <i data-lucide="check" class="w-5 h-5"></i>
            <span>Got it</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    if (autoClose && cfg.autoCloseDelay > 0) {
      const progressBar = overlay.querySelector('.alert-progress');
      if (progressBar) {
        setTimeout(() => progressBar.style.width = '0%', 50);
      }
    }

    const closeAlert = () => {
      overlay.classList.add('animate-fade-out');
      setTimeout(() => {
        overlay.remove();
        if (onClose) onClose();
      }, 200);
    };

    document.getElementById('alertModalClose').addEventListener('click', closeAlert);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAlert();
    });

    let autoCloseTimer = null;
    if (autoClose && cfg.autoCloseDelay > 0) {
      autoCloseTimer = setTimeout(closeAlert, cfg.autoCloseDelay);
    }

    overlay.querySelector('.bg-white').addEventListener('mouseenter', () => {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
        const progressBar = overlay.querySelector('.alert-progress');
        if (progressBar) progressBar.style.width = '100%';
      }
    });

    return overlay;
  }

  // ============================================
  // CONFIRM MODALS
  // ============================================

  function showConfirmModal(title, message, onConfirm, onCancel, type) {
    if (onCancel === undefined) onCancel = null;
    if (type === undefined) type = 'warning';
    const config = {
      warning: { icon: 'alert-triangle', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600', confirmBg: 'bg-yellow-500 hover:bg-yellow-600' },
      danger: { icon: 'trash-2', iconBg: 'bg-red-100', iconColor: 'text-red-600', confirmBg: 'bg-red-500 hover:bg-red-600' },
      info: { icon: 'help-circle', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', confirmBg: 'bg-blue-500 hover:bg-blue-600' },
      success: { icon: 'check-circle', iconBg: 'bg-green-100', iconColor: 'text-green-600', confirmBg: 'bg-green-500 hover:bg-green-600' }
    };
    const cfg = config[type] || config.warning;

    const overlay = document.createElement('div');
    overlay.id = 'confirmModal';
    overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in';

    overlay.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
        <div class="p-6 text-center">
          <div class="w-16 h-16 ${cfg.iconBg} rounded-full flex items-center justify-center mx-auto mb-4">
            <i data-lucide="${cfg.icon}" class="w-8 h-8 ${cfg.iconColor}"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">${title}</h3>
          <p class="text-gray-600 text-sm whitespace-pre-line leading-relaxed">${message}</p>
        </div>
        <div class="px-6 pb-6 flex gap-3">
          <button id="confirmModalCancel" class="flex-1 border-2 border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all transform active:scale-95 flex items-center justify-center gap-2">
            <i data-lucide="x" class="w-4 h-4"></i>
            Cancel
          </button>
          <button id="confirmModalConfirm" class="flex-1 ${cfg.confirmBg} text-white font-semibold py-3 rounded-xl transition-all transform active:scale-95 flex items-center justify-center gap-2">
            <i data-lucide="check" class="w-4 h-4"></i>
            Confirm
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    if (typeof lucide !== 'undefined') lucide.createIcons();

    const closeOverlay = () => {
      overlay.classList.add('animate-fade-out');
      setTimeout(() => overlay.remove(), 200);
    };

    document.getElementById('confirmModalCancel').addEventListener('click', () => {
      closeOverlay();
      if (onCancel) onCancel();
    });

    document.getElementById('confirmModalConfirm').addEventListener('click', () => {
      closeOverlay();
      if (onConfirm) onConfirm();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeOverlay();
        if (onCancel) onCancel();
      }
    });

    return overlay;
  }

  function showConfirm(title, message, type) {
    if (type === undefined) type = 'warning';
    return new Promise((resolve) => {
      const config = {
        warning: { icon: 'alert-triangle', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600', confirmBg: 'bg-yellow-500 hover:bg-yellow-600' },
        danger: { icon: 'trash-2', iconBg: 'bg-red-100', iconColor: 'text-red-600', confirmBg: 'bg-red-500 hover:bg-red-600' },
        info: { icon: 'help-circle', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', confirmBg: 'bg-blue-500 hover:bg-blue-600' },
        success: { icon: 'check-circle', iconBg: 'bg-green-100', iconColor: 'text-green-600', confirmBg: 'bg-green-500 hover:bg-green-600' }
      };
      const cfg = config[type] || config.warning;

      const existing = document.getElementById('confirmModal');
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.id = 'confirmModal';
      overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in';

      overlay.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
          <div class="p-6 text-center">
            <div class="w-16 h-16 ${cfg.iconBg} rounded-full flex items-center justify-center mx-auto mb-4">
              <i data-lucide="${cfg.icon}" class="w-8 h-8 ${cfg.iconColor}"></i>
            </div>
            <h3 class="text-xl font-bold text-gray-800 mb-2">${title}</h3>
            <p class="text-gray-600 text-sm whitespace-pre-line leading-relaxed">${message}</p>
          </div>
          <div class="px-6 pb-6 flex gap-3">
            <button class="confirm-cancel flex-1 border-2 border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all transform active:scale-95 flex items-center justify-center gap-2">
              <i data-lucide="x" class="w-4 h-4"></i>
              Cancel
            </button>
            <button class="confirm-ok flex-1 ${cfg.confirmBg} text-white font-semibold py-3 rounded-xl transition-all transform active:scale-95 flex items-center justify-center gap-2">
              <i data-lucide="check" class="w-4 h-4"></i>
              Confirm
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      if (typeof lucide !== 'undefined') lucide.createIcons();

      const closeOverlay = (result) => {
        overlay.classList.add('animate-fade-out');
        setTimeout(() => {
          overlay.remove();
          resolve(result);
        }, 200);
      };

      overlay.querySelector('.confirm-cancel').addEventListener('click', () => closeOverlay(false));
      overlay.querySelector('.confirm-ok').addEventListener('click', () => closeOverlay(true));

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeOverlay(false);
      });
    });
  }

  // ============================================
  // MODAL SYSTEM
  // ============================================

  function showModal(title, body, options) {
    if (options === undefined) options = {};
    const modal = document.getElementById('modal');
    const modalContent = modal.querySelector('div');

    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = body;

    modalContent.classList.remove('animate-scale-in', 'animate-fade-out');
    void modalContent.offsetWidth;
    modalContent.classList.add('animate-scale-in');

    modal.classList.add('active');

    if (typeof lucide !== 'undefined') {
      setTimeout(() => lucide.createIcons(), 50);
    }

    if (options.autoClose) {
      const delay = typeof options.autoClose === 'number' ? options.autoClose : 2000;
      setTimeout(() => closeModal(), delay);
    }
  }

  function closeModal(callback) {
    if (callback === undefined) callback = null;
    const modal = document.getElementById('modal');
    const modalContent = modal.querySelector('div');

    modalContent.classList.add('animate-fade-out');

    setTimeout(() => {
      modal.classList.remove('active');
      modalContent.classList.remove('animate-fade-out');
      if (callback) callback();
    }, 200);
  }

  function closeModalWithSuccess(message) {
    if (message === undefined) message = 'Operation completed successfully!';
    closeModal(() => {
      showToast(message, 'success');
    });
  }

  // ============================================
  // PAGE VIEW SYSTEM
  // ============================================

  function showPage(title, content) {
    const mapContainer = document.getElementById('mapContainer');
    const pageContainer = document.getElementById('pageContainer');
    const pageContent = document.getElementById('pageContent');

    mapContainer.classList.add('hidden');
    pageContainer.classList.remove('hidden');

    pageContent.innerHTML = `
      <div class="animate-fade-in">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <button onclick="closePage()" class="p-2 hover:bg-gray-200 rounded-lg transition-colors">
              <i data-lucide="arrow-left" class="w-5 h-5 text-gray-600"></i>
            </button>
            <h1 class="text-2xl font-bold text-gray-800">${title}</h1>
          </div>
        </div>
        <div class="page-body">
          ${content}
        </div>
      </div>
    `;

    if (typeof lucide !== 'undefined') {
      setTimeout(() => lucide.createIcons(), 50);
    }
  }

  function closePage() {
    const mapContainer = document.getElementById('mapContainer');
    const pageContainer = document.getElementById('pageContainer');

    mapContainer.classList.remove('hidden');
    pageContainer.classList.add('hidden');

    if (App.map) {
      setTimeout(() => App.map.invalidateSize(), 100);
    }
  }

  // Close modal on click outside
  window.addEventListener('click', (e) => {
    const modal = document.getElementById('modal');
    if (e.target === modal) {
      closeModal();
    }
  });

  // ============================================
  // TIME AGO UTILITY
  // ============================================

  function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  // ============================================
  // EXPOSE ON WINDOW
  // ============================================

  window.escapeHtml = escapeHtml;
  window.showPageLoading = showPageLoading;
  window.hidePageLoading = hidePageLoading;
  window.ensureToastContainer = ensureToastContainer;
  window.showToast = showToast;
  window.showAlertModal = showAlertModal;
  window.showConfirmModal = showConfirmModal;
  window.showConfirm = showConfirm;
  window.showModal = showModal;
  window.closeModal = closeModal;
  window.closeModalWithSuccess = closeModalWithSuccess;
  window.showPage = showPage;
  window.closePage = closePage;
  window.getTimeAgo = getTimeAgo;

})();
