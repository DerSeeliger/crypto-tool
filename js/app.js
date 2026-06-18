// Verbindet die Krypto-Module mit der Benutzeroberfläche

import * as Caesar from './caesar.js';
import * as Vigenere from './vigenere.js';
import * as Substitution from './substitution.js';
import { renderFrequencyChart } from './frequency.js';
import * as Huffman from './huffman.js';
import { ALPHABET, letterFrequencies } from './utils.js';

// ---------- Tabs ----------
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

// ---------- Caesar ----------
const caesarInput = document.getElementById('caesar-input');
const caesarOutput = document.getElementById('caesar-output');
const caesarShift = document.getElementById('caesar-shift');

document.getElementById('caesar-encrypt-btn').addEventListener('click', () => {
  caesarOutput.value = Caesar.encrypt(caesarInput.value, Number(caesarShift.value));
});
document.getElementById('caesar-decrypt-btn').addEventListener('click', () => {
  caesarOutput.value = Caesar.decrypt(caesarInput.value, Number(caesarShift.value));
});

document.getElementById('caesar-bruteforce-btn').addEventListener('click', () => {
  const lang = document.getElementById('caesar-bf-lang').value;
  const results = Caesar.bruteForce(caesarInput.value, lang);
  const container = document.getElementById('caesar-bf-results');
  container.innerHTML = '';
  results.forEach((r, i) => {
    const row = document.createElement('div');
    row.className = 'result-row' + (i === 0 ? ' best' : '');
    row.innerHTML = `
      <div class="result-meta">Verschiebung ${r.shift}${i === 0 ? ' — wahrscheinlichste Lösung' : ''} (Chi² = ${r.score.toFixed(2)})</div>
      <div class="result-text"></div>
    `;
    row.querySelector('.result-text').textContent = r.text;
    row.addEventListener('click', () => {
      caesarShift.value = r.shift;
      caesarOutput.value = r.text;
    });
    container.appendChild(row);
  });
});

// ---------- Vigenere ----------
const vigenereInput = document.getElementById('vigenere-input');
const vigenereOutput = document.getElementById('vigenere-output');
const vigenereKey = document.getElementById('vigenere-key');

document.getElementById('vigenere-encrypt-btn').addEventListener('click', () => {
  vigenereOutput.value = Vigenere.encrypt(vigenereInput.value, vigenereKey.value);
});
document.getElementById('vigenere-decrypt-btn').addEventListener('click', () => {
  vigenereOutput.value = Vigenere.decrypt(vigenereInput.value, vigenereKey.value);
});

document.getElementById('vigenere-analyze-btn').addEventListener('click', () => {
  const lang = document.getElementById('vigenere-analyze-lang').value;
  const maxLength = Number(document.getElementById('vigenere-max-length').value) || 20;
  const candidates = Vigenere.analyze(vigenereInput.value, lang, maxLength);
  const container = document.getElementById('vigenere-analysis-results');
  container.innerHTML = '';
  candidates.forEach((c, i) => {
    const row = document.createElement('div');
    row.className = 'result-row' + (i === 0 ? ' best' : '');
    row.innerHTML = `
      <div class="result-meta">Schlüssellänge ${c.length}${i === 0 ? ' — wahrscheinlichste Lösung' : ''} · vermuteter Schlüssel: <strong>${c.key}</strong> · Ø IC = ${c.avgIC.toFixed(4)}</div>
      <div class="result-text"></div>
    `;
    row.querySelector('.result-text').textContent = c.preview;
    row.addEventListener('click', () => {
      vigenereKey.value = c.key;
      vigenereOutput.value = c.preview;
    });
    container.appendChild(row);
  });
});

// ---------- Substitution: Ver-/Entschlüsseln mit Schlüsselalphabet ----------
const substitutionKey = document.getElementById('substitution-key');
const substitutionKeyStatus = document.getElementById('substitution-key-status');
const substitutionInput = document.getElementById('substitution-input');
const substitutionOutput = document.getElementById('substitution-output');

