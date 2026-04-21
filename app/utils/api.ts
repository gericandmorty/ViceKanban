import Cookies from 'js-cookie';

const isProd = process.env.NODE_ENV === 'production';

// Define the failover chain from environment variables
const ALL_URLS: string[] = [
  process.env.NEXT_PUBLIC_API_URL_PRIMARY,
  process.env.NEXT_PUBLIC_API_URL_SECONDARY,
  process.env.NEXT_PUBLIC_API_URL_TERTIARY,
  process.env.NEXT_PUBLIC_API_URL, // Fallback to the legacy variable
].filter((url): url is string => Boolean(url && url.trim()));

// Filter out localhost if we are in a production environment to prevent "connecting to visitor's computer"
const BACKEND_URLS = ALL_URLS.filter(url => {
  const isLocal = url.includes('localhost') || url.includes('127.0.0.1');
  if (isProd && isLocal) return false;
  return true;
});

// Internal state to track the currently active host for "stickiness"
export let API_URL = BACKEND_URLS[0] || '';
let activeHost = API_URL;

/**
 * Enhanced fetch wrapper for API calls
 * - Automatically handles a chain of backend failovers
 * - Remembers the working host (Stickiness)
 * - Automatically adds Authorization header if token exists
 * - Handles 401 Unauthorized globally
 */
export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = Cookies.get('access_token');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Helper to perform the actual fetch with the selected host
  const attemptFetch = async (host: string) => {
    const url = `${host}${normalizedPath}`;
    const headers = new Headers(options.headers || {});
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('unauthorized'));
      }
    }

    // Failover if we get a Server Error (500+) or Gateway Error (common on cold starts)
    if (response.status >= 500) {
      throw new Error(`Server Error: ${response.status}`);
    }

    return response;
  };

  // 1. Try with the currently active host first (Stickiness)
  try {
    return await attemptFetch(activeHost);
  } catch (error) {
    console.warn(`apiFetch failed with host ${activeHost}, attempting chain failover...`, error);
  }

  // 2. Chain Failover: Try each host in the list if the active host fails
  for (const host of BACKEND_URLS) {
    if (host === activeHost) continue; // Already tried this one above

    try {
      const response = await attemptFetch(host);
      
      // 3. If successful, "stick" to this new working host
      activeHost = host;
      API_URL = host; // Sync exported constant
      console.info(`Switched active host to ${activeHost}`);
      
      return response;
    } catch (fallbackError) {
      console.warn(`Fallback host ${host} also failed, trying next...`);
    }
  }

  // 4. If all hosts fail, throw a final error
  const finalError = new Error('apiFetch Network Error: All configured backend hosts are unreachable.');
  console.error(finalError.message);
  throw finalError;
}
