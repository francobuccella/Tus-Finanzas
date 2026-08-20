// Re-packs tools/decoded/template.html back into the dc bundle format,
// reproducing the bundler's own escaping (every literal "</" becomes "<\/"
// inside the JSON string) so the outer HTML parser doesn't prematurely
// close the __bundler/template <script> tag on a </div>, </button>, etc.
// See tools/unpack.mjs for the reverse direction.
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, '..', 'Tus Finanzas (standalone).html');
const DECODED = join(__dirname, 'decoded', 'template.html');
const DEPLOY = join(__dirname, '..', 'docs', 'index.html');

const TAG_OPEN = '<script type="__bundler/template">';
const TAG_CLOSE = '</script>';

const raw = readFileSync(SRC, 'utf8');
const html = readFileSync(DECODED, 'utf8');

const openIdx = raw.indexOf(TAG_OPEN);
if (openIdx === -1) throw new Error('Could not find __bundler/template open tag');
const contentStart = openIdx + TAG_OPEN.length;
const closeIdx = raw.indexOf(TAG_CLOSE, contentStart);
if (closeIdx === -1) throw new Error('Could not find __bundler/template close tag');

let jsonStr = JSON.stringify(html);
jsonStr = jsonStr.replace(/<\//g, '<\\u002F');

// Preserve whatever whitespace originally surrounded the JSON string inside
// the script tag (e.g. a wrapping newline before/after), so a no-op
// unpack->pack round-trip is byte-identical to the source.
const between = raw.slice(contentStart, closeIdx);
const leadingWs = between.match(/^\s*/)[0];
const trailingWs = between.match(/\s*$/)[0];

const before = raw.slice(0, contentStart);
const after = raw.slice(closeIdx);
const packed = before + leadingWs + jsonStr + trailingWs + after;

// Sanity: the packed template tag content must round-trip back to the
// exact same decoded HTML, and must contain no literal "</" (which would
// prematurely close the outer <script> tag in a real browser/parser).
const reDecoded = JSON.parse(jsonStr);
if (reDecoded !== html) {
  throw new Error('Round-trip mismatch: JSON.parse(packed) !== source html');
}
if (jsonStr.includes('</')) {
  throw new Error('Packed JSON string still contains a literal "</" — escaping failed');
}

writeFileSync(SRC, packed, 'utf8');
copyFileSync(SRC, DEPLOY);

console.log(`Packed ${html.length} chars -> ${SRC}`);
console.log(`Copied -> ${DEPLOY}`);
