/**
 * Centralized API Fetch Helper module
 */
const API = {
  baseUrl: '/api',

  /**
   * Helper to retrieve JWT token from localStorage
   */
  getToken() {
    return localStorage.getItem('token');
  },

  /**
   * Helper to set auth session
   */
  setSession(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  /**
   * Helper to clear auth session
   */
  clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Get current stored user object
   */
  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Centralized Request Method wrapper around Fetch API
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Handle 401 Unauthorized globally
        if (response.status === 401) {
          this.clearSession();
          if (!window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('register.html')) {
            window.location.href = '/login.html';
          }
        }
        throw new Error(data.message || `HTTP Error ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`[API Error] ${endpoint}:`, error.message);
      throw error;
    }
  },

  // Auth Methods
  register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: userData
    });
  },

  login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: credentials
    });
  },

  getMe() {
    return this.request('/auth/me', {
      method: 'GET'
    });
  },

  // Expense Methods
  getExpenses(queryParams = '') {
    return this.request(`/expenses${queryParams}`, {
      method: 'GET'
    });
  },

  getSummary() {
    return this.request('/expenses/summary', {
      method: 'GET'
    });
  },

  getExpenseById(id) {
    return this.request(`/expenses/${id}`, {
      method: 'GET'
    });
  },

  createExpense(expenseData) {
    return this.request('/expenses', {
      method: 'POST',
      body: expenseData
    });
  },

  updateExpense(id, expenseData) {
    return this.request(`/expenses/${id}`, {
      method: 'PUT',
      body: expenseData
    });
  },

  deleteExpense(id) {
    return this.request(`/expenses/${id}`, {
      method: 'DELETE'
    });
  }
};

/**
 * Toast Notification Utility
 */
function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'fa-info-circle';
  if (type === 'success') icon = 'fa-check-circle';
  if (type === 'error') icon = 'fa-exclamation-circle';

  toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
