// Service dédié aux pages PUBLIQUES (hors authentification).
// N'utilise PAS l'intercepteur axios (api.js) qui exige un token Keycloak :
// ces routes sont accessibles sans JWT via la route publique Kong.
const AUTH_URL = 'http://localhost:8000';

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || 'Une erreur est survenue');
    error.response = { data };
    throw error;
  }
  return data;
}

export const forgotPassword = (email, confirm = false) =>
  fetch(`${AUTH_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, confirm }),
  }).then(handleResponse);

export const resetPassword = ({ email, code, newPassword }) =>
  fetch(`${AUTH_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, newPassword }),
  }).then(handleResponse);
