// Gemeinsame Hilfsfunktionen: Alphabet, Sprachstatistik, Häufigkeitsanalyse

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Relative Buchstabenhäufigkeiten im Deutschen (in %), Quelle: gängige Referenztabellen
export const GERMAN_FREQ = {
  A: 6.51, B: 1.89, C: 3.06, D: 5.08, E: 16.93, F: 1.66, G: 3.01, H: 4.76,
  I: 7.55, J: 0.27, K: 1.21, L: 3.44, M: 2.53, N: 9.78, O: 2.51, P: 0.79,
  Q: 0.02, R: 7.00, S: 6.42, T: 6.15, U: 4.35, V: 0.84, W: 1.78, X: 0.03,
  Y: 0.04, Z: 1.13
};

// Relative Buchstabenhäufigkeiten im Englischen (in %), als Alternative
export const ENGLISH_FREQ = {
  A: 8.17, B: 1.49, C: 2.78, D: 4.25, E: 12.70, F: 2.23, G: 2.02, H: 6.09,
  I: 7.00, J: 0.15, K: 0.77, L: 4.03, M: 2.41, N: 6.75, O: 7.51, P: 1.93,
  Q: 0.10, R: 5.99, S: 6.33, T: 9.06, U: 2.76, V: 0.98, W: 2.36, X: 0.15,
  Y: 1.97, Z: 0.07
};

// Erwartete Index-of-Coincidence Werte für Zufallstext vs. natürliche Sprache
export const IC_GERMAN = 0.0762;
export const IC_RANDOM = 1 / 26;

/**
 * Wandelt Umlaute in Standard-Buchstaben um (für Analyse-Zwecke),
 * damit sie ins 26-Buchstaben-Alphabet passen.
 */
export function normalizeUmlaute(text) {
  return text
    .replace(/[äÄ]/g, 'AE')
    .replace(/[öÖ]/g, 'OE')
    .replace(/[üÜ]/g, 'UE')
    .replace(/ß/g, 'SS');
}

/**
 * Extrahiert nur die Großbuchstaben A-Z aus einem Text (für Analyse).
 */
export function onlyLetters(text) {
  return normalizeUmlaute(text).toUpperCase().replace(/[^A-Z]/g, '');
}

/**
 * Zählt absolute und relative Häufigkeiten der Buchstaben A-Z in einem Text.
 * @returns {{counts: Object, percentages: Object, total: number}}
 */
export function letterFrequencies(text) {
  const letters = onlyLetters(text);
  const counts = {};
  for (const ch of ALPHABET) counts[ch] = 0;
  for (const ch of letters) counts[ch]++;
  const total = letters.length;
  const percentages = {};
  for (const ch of ALPHABET) {
    percentages[ch] = total > 0 ? (counts[ch] / total) * 100 : 0;
  }
  return { counts, percentages, total };
}

/**
 * Berechnet den Koinzidenzindex (Index of Coincidence) eines Textes.
 */
export function indexOfCoincidence(text) {
  const { counts, total } = letterFrequencies(text);
  if (total < 2) return 0;
  let sum = 0;
  for (const ch of ALPHABET) {
    sum += counts[ch] * (counts[ch] - 1);
  }
  return sum / (total * (total - 1));
}

/**
 * Chi-Quadrat-Test: vergleicht die Häufigkeiten eines Textes mit einer
 * erwarteten Sprachverteilung. Kleinerer Wert = bessere Übereinstimmung.
 */
export function chiSquared(text, referenceFreq = GERMAN_FREQ) {
  const { counts, total } = letterFrequencies(text);
  if (total === 0) return Infinity;
  let chi2 = 0;
  for (const ch of ALPHABET) {
    const expected = (referenceFreq[ch] / 100) * total;
    if (expected === 0) continue;
    const diff = counts[ch] - expected;
    chi2 += (diff * diff) / expected;
  }
  return chi2;
}

/**
 * Verschiebt einen einzelnen Großbuchstaben um n Stellen im Alphabet (mod 26).
 * Nicht-Buchstaben werden unverändert zurückgegeben.
 */
export function shiftChar(ch, n) {
  const isUpper = ch >= 'A' && ch <= 'Z';
  const isLower = ch >= 'a' && ch <= 'z';
  if (!isUpper && !isLower) return ch;
  const base = isUpper ? 65 : 97;
  const code = ch.charCodeAt(0) - base;
  const shifted = ((code + n) % 26 + 26) % 26;
  return String.fromCharCode(shifted + base);
}
