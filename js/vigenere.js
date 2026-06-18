// Vigenère-Verschlüsselung und Kryptoanalyse (Kasiski / Index of Coincidence)

import {
  ALPHABET, shiftChar, onlyLetters, indexOfCoincidence, chiSquared,
  GERMAN_FREQ, ENGLISH_FREQ, IC_GERMAN, IC_RANDOM
} from './utils.js';

/**
 * Verschlüsselt einen Text mit Vigenère. Der Schlüssel wird nur auf
 * Buchstaben angewendet, Sonderzeichen/Zahlen bleiben unverändert
 * und verbrauchen keine Schlüsselposition.
 */
export function encrypt(text, key) {
  const cleanKey = onlyLetters(key);
  if (cleanKey.length === 0) return text;
  let keyIndex = 0;
  return [...text].map(ch => {
    if (!/[a-zA-Z]/.test(ch)) return ch;
    const shift = cleanKey.charCodeAt(keyIndex % cleanKey.length) - 65;
    keyIndex++;
    return shiftChar(ch, shift);
  }).join('');
}

/**
 * Entschlüsselt einen Text mit Vigenère.
 */
export function decrypt(text, key) {
  const cleanKey = onlyLetters(key);
  if (cleanKey.length === 0) return text;
  let keyIndex = 0;
  return [...text].map(ch => {
    if (!/[a-zA-Z]/.test(ch)) return ch;
    const shift = cleanKey.charCodeAt(keyIndex % cleanKey.length) - 65;
    keyIndex++;
    return shiftChar(ch, -shift);
  }).join('');
}

/**
 * Schätzt mögliche Schlüssellängen über den Index of Coincidence.
 * Für jede Länge n werden die Buchstaben in n Spalten aufgeteilt
 * (Position i, i+n, i+2n, ...) und der durchschnittliche IC berechnet.
 * Werte nahe IC_GERMAN (~0.0762) deuten auf die richtige Länge hin.
 */
export function estimateKeyLengths(cipherText, maxLength = 20) {
  const letters = onlyLetters(cipherText);
  const results = [];
  for (let len = 1; len <= maxLength; len++) {
    const columns = Array.from({ length: len }, () => '');
    for (let i = 0; i < letters.length; i++) {
      columns[i % len] += letters[i];
    }
    const avgIC = columns.reduce((sum, col) => sum + indexOfCoincidence(col), 0) / len;
    results.push({ length: len, avgIC, deltaToGerman: Math.abs(avgIC - IC_GERMAN) });
  }
  return results.sort((a, b) => a.deltaToGerman - b.deltaToGerman);
}

/**
 * Bestimmt für eine gegebene Schlüssellänge den wahrscheinlichsten
 * Schlüssel, indem jede Spalte wie eine Caesar-Chiffre per
 * Chi-Quadrat-Test analysiert wird.
 */
export function guessKeyForLength(cipherText, keyLength, language = 'de') {
  const ref = language === 'en' ? ENGLISH_FREQ : GERMAN_FREQ;
  const letters = onlyLetters(cipherText);
  const columns = Array.from({ length: keyLength }, () => '');
  for (let i = 0; i < letters.length; i++) {
    columns[i % keyLength] += letters[i];
  }
  let key = '';
  for (const col of columns) {
    let bestShift = 0;
    let bestScore = Infinity;
    for (let shift = 0; shift < 26; shift++) {
      const decoded = [...col].map(ch => shiftChar(ch, -shift)).join('');
      const score = chiSquared(decoded, ref);
      if (score < bestScore) {
        bestScore = score;
        bestShift = shift;
      }
    }
    key += ALPHABET[bestShift];
  }
  return key;
}

/**
 * Komplette Analyse: liefert Top-Kandidaten für Schlüssellängen
 * (inkl. geschätztem Schlüssel und probeweise entschlüsseltem Text).
 */
export function analyze(cipherText, language = 'de', maxLength = 20, topN = 5) {
  const lengthCandidates = estimateKeyLengths(cipherText, maxLength).slice(0, topN);
  return lengthCandidates.map(({ length, avgIC }) => {
    const key = guessKeyForLength(cipherText, length, language);
    const preview = decrypt(cipherText, key);
    return { length, avgIC, key, preview };
  });
}

export { IC_GERMAN, IC_RANDOM };
