import Cookies from 'js-cookie';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Enhanced fetch wrapper for API calls
 * - Automatically prepends API_URL
 * - Automatically adds Authorization header if token exists
 * - Handles 401 Unauthorized globally by triggering logout
 */
export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = Cookies.get('access_token');
  
  // Clean path (ensure it starts with /)
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_URL}${normalizedPath}`;

  // Prepare headers
  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      // Trigger global unauthorized event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('unauthorized'));
      }
    }

    return response;
  } catch (error) {
    console.error('apiFetch Network Error:', error);
    throw error;
  }
}
