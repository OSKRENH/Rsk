import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('dist');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
if(new Set(ids).size!==ids.length)throw new Error('Duplicate HTML IDs');
const references=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]);
for(const url of references){if(url.startsWith('#')){if(!ids.includes(url.slice(1)))throw new Error('Missing anchor '+url)}else if(!/^(https?:|tel:)/.test(url)&&!fs.existsSync(path.join(root,url)))throw new Error('Missing asset '+url)}
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
for(const m of app.matchAll(/image:'([^']+)'/g)){if(!fs.existsSync(path.join(root,m[1])))throw new Error('Missing project image '+m[1])}
for(const m of fs.readFileSync(path.join(root,'styles.css'),'utf8').matchAll(/url\('([^']+)'\)/g)){if(!fs.existsSync(path.join(root,m[1])))throw new Error('Missing font '+m[1])}
console.log('Validated: anchors, IDs, downloadable files, fonts and all six project images.');
