// Huffman-Codierung: Baumaufbau, Code-Erzeugung, Statistik und Baum-Visualisierung

class HuffmanNode {
  constructor({ char = null, count = 0, left = null, right = null }) {
    this.char = char;
    this.count = count;
    this.left = left;
    this.right = right;
  }
  get isLeaf() {
    return this.left === null && this.right === null;
  }
}

/**
 * Zählt die absolute Häufigkeit jedes Zeichens im Text.
 * @returns {Map<string, number>}
 */
function buildFrequencies(text) {
  const counts = new Map();
  for (const ch of text) {
    counts.set(ch, (counts.get(ch) || 0) + 1);
  }
  return counts;
}

/**
 * Baut den Huffman-Baum nach dem klassischen Greedy-Verfahren:
 * die zwei Knoten mit der kleinsten Häufigkeit werden wiederholt
 * zu einem neuen Knoten zusammengefasst, bis nur die Wurzel übrig bleibt.
 */
function buildTree(counts) {
  const nodes = [...counts.entries()]
    .map(([char, count]) => new HuffmanNode({ char, count }))
    .sort((a, b) => a.count - b.count);

  if (nodes.length === 0) return null;

  while (nodes.length > 1) {
    const left = nodes.shift();
    const right = nodes.shift();
    const parent = new HuffmanNode({ count: left.count + right.count, left, right });
    let i = 0;
    while (i < nodes.length && nodes[i].count < parent.count) i++;
    nodes.splice(i, 0, parent);
  }
  return nodes[0];
}

/**
 * Liest die Codes (Bitfolgen als String aus '0'/'1') aus dem Baum aus.
 * Sonderfall: besteht der Text nur aus einem einzigen Zeichen, gibt es
 * keine Verzweigung - das Zeichen erhält dann den Code "0".
 */
function generateCodes(root) {
  const codes = new Map();
  if (!root) return codes;
  if (root.isLeaf) {
    codes.set(root.char, '0');
    return codes;
  }
  function walk(node, prefix) {
    if (node.isLeaf) {
      codes.set(node.char, prefix);
      return;
    }
    walk(node.left, prefix + '0');
    walk(node.right, prefix + '1');
  }
  walk(root, '');
  return codes;
}

/**
 * Stellt Steuerzeichen lesbar dar (Leerzeichen, Zeilenumbruch, Tab, ...).
 */
export function displayChar(ch) {
  const map = { ' ': '␣', '\n': '⏎', '\t': '⇥', '\r': '␍' };
  return map[ch] ?? ch;
}

/**
 * Führt die komplette Huffman-Analyse für einen Text durch: Baum, Codes,
 * Entropie, durchschnittliche Codewortlänge und Kompressionsstatistik.
 * @param {string} text
 */
export function analyze(text) {
  const total = text.length;
  if (total === 0) {
    return {
      text, total: 0, distinct: 0, symbols: [], tree: null, codes: new Map(),
      entropy: 0, avgLength: 0, inputBitsAscii: 0, outputBits: 0, compressionRatio: 0,
    };
  }

  const counts = buildFrequencies(text);
  const tree = buildTree(counts);
  const codes = generateCodes(tree);

  const symbols = [...counts.entries()]
    .map(([char, count]) => {
      const prob = count / total;
      const code = codes.get(char) || '';
      return { char, count, prob, code, codeLength: code.length };
    })
    .sort((a, b) => b.count - a.count);

  let entropy = 0;
  let avgLength = 0;
  for (const s of symbols) {
    entropy += -s.prob * Math.log2(s.prob);
    avgLength += s.prob * s.codeLength;
  }

  const outputBits = symbols.reduce((sum, s) => sum + s.count * s.codeLength, 0);
  const inputBitsAscii = total * 8;
  const compressionRatio = outputBits / inputBitsAscii;

  return {
    text, total, distinct: symbols.length, symbols, tree, codes,
    entropy, avgLength, inputBitsAscii, outputBits, compressionRatio,
  };
}

/**
 * Kodiert einen Text als Bitfolge (String aus '0'/'1') anhand der übergebenen Codetabelle.
 */
export function encode(text, codes) {
  let out = '';
  for (const ch of text) out += codes.get(ch);
  return out;
}

/**
 * Ordnet jedem Knoten eine (x, y)-Position für die Baum-Zeichnung zu:
 * x = Reihenfolge unter den Blättern, y = Tiefe im Baum.
 */
function layoutTree(root) {
  let leafIndex = 0;
  const positions = new Map();
  function assign(node, depth) {
    if (node.isLeaf) {
      positions.set(node, { x: leafIndex++, y: depth });
      return;
    }
    assign(node.left, depth + 1);
    assign(node.right, depth + 1);
    positions.set(node, { x: (positions.get(node.left).x + positions.get(node.right).x) / 2, y: depth });
  }
  assign(root, 0);
  return positions;
}

/**
 * Zeichnet den Huffman-Baum als SVG in das übergebene Container-Element.
 * Linke Kanten = Bit 0, rechte Kanten = Bit 1.
 */
export function renderTree(container, root) {
  container.innerHTML = '';
  if (!root) return;

  const positions = layoutTree(root);
  let maxX = 0, maxY = 0;
  for (const pos of positions.values()) {
    maxX = Math.max(maxX, pos.x);
    maxY = Math.max(maxY, pos.y);
  }

  const leafGap = 60;
  const levelGap = 76;
  const marginX = 36;
  const marginY = 28;
  const width = marginX * 2 + maxX * leafGap;
  const height = marginY * 2 + maxY * levelGap;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.classList.add('huffman-tree-svg');

  function px(node) {
    const p = positions.get(node);
    return { x: marginX + p.x * leafGap, y: marginY + p.y * levelGap };
  }

  function drawEdges(node) {
    if (node.isLeaf) return;
    const parentPos = px(node);
    for (const [child, bit] of [[node.left, '0'], [node.right, '1']]) {
      const childPos = px(child);
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', parentPos.x);
      line.setAttribute('y1', parentPos.y);
      line.setAttribute('x2', childPos.x);
      line.setAttribute('y2', childPos.y);
      line.setAttribute('class', 'huffman-edge');
      svg.appendChild(line);

      const label = document.createElementNS(svgNS, 'text');
      label.setAttribute('x', (parentPos.x + childPos.x) / 2 + (bit === '0' ? -9 : 9));
      label.setAttribute('y', (parentPos.y + childPos.y) / 2);
      label.setAttribute('class', 'huffman-edge-label');
      label.textContent = bit;
      svg.appendChild(label);

      drawEdges(child);
    }
  }
  drawEdges(root);

  function drawNode(node) {
    const pos = px(node);
    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('cx', pos.x);
    circle.setAttribute('cy', pos.y);
    circle.setAttribute('r', node.isLeaf ? 15 : 11);
    circle.setAttribute('class', 'huffman-node ' + (node.isLeaf ? 'huffman-node-leaf' : 'huffman-node-internal'));
    svg.appendChild(circle);

    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('x', pos.x);
    text.setAttribute('y', node.isLeaf ? pos.y + 30 : pos.y - 16);
    text.setAttribute('class', 'huffman-node-label');
    text.textContent = node.isLeaf ? `${displayChar(node.char)} (${node.count})` : `${node.count}`;
    svg.appendChild(text);

    if (!node.isLeaf) {
      drawNode(node.left);
      drawNode(node.right);
    }
  }
  drawNode(root);

  container.appendChild(svg);
}
