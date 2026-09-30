/**
 * GramSetu — Citizen Authentication Manager
 */

const auth = {
  TOKEN_KEY: 'gramsetu_citizen_token',
  USER_KEY: 'gramsetu_citizen_user',

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  getUser() {
    try {
      const userStr = localStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return Boolean(this.getToken());
  },

  setSession(token, user) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    window.location.href = '/citizen/login.html?loggedOut=1';
  },

  /**
   * Guards protected pages (dashboard, submit-complaint, complaints, profile)
   */
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = '/citizen/login.html?redirect=' + encodeURIComponent(window.location.pathname);
      return false;
    }
    return true;
  },

  /**
   * Redirects authenticated citizen away from login/register
   */
  redirectIfAuthenticated() {
    if (this.isAuthenticated()) {
      window.location.href = '/citizen/dashboard.html';
      return true;
    }
    return false;
  },

  /**
   * Updates UI navigation based on login status
   */
  renderNav() {
    const user = this.getUser();
    const guestLinks = document.getElementById('navGuestLinks');
    const authLinks = document.getElementById('navAuthLinks');
    const citizenNameEl = document.getElementById('navCitizenName');

    if (this.isAuthenticated() && user) {
      if (guestLinks) guestLinks.style.display = 'none';
      if (authLinks) authLinks.style.display = 'flex';
      if (citizenNameEl) citizenNameEl.textContent = user.fullName || 'Citizen';
    } else {
      if (guestLinks) guestLinks.style.display = 'flex';
      if (authLinks) authLinks.style.display = 'none';
    }

    const logoutBtn = document.getElementById('navLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        auth.logout();
      });
    }
  },
};

window.auth = auth;
