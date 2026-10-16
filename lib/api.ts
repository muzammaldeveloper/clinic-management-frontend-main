// API utility functions for patient and visit management

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('clinic_token');
  }
  return null;
};

// Clear session and redirect to login
const handleAuthFailure = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('clinic_token');
    localStorage.removeItem('clinic_user');
    window.location.href = '/signin';
  }
};

// Get auth headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// API request wrapper
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!baseUrl) {
    throw new Error('Backend URL is not configured.');
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });
  } catch {
    throw new Error('Network error — could not reach the server.');
  }

  // Token expired or invalid — auto logout and redirect
  if (response.status === 401) {
    handleAuthFailure();
    throw new Error('Session expired. Please login again.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `Request failed with status ${response.status}`);
  }

  return response.json().catch(() => {
    throw new Error('Invalid response from server');
  });
};

// Patient API functions
export const patientAPI = {
  // Get all patients with pagination and search
  getAll: async (page: number = 1, limit: number = 10, search: string = '') => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });
    return apiRequest(`/patients?${params.toString()}`);
  },

  // Get patient by ID
  getById: async (id: string) => {
    return apiRequest(`/patients/${id}`);
  },

  // Create new patient
  // Note: backend must be updated to accept optional `visitCount` if you want to set it from imports.
  create: async (data: { 
    idCard: string; 
    name: string; 
    charges?: number; 
    visitCount?: number;
    type?: 'child' | 'man' | 'woman';
    dateOfBirth?: string;
  }) => {
    return apiRequest('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update patient
  update: async (id: string, data: { 
    name?: string; 
    charges?: number;
    type?: 'child' | 'man' | 'woman';
    dateOfBirth?: string;
  }) => {
    return apiRequest(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete patient
  delete: async (id: string) => {
    return apiRequest(`/patients/${id}`, {
      method: 'DELETE',
    });
  },

  // Bulk import patients from Excel/CSV
  bulkImport: async (patients: Array<{ 
    idCard: string; 
    name: string; 
    charges?: number; 
    visitCount?: number;
    type?: 'child' | 'man' | 'woman';
    dateOfBirth?: string;
  }>) => {
    return apiRequest('/patients/import', {
      method: 'POST',
      body: JSON.stringify({ patients }),
    });
  },
};

// Visit API functions
export const visitAPI = {
  // Record a visit
  record: async (patientId: string, data: { notes?: string; charges?: number }) => {
    return apiRequest(`/patients/${patientId}/visits`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get patient visits
  getByPatientId: async (patientId: string) => {
    return apiRequest(`/patients/${patientId}/visits`);
  },

  // Mark visit as paid
  markPaid: async (visitId: string) => {
    return apiRequest(`/patients/visits/${visitId}/paid`, {
      method: 'PATCH',
    });
  },
};

// Auth API functions
export const authAPI = {
  // Get current user
  getCurrentUser: () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('clinic_user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!getAuthToken();
  },

  // Logout
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('clinic_token');
      localStorage.removeItem('clinic_user');
      window.location.href = '/signin';
    }
  },

  // Forgot password - request password reset
  forgotPassword: async (email: string) => {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Reset password with token
  resetPassword: async (token: string, newPassword: string) => {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },
};