function buildPlainToCipherFromKey(key) {
  const upperKey = key.toUpperCase();
  const mapping = {};
  for (let i = 0; i < ALPHABET.length; i++) {
    mapping[ALPHABET[i]] = upperKey[i];
  }
  return mapping;
}

function validateKeyAlphabet(key) {
  const upperKey = key.toUpperCase();
  if (upperKey.length !== 26) return false;
  return new Set(upperKey).size === 26 && [...upperKey].every(ch => ALPHABET.includes(ch));
}

function updateKeyStatus() {
  const key = substitutionKey.value;
  if (key.length === 0) {
    substitutionKeyStatus.textContent = '';
    substitutionKeyStatus.className = 'status';
    return false;
  }
  const valid = validateKeyAlphabet(key);
  substitutionKeyStatus.textContent = valid
    ? 'Gültiges Schlüsselalphabet (alle 26 Buchstaben, keine Wiederholung)'
    : 'Ungültig: es werden genau 26 verschiedene Buchstaben A-Z benötigt';
  substitutionKeyStatus.className = 'status' + (valid ? ' ok' : '');
  return valid;
}

substitutionKey.addEventListener('input', updateKeyStatus);

document.getElementById('substitution-encrypt-btn').addEventListener('click', () => {
  if (!updateKeyStatus()) return;
  const plainToCipher = buildPlainToCipherFromKey(substitutionKey.value);
  substitutionOutput.value = Substitution.encrypt(substitutionInput.value, plainToCipher);
});
document.getElementById('substitution-decrypt-btn').addEventListener('click', () => {
  if (!updateKeyStatus()) return;
  const plainToCipher = buildPlainToCipherFromKey(substitutionKey.value);
  const cipherToPlain = Substitution.invertMapping(plainToCipher);
  substitutionOutput.value = Substitution.decrypt(substitutionInput.value, cipherToPlain);
});
document.getElementById('substitution-random-btn').addEventListener('click', () => {
  const plainToCipher = Substitution.randomMapping();
  substitutionKey.value = ALPHABET.split('').map(ch => plainToCipher[ch]).join('');
  updateKeyStatus();
});

// ---------- Substitution: Kryptoanalyse ----------
const cipherInput = document.getElementById('substitution-cipher-input');
const freqChartContainer = document.getElementById('substitution-freq-chart');
const mappingTable = document.getElementById('substitution-mapping-table');
const decodedPreview = document.getElementById('substitution-decoded-preview');

function getCurrentCipherToPlain() {
  const mapping = {};
  mappingTable.querySelectorAll('select').forEach(select => {
    if (select.value) mapping[select.dataset.cipherLetter] = select.value;
  });
  return mapping;
}

function updateDecodedPreview() {
  const mapping = getCurrentCipherToPlain();
  decodedPreview.value = Substitution.decrypt(cipherInput.value, mapping);
}

function buildMappingTable(presetMapping = {}) {
  const { percentages } = letterFrequencies(cipherInput.value);
  const previousMapping = mappingTable.children.length > 0 ? getCurrentCipherToPlain() : {};
  const mapping = { ...previousMapping, ...presetMapping };

  mappingTable.innerHTML = '';
  for (const cipherLetter of ALPHABET) {
    const cell = document.createElement('div');
    cell.className = 'mapping-cell';

    const label = document.createElement('div');
    label.className = 'cipher-letter';
    label.textContent = cipherLetter;

    const pct = document.createElement('div');
    pct.className = 'freq-pct';
    pct.textContent = `${percentages[cipherLetter].toFixed(1)}%`;

    const select = document.createElement('select');
    select.dataset.cipherLetter = cipherLetter;
    const blankOption = document.createElement('option');
    blankOption.value = '';
    blankOption.textContent = '–';
    select.appendChild(blankOption);
    for (const plainLetter of ALPHABET) {
      const opt = document.createElement('option');
      opt.value = plainLetter;
      opt.textContent = plainLetter;
      select.appendChild(opt);
    }
    if (mapping[cipherLetter]) select.value = mapping[cipherLetter];

    select.addEventListener('change', updateDecodedPreview);

    cell.appendChild(label);
    cell.appendChild(pct);
    cell.appendChild(select);
    mappingTable.appendChild(cell);
  }
  updateDecodedPreview();
}

