'use strict';
const $ = selector => document.querySelector(selector);
const menu=$('.menu'), nav=$('#navigation');
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'Закрыть':'Меню';nav.classList.toggle('open',open)});
nav.addEventListener('click',e=>{if(e.target.closest('a')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='Меню'}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='Меню'}});
let toastTimer;
function notify(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>{$('#toast').hidden=true},3000)}
document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(button.dataset.copy);notify('Скопировано: '+button.dataset.copy)}catch{notify('Код цвета: '+button.dataset.copy+', выделите и скопируйте вручную')}}));
// Each card owns its color, surface, and current download independently.
const logoAssets={
  full:{color:'rsk-logo.svg',white:'rsk-logo-white.svg',black:'rsk-logo-black.svg'},
  symbol:{color:'rsk-symbol.svg',white:'rsk-symbol-white.svg',black:'rsk-symbol-black.svg'},
  alternative:{color:'rsk-logo-alternative.svg',white:'rsk-logo-alternative-white.svg',black:'rsk-logo-alternative-black.svg'}
};
const toneLabels={color:'цветной',white:'белый',black:'чёрный'};
document.querySelectorAll('[data-logo-key]').forEach(card=>{
  const stage=card.querySelector('.logo-stage'),image=card.querySelector('.logo-art img'),download=card.querySelector('[data-logo-download]');
  const title=card.querySelector('h3').textContent;
  // Preload all three so a rapid change has immediate visual feedback.
  Object.values(logoAssets[card.dataset.logoKey]).forEach(file=>{const preload=new Image();preload.src='assets/'+file});
  card.querySelectorAll('[data-logo-tone]').forEach(button=>button.addEventListener('click',()=>{
    const tone=button.dataset.logoTone,file='assets/'+logoAssets[card.dataset.logoKey][tone];
    card.dataset.currentTone=tone;image.src=file;image.alt=title+' РСК, '+toneLabels[tone];
    stage.classList.remove('tone-color','tone-white','tone-black');stage.classList.add('tone-'+tone);
    download.href=file;download.setAttribute('aria-label','Скачать: '+title.toLowerCase()+', '+toneLabels[tone]);
    card.querySelectorAll('[data-logo-tone]').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
  }));
});
const preview=$('#font-preview');if(matchMedia('(max-width:768px)').matches){$('#font-size').value='36';$('#font-size-output').value='36 px'}preview.value=preview.value.replace('\\n','\n');
preview.style.fontSize=$('#font-size').value+'px';preview.style.fontWeight=$('#font-weight').value;
$('#font-weight').addEventListener('change',e=>preview.style.fontWeight=e.target.value);
$('#font-size').addEventListener('input',e=>{preview.style.fontSize=e.target.value+'px';$('#font-size-output').value=e.target.value+' px'});
const projects=[
{name:'Центральный квартал',city:'Луганск',image:'assets/central.webp',slug:'zhk-tsentralnyy-kvartal',folder:'Центральный квартал'},
{name:'Кленовая аллея',city:'Мариуполь',image:'assets/klen.webp',slug:'zhk-klenovaya-alleya',folder:'Кленовая Аллея'},
{name:'Морская аллея',city:'Геническ',image:'assets/sea.webp',slug:'zhk-morskaya-alleya',folder:'Морская аллея'},
{name:'Садовый квартал',city:'Макеевка',image:'assets/garden.webp',slug:'zhk-sadovyy-kvartal',folder:'Макеевка Садовый квартал'},
{name:'Черешневый сад',city:'Мелитополь',image:'assets/cherry.webp',slug:'zhk-chereshnevyy-sad',folder:'Черешневый сад'},
{name:'Лазурный берег',city:'Геническ',image:'assets/azure.webp',slug:'zhk-lazurnyy-bereg',folder:'Лазурный Берег'}];
const diskUrl=p=>'https://disk.yandex.ru/d/Vznzzq6ocT7DKA/'+encodeURIComponent(p.folder);
let city='Все';
function icon(name){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','ic');svg.setAttribute('aria-hidden','true');const use=document.createElementNS('http://www.w3.org/2000/svg','use');use.setAttribute('href','#i-'+name);svg.append(use);return svg}
function element(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el}
function renderProjects(){const query=$('#project-search').value.trim().toLocaleLowerCase('ru');const visible=projects.filter(p=>(city==='Все'||p.city===city)&&(`${p.name} ${p.city}`).toLocaleLowerCase('ru').includes(query));const grid=$('#project-grid');grid.replaceChildren();$('#project-empty').hidden=visible.length>0;visible.forEach((p,i)=>{const card=element('article','project-card');card.style.setProperty('--i',i);const button=element('button','project-image');button.setAttribute('aria-label','Посмотреть рендер: '+p.name);const img=element('img');img.src=p.image;img.alt='Рендер ЖК '+p.name;img.loading='lazy';img.width=800;img.height=600;button.append(img);button.addEventListener('click',()=>openProject(p,button));const info=element('div','project-info');info.append(element('p','',p.city),element('h3','',p.name));const links=element('div','project-links');const disk=element('a','','Все ракурсы ');disk.append(icon('up-right'));disk.href=diskUrl(p);disk.target='_blank';disk.rel='noopener';const download=element('a','','Скачать превью ');download.append(icon('down'));download.href=p.image;download.download=p.name;links.append(disk,download);info.append(links);card.append(button,info);grid.append(card)})}
document.querySelectorAll('[data-city]').forEach(b=>b.addEventListener('click',()=>{city=b.dataset.city;document.querySelectorAll('[data-city]').forEach(button=>button.setAttribute('aria-pressed',String(b===button)));renderProjects()}));
$('#project-search').addEventListener('input',renderProjects);
// A critically damped spring keeps presentation and velocity when redirected.
const dialog=$('#project-dialog');
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
let progress=0,velocity=0,target=0,frame=0,lastTime=0,sourceButton=null;
let dragY=0,dragV=0,dragTarget=0,dragFrame=0,dragLast=0;
function presentDialog(){
  const open=Math.max(0,Math.min(1,progress)),span=dialog.offsetHeight||600,away=Math.max(0,Math.min(1,dragY/span));
  dialog.style.opacity=String(open*(1-.4*away));
  dialog.style.transform=`translateY(${dragY}px) `+(reduceMotion.matches?'none':`scale(${.94+.06*progress})`);
  dialog.style.setProperty('--scrim',String(.5*open*(1-away)));
}
function settleDialog(){
  progress=target;velocity=0;frame=0;presentDialog();
  if(target===0&&dialog.open){dialog.close();sourceButton?.focus({preventScroll:true})}
}
function springStep(now){
  const dt=Math.min((now-lastTime)/1000,.064);lastTime=now;
  // Exact critical damping solution, omega=20: approximately .35s response.
  const omega=20,displacement=progress-target;
  const coefficient=velocity+omega*displacement,decay=Math.exp(-omega*dt);
  progress=target+(displacement+coefficient*dt)*decay;
  velocity=(velocity-omega*coefficient*dt)*decay;
  presentDialog();
  if(Math.abs(progress-target)<.001&&Math.abs(velocity)<.01)settleDialog();
  else frame=requestAnimationFrame(springStep);
}
function moveDialog(next){
  target=next;
  if(reduceMotion.matches){cancelAnimationFrame(frame);settleDialog();return}
  if(!frame){lastTime=performance.now();frame=requestAnimationFrame(springStep)}
}
function openProject(p,button){
  sourceButton=button;cancelAnimationFrame(dragFrame);dragFrame=0;dragY=0;dragV=0;
  $('#dialog-title').textContent=p.name;$('#dialog-city').textContent=p.city;
  $('#dialog-image').src=p.image;$('#dialog-image').alt='Рендер ЖК '+p.name;
  $('#dialog-download').href=p.image;$('#dialog-download').download=p.name;
  $('#dialog-disk').href=diskUrl(p);$('#dialog-site').href='https://rsk-development.ru/projects/'+p.slug;
  if(!dialog.open){progress=0;velocity=0;presentDialog();dialog.showModal()}
  const source=button.getBoundingClientRect(),surface=dialog.getBoundingClientRect();
  dialog.style.setProperty('--origin-x',`${Math.max(0,Math.min(100,(source.left+source.width/2-surface.left)/surface.width*100))}%`);
  dialog.style.setProperty('--origin-y',`${Math.max(0,Math.min(100,(source.top+source.height/2-surface.top)/surface.height*100))}%`);
  moveDialog(1);
}
$('#dialog-close').addEventListener('click',()=>moveDialog(0));
// Sheet drag: 1:1 tracking with rubber-banded upward pull; release velocity is projected
// (Apple's exponential deceleration) to choose dismiss vs return, then handed to a critically damped spring.
const project=(v,rate=.998)=>v/1000*rate/(1-rate);
const rubberband=(over,dim,k=.55)=>over*dim*k/(dim+k*Math.abs(over));
function springDrag(now){
  const dt=Math.min((now-dragLast)/1000,.064);dragLast=now;
  const omega=20,displacement=dragY-dragTarget,coefficient=dragV+omega*displacement,decay=Math.exp(-omega*dt);
  dragY=dragTarget+(displacement+coefficient*dt)*decay;dragV=(dragV-omega*coefficient*dt)*decay;
  presentDialog();
  if(Math.abs(dragY-dragTarget)<.5&&Math.abs(dragV)<5){
    dragFrame=0;dragY=dragTarget;
    if(dragTarget>0){dragY=0;dragV=0;progress=0;velocity=0;target=0;presentDialog();dialog.close();sourceButton?.focus({preventScroll:true})}
    else presentDialog();
  }else dragFrame=requestAnimationFrame(springDrag);
}
function releaseDrag(vy){
  const span=dialog.offsetHeight,close=dragY+project(vy)>span*.3;
  dragTarget=close?span+40:0;
  if(reduceMotion.matches){dragV=0;dragY=dragTarget;if(close){dragY=0;progress=0;target=0;presentDialog();dialog.close();sourceButton?.focus({preventScroll:true})}else presentDialog();return}
  dragV=vy;dragLast=performance.now();dragFrame=requestAnimationFrame(springDrag);
}
(()=>{
  const zone=dialog.querySelector('img');let id=null,startY=0,samples=[];
  zone.addEventListener('pointerdown',e=>{if(e.button>0)return;cancelAnimationFrame(dragFrame);dragFrame=0;id=e.pointerId;zone.setPointerCapture(id);
    // Grab from the live on-screen offset so an interrupted release never jumps.
    startY=e.clientY-dragY;samples=[{t:e.timeStamp,y:dragY}]});
  zone.addEventListener('pointermove',e=>{if(e.pointerId!==id)return;
    const raw=e.clientY-startY;dragY=raw<0?-rubberband(-raw,dialog.offsetHeight):raw;
    samples.push({t:e.timeStamp,y:dragY});if(samples.length>6)samples.shift();presentDialog()});
  const end=e=>{if(e.pointerId!==id)return;id=null;
    const last=samples[samples.length-1],first=samples.find(s=>e.timeStamp-s.t<=100);
    // Only motion in the last 100ms counts; holding still before release means zero velocity.
    const dt=first?(last.t-first.t)/1000:0,vy=dt>0?(last.y-first.y)/dt:0;releaseDrag(vy)};
  zone.addEventListener('pointerup',end);zone.addEventListener('pointercancel',end);
})();
dialog.addEventListener('cancel',e=>{e.preventDefault();moveDialog(0)});
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)moveDialog(0)}});
reduceMotion.addEventListener('change',()=>{if(frame){cancelAnimationFrame(frame);settleDialog()}});
// Wayfinding follows the visible section; no scroll handler or layout polling.
if('IntersectionObserver' in window){
  const sectionObserver=new IntersectionObserver(entries=>{
    const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
    if(visible)nav.querySelectorAll('a').forEach(link=>{
      if(link.hash==='#'+visible.target.id)link.setAttribute('aria-current','true');
      else link.removeAttribute('aria-current');
    });
  },{rootMargin:'-15% 0px -55% 0px',threshold:0});
  document.querySelectorAll('main .section').forEach(section=>sectionObserver.observe(section));
}
renderProjects();
// One entrance system: blocks rise once when they first enter the viewport.
(()=>{
  const targets=document.querySelectorAll('.heading,.logo-toolbar,.logo-item,.guidance,.swatch,.note,.type-workspace,.alphabet,.project-toolbar,.download-list>a,.footer-main');
  if(!('IntersectionObserver' in window)||reduceMotion.matches){return}
  const seen=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in');seen.unobserve(entry.target)}}),{rootMargin:'0px 0px -8% 0px',threshold:.08});
  targets.forEach(el=>{
    const siblings=[...el.parentElement.children].filter(c=>c.matches('.logo-item,.swatch,.download-list>a'));
    el.style.setProperty('--i',Math.max(0,siblings.indexOf(el)));
    el.classList.add('reveal');seen.observe(el);
  });
})();
