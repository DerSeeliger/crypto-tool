// Monoalphabetische Substitution + Häufigkeits-basierte Analysehilfe

import {
  ALPHABET, GERMAN_FREQ, ENGLISH_FREQ, letterFrequencies, onlyLetters,
  GERMAN_BIGRAMS, ENGLISH_BIGRAMS
} from './utils.js';

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

/**
 * Bigramm-Häufigkeiten (z.B. "TH", "CH") verraten Buchstaben-Nachbarschaften,
 * die eine reine Einzelbuchstaben-Häufigkeitsanalyse nicht erfasst - dadurch
 * lässt sich eine ganze Zuordnung als Block bewerten statt buchstabenweise.
 * Fehlende Bigramme erhalten eine kleine Mindestwahrscheinlichkeit (Floor),
 * damit auch seltene/unbekannte Paare einen (schlechten, aber endlichen) Score ergeben.
 */
const BIGRAM_FLOOR_LOG = Math.log(0.00005);

function buildBigramLogTable(freqPercent) {
  const logTable = {};
  for (const [bigram, pct] of Object.entries(freqPercent)) {
    logTable[bigram] = Math.log(pct / 100);
  }
  return logTable;
}

function scoreLettersWithMapping(letters, mapping, logTable) {
  let score = 0;
  let prev = mapping[letters[0]];
  for (let i = 1; i < letters.length; i++) {
    const cur = mapping[letters[i]];
    score += logTable[prev + cur] ?? BIGRAM_FLOOR_LOG;
    prev = cur;
  }
  return score;
}

function buildPlainToCipherFromRandom() {
  const shuffled = [...ALPHABET];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const mapping = {};
  [...ALPHABET].forEach((ch, i) => { mapping[ch] = shuffled[i]; });
  return mapping;
}

/**
 * Stärkerer Lösungsvorschlag per Hill-Climbing: bewertet vollständige
 * cipherToPlain-Zuordnungen anhand der Bigramm-Statistik der entschlüsselten
 * Vorschau (statt nur Einzelbuchstaben-Rängen) und verbessert die Zuordnung
 * iterativ durch zufällige Buchstabentausche. Mehrere Neustarts (einer davon
 * mit dem einfachen Häufigkeits-Vorschlag als Startpunkt) verringern das
 * Risiko, in einem lokalen Optimum hängen zu bleiben.
 * @returns {{mapping: Object, score: number}}
 */
export function suggestMappingHillClimb(cipherText, language = 'de', options = {}) {
  const { iterations = 4000, restarts = 6 } = options;
  const freqTable = language === 'en' ? ENGLISH_BIGRAMS : GERMAN_BIGRAMS;
  const logTable = buildBigramLogTable(freqTable);
  const letters = onlyLetters(cipherText);

  if (letters.length < 2) {
    return { mapping: suggestMapping(cipherText, language), score: 0 };
  }

  const seedMapping = suggestMapping(cipherText, language);

  let best = null;
  let bestScore = -Infinity;

  for (let r = 0; r < restarts; r++) {
    let mapping = r === 0 ? { ...seedMapping } : buildPlainToCipherFromRandom();
    let curScore = scoreLettersWithMapping(letters, mapping, logTable);

    for (let i = 0; i < iterations; i++) {
      const a = ALPHABET[Math.floor(Math.random() * 26)];
      let b = ALPHABET[Math.floor(Math.random() * 26)];
      while (b === a) b = ALPHABET[Math.floor(Math.random() * 26)];

      const swapped = { ...mapping, [a]: mapping[b], [b]: mapping[a] };
      const newScore = scoreLettersWithMapping(letters, swapped, logTable);

      if (newScore >= curScore) {
        mapping = swapped;
        curScore = newScore;
      }
    }

    if (curScore > bestScore) {
      bestScore = curScore;
      best = mapping;
    }
  }

  return { mapping: best, score: bestScore };
}
