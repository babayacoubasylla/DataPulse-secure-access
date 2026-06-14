const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const TOKEN_KEY = 'datapulse_access_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `API error ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  register: (payload) =>
    request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  me: () => request('/api/auth/me'),

  // Dashboard
  dashboard: () => request('/api/dashboard/summary'),

  // Reports
  marketSummaryReport: (days = 7) =>
    request(`/api/reports/market-summary?days=${days}`),

  // Subscriptions
  subscriptionPlans: () => request('/api/subscriptions/plans'),

  currentSubscription: () => request('/api/subscriptions/current'),

  // Billing client
  billingInvoices: () => request('/api/billing/invoices'),

  // Billing admin
  billingAdminSummary: () => request('/api/billing/admin/summary'),

  billingAdminInvoices: () => request('/api/billing/admin/invoices'),

  billingCreateInvoice: (payload) =>
    request('/api/billing/admin/invoices', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  billingMarkInvoicePaid: (id, payload = { provider: 'manual' }) =>
    request(`/api/billing/admin/invoices/${id}/mark-paid`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  billingUpdateInvoiceStatus: (id, payload) =>
    request(`/api/billing/admin/invoices/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Admin
  adminOrganizations: () => request('/api/admin/organizations'),

  adminChangeOrganizationPlan: (id, payload) =>
    request(`/api/admin/organizations/${id}/plan`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  adminChangeOrganizationStatus: (id, payload) =>
    request(`/api/admin/organizations/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Team
  teamMembers: () => request('/api/team'),

  createTeamMember: (payload) =>
    request('/api/team', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateTeamMember: (id, payload) =>
    request(`/api/team/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deactivateTeamMember: (id) =>
    request(`/api/team/${id}`, {
      method: 'DELETE',
    }),

  // Scraping
  runScrapeUrl: (id) =>
    request(`/api/scraping/run-url/${id}`, {
      method: 'POST',
    }),

  runScrapeActive: (limit = 10) =>
    request(`/api/scraping/run-active?limit=${limit}`, {
      method: 'POST',
    }),

  // Observations
  observations: () => request('/api/observations'),

  // Alerts
  alerts: () => request('/api/alerts'),

  alertRules: () => request('/api/alerts/rules'),

  createAlertRule: (payload) =>
    request('/api/alerts/rules', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateAlertRule: (id, payload) =>
    request(`/api/alerts/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteAlertRule: (id) =>
    request(`/api/alerts/rules/${id}`, {
      method: 'DELETE',
    }),

  // Tracked items
  trackedItems: () => request('/api/tracked-items'),

  createTrackedItem: (payload) =>
    request('/api/tracked-items', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateTrackedItem: (id, payload) =>
    request(`/api/tracked-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteTrackedItem: (id) =>
    request(`/api/tracked-items/${id}`, {
      method: 'DELETE',
    }),

  // Monitored URLs
  monitoredUrls: () => request('/api/monitored-urls'),

  createMonitoredUrl: (payload) =>
    request('/api/monitored-urls', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateMonitoredUrl: (id, payload) =>
    request(`/api/monitored-urls/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteMonitoredUrl: (id) =>
    request(`/api/monitored-urls/${id}`, {
      method: 'DELETE',
    }),

  // Competitors
  competitors: () => request('/api/competitors'),

  createCompetitor: (payload) =>
    request('/api/competitors', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateCompetitor: (id, payload) =>
    request(`/api/competitors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteCompetitor: (id) =>
    request(`/api/competitors/${id}`, {
      method: 'DELETE',
    }),
};