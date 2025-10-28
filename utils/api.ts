// API service for connecting to Supabase backend
const API_BASE_URL = 'https://constructtrack-pro-backend.vercel.app/api/v1';

// Generic API request function
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} ${error}`);
  }

  return response.json();
}

// Auth API
export const authAPI = {
  register: (data: { email: string; password: string; name: string; role: string; organizationName?: string }) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCurrentUser: (token: string) =>
    apiRequest('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// Projects API
export const projectsAPI = {
  getAll: (token: string) =>
    apiRequest('/projects', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getById: (id: number, token: string) =>
    apiRequest(`/projects/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  create: (data: any, token: string) =>
    apiRequest('/projects', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  update: (id: number, data: any, token: string) =>
    apiRequest(`/projects/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  delete: (id: number, token: string) =>
    apiRequest(`/projects/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// Tasks API
export const tasksAPI = {
  getAll: (token: string) =>
    apiRequest('/tasks', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  create: (data: any, token: string) =>
    apiRequest('/tasks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  update: (id: number, data: any, token: string) =>
    apiRequest(`/tasks/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  delete: (id: number, token: string) =>
    apiRequest(`/tasks/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// Users API
export const usersAPI = {
  getAll: (token: string) =>
    apiRequest('/users', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getById: (id: number, token: string) =>
    apiRequest(`/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  create: (data: any, token: string) =>
    apiRequest('/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  update: (id: number, data: any, token: string) =>
    apiRequest(`/users/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  delete: (id: number, token: string) =>
    apiRequest(`/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// Time Logs API
export const timeLogsAPI = {
  getAll: (token: string) =>
    apiRequest('/timelogs', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  create: (data: any, token: string) =>
    apiRequest('/timelogs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  update: (id: number, data: any, token: string) =>
    apiRequest(`/timelogs/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  delete: (id: number, token: string) =>
    apiRequest(`/timelogs/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// Inventory API
export const inventoryAPI = {
  getAll: (token: string) =>
    apiRequest('/inventory', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  create: (data: any, token: string) =>
    apiRequest('/inventory', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  update: (id: number, data: any, token: string) =>
    apiRequest(`/inventory/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  delete: (id: number, token: string) =>
    apiRequest(`/inventory/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// Invoices API
export const invoicesAPI = {
  getAll: (token: string) =>
    apiRequest('/invoices', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  create: (data: any, token: string) =>
    apiRequest('/invoices', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  update: (id: number, data: any, token: string) =>
    apiRequest(`/invoices/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  delete: (id: number, token: string) =>
    apiRequest(`/invoices/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// Expenses API
export const expensesAPI = {
  getAll: (token: string) =>
    apiRequest('/expenses', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  create: (data: any, token: string) =>
    apiRequest('/expenses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  update: (id: number, data: any, token: string) =>
    apiRequest(`/expenses/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  delete: (id: number, token: string) =>
    apiRequest(`/expenses/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),
};
