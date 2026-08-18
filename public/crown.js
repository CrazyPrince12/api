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
      if (!token) {
        this.updateUiLoggedOut();
        return null;
      }
      try {
        const res = await fetch('/api/manageusers/user', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (data && data.status && data.user) {
          this.user = data.user;
          this.user.currentLimit = data.CurrentLimit;
          this.updateUiLoggedIn(this.user);
          return this.user;
        } else {
          this.logout(false);
          return null;
        }
      } catch {
        return null;
      }
    },
    logout(redirect = true) {
      localStorage.removeItem('token');
      this.user = null;
      this.updateUiLoggedOut();
      if (redirect) {
        window.location.href = '/';
      }
    },
    updateUiLoggedIn(user) {
      const authBtns = document.querySelectorAll('.auth-btn-guest');
      const userBtns = document.querySelectorAll('.auth-btn-user');
      const userNameEls = document.querySelectorAll('.user-display-name');
      const apiKeyEls = document.querySelectorAll('.user-display-apikey');
      const usesEls = document.querySelectorAll('.user-display-uses');
      const tierEls = document.querySelectorAll('.user-display-tier');

      authBtns.forEach(el => el.style.display = 'none');
      userBtns.forEach(el => el.style.display = 'inline-flex');

      const name = user.mail ? user.mail.split('@')[0] : 'Membre';
      userNameEls.forEach(el => el.textContent = name);
      apiKeyEls.forEach(el => el.textContent = user.apikey || 'CrazyPrince');
      
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
  window.updateCrownStatus = async function () {
    try {
      const res = await fetch('/status');
      const data = await res.json();
      if (data && data.status) {
        const uptimeEls = document.querySelectorAll('.metric-uptime');
        const latencyEls = document.querySelectorAll('.metric-latency');
        const requestsEls = document.querySelectorAll('.metric-requests');
        const visitorsEls = document.querySelectorAll('.metric-visitors');

        uptimeEls.forEach(el => el.textContent = data.uptime || '1h 00m');
        latencyEls.forEach(el => el.textContent = data.latencia || '12 ms');
        requestsEls.forEach(el => el.textContent = (data.totalRequests || 0).toLocaleString());
        visitorsEls.forEach(el => el.textContent = (data.totalVisitors || 0).toLocaleString());
      }
    } catch {}
  };

  // Init on DOM load
  document.addEventListener('DOMContentLoaded', function () {
    updateThemeIcons(currentTheme);
    CrownAuth.checkUser();
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
