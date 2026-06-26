
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://nandaracorporation.onrender.com';

console.log('[API DEBUG] import.meta.env:', import.meta.env);
console.log('[API DEBUG] VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('[API DEBUG] resolved API_BASE_URL:', API_BASE_URL);

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
  body?: any;
}

export async function apiFetch(endpoint: string, options: RequestOptions = {}) {
  const token = localStorage.getItem('token');
  const body = options.body;
  const isFormData = body instanceof FormData || body instanceof URLSearchParams;

  const headers: Record<string, string> = {
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!isFormData && body !== undefined && !Object.prototype.hasOwnProperty.call(headers, 'Content-Type')) {
    headers['Content-Type'] = 'application/json';
  }

  const requestBody = body !== undefined
    ? isFormData
      ? body
      : (typeof body === 'string' ? body : JSON.stringify(body))
    : undefined;

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      body: requestBody,
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
