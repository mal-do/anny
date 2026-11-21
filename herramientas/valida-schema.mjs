#!/usr/bin/env node
/* annymaldonado.com · valida el JSON-LD de todas las páginas contra schema.org
 *
 *   cd herramientas && npm install     (una sola vez: schema-dts y typescript)
 *   node herramientas/valida-schema.mjs
 *
 * Cómo valida: schema-dts son los tipos oficiales de schema.org escritos en
 * TypeScript. El script copia cada bloque JSON-LD a un fichero .ts tipado y
 * deja que el compilador diga si un tipo no existe (p. ej. "Psychologist",
 * que NO existe en schema.org) o si una propiedad no corresponde a ese tipo
 * (p. ej. "availableIn" en un Service). También falla si un bloque no es
 * JSON válido.
 *
 * No sustituye a la prueba de resultados enriquecidos de Google, que mira
 * además qué campos USA Google: https://search.google.com/test/rich-results
 */
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = join(aqui, '..');
const tmp = join(aqui, '.valida');

function htmls(dir) {
  const fuera = [];
  for (const n of readdirSync(dir)) {
    if (n.startsWith('.') || n === 'node_modules') continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) fuera.push(...htmls(p));
    else if (n.endsWith('.html')) fuera.push(p);
  }
  return fuera;
}

let ts = 'import type { WithContext, Thing, Graph } from "schema-dts";\n';
let n = 0, malos = 0;
for (const f of htmls(raiz)) {
  const s = readFileSync(f, 'utf8');
  for (const m of s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let o;
    try { o = JSON.parse(m[1]); } catch (e) { console.log(`JSON inválido en ${relative(raiz, f)}: ${e.message}`); malos++; continue; }
    // schema-dts no admite "@type" con varios valores: se valida cada uno por separado.
    const variantes = Array.isArray(o['@type']) ? o['@type'].map((t) => ({ ...o, '@type': t })) : [o];
    for (const v of variantes) {
      ts += `// ${relative(raiz, f)}\nexport const b${n++}: ${v['@graph'] ? 'Graph' : 'WithContext<Thing>'} = ${JSON.stringify(v)};\n`;
    }
  }
}
mkdirSync(tmp, { recursive: true });
writeFileSync(join(tmp, 'bloques.ts'), ts);
console.log(`${n} bloques JSON-LD revisados.`);

try {
  execFileSync(join(aqui, 'node_modules/.bin/tsc'),
    ['--noEmit', '--strict', '--target', 'es2020', '--module', 'nodenext', '--moduleResolution', 'nodenext', '--typeRoots', join(aqui, 'node_modules'), join(tmp, 'bloques.ts')],
    { stdio: 'pipe', cwd: aqui });
  if (malos) process.exit(1);
  console.log('schema.org: sin errores.');
} catch (e) {
  if (e.code === 'ENOENT') { console.error('Falta instalar: cd herramientas && npm install'); process.exit(1); }
  const lineas = readFileSync(join(tmp, 'bloques.ts'), 'utf8').split('\n');
  const errores = e.stdout.toString().split('\n').filter((l) => /error TS/.test(l));
  for (const l of errores) {
    const fila = +(l.match(/\((\d+),/) || [0, 0])[1];
    console.log(`${(lineas[fila - 2] || '').slice(3)} → ${l.replace(/^.*error TS\d+: /, '').slice(0, 220)}`);
  }
  console.log(`${errores.length} errores de schema.org.`);
  process.exit(1);
}
