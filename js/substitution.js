// Monoalphabetische Substitution + Häufigkeits-basierte Analysehilfe

import { ALPHABET, GERMAN_FREQ, ENGLISH_FREQ, letterFrequencies } from './utils.js';

/**
 * Wendet eine Buchstaben-Ersetzung auf einen Text an.
 * `mapping` ist ein Objekt {QUELLBUCHSTABE: ZIELBUCHSTABE, ...} mit
 * Großbuchstaben A-Z. Klein-/Großschreibung des Originals bleibt erhalten,
 * Sonderzeichen werden nicht verändert.
 */
function applyMapping(text, mapping) {
  return [...text].map(ch => {
    const upper = ch.toUpperCase();
    if (!mapping[upper]) return ch;
    const replacement = mapping[upper];
    return ch === upper ? replacement : replacement.toLowerCase();
  }).join('');
}

/**
 * Verschlüsselt mit einem Klartext->Geheimtext-Mapping (plainToCipher).
 */
export function encrypt(text, plainToCipher) {
  return applyMapping(text, plainToCipher);
}

/**
 * Entschlüsselt mit einem Geheimtext->Klartext-Mapping (cipherToPlain).
 */
export function decrypt(text, cipherToPlain) {
  return applyMapping(text, cipherToPlain);
}

/**
 * Erstellt aus einem Mapping das jeweils umgekehrte Mapping
 * (z.B. cipherToPlain -> plainToCipher).
 */
export function invertMapping(mapping) {
  const inverted = {};
  for (const [from, to] of Object.entries(mapping)) {
    if (to) inverted[to] = from;
  }
  return inverted;
}

/**
 * Erstellt einen ersten Lösungsvorschlag für ein cipherToPlain-Mapping,
 * indem die häufigsten Geheimtext-Buchstaben den häufigsten
 * Buchstaben der Referenzsprache zugeordnet werden.
 * Liefert ein vollständiges Mapping (alle 26 Buchstaben), auch wenn
 * manche im Geheimtext gar nicht vorkommen (diese werden nach Häufigkeit
 * mit den übrigen Buchstaben aufgefüllt).
 */
export function suggestMapping(cipherText, language = 'de') {
  const ref = language === 'en' ? ENGLISH_FREQ : GERMAN_FREQ;
  const { counts } = letterFrequencies(cipherText);

  const cipherByFreq = [...ALPHABET].sort((a, b) => counts[b] - counts[a]);
  const plainByFreq = [...ALPHABET].sort((a, b) => ref[b] - ref[a]);

  const mapping = {};
  for (let i = 0; i < ALPHABET.length; i++) {
    mapping[cipherByFreq[i]] = plainByFreq[i];
  }
  return mapping;
}

/**
 * Erzeugt ein zufälliges, gültiges Substitutionsalphabet
 * (z.B. um eine Übungsaufgabe zu erstellen). Gibt ein
 * plainToCipher-Mapping zurück.
 */
export function randomMapping() {
  const shuffled = [...ALPHABET];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const mapping = {};
  [...ALPHABET].forEach((ch, i) => { mapping[ch] = shuffled[i]; });
  return mapping;
}
