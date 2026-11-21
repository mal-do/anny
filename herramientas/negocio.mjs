#!/usr/bin/env node
/* annymaldonado.com · copia los datos del consultorio y de Anny en todas las páginas
 *
 *   node herramientas/negocio.mjs              reescribe el bloque en cada página
 *   node herramientas/negocio.mjs --verifica   falla si alguna página está desfasada
 *
 * Los datos de quién es Anny y del consultorio (dirección, horario, teléfono,
 * formación, servicios…) van en TODAS las páginas como JSON-LD, para que
 * cualquier buscador o asistente que llegue a una página suelta sepa de quién
 * es. Ese bloque vive en UN solo sitio: herramientas/negocio.json. Se edita
 * ahí y se corre este script; no hay que tocar los 29 HTML a mano.
 *
 * Cómo encuentra el bloque en cada página: es el <script type="application/ld+json">
 * cuyo JSON contiene el @id "https://annymaldonado.com/#anny" como nodo
 * principal (el bloque viejo "Psychologist" o el @graph nuevo). Los demás
 * bloques de la página (Service, BlogPosting, FAQPage, BreadcrumbList) no se
 * tocan: solo lo REFERENCIAN por ese @id.
 *
 * Sin dependencias: solo Node.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'https://annymaldonado.com/#anny';
const bloque = '<script type="application/ld+json">' +
  JSON.stringify(JSON.parse(readFileSync(join(raiz, 'herramientas/negocio.json'), 'utf8'))) +
  '</script>';

function htmls(dir) {
  const fuera = [];
  for (const n of readdirSync(dir)) {
    if (n.startsWith('.') || n === 'herramientas' || n === 'node_modules') continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) fuera.push(...htmls(p));
    else if (n.endsWith('.html')) fuera.push(p);
  }
  return fuera;
}

const esElBloque = (json) => {
  try {
    const o = JSON.parse(json);
    return o['@id'] === ID || (Array.isArray(o['@graph']) && o['@graph'].some((n) => n['@id'] === ID));
  } catch { return false; }
};

const verifica = process.argv.includes('--verifica');
let cambiadas = 0, sinBloque = [];
for (const f of htmls(raiz)) {
  const html = readFileSync(f, 'utf8');
  if (/<meta\s+http-equiv="refresh"/i.test(html)) continue; // páginas de redirección
  let hallado = false;
  const nuevo = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (todo, json) => {
    if (!esElBloque(json)) return todo;
    hallado = true;
    return bloque;
  });
  if (!hallado) { sinBloque.push(relative(raiz, f)); continue; }
  if (nuevo !== html) { cambiadas++; if (!verifica) writeFileSync(f, nuevo); }
}

if (sinBloque.length) console.warn('Sin bloque del consultorio (no se tocaron):\n  ' + sinBloque.join('\n  '));
if (verifica && cambiadas) { console.error(`${cambiadas} páginas desfasadas: corre \`node herramientas/negocio.mjs\`.`); process.exit(1); }
console.log(verifica ? 'Todas las páginas al día.' : `${cambiadas} páginas actualizadas.`);
