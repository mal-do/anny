#!/usr/bin/env node
/* annymaldonado.com · revisa lo básico de cada página antes de publicar
 *
 *   node herramientas/revisa.mjs
 *
 * Para cada página indexable (no las de redirección ni las noindex) comprueba:
 *   - <html lang="es-EC">;
 *   - que title, description, canonical, robots, Open Graph y Twitter están
 *     como etiquetas reales DENTRO del <head> (no en el <body>);
 *   - que el canonical coincide con la carpeta, y og:url con el canonical;
 *   - que ningún title ni description se repite en otra página;
 *   - que el contenido principal está en el HTML (un <main> con <h1> y texto),
 *     es decir, que se lee sin ejecutar JavaScript;
 *   - que todos los bloques JSON-LD son JSON válido;
 *   - que cada FAQPage dice lo mismo que las preguntas visibles.
 *
 * Sin dependencias: solo Node. Sale con error si algo falla.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';

const DOMINIO = 'https://annymaldonado.com';
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

function paginas(dir) {
  const fuera = [];
  for (const n of readdirSync(dir)) {
    if (n.startsWith('.') || ['herramientas', 'assets', 'img', 'node_modules'].includes(n)) continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) fuera.push(...paginas(p));
    else if (n === 'index.html') fuera.push(p);
  }
  return fuera;
}

const texto = (h) => h.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const attr = (head, re) => (head.match(re) || [])[1];

const fallos = [];
const vistos = { title: new Map(), description: new Map() };
let revisadas = 0;

for (const f of paginas(raiz)) {
  const html = readFileSync(f, 'utf8');
  if (/<meta\s+http-equiv="refresh"/i.test(html)) continue;
  const rel = relative(raiz, f);
  const mal = (m) => fallos.push(`${rel}: ${m}`);
  const head = (html.match(/<head>([\s\S]*?)<\/head>/) || [])[1] || '';
  const body = html.slice(html.indexOf('</head>'));
  if (/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(head)) continue;
  revisadas++;

  if (!/<html lang="es-EC"/.test(html)) mal('falta lang="es-EC" en <html>');

  const title = attr(head, /<title>([^<]+)<\/title>/);
  const desc = attr(head, /<meta name="description" content="([^"]+)"/);
  const canonical = attr(head, /<link rel="canonical" href="([^"]+)"/);
  const carpeta = relative(raiz, dirname(f)).split(sep).join('/');
  const esperado = `${DOMINIO}/${carpeta ? carpeta + '/' : ''}`;

  if (!title) mal('falta <title> en el <head>');
  if (!desc) mal('falta <meta name="description"> en el <head>');
  if (canonical !== esperado) mal(`canonical «${canonical}», debería ser «${esperado}»`);
  if (!/<meta name="robots" content="[^"]+">/.test(head)) mal('falta <meta name="robots">');
  for (const p of ['og:type', 'og:title', 'og:description', 'og:url', 'og:image', 'og:locale'])
    if (!head.includes(`property="${p}"`)) mal(`falta <meta property="${p}">`);
  for (const p of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'])
    if (!head.includes(`name="${p}"`)) mal(`falta <meta name="${p}">`);
  const ogUrl = attr(head, /<meta property="og:url" content="([^"]+)"/);
  if (ogUrl && ogUrl !== canonical) mal(`og:url «${ogUrl}» no coincide con el canonical`);
  if (/<meta (name|property)="(description|og:|twitter:)/.test(body) || /<link rel="canonical"/.test(body))
    mal('hay metadatos fuera del <head>');

  for (const [clave, valor] of [['title', title], ['description', desc]]) {
    if (!valor) continue;
    if (vistos[clave].has(valor)) mal(`${clave} repetido con ${vistos[clave].get(valor)}`);
    else vistos[clave].set(valor, rel);
  }

  const main = (html.match(/<main[^>]*>([\s\S]*?)<\/main>/) || [])[1];
  if (!main) mal('no hay <main>');
  else {
    if (!/<h1[\s>]/.test(main)) mal('el <main> no tiene <h1>');
    if (texto(main).length < 400) mal('el <main> casi no tiene texto en el HTML');
  }

  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let o;
    try { o = JSON.parse(m[1]); } catch (e) { mal(`JSON-LD inválido: ${e.message}`); continue; }
    if (o['@type'] !== 'FAQPage') continue;
    const visibles = [...html.matchAll(/<summary>([\s\S]*?)<\/summary>\s*<div class="acor__c">([\s\S]*?)<\/div>\s*<\/details>/g)]
      .map(([, q, a]) => [texto(q), texto(a)]);
    const json = o.mainEntity.map((q) => [q.name, q.acceptedAnswer.text]);
    if (JSON.stringify(visibles) !== JSON.stringify(json)) mal('el FAQPage no dice lo mismo que las preguntas visibles');
  }
}

if (fallos.length) {
  console.error(fallos.join('\n'));
  console.error(`\n${fallos.length} problemas en ${revisadas} páginas.`);
  process.exit(1);
}
console.log(`${revisadas} páginas revisadas: todo en orden.`);
