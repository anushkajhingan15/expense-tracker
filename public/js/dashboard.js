let currentExpenseId = null;
let debounceTimer = null;

const CATEGORY_COLORS = {
  Food: '#f59e0b',
  Transport: '#06b6d4',
  Shopping: '#a855f7',
  Bills: '#f43f5e',
  Entertainment: '#ec4899',
  Health: '#22c55e',
  Education: '#6366f1',
  Other: '#94a3b8'
};

const CATEGORY_ICONS = {
  Food: 'fa-utensils',
  Transport: 'fa-car',
  Shopping: 'fa-shopping-bag',
  Bills: 'fa-file-invoice-dollar',
  Entertainment: 'fa-film',
  Health: 'fa-heartbeat',
  Education: 'fa-graduation-cap',
  Other: 'fa-receipt'
};

document.addEventListener('DOMContentLoaded', () => {
  // Check auth
  const token = API.getToken();
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  // Load User Info
  loadUserInfo();

  // Load Initial Dashboard Data
  fetchSummaryData();
  fetchExpensesData();

  // Filter Event Listeners
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  const sortFilter = document.getElementById('sortFilter');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fetchExpensesData(), 300);
    });
  }

  if (categoryFilter) categoryFilter.addEventListener('change', () => fetchExpensesData());
  if (startDateInput) startDateInput.addEventListener('change', () => fetchExpensesData());
  if (endDateInput) endDateInput.addEventListener('change', () => fetchExpensesData());
  if (sortFilter) sortFilter.addEventListener('change', () => fetchExpensesData());

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (categoryFilter) categoryFilter.value = 'All';
      if (startDateInput) startDateInput.value = '';
      if (endDateInput) endDateInput.value = '';
      if (sortFilter) sortFilter.value = 'date_desc';
      fetchExpensesData();
    });
  }

  // Add Expense Button Listener
  const addExpenseBtn = document.getElementById('addExpenseBtn');
  if (addExpenseBtn) {
    addExpenseBtn.addEventListener('click', () => openExpenseModal());
  }

  // Expense Form Submit Handler
  const expenseForm = document.getElementById('expenseForm');
  if (expenseForm) {
    expenseForm.addEventListener('submit', handleExpenseFormSubmit);
  }
});

// User Profile Loader
async function loadUserInfo() {
  try {
    const response = await API.getMe();
    const user = response.data;
    
    const userNameEl = document.getElementById('userName');
    const userAvatarEl = document.getElementById('userAvatar');

    if (userNameEl) userNameEl.textContent = user.name;
    if (userAvatarEl) userAvatarEl.textContent = user.name.charAt(0).toUpperCase();
  } catch (error) {
    console.error('Failed to load user info:', error);
  }
}

// Fetch Summary Cards & Analytics
async function fetchSummaryData() {
  try {
    const response = await API.getSummary();
    const summary = response.data;

    document.getElementById('totalExpenses').textContent = formatCurrency(summary.totalExpenses);
    document.getElementById('expenseCount').textContent = summary.count;
    document.getElementById('currentMonthSpending').textContent = formatCurrency(summary.currentMonthSpending);
    document.getElementById('highestExpense').textContent = formatCurrency(summary.highestExpense);

    renderCategoryBars(summary.categoryBreakdown, summary.totalExpenses);
  } catch (error) {
    console.error('Failed to fetch summary data:', error);
  }
}

// Render Category Analytics Bars
function renderCategoryBars(categoryBreakdown, totalExpenses) {
  const container = document.getElementById('categoryBars');
  if (!container) return;

  container.innerHTML = '';

  const categories = Object.keys(categoryBreakdown);
  if (categories.length === 0 || totalExpenses === 0) {
    container.innerHTML = '<p class="text-muted" style="font-size: 0.9rem;">No spending recorded by category yet.</p>';
    return;
  }

  categories.forEach((cat) => {
    const data = categoryBreakdown[cat];
    const percentage = totalExpenses > 0 ? ((data.total / totalExpenses) * 100).toFixed(1) : 0;
    const color = CATEGORY_COLORS[cat] || '#94a3b8';
    const icon = CATEGORY_ICONS[cat] || 'fa-tag';

    const barEl = document.createElement('div');
    barEl.className = 'bar-item';
    barEl.innerHTML = `
      <div class="bar-header">
        <span><i class="fas ${icon}" style="color: ${color}"></i> ${cat} (${data.count})</span>
        <span>${formatCurrency(data.total)} (${percentage}%)</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width: ${percentage}%; background-color: ${color};"></div>
      </div>
    `;
    container.appendChild(barEl);
  });
}

// Fetch & Render Expense List
async function fetchExpensesData() {
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  const sortFilter = document.getElementById('sortFilter');

  const search = searchInput ? searchInput.value.trim() : '';
  const category = categoryFilter ? categoryFilter.value : 'All';
  const startDate = startDateInput ? startDateInput.value : '';
  const endDate = endDateInput ? endDateInput.value : '';
  const sortValue = sortFilter ? sortFilter.value : 'date_desc';

  const [sortBy, order] = sortValue.split('_');

  const queryParams = new URLSearchParams();
  if (search) queryParams.append('search', search);
  if (category && category !== 'All') queryParams.append('category', category);
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);
  if (sortBy) queryParams.append('sortBy', sortBy);
  if (order) queryParams.append('order', order);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  try {
    const response = await API.getExpenses(queryString);
    renderExpenseTable(response.data);
  } catch (error) {
    showToast('Failed to load expenses', 'error');
  }
}

