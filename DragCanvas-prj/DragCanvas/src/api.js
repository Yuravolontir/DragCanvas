const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3001';

const TOKEN_KEY = 'dragcanvas_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(message, { status = 0, requestId = null, cause } = {}) {
    super(message, { cause });
    this.name = 'ApiError';
    this.status = status;
    this.requestId = requestId;
  }
}

/**
 * Single entry point for every call to our Node API.
 *
 * It attaches the JWT, encodes JSON bodies, unwraps the { success, data }
 * envelope the server sends, and turns an expired session into a redirect
 * to the login page - so no component has to deal with any of that.
 */
export async function apiFetch(path, options = {}) {
  const { body, headers: extraHeaders, ...rest } = options;
  const headers = { ...extraHeaders };
  const token = getToken();

  if (token) headers.Authorization = `Bearer ${token}`;

  // FormData (file upload) must keep the boundary header the browser sets
  const isFormData = body instanceof FormData;
  let payload = body;
  if (body && !isFormData && typeof body !== 'string') {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...rest, headers, body: payload });
  } catch (cause) {
    throw new ApiError('Could not connect to the server. Check your internet connection and try again.', { cause });
  }

  const requestId = response.headers.get('X-Request-Id');
  const result = await response.json().catch(() => null);

  // Only an existing token can expire. A 401 from login means bad credentials
  // and must preserve the server's useful message instead of redirecting.
  if (response.status === 401 && token) {
    clearToken();
    if (window.location.pathname !== '/login') window.location.href = '/login';
    throw new ApiError('Your session has expired. Please sign in again.', { status: 401, requestId });
  }

  if (!response.ok || result?.success === false) {
    const message = result?.error || `Request failed (${response.status})`;
    throw new ApiError(message, { status: response.status, requestId });
  }

  return result?.data !== undefined ? result.data : result;
}

export default API_URL;
