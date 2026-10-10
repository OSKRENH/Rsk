'use strict';
const $ = selector => document.querySelector(selector);
const menu=$('.menu'), nav=$('#navigation');
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'Закрыть':'Меню';nav.classList.toggle('open',open)});
nav.addEventListener('click',e=>{if(e.target.closest('a')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='Меню'}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='Меню'}});
let toastTimer;
function notify(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>{$('#toast').hidden=true},3000)}
document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(button.dataset.copy);notify('Скопировано: '+button.dataset.copy)}catch{notify('Код цвета: '+button.dataset.copy+' · выделите и скопируйте вручную')}}));
document.querySelectorAll('[data-logo-theme]').forEach(button=>button.addEventListener('click',()=>{const white=button.dataset.logoTheme==='white';document.querySelectorAll('[data-logo-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));$('#full-logo-stage').classList.toggle('blue',white);$('#full-logo').src=white?'assets/rsk-logo-white.svg':'assets/rsk-logo.svg';$('#logo-download').href=$('#full-logo').src}));
const preview=$('#font-preview');if(matchMedia('(max-width:768px)').matches){$('#font-size').value='40';$('#font-size-output').value='40 px'}preview.value=preview.value.replace('\\n','\n');
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
function element(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el}
function renderProjects(){const query=$('#project-search').value.trim().toLocaleLowerCase('ru');const visible=projects.filter(p=>(city==='Все'||p.city===city)&&(`${p.name} ${p.city}`).toLocaleLowerCase('ru').includes(query));const grid=$('#project-grid');grid.replaceChildren();$('#project-empty').hidden=visible.length>0;visible.forEach(p=>{const card=element('article','project-card');const button=element('button','project-image');button.setAttribute('aria-label','Посмотреть рендер: '+p.name);const img=element('img');img.src=p.image;img.alt='Рендер ЖК '+p.name;img.loading='lazy';img.width=800;img.height=600;button.append(img);button.addEventListener('click',()=>openProject(p));const info=element('div','project-info');info.append(element('p','',p.city),element('h3','',p.name));const links=element('div','project-links');const disk=element('a','','Все ракурсы ↗');disk.href=diskUrl(p);disk.target='_blank';disk.rel='noopener';const download=element('a','','Скачать превью ↓');download.href=p.image;download.download=p.name;links.append(disk,download);info.append(links);card.append(button,info);grid.append(card)})}
document.querySelectorAll('[data-city]').forEach(b=>b.addEventListener('click',()=>{city=b.dataset.city;document.querySelectorAll('[data-city]').forEach(button=>button.setAttribute('aria-pressed',String(b===button)));renderProjects()}));
$('#project-search').addEventListener('input',renderProjects);
const dialog=$('#project-dialog');function openProject(p){$('#dialog-title').textContent=p.name;$('#dialog-city').textContent=p.city;$('#dialog-image').src=p.image;$('#dialog-image').alt='Рендер ЖК '+p.name;$('#dialog-download').href=p.image;$('#dialog-download').download=p.name;$('#dialog-disk').href=diskUrl(p);$('#dialog-site').href='https://rsk-development.ru/projects/'+p.slug;dialog.showModal()}
$('#dialog-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});renderProjects();
