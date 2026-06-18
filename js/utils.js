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

// Relative Bigramm-Häufigkeiten im Deutschen (in %, Auswahl der häufigsten),
// Quelle: gängige Referenztabellen. Wird für die Hill-Climbing-Analyse der
// Substitutionschiffre genutzt - Bigramme verraten Buchstaben-Nachbarschaften,
// die eine reine Einzelbuchstaben-Häufigkeitsanalyse nicht erfassen kann.
export const GERMAN_BIGRAMS = {
  EN: 3.94, ER: 3.75, CH: 2.75, DE: 2.00, ND: 1.99, EI: 1.88, TE: 1.79,
  IN: 1.67, IE: 1.55, GE: 1.51, ES: 1.45, UN: 1.36, ST: 1.30, RE: 1.21,
  AN: 1.20, SE: 1.01, NE: 1.01, BE: 0.97, IC: 0.93, AU: 0.89, NG: 0.88,
  AB: 0.85, EH: 0.81, HE: 0.80, AS: 0.78, RA: 0.75, LE: 0.73, DI: 0.70,
  WI: 0.68, IS: 0.66, EL: 0.65, AL: 0.63, NT: 0.62, RI: 0.60, TI: 0.58,
  SI: 0.57, LI: 0.55, OR: 0.54, HA: 0.53, WE: 0.52, AR: 0.51, UR: 0.50,
  KE: 0.49, ME: 0.48, VE: 0.47, OM: 0.46, AM: 0.45, OS: 0.44, EG: 0.43,
  ET: 0.42, DA: 0.41, FE: 0.40, SO: 0.39, WA: 0.38, ON: 0.37, IG: 0.36,
  US: 0.35, UT: 0.34, OL: 0.33, AG: 0.32, EM: 0.31, OB: 0.30
};

// Relative Bigramm-Häufigkeiten im Englischen (in %, Auswahl der häufigsten)
export const ENGLISH_BIGRAMS = {
  TH: 3.56, HE: 3.07, IN: 2.43, ER: 2.05, AN: 1.99, RE: 1.85, ES: 1.59,
  ON: 1.55, ST: 1.52, NT: 1.45, EN: 1.45, AT: 1.44, ED: 1.42, ND: 1.35,
  TO: 1.31, OR: 1.28, EA: 1.24, TI: 1.20, AR: 1.20, TE: 1.18, NG: 1.18,
  AL: 1.09, IT: 1.05, AS: 1.01, IS: 1.00, HA: 0.93, ET: 0.88, SE: 0.87,
  OU: 0.87, OF: 0.83, LE: 0.83, SA: 0.81, VE: 0.79, RO: 0.78, RA: 0.74,
  RI: 0.73, HI: 0.70, NE: 0.69, ME: 0.65, DE: 0.65, CO: 0.64, TA: 0.59,
  EC: 0.58, SI: 0.55, WI: 0.55, LL: 0.53, CH: 0.50, WA: 0.48, LI: 0.44,
  EL: 0.43, NO: 0.43, MA: 0.43, WH: 0.40, UR: 0.39, CE: 0.39, DI: 0.38,
  GE: 0.37, BE: 0.36, LO: 0.36, IC: 0.35, IO: 0.34, OW: 0.34, UN: 0.34,
  PE: 0.32, AC: 0.30, AD: 0.30, OL: 0.29, SO: 0.29
};

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
