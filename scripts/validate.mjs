// Static checks for the published folder: run with `npm run check`.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve('dist');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, decodeURI(file)));
const fail = message => { throw new Error(message); };

const html = read('index.html');
const app = read('app.js');
const css = read('styles.css');

// Elements that browsers silently re-nest when a closing tag is lost must balance.
for (const tag of ['a', 'button', 'section', 'div', 'p', 'span', 'article', 'h2', 'h3']) {
  const opened = (html.match(new RegExp(`<${tag}[\\s>]`, 'g')) || []).length, closed = (html.match(new RegExp(`</${tag}>`, 'g')) || []).length;
  if (opened !== closed) fail(`Unbalanced <${tag}>: ${opened} opened, ${closed} closed`);
}

// IDs are unique and every in-page anchor points at one.
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
if (new Set(ids).size !== ids.length) fail('Duplicate HTML IDs');

// Every local src, href and srcset entry exists.
const urls = [...html.matchAll(/\s(?:src|href)="([^"]+)"/g)].map(m => m[1]);
for (const m of html.matchAll(/\ssrcset="([^"]+)"/g)) urls.push(...m[1].split(',').map(part => part.trim().split(/\s+/)[0]));
for (const url of urls) {
  if (url.startsWith('#')) { if (!ids.includes(url.slice(1))) fail('Missing anchor ' + url); }
  else if (!/^(https?:|mailto:|tel:)/.test(url) && !exists(url)) fail('Missing file ' + url);
}

// Project data: six projects, each with both image sizes on disk.
const images = [...app.matchAll(/\bimage:\s*'([^']+)'/g)].map(m => m[1]);
const smalls = [...app.matchAll(/\bsmall:\s*'([^']+)'/g)].map(m => m[1]);
if (images.length !== 6 || smalls.length !== 6) fail(`Expected 6 projects, found ${images.length} images and ${smalls.length} small images`);
for (const file of [...images, ...smalls]) if (!exists(file)) fail('Missing project image ' + file);

// Fonts referenced by the stylesheet.
for (const m of css.matchAll(/url\('([^']+)'\)/g)) if (!exists(m[1])) fail('Missing font ' + m[1]);

// Files the page, the manifest and crawlers expect.
for (const file of ['_headers', 'robots.txt', 'sitemap.xml', 'site.webmanifest', 'assets/og.png', 'assets/favicon-32.png',
  'assets/apple-touch-icon.png', 'assets/icon-192.png', 'assets/icon-512.png', 'assets/rsk-map.png',
  'downloads/RSK_Brand_Kit.zip', 'downloads/RSK_Logos.zip', 'downloads/RSK_Fonts.zip', 'downloads/RSK_Colors.zip', 'downloads/RSK_Map.zip', 'downloads/RSK_Projects.zip']) {
  if (!exists(file)) fail('Missing ' + file);
}

// Structured data is valid JSON.
for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(m[1]);

// The Content-Security-Policy allows exactly the inline scripts the page runs.
const headers = read('_headers');
for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
  const hash = crypto.createHash('sha256').update(m[1]).digest('base64');
  if (!headers.includes(`'sha256-${hash}'`)) fail('Inline script is not allowed by the CSP in _headers: sha256-' + hash);
}

console.log('Validated: anchors, IDs, files and srcsets, six projects, fonts, structured data and CSP hashes.');
