const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const TOKEN_KEY = 'dragcanvas_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

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

  const response = await fetch(`${API_URL}${path}`, { ...rest, headers, body: payload });

  if (response.status === 401) {
    clearToken();
    if (window.location.pathname !== '/login') window.location.href = '/login';
    throw new Error('Session expired, please log in again');
  }

  const result = await response.json().catch(() => null);

  if (!response.ok || result?.success === false) {
    throw new Error(result?.error || `Request failed (${response.status})`);
  }

  return result?.data !== undefined ? result.data : result;
}

export default API_URL;
