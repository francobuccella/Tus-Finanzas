// Unpacks the __bundler/template script tag from the dc bundle into a
// readable HTML file for editing. See tools/pack.mjs for the reverse.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, '..', 'Tus Finanzas (standalone).html');
const OUT = join(__dirname, 'decoded', 'template.html');

const TAG_OPEN = '<script type="__bundler/template">';
const TAG_CLOSE = '</script>';

const raw = readFileSync(SRC, 'utf8');

const openIdx = raw.indexOf(TAG_OPEN);
if (openIdx === -1) throw new Error('Could not find __bundler/template open tag');
const contentStart = openIdx + TAG_OPEN.length;
const closeIdx = raw.indexOf(TAG_CLOSE, contentStart);
if (closeIdx === -1) throw new Error('Could not find __bundler/template close tag');

const jsonStr = raw.slice(contentStart, closeIdx);
const html = JSON.parse(jsonStr);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, html, 'utf8');

console.log(`Unpacked ${html.length} chars -> ${OUT}`);
