// Alphanumerische Codes: ASCII, UTF-8, UTF-16 und Base64 - Kodieren/Dekodieren
// und Werkzeuge zum Vergleich der jeweiligen Speicherlänge.

/**
 * Zerlegt einen Text in seine Unicode-Codepoints (berücksichtigt Surrogatpaare,
 * z.B. bei Emoji, im Gegensatz zu einer einfachen Iteration über UTF-16-Einheiten).
 */
export function codePoints(text) {
  return Array.from(text).map(ch => ch.codePointAt(0));
}

/**
 * Kodiert Text als ASCII-Codes (0-127). Zeichen außerhalb des Bereichs werden
 * in invalidChars gemeldet, im codes-Array aber trotzdem mit ihrem Codepoint ausgegeben.
 */
export function toAsciiCodes(text) {
  const chars = Array.from(text);
  const invalidChars = [];
  chars.forEach((ch, i) => {
    const cp = ch.codePointAt(0);
    if (cp > 127) invalidChars.push({ char: ch, codePoint: cp, index: i });
  });
  return { codes: chars.map(ch => ch.codePointAt(0)), invalidChars };
}

export function fromAsciiCodes(codes) {
  return codes.map(c => (c >= 0 && c <= 127 ? String.fromCharCode(c) : '�')).join('');
}

export function toUtf8Bytes(text) {
  return Array.from(new TextEncoder().encode(text));
}

export function fromUtf8Bytes(bytes) {
  return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes));
}

/**
 * UTF-16-Codeeinheiten: JS-Strings sind intern bereits UTF-16, daher entspricht
 * dies direkt charCodeAt() je Index (Emoji & Co. erscheinen als Surrogatpaar = 2 Einheiten).
 */
export function toUtf16Units(text) {
  const units = [];
  for (let i = 0; i < text.length; i++) units.push(text.charCodeAt(i));
  return units;
}

export function fromUtf16Units(units) {
  return String.fromCharCode(...units);
}

export function toBase64(text) {
  const bytes = toUtf8Bytes(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export function fromBase64(b64) {
  const binary = atob(b64.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return fromUtf8Bytes(bytes);
}

/**
 * Formatiert eine Zahlenfolge im gewünschten Format, mit Auffüllung passend
 * zur Einheitengröße (8 Bit für ASCII/UTF-8-Bytes, 16 Bit für UTF-16-Einheiten).
 */
export function formatNumbers(numbers, base, bitWidth = 8) {
  const hexDigits = Math.ceil(bitWidth / 4);
  if (base === 'hex') return numbers.map(n => '0x' + n.toString(16).toUpperCase().padStart(hexDigits, '0')).join(' ');
  if (base === 'bin') return numbers.map(n => '0b' + n.toString(2).padStart(bitWidth, '0')).join(' ');
  return numbers.join(' ');
}

/**
 * Liest eine Zahlenfolge (getrennt durch Leerzeichen/Kommas) im gewählten Format ein.
 */
export function parseNumbers(str, base) {
  const tokens = str.trim().split(/[\s,]+/).filter(Boolean);
  const radix = base === 'hex' ? 16 : base === 'bin' ? 2 : 10;
  return tokens.map(t => parseInt(t.replace(/^0[xXbB]/, ''), radix));
}

/**
 * Baut eine Zeichen-für-Zeichen-Tabelle: Codepoint, ASCII (falls darstellbar),
 * UTF-8-Bytes und UTF-16-Einheiten je Zeichen - macht die unterschiedliche
 * Längencodierung der Formate sichtbar.
 */
export function charTable(text) {
  return Array.from(text).map(ch => {
    const cp = ch.codePointAt(0);
    const utf8 = Array.from(new TextEncoder().encode(ch));
    const utf16 = [];
    for (let i = 0; i < ch.length; i++) utf16.push(ch.charCodeAt(i));
    return {
      char: ch,
      codePoint: cp,
      ascii: cp <= 127 ? cp : null,
      utf8Bytes: utf8,
      utf16Units: utf16,
    };
  });
}

/**
 * Vergleicht die Bit-/Byte-Länge des Textes unter den verschiedenen Kodierungen.
 * asciiBits ist null, wenn der Text Zeichen außerhalb von 0-127 enthält.
 */
export function sizeStats(text) {
  const points = codePoints(text);
  const hasNonAscii = points.some(cp => cp > 127);
  const utf8Bytes = toUtf8Bytes(text).length;
  const utf16Units = toUtf16Units(text).length;
  return {
    chars: points.length,
    asciiBits: hasNonAscii ? null : points.length * 8,
    utf8Bits: utf8Bytes * 8,
    utf8Bytes,
    utf16Bits: utf16Units * 16,
    utf16Units,
  };
}