// Render Table Rows
function renderExpenseTable(expenses) {
  const tbody = document.getElementById('expenseTableBody');
  const emptyState = document.getElementById('emptyState');
  const tableContainer = document.getElementById('tableContainer');

  if (!tbody) return;

  tbody.innerHTML = '';

  if (!expenses || expenses.length === 0) {
    if (tableContainer) tableContainer.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (tableContainer) tableContainer.style.display = 'block';
  if (emptyState) emptyState.style.display = 'none';

  expenses.forEach((exp) => {
    const tr = document.createElement('tr');
    const catIcon = CATEGORY_ICONS[exp.category] || 'fa-tag';

    tr.innerHTML = `
      <td>
        <div style="font-weight: 600;">${escapeHTML(exp.title)}</div>
      </td>
      <td>
        <span class="amount-display">${formatCurrency(exp.amount)}</span>
      </td>
      <td>
        <span class="badge badge-${exp.category}">
          <i class="fas ${catIcon}"></i> ${exp.category}
        </span>
      </td>
      <td>
        <span style="color: var(--text-muted); font-size: 0.9rem;">
          ${exp.description ? escapeHTML(exp.description) : '<em style="color:var(--text-dim)">None</em>'}
        </span>
      </td>
      <td>
        <span style="font-size: 0.9rem;">${formatDate(exp.date)}</span>
      </td>
      <td style="text-align: right;">
        <button class="btn-icon" onclick="editExpense('${exp._id}')" title="Edit Expense">
          <i class="fas fa-edit" style="color: var(--primary);"></i>
        </button>
        <button class="btn-icon" onclick="confirmDeleteExpense('${exp._id}', '${escapeHTML(exp.title).replace(/'/g, "\\'")}')" title="Delete Expense">
          <i class="fas fa-trash-alt" style="color: var(--accent-rose);"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Open Add / Edit Modal
function openExpenseModal(expense = null) {
  const modal = document.getElementById('expenseModal');
  const modalTitle = document.getElementById('modalTitle');
  const form = document.getElementById('expenseForm');

  if (!modal || !form) return;

  form.reset();

  if (expense) {
    currentExpenseId = expense._id;
    if (modalTitle) modalTitle.textContent = 'Edit Expense';
    
    document.getElementById('modalTitleInput').value = expense.title;
    document.getElementById('modalAmountInput').value = expense.amount;
    document.getElementById('modalCategoryInput').value = expense.category;
    document.getElementById('modalDescriptionInput').value = expense.description || '';
    document.getElementById('modalDateInput').value = expense.date ? new Date(expense.date).toISOString().split('T')[0] : '';
  } else {
    currentExpenseId = null;
    if (modalTitle) modalTitle.textContent = 'Add New Expense';
    // Default to today's date
    document.getElementById('modalDateInput').value = new Date().toISOString().split('T')[0];
  }

  modal.classList.add('active');
}

// Close Modal
function closeExpenseModal() {
  const modal = document.getElementById('expenseModal');
  if (modal) modal.classList.remove('active');
  currentExpenseId = null;
}

// Edit Expense Handler
async function editExpense(id) {
  try {
    const response = await API.getExpenseById(id);
    openExpenseModal(response.data);
  } catch (error) {
    showToast(error.message || 'Could not load expense details', 'error');
  }
}

// Handle Form Submit
async function handleExpenseFormSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('modalTitleInput').value.trim();
  const amount = parseFloat(document.getElementById('modalAmountInput').value);
  const category = document.getElementById('modalCategoryInput').value;
  const description = document.getElementById('modalDescriptionInput').value.trim();
  const date = document.getElementById('modalDateInput').value;
  const submitBtn = e.target.querySelector('button[type="submit"]');

  if (!title || isNaN(amount) || amount <= 0 || !category || !date) {
    showToast('Please provide valid title, amount (> 0), category, and date', 'error');
    return;
  }

  const payload = { title, amount, category, description, date };

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    if (currentExpenseId) {
      await API.updateExpense(currentExpenseId, payload);
      showToast('Expense updated successfully!', 'success');
    } else {
      await API.createExpense(payload);
      showToast('Expense created successfully!', 'success');
    }

    closeExpenseModal();
    fetchSummaryData();
    fetchExpensesData();
  } catch (error) {
    showToast(error.message || 'Operation failed', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Save Expense';
  }
}

// Confirm Delete Modal & Action
function confirmDeleteExpense(id, title) {
  if (confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
    deleteExpenseAction(id);
  }
}

async function deleteExpenseAction(id) {
  try {
    await API.deleteExpense(id);
    showToast('Expense deleted successfully', 'success');
    fetchSummaryData();
    fetchExpensesData();
  } catch (error) {
    showToast(error.message || 'Failed to delete expense', 'error');
  }
}

// Formatters
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0);
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
