/**
 * Adapter Output — DocxExtractor
 * Extrait le texte brut d'un buffer DOCX via mammoth.
 *
 * ⚠️ mammoth supporte UNIQUEMENT le format .docx (XML Open Packaging).
 * L'ancien format .doc (binaire) n'est PAS supporté et sera rejeté
 * en amont par la vérification des magic bytes (PK header vs D0CF).
 */
const mammoth = require('mammoth');

async function extractText(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

module.exports = { extractText };
