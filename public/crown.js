/**
 * CROWN API — Core Frontend Logic (2026 Edition)
 * Propulsé par CrazyPrince, Développeur Camerounais
 */

(function () {
  // Theme Management
  const currentTheme = localStorage.getItem('crown_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);

  window.toggleCrownTheme = function () {
    const active = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = active === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('crown_theme', next);
    updateThemeIcons(next);
  };

  function updateThemeIcons(theme) {
    const icons = document.querySelectorAll('.theme-toggle-icon');
    icons.forEach(icon => {
      if (theme === 'light') {
        icon.className = 'fas fa-sun theme-toggle-icon';
      } else {
        icon.className = 'fas fa-moon theme-toggle-icon';
      }
    });
  }

  // Toast System
  window.showCrownToast = function (message, type = 'info') {
    let toast = document.getElementById('crownToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'crownToast';
      toast.className = 'crown-toast';
      document.body.appendChild(toast);
    }
    const iconClass = type === 'success' ? 'fa-check-circle text-emerald-400' :
                      type === 'error' ? 'fa-exclamation-circle text-rose-400' :
                      'fa-info-circle text-cyan-400';
    toast.innerHTML = `<i class="fas ${iconClass}"></i> <span>${message}</span>`;
    toast.classList.add('show');
    clearTimeout(window._toastTimeout);
    window._toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  };

  // Copy to Clipboard
  window.copyToClipboard = function (text, successMsg = 'Copié dans le presse-papiers !') {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showCrownToast(successMsg, 'success');
      }).catch(() => fallbackCopy(text, successMsg));
    } else {
      fallbackCopy(text, successMsg);
    }
  };

  function fallbackCopy(text, successMsg) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showCrownToast(successMsg, 'success');
    } catch {
      showCrownToast('Impossible de copier automatiquement.', 'error');
    }
    document.body.removeChild(ta);
  }

  // Session & User Data
  window.CrownAuth = {
    token: localStorage.getItem('token'),
    user: null,
    async checkUser() {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': 'Bearer ' + token } : {};

      try {
        const res = await fetch('/api/manageusers/user', {
          headers,
          credentials: 'same-origin',
          cache: 'no-store'
        });
        const data = await res.json();
        if (data && data.status && data.user) {
          this.user = data.user;
          this.user.currentLimit = data.CurrentLimit;
          this.updateUiLoggedIn(this.user);
          return this.user;
        }

        localStorage.removeItem('token');
        this.user = null;
        this.updateUiLoggedOut();
        return null;
      } catch {
        this.user = null;
        this.updateUiLoggedOut();
        return null;
      }
    },
    async logout(redirect = true) {
      try {
        await fetch('/api/manageusers/logout', {
          method: 'POST',
          credentials: 'same-origin'
        });
      } catch {
        // La session locale doit être supprimée même si le réseau est indisponible.
      } finally {
        localStorage.removeItem('token');
        this.user = null;
        this.updateUiLoggedOut();
        if (redirect) {
          window.location.href = '/';
        }
      }
    },
    updateUiLoggedIn(user) {
      const authBtns = document.querySelectorAll('.auth-btn-guest');
      const userBtns = document.querySelectorAll('.auth-btn-user');
      const userNameEls = document.querySelectorAll('.user-display-name');
      const userEmailEls = document.querySelectorAll('.user-display-email');
      const apiKeyEls = document.querySelectorAll('.user-display-apikey');
      const usesEls = document.querySelectorAll('.user-display-uses');
      const tierEls = document.querySelectorAll('.user-display-tier');

      authBtns.forEach(el => el.style.display = 'none');
      userBtns.forEach(el => el.style.display = 'inline-flex');

      const name = user.mail ? user.mail.split('@')[0] : 'Membre';
      userNameEls.forEach(el => el.textContent = name);
      userEmailEls.forEach(el => el.textContent = user.mail || 'Adresse e-mail indisponible');
      apiKeyEls.forEach(el => el.textContent = user.apikey || 'Clé indisponible');
      
      const remaining = Math.max(0, (user.currentLimit || 10000) - (user.uses || 0));
      usesEls.forEach(el => el.textContent = remaining.toLocaleString());
      tierEls.forEach(el => {
        el.textContent = user.isPremium ? 'Premium VIP' : 'Standard';
        el.className = user.isPremium ? 'crown-badge crown-badge-amber' : 'crown-badge crown-badge-blue';
      });

      // Update API links on page with apikey
      const apiLinks = document.querySelectorAll('a[href*="/api/"]');
      apiLinks.forEach(link => {
        try {
          const url = new URL(link.href, window.location.origin);
          if (!url.searchParams.has('apikey')) {
            url.searchParams.set('apikey', user.apikey);
            link.href = url.pathname + url.search;
          }
        } catch {}
      });
    },
    updateUiLoggedOut() {
      const authBtns = document.querySelectorAll('.auth-btn-guest');
      const userBtns = document.querySelectorAll('.auth-btn-user');
      authBtns.forEach(el => el.style.display = 'inline-flex');
      userBtns.forEach(el => el.style.display = 'none');
    }
  };

  window.copyUserApiKey = function () {
    const apiKey = CrownAuth.user && CrownAuth.user.apikey;
    if (!apiKey) {
      showCrownToast('Aucune clé API de compte disponible.', 'error');
      return;
    }
    copyToClipboard(apiKey, 'Clé API copiée !');
  };

  // Profile Modal Handler
  window.openProfileModal = function () {
    const modal = document.getElementById('crownProfileModal');
    if (!modal) return;
    CrownAuth.checkUser().then(user => {
      if (!user) {
        window.location.href = '/login.html';
        return;
      }
      modal.classList.add('active');
    });
  };

  window.closeProfileModal = function () {
    const modal = document.getElementById('crownProfileModal');
    if (modal) modal.classList.remove('active');
  };

  // Status Metrics Polling
  // Latence = temps reel de la requete /status (aller-retour complet mesure cote client).
  // Temps d'activite = uptime du serveur, formate jours/heures/minutes/secondes.
  window.formatCrownUptime = function (totalSeconds) {
    totalSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts = [];
    if (days > 0) parts.push(days + 'j');
    parts.push(`${hours}h ${minutes}m ${seconds}s`);
    return parts.join(' ');
  };

  window.updateCrownStatus = async function () {
    const uptimeEls = document.querySelectorAll('.metric-uptime');
    const latencyEls = document.querySelectorAll('.metric-latency');
    const requestsEls = document.querySelectorAll('.metric-requests');
    const visitorsEls = document.querySelectorAll('.metric-visitors');
    try {
      const t0 = performance.now();
      const res = await fetch('/status', { cache: 'no-store' });
      const rttMs = Math.max(1, Math.round(performance.now() - t0));
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (data && data.status) {
        let uptimeText = data.uptime;
        if (data.uptimeSeconds != null) {
          uptimeText = window.formatCrownUptime(data.uptimeSeconds);
        } else if (typeof uptimeText === 'string') {
          // Compatibilite : convertit "34h 12m 03s" (sans jours) en "1j 10h 12m 03s"
          const m = uptimeText.match(/^(\d+)h\s+(\d+)m\s+(\d+)s$/);
          if (m) {
            const total = (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]);
            uptimeText = window.formatCrownUptime(total);
          }
        }
        uptimeEls.forEach(el => el.textContent = uptimeText || '—');
        latencyEls.forEach(el => el.textContent = rttMs + ' ms');
        requestsEls.forEach(el => el.textContent = (data.totalRequests || 0).toLocaleString());
        visitorsEls.forEach(el => el.textContent = (data.totalVisitors || 0).toLocaleString());
      }
    } catch {
      uptimeEls.forEach(el => el.textContent = 'Hors ligne');
      latencyEls.forEach(el => el.textContent = '—');
    }
  };

  // Init on DOM load
  document.addEventListener('DOMContentLoaded', function () {
    updateThemeIcons(currentTheme);
    window.CrownAuthReady = CrownAuth.checkUser();
    updateCrownStatus();
    setInterval(updateCrownStatus, 4000);

    // Close modal on escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeProfileModal();
    });

    // Close modal when clicking outside
    const modal = document.getElementById('crownProfileModal');
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeProfileModal();
      });
    }
  });
})();
