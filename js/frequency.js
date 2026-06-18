// Darstellung der Häufigkeitsverteilung als einfaches Balkendiagramm (reines DOM/CSS)

import { ALPHABET, GERMAN_FREQ, ENGLISH_FREQ, letterFrequencies, indexOfCoincidence } from './utils.js';

/**
 * Rendert ein Balkendiagramm, das die Buchstabenhäufigkeit eines Textes
 * mit der erwarteten Verteilung einer Referenzsprache vergleicht.
 * @param {HTMLElement} container - Element, in das das Diagramm gerendert wird
 * @param {string} text - zu analysierender Text
 * @param {'de'|'en'} language - Referenzsprache für den Vergleich
 */
export function renderFrequencyChart(container, text, language = 'de') {
  const ref = language === 'en' ? ENGLISH_FREQ : GERMAN_FREQ;
  const { percentages, total } = letterFrequencies(text);

  const maxValue = Math.max(
    ...ALPHABET.split('').map(ch => Math.max(percentages[ch], ref[ch])),
    1
  );

  container.innerHTML = '';

  const chart = document.createElement('div');
  chart.className = 'freq-chart';

  for (const ch of ALPHABET) {
    const group = document.createElement('div');
    group.className = 'freq-group';

    const bars = document.createElement('div');
    bars.className = 'freq-bars';

    const textBar = document.createElement('div');
    textBar.className = 'freq-bar freq-bar-text';
    textBar.style.height = `${(percentages[ch] / maxValue) * 100}%`;
    textBar.title = `Text: ${percentages[ch].toFixed(2)}%`;

    const refBar = document.createElement('div');
    refBar.className = 'freq-bar freq-bar-ref';
    refBar.style.height = `${(ref[ch] / maxValue) * 100}%`;
    refBar.title = `Referenz (${language.toUpperCase()}): ${ref[ch].toFixed(2)}%`;

    bars.appendChild(textBar);
    bars.appendChild(refBar);

    const label = document.createElement('div');
    label.className = 'freq-label';
    label.textContent = ch;

    group.appendChild(bars);
    group.appendChild(label);
    chart.appendChild(group);
  }

  container.appendChild(chart);

  const info = document.createElement('div');
  info.className = 'freq-info';
  const ic = indexOfCoincidence(text);
  info.innerHTML = `
    <span><span class="freq-swatch freq-swatch-text"></span> Text (${total} Buchstaben)</span>
    <span><span class="freq-swatch freq-swatch-ref"></span> Referenz (${language === 'en' ? 'Englisch' : 'Deutsch'})</span>
    <span>Koinzidenzindex (IC): <strong>${ic.toFixed(4)}</strong></span>
  `;
  container.appendChild(info);
}
