import { jwtDecode } from 'jwt-decode';

const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8085';
const REALM = 'keystone';
const CLIENT_ID = 'keystone-react';
// keystone-react est un public client Keycloak — PAS de client_secret
// Envoyer un client_secret sur un public client provoque un rejet silencieux du refresh token
const TOKEN_URL = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`;

// Persistance localStorage : acceptable ici car l'app est un client SPA interne
// (pas de refresh token httpOnly côté serveur). Les tokens restent accessibles
// au JavaScript de la page — même contrainte qu'avec keycloak-js en mémoire.
const STORAGE_ACCESS = 'keystone_access_token';
const STORAGE_REFRESH = 'keystone_refresh_token';
const REFRESH_THRESHOLD_SEC = 30;

let refreshPromise = null;

function decodeToken(token) {
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
}

function secondsUntilExpiry(token) {
  const parsed = decodeToken(token);
  if (!parsed?.exp) return 0;
  return parsed.exp - Math.floor(Date.now() / 1000);
}

async function fetchToken(body) {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  });
  const data = await response.json();
  if (!response.ok) {
    const err = new Error(data.error_description || data.error || 'Authentication failed');
    err.status = response.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function setStoredTokens(accessToken, refreshToken) {
  localStorage.setItem(STORAGE_ACCESS, accessToken);
  if (refreshToken) {
    localStorage.setItem(STORAGE_REFRESH, refreshToken);
  }
}

export function clearStoredTokens() {
  localStorage.removeItem(STORAGE_ACCESS);
  localStorage.removeItem(STORAGE_REFRESH);
}

export function getStoredAccessToken() {
  return localStorage.getItem(STORAGE_ACCESS);
}

export function getStoredRefreshToken() {
  return localStorage.getItem(STORAGE_REFRESH);
}

export function getTokenParsed() {
  const token = getStoredAccessToken();
  return token ? decodeToken(token) : null;
}

export function isStoredTokenValid() {
  const token = getStoredAccessToken();
  if (!token) return false;
  return secondsUntilExpiry(token) > 0;
}

export async function loginWithPassword(username, password) {
  const data = await fetchToken({
    grant_type: 'password',
    client_id: CLIENT_ID,
    username,
    password,
  });
  setStoredTokens(data.access_token, data.refresh_token);
  return data;
}

async function refreshAccessToken() {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  const data = await fetchToken({
    grant_type: 'refresh_token',
    client_id: CLIENT_ID,
    // Pas de client_secret — keystone-react est un public client Keycloak
    refresh_token: refreshToken,
  });

  setStoredTokens(data.access_token, data.refresh_token ?? refreshToken);
  return data.access_token;
}

/** Utilisable hors composants React (intercepteurs axios). */
export async function getToken() {
  let accessToken = getStoredAccessToken();
  if (!accessToken) return null;

  const remaining = secondsUntilExpiry(accessToken);
  if (remaining > REFRESH_THRESHOLD_SEC) {
    return accessToken;
  }

  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  try {
    return await refreshPromise;
  } catch {
    clearStoredTokens();
    return null;
  }
}

export function extractUserRole(tokenParsed) {
  if (!tokenParsed) return 'employee';

  const realmRoles = tokenParsed.realm_access?.roles || [];
  const clientRoles = tokenParsed.resource_access?.['keystone-react']?.roles || [];
  const allRoles = [...realmRoles, ...clientRoles];

  if (allRoles.includes('admin')) return 'admin';
  if (allRoles.includes('hr')) return 'hr';
  if (allRoles.includes('itsupport')) return 'itsupport';
  if (allRoles.includes('manager')) return 'manager';
  return 'employee';
}

export function extractUser(tokenParsed) {
  if (!tokenParsed) return null;
  return {
    sub: tokenParsed.sub,
    username: tokenParsed.preferred_username,
    firstName: tokenParsed.given_name,
    lastName: tokenParsed.family_name,
    email: tokenParsed.email,
  };
}
