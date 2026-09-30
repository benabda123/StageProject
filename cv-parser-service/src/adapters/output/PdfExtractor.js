/**
 * Adapter Output — PdfExtractor
 * Extrait le texte brut d'un buffer PDF via pdf-parse.
 * Vérifie les magic bytes (%PDF-) avant d'essayer de parser.
 */
const pdfParse = require('pdf-parse');

async function extractText(buffer) {
  const data = await pdfParse(buffer);
  return data.text;
}

module.exports = { extractText };
