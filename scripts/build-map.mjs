import {chromium} from 'playwright';
import fs from 'fs';
// Rebuilds dist/assets/rsk-map*.svg from the supplied map (source-assets/map/rsk-map-source.svg) and adds city markers.
// Run from the repository root: node scripts/build-map.mjs   (needs playwright)
const SRC='source-assets/map/rsk-map-source.svg';
const OLD='source-assets/map/markers-source.svg';
const OUT=process.argv[2]||'dist/assets';
fs.mkdirSync(OUT,{recursive:true});
let svg=fs.readFileSync(SRC,'utf8');
const old=fs.readFileSync(OLD,'utf8');
// ---- old markers
const names=['Луганск','Макеевка','Мариуполь','Мелитополь','Геническ','Донецк','Скадовск'];
const groups=[...old.matchAll(/<g>\n(<rect x="\d+" y="\d+" width="\d+" height="36" rx="16" fill="white"\/>[\s\S]*?)\n<\/g>/g)].map(m=>m[1]);
if(groups.length!==7) throw new Error('markers '+groups.length);
const markers=groups.map((g,i)=>{const c=g.match(/<rect x="(\d+)" y="(\d+)" width="32" height="32" rx="16" fill="#72C6EF"\/>/);const w=g.match(/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="36"/);return {name:names[i],body:g,ocx:+c[1]+16,ocy:+c[2]+16,pill:[+w[1],+w[2],+w[3],36]}});
// old -> new affine
const ax=2.129,bx=-29.9,ay=2.005,by=496.1;
for(const m of markers){m.cx=ax*m.ocx+bx;m.cy=ay*m.ocy+by;}
const nudge={};
for(const m of markers){const n=nudge[m.name];if(n){m.cx+=n[0];m.cy+=n[1];}}
// ---- bboxes of paths for pruning
const pathRe=/<path\b[^>]*\/>/g;
const paths=[...svg.matchAll(pathRe)].map(m=>({text:m[0],index:m.index}));
const b=await chromium.launch();
const p=await b.newPage();
await p.setContent('<body>'+svg.replace(/<\?xml[^>]*>/,'')+'</body>');
const boxes=await p.evaluate(()=>[...document.querySelectorAll('svg path')].map(e=>{const b=e.getBBox();return [b.x,b.y,b.x+b.width,b.y+b.height]}));
if(boxes.length!==paths.length) throw new Error('count '+boxes.length+' '+paths.length);
// ---- views
const bounds={x0:1e9,y0:1e9,x1:-1e9,y1:-1e9};
function grow(x0,y0,x1,y1){bounds.x0=Math.min(bounds.x0,x0);bounds.y0=Math.min(bounds.y0,y0);bounds.x1=Math.max(bounds.x1,x1);bounds.y1=Math.max(bounds.y1,y1)}
grow(1166,581,2500,1573);
const KD=+(process.env.KD||2.0); // desktop: units per display px
for(const m of markers){const [px,py,pw,ph]=m.pill;grow(m.cx+(px-m.ocx)*KD,m.cy+(py-m.ocy)*KD,m.cx+(px+pw-m.ocx)*KD,m.cy+(py+ph-m.ocy)*KD)}
console.log('bounds',bounds);
const RATIO_D=1328/580, RATIO_M=740/502;
const padD=90;
const Hd=bounds.y1-bounds.y0+2*padD;let Wd=Math.max(Hd*RATIO_D, +(process.env.WD||2630));let Hd2=Wd/RATIO_D;
const vd={x:Math.max(0,bounds.x1+padD-Wd),y:(bounds.y0+bounds.y1)/2-Hd2/2,w:Wd,h:Hd2};
const padM=80;
const Wm0=bounds.x1-bounds.x0+2*padM,Hm0=bounds.y1-bounds.y0+2*padM;let Hm=Math.max(Hm0,Wm0/RATIO_M),Wm=Hm*RATIO_M;
const vm={x:(bounds.x0+bounds.x1)/2-Wm/2,y:(bounds.y0+bounds.y1)/2-Hm/2,w:Wm,h:Hm};
console.log('desktop',vd,'medium',vm);
const keepRect=[Math.min(vd.x,vm.x)-50,Math.min(vd.y,vm.y)-50,Math.max(vd.x+vd.w,vm.x+vm.w)+50,Math.max(vd.y+vd.h,vm.y+vm.h)+50];
let out='',last=0,kept=0,dropped=0;
paths.forEach((pt,i)=>{const [x0,y0,x1,y1]=boxes[i];const hit=!(x1<keepRect[0]||x0>keepRect[2]||y1<keepRect[1]||y0>keepRect[3]);out+=svg.slice(last,pt.index);last=pt.index+pt.text.length;if(hit){out+=pt.text.replace(/\s(data-region-id|vector-effect)="[^"]*"/g,m=>m.includes('vector-effect')?m:'');kept++}else dropped++});
out+=svg.slice(last);
console.log('paths kept',kept,'dropped',dropped);
function build(view,k,markerShift){
  let s=out.replace(/<\?xml[^>]*>\s*/,'').replace(/<!--[\s\S]*?-->\s*/g,'').replace(/ id="mapSvg"/,'').replace(/viewBox="[^"]*"/,`width="${view.w===vd.w?1328:740}" height="${view.w===vd.w?580:502}" viewBox="${view.x.toFixed(1)} ${view.y.toFixed(1)} ${view.w.toFixed(1)} ${view.h.toFixed(1)}"`).replace(/ pointer-events="auto"/,'');
  s=s.replace(/data-region-id="[^"]*"\s*/g,'');
  const mk=markers.map(m=>{const sh=(markerShift&&markerShift[m.name])||[0,0];const cx=(m.cx+sh[0]).toFixed(1),cy=(m.cy+sh[1]).toFixed(1);return `<g fill="none" transform="translate(${cx} ${cy}) scale(${k.toFixed(4)}) translate(${-m.ocx} ${-m.ocy})">\n${m.body}\n</g>`}).join('\n');
  return s.replace('</svg>',mk+'\n</svg>');
}
const kD=vd.w/1328,kM=vm.w/740,kC=1.4*kM;
fs.writeFileSync(OUT+'/rsk-map.svg',build(vd,kD));
fs.writeFileSync(OUT+'/rsk-map-medium.svg',build(vm,kM));
fs.writeFileSync(OUT+'/rsk-map-compact.svg',build(vm,kC,{'Донецк':[-30,45]}));
// Download version: the supplied map untouched, plus the city markers (2 units per marker pixel on the 3840x2160 canvas).
const fullMarkers=markers.map(m=>`<g fill="none" transform="translate(${m.cx.toFixed(1)} ${m.cy.toFixed(1)}) scale(2) translate(${-m.ocx} ${-m.ocy})">\n${m.body}\n</g>`).join('\n');
fs.writeFileSync(OUT+'/rsk-map-full.svg',svg.replace('</svg>',fullMarkers+'\n</svg>'));
await b.close();

// PNG of the full map for download.
const b2=await chromium.launch();
const p2=await b2.newPage({viewport:{width:3840,height:2160}});
await p2.goto('file://'+process.cwd()+'/'+OUT+'/rsk-map-full.svg');await p2.waitForTimeout(800);
await p2.screenshot({path:OUT+'/rsk-map-full.png'});await b2.close();
