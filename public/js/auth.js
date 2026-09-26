document.addEventListener('DOMContentLoaded', () => {
  const token = API.getToken();
  const currentPath = window.location.pathname;

  // Auto-redirect if already logged in and visiting auth pages
  if (token && (currentPath.endsWith('login.html') || currentPath.endsWith('register.html') || currentPath === '/' || currentPath.endsWith('index.html'))) {
    window.location.href = '/dashboard.html';
    return;
  }

  // Auto-redirect to login if not logged in and visiting protected page
  if (!token && currentPath.endsWith('dashboard.html')) {
    window.location.href = '/login.html';
    return;
  }

  // Handle Login Form Submission
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      if (!email || !password) {
        showToast('Please enter both email and password', 'error');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

        const response = await API.login({ email, password });
        API.setSession(response.data.token, response.data.user);
        
        showToast('Login successful! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 1000);
      } catch (error) {
        showToast(error.message || 'Login failed', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Login';
      }
    });
  }

  // Handle Register Form Submission
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const submitBtn = registerForm.querySelector('button[type="submit"]');

      if (!name || !email || !password || !confirmPassword) {
        showToast('Please fill in all fields', 'error');
        return;
      }

      if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }

      if (password.length < 6) {
        showToast('Password must be at least 6 characters long', 'error');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';

        const response = await API.register({ name, email, password });
        API.setSession(response.data.token, response.data.user);

        showToast('Account created successfully! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 1000);
      } catch (error) {
        showToast(error.message || 'Registration failed', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Create Account';
      }
    });
  }
});

// Logout Handler Function
function logout() {
  API.clearSession();
  showToast('Logged out successfully', 'info');
  setTimeout(() => {
    window.location.href = '/login.html';
  }, 500);
}