function refreshSubstitutionAnalysis() {
  const lang = document.getElementById('substitution-suggest-lang').value;
  renderFrequencyChart(freqChartContainer, cipherInput.value, lang);
  buildMappingTable();
}

cipherInput.addEventListener('input', refreshSubstitutionAnalysis);
document.getElementById('substitution-suggest-lang').addEventListener('change', refreshSubstitutionAnalysis);

document.getElementById('substitution-suggest-btn').addEventListener('click', () => {
  const lang = document.getElementById('substitution-suggest-lang').value;
  const suggestion = Substitution.suggestMapping(cipherInput.value, lang);
  buildMappingTable(suggestion);
});

document.getElementById('substitution-reset-btn').addEventListener('click', () => {
  mappingTable.innerHTML = '';
  buildMappingTable();
});

// ---------- Häufigkeitsanalyse (allgemein) ----------
document.getElementById('frequency-analyze-btn').addEventListener('click', () => {
  const text = document.getElementById('frequency-input').value;
  const lang = document.getElementById('frequency-lang').value;
  renderFrequencyChart(document.getElementById('frequency-chart-container'), text, lang);
});

// Initiale, leere Tabelle für die Substitutions-Kryptoanalyse anzeigen
buildMappingTable();

// ---------- Huffman ----------
document.getElementById('huffman-compress-btn').addEventListener('click', () => {
  const text = document.getElementById('huffman-input').value;
  const result = Huffman.analyze(text);

  const statsCard = document.getElementById('huffman-stats-card');
  const tableCard = document.getElementById('huffman-table-card');
  const treeCard = document.getElementById('huffman-tree-card');
  const outputCard = document.getElementById('huffman-output-card');

  if (result.total === 0) {
    statsCard.hidden = true;
    tableCard.hidden = true;
    treeCard.hidden = true;
    outputCard.hidden = true;
    return;
  }

  statsCard.hidden = false;
  tableCard.hidden = false;
  treeCard.hidden = false;
  outputCard.hidden = false;

  document.getElementById('huffman-stat-total').textContent = `${result.total} Zeichen`;
  document.getElementById('huffman-stat-distinct').textContent = `${result.distinct}`;
  document.getElementById('huffman-stat-entropy').textContent = `${result.entropy.toFixed(4)} Bit/Zeichen`;
  document.getElementById('huffman-stat-avglen').textContent = `${result.avgLength.toFixed(4)} Bit/Zeichen`;
  document.getElementById('huffman-stat-input-bits').textContent = `${result.inputBitsAscii} Bit`;
  document.getElementById('huffman-stat-output-bits').textContent = `${result.outputBits} Bit`;
  document.getElementById('huffman-stat-ratio').textContent = `${(result.compressionRatio * 100).toFixed(1)}% der Originalgrösse`;
  document.getElementById('huffman-stat-savings').textContent = `${((1 - result.compressionRatio) * 100).toFixed(1)}% kleiner`;

  const maxBits = Math.max(result.inputBitsAscii, result.outputBits, 1);
  document.getElementById('huffman-bar-input').style.width = `${(result.inputBitsAscii / maxBits) * 100}%`;
  document.getElementById('huffman-bar-output').style.width = `${(result.outputBits / maxBits) * 100}%`;
  document.getElementById('huffman-bar-input-value').textContent = `${result.inputBitsAscii} Bit`;
  document.getElementById('huffman-bar-output-value').textContent = `${result.outputBits} Bit`;

  const tbody = document.querySelector('#huffman-codes-table tbody');
  tbody.innerHTML = '';
  for (const s of result.symbols) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="huffman-char">${Huffman.displayChar(s.char)}</td>
      <td>${s.count}</td>
      <td>${(s.prob * 100).toFixed(2)}%</td>
      <td class="huffman-code">${s.code}</td>
      <td>${s.codeLength}</td>
    `;
    tbody.appendChild(row);
  }

  Huffman.renderTree(document.getElementById('huffman-tree-container'), result.tree);

  document.getElementById('huffman-output').value = Huffman.encode(text, result.codes);
});
