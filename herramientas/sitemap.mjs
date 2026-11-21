#!/usr/bin/env node
/* annymaldonado.com · genera sitemap.xml a partir de las páginas que existen
 *
 *   node herramientas/sitemap.mjs              escribe sitemap.xml
 *   node herramientas/sitemap.mjs --verifica   falla si sitemap.xml no está al día
 *
 * Por qué un script y no un sitemap escrito a mano: el anterior listaba los
 * artículos en la raíz (/amistad/) cuando viven en /blog/amistad/, y nadie lo
 * notó porque el fichero no sabía nada de las carpetas. Aquí la lista sale de
 * las carpetas mismas, así que no se puede desincronizar.
 *
 * Qué entra:
 *   - cada index.html del sitio (la URL es su carpeta: blog/amistad/index.html
 *     → https://annymaldonado.com/blog/amistad/).
 * Qué NO entra:
 *   - 404.html,
 *   - las páginas de redirección (las que llevan <meta http-equiv="refresh">),
 *   - las que tienen <meta name="robots" content="noindex…">,
 *   - lo que está en herramientas/.
 *
 * Comprobación de seguridad: si el <link rel="canonical"> de una página no
 * coincide con su carpeta, el script se detiene y dice cuál. Es exactamente
 * el error que tenía el blog.
 *
 * <lastmod>, por orden de preferencia:
 *   1. el "dateModified" del JSON-LD de la página, si lo tiene (artículos);
 *   2. si la página tiene cambios sin commit, la fecha de hoy;
 *   3. la fecha del último commit que tocó el fichero.
 *   Por eso conviene correrlo justo antes de hacer el commit.
 *
 * Sin dependencias: solo Node.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';

const DOMINIO = 'https://annymaldonado.com';
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const NO_ENTRAN = new Set(['.git', 'herramientas', 'assets', 'img', 'node_modules']);

function paginas(dir) {
  const fuera = [];
  for (const nombre of readdirSync(dir)) {
    if (nombre.startsWith('.') || NO_ENTRAN.has(nombre)) continue;
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) fuera.push(...paginas(ruta));
    else if (nombre === 'index.html') fuera.push(ruta);
  }
  return fuera;
}

const git = (...args) => execFileSync('git', ['-C', raiz, ...args], { encoding: 'utf8' }).trim();
const hoy = new Date().toISOString().slice(0, 10);

function lastmod(fichero, html) {
  const m = html.match(/"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const rel = relative(raiz, fichero);
  if (git('status', '--porcelain', '--', rel)) return hoy;
  return git('log', '-1', '--format=%cs', '--', rel) || hoy;
}

const errores = [];
const urls = [];
for (const fichero of paginas(raiz)) {
  const html = readFileSync(fichero, 'utf8');
  if (/<meta\s+http-equiv="refresh"/i.test(html)) continue;
  if (/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html)) continue;
  const carpeta = relative(raiz, dirname(fichero)).split(sep).join('/');
  const loc = `${DOMINIO}/${carpeta ? carpeta + '/' : ''}`;
  const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  if (canonical !== loc) errores.push(`${relative(raiz, fichero)}: canonical «${canonical}», debería ser «${loc}»`);
  urls.push({ loc, lastmod: lastmod(fichero, html) });
}

if (errores.length) {
  console.error('El canonical no coincide con la carpeta en:\n  ' + errores.join('\n  '));
  process.exit(1);
}

// La portada primero; el resto, por ruta, así los artículos quedan juntos.
urls.sort((a, b) => (a.loc === `${DOMINIO}/` ? -1 : b.loc === `${DOMINIO}/` ? 1 : a.loc.localeCompare(b.loc)));

const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<!-- Generado por herramientas/sitemap.mjs. No lo edites a mano: corre `node herramientas/sitemap.mjs`. -->\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join('\n') +
  '\n</urlset>\n';

const destino = join(raiz, 'sitemap.xml');
if (process.argv.includes('--verifica')) {
  const actual = existsSync(destino) ? readFileSync(destino, 'utf8') : '';
  if (actual !== xml) { console.error('sitemap.xml no está al día: corre `node herramientas/sitemap.mjs`.'); process.exit(1); }
  console.log(`sitemap.xml al día (${urls.length} URLs).`);
} else {
  writeFileSync(destino, xml);
  console.log(`sitemap.xml: ${urls.length} URLs.`);
}
