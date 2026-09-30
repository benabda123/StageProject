import { getToken } from './tokenStore';

const API_BASE = 'http://localhost:8000';

/**
 * Envoie un fichier CV (PDF/DOCX) au cv-parser-service via Kong.
 * Utilise fetch natif avec FormData pour l'upload multipart.
 * Axios n'est pas utilisé ici car multer exige que le Content-Type
 * soit défini automatiquement par le browser (avec le boundary correct).
 *
 * @param {File} file - Fichier PDF ou DOCX
 * @returns {Promise<{firstName, lastName, position, phone, email, skills}>}
 */
export async function parseCV(file) {
  const token = await getToken();
  if (!token) throw new Error('Non authentifié');

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/cv/parse`, {
    method: 'POST',
    headers: {
      // Ne pas définir Content-Type manuellement — le browser le fait
      // automatiquement avec le boundary correct pour multipart/form-data
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(data.error || `Erreur ${response.status}`);
  }

  return response.json();
}
