const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3001';

const TOKEN_KEY = 'dragcanvas_token';

// Authentication token helpers live here so no component needs to know the
// localStorage key used by the API layer.
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/** An Error with the extra HTTP details useful to callers and support logs. */
export class ApiError extends Error {
  constructor(message, { status = 0, requestId = null, cause } = {}) {
    super(message, { cause });
    this.name = 'ApiError';
    this.status = status;
    this.requestId = requestId;
  }
}

function prepareRequestBody(body, headers) {
  if (!body) return body;

  // The browser must create FormData's multipart boundary header itself.
  const isFileUpload = body instanceof FormData;
  const isAlreadyEncoded = typeof body === 'string';

  if (isFileUpload || isAlreadyEncoded) return body;

  headers['Content-Type'] = 'application/json';
  return JSON.stringify(body);
}

async function readJsonResponse(response) {
  // A server error or proxy may return an empty/non-JSON response. Parsing that
  // must not hide the original HTTP status behind a JSON syntax error.
  return response.json().catch(() => null);
}

function expireSession() {
  clearToken();
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
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

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const requestBody = prepareRequestBody(body, headers);
  const requestUrl = `${API_URL}${path}`;

  let response;
  try {
    response = await fetch(requestUrl, {
      ...rest,
      headers,
      body: requestBody,
    });
  } catch (cause) {
    throw new ApiError(
      'Could not connect to the server. Check your internet connection and try again.',
      { cause },
    );
  }

  const requestId = response.headers.get('X-Request-Id');
  const result = await readJsonResponse(response);

  // Only an existing token can expire. A 401 from login means bad credentials
  // and must preserve the server's useful message instead of redirecting.
  if (response.status === 401 && token) {
    expireSession();
    throw new ApiError(
      'Your session has expired. Please sign in again.',
      { status: 401, requestId },
    );
  }

  if (!response.ok || result?.success === false) {
    const message = result?.error || `Request failed (${response.status})`;
    throw new ApiError(message, {
      status: response.status,
      requestId,
    });
  }

  // Most API responses use { success, data }. A few legacy endpoints return
  // their useful value directly, so both shapes remain supported.
  return result?.data !== undefined ? result.data : result;
}

export default API_URL;
