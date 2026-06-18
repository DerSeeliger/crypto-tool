// Caesar-Verschlüsselung (Verschiebechiffre)

import { shiftChar, chiSquared, GERMAN_FREQ, ENGLISH_FREQ } from './utils.js';

/**
 * Verschlüsselt einen Text mit Caesar-Chiffre (Verschiebung um `shift`).
 * Gross-/Kleinschreibung und Sonderzeichen bleiben erhalten.
 */
export function encrypt(text, shift) {
  return [...text].map(ch => shiftChar(ch, shift)).join('');
}

/**
 * Entschlüsselt einen Text mit Caesar-Chiffre (Verschiebung um `shift`).
 */
export function decrypt(text, shift) {
  return encrypt(text, -shift);
}

/**
 * Brute-Force: probiert alle 26 Verschiebungen und bewertet jede
 * mit dem Chi-Quadrat-Test gegen eine Sprachverteilung.
 * @returns {Array<{shift: number, text: string, score: number}>} sortiert nach Score (beste zuerst)
 */
export function bruteForce(cipherText, language = 'de') {
  const ref = language === 'en' ? ENGLISH_FREQ : GERMAN_FREQ;
  const results = [];
  for (let shift = 0; shift < 26; shift++) {
    const decoded = decrypt(cipherText, shift);
    results.push({ shift, text: decoded, score: chiSquared(decoded, ref) });
  }
  return results.sort((a, b) => a.score - b.score);
}
