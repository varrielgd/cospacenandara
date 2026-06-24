
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

export async function apiFetch(endpoint: string, options: RequestOptions = {}) {
  const token = localStorage.getItem('token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      // Handle specific error codes
      if (response.status === 401 || response.status === 403) {
        // Token invalid / expired or unauthorized: clear it so the UI returns to login.
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('auth:logout'));
      }

      const errorMessage = (data && typeof data === 'object' && data.message)
        ? data.message
        : (typeof data === 'string' && data ? data : `API Error: ${response.status} ${response.statusText}`);

      const normalizedMessage = response.status === 401
        ? 'Session expired or invalid credentials. Please log in again.'
        : errorMessage;

      throw new Error(normalizedMessage);
    }

    return data;
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('Backend server is unavailable or network error.');
    }
    throw error;
  }
}

export const api = {
  get: (endpoint: string, options: RequestOptions = {}) => 
    apiFetch(endpoint, { ...options, method: 'GET' }),
    
  post: (endpoint: string, body: any, options: RequestOptions = {}) => 
    apiFetch(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
    
  put: (endpoint: string, body: any, options: RequestOptions = {}) => 
    apiFetch(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
    
  delete: (endpoint: string, options: RequestOptions = {}) => 
    apiFetch(endpoint, { ...options, method: 'DELETE' }),
};
