/**
 * GramSetu — Administrative Authentication Manager
 */

const adminAuth = {
  TOKEN_KEY: 'gramsetu_admin_token',
  USER_KEY: 'gramsetu_admin_user',

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  getUser() {
    try {
      const u = localStorage.getItem(this.USER_KEY);
      return u ? JSON.parse(u) : null;
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
    window.location.href = '/admin/index.html?loggedOut=1';
  },

  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = '/admin/index.html?redirect=' + encodeURIComponent(window.location.pathname);
      return false;
    }
    return true;
  },

  redirectIfAuthenticated() {
    if (this.isAuthenticated()) {
      window.location.href = '/admin/dashboard.html';
      return true;
    }
    return false;
  },
};

window.adminAuth = adminAuth;
