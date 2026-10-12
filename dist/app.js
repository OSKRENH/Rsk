'use strict';
const $ = selector => document.querySelector(selector);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

// ---- Mobile menu: a disclosure that closes on Escape, on a link, or on a tap outside ----
const menu = $('.menu'), nav = $('#navigation');
function setMenu(open, {restoreFocus = false} = {}) {
  menu.setAttribute('aria-expanded', String(open));
  menu.textContent = open ? 'Закрыть' : 'Меню';
  nav.classList.toggle('open', open);
  if (!open && restoreFocus) menu.focus({preventScroll: true});
}
menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('click', e => {
  if (nav.classList.contains('open') && !e.target.closest('.topbar')) setMenu(false);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && nav.classList.contains('open')) setMenu(false, {restoreFocus: nav.contains(document.activeElement)});
});

// ---- Toast: one status line; it enters and leaves along the same path ----
const toast = $('#toast');
let toastTimer;
function notify(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

// ---- Copy color values; the arrow on a HEX button briefly turns into a check ----
document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(button.dataset.copy);
    notify('Скопировано: ' + button.dataset.copy);
    const use = button.querySelector('use');
    if (use) {
      use.setAttribute('href', '#i-check');
      clearTimeout(button._copyTimer);
      button._copyTimer = setTimeout(() => use.setAttribute('href', '#i-up-right'), 1400);
    }
  } catch {
    notify('Не удалось скопировать: ' + button.dataset.copy + '. Выделите и скопируйте вручную');
  }
}));

// ---- Logos: each card owns its color, surface and current download ----
const logoAssets = {
  full: {color: 'rsk-logo.svg', white: 'rsk-logo-white.svg', black: 'rsk-logo-black.svg'},
  symbol: {color: 'rsk-symbol.svg', white: 'rsk-symbol-white.svg', black: 'rsk-symbol-black.svg'},
  alternative: {color: 'rsk-logo-alternative.svg', white: 'rsk-logo-alternative-white.svg', black: 'rsk-logo-alternative-black.svg'}
};
const toneLabels = {color: 'цветной', white: 'белый', black: 'черный'};
document.querySelectorAll('[data-logo-key]').forEach(card => {
  const key = card.dataset.logoKey, stage = card.querySelector('.logo-stage');
  const image = card.querySelector('.logo-art img'), inline = card.querySelector('.logo-svg');
  const download = card.querySelector('[data-logo-download]'), note = card.querySelector('.asset-caption p');
  const title = card.querySelector('h3').textContent, toggle = card.querySelector('.desc-switch');
  let tone = 'color', descriptor = true;
  if (toggle) stage.classList.add('desc-on');
  // Other color files load only when the visitor shows intent, not on every page view.
  const preload = () => {
    const sets = [logoAssets[key]];
    if (toggle) sets.push(logoAssets.symbol);
    sets.forEach(set => Object.values(set).forEach(file => { new Image().src = 'assets/' + file; }));
  };
  ['pointerenter', 'focusin', 'touchstart'].forEach(type => stage.addEventListener(type, preload, {once: true, passive: true}));
  function update() {
    // Without the descriptor the download is the compact mark in the same color.
    const plain = toggle && !descriptor;
    const file = 'assets/' + logoAssets[plain ? 'symbol' : key][tone];
    const label = (plain ? 'Знак без дескриптора' : title) + ' РСК, ' + toneLabels[tone];
    if (image) { image.src = file; image.alt = label; }
    if (inline) inline.setAttribute('aria-label', label);
    stage.classList.remove('tone-color', 'tone-white', 'tone-black');
    stage.classList.add('tone-' + tone);
    download.href = file;
    download.setAttribute('aria-label', 'Скачать: ' + (plain ? 'знак без дескриптора' : title.toLowerCase()) + ', ' + toneLabels[tone]);
    if (toggle && note) note.textContent = descriptor ? 'С названием компании' : 'Только знак';
  }
  card.querySelectorAll('[data-logo-tone]').forEach(button => button.addEventListener('click', () => {
    tone = button.dataset.logoTone;
    update();
    card.querySelectorAll('[data-logo-tone]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  }));
  if (toggle) toggle.addEventListener('click', () => {
    descriptor = !descriptor;
    toggle.setAttribute('aria-checked', String(descriptor));
    stage.classList.toggle('desc-on', descriptor);
    update();
  });
});

// ---- Projects ----
const projects = [
  {name: 'Центральный квартал', city: 'Луганск', image: 'assets/central.webp', small: 'assets/central-600.webp', w: 1200, slug: 'zhk-tsentralnyy-kvartal', folder: 'Центральный квартал'},
  {name: 'Кленовая аллея', city: 'Мариуполь', image: 'assets/klen.webp', small: 'assets/klen-600.webp', w: 1200, slug: 'zhk-klenovaya-alleya', folder: 'Кленовая Аллея'},
  {name: 'Морская аллея', city: 'Геническ', image: 'assets/sea.webp', small: 'assets/sea-600.webp', w: 1000, slug: 'zhk-morskaya-alleya', folder: 'Морская аллея'},
  {name: 'Садовый квартал', city: 'Макеевка', image: 'assets/garden.webp', small: 'assets/garden-600.webp', w: 1200, slug: 'zhk-sadovyy-kvartal', folder: 'Макеевка Садовый квартал'},
  {name: 'Черешневый сад', city: 'Мелитополь', image: 'assets/cherry.webp', small: 'assets/cherry-600.webp', w: 1200, slug: 'zhk-chereshnevyy-sad', folder: 'Черешневый сад'},
  {name: 'Лазурный берег', city: 'Геническ', image: 'assets/azure.webp', small: 'assets/azure-600.webp', w: 1200, slug: 'zhk-lazurnyy-bereg', folder: 'Лазурный Берег'}
];
const diskUrl = p => 'https://disk.yandex.ru/d/Vznzzq6ocT7DKA/' + encodeURIComponent(p.folder);
const NEW_TAB = ', откроется в новой вкладке';
let city = 'Все';
function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'ic');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', '#i-' + name);
  svg.append(use);
  return svg;
}
function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
function projectCount(n) {
  const mod10 = n % 10, mod100 = n % 100;
  const word = mod10 === 1 && mod100 !== 11 ? 'проект' : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? 'проекта' : 'проектов';
  return n ? 'Показано ' + n + ' ' + word : 'Проектов не найдено';
}
function renderProjects({animate = false, announce = true} = {}) {
  const query = $('#project-search').value.trim().toLocaleLowerCase('ru');
  const visible = projects.filter(p => (city === 'Все' || p.city === city) && `${p.name} ${p.city}`.toLocaleLowerCase('ru').includes(query));
  const grid = $('#project-grid');
  grid.replaceChildren();
  grid.dataset.count = visible.length;
  $('#project-empty').hidden = visible.length > 0;
  if (announce) $('#project-count').textContent = projectCount(visible.length);
  visible.forEach((p, i) => {
    const card = element('article', animate ? 'project-card enter' : 'project-card');
    card.style.setProperty('--i', i);
    const button = element('button', 'project-image');
    button.type = 'button';
    button.setAttribute('aria-label', 'Посмотреть рендер: ' + p.name + ', ' + p.city);
    const img = element('img');
    img.src = p.image;
    img.srcset = `${p.small} 600w, ${p.image} ${p.w}w`;
    img.sizes = '(max-width:600px) 100vw, (max-width:1150px) 50vw, 60vw';
    img.alt = 'Рендер ЖК ' + p.name;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.width = 800;
    img.height = 600;
    button.append(img, element('span', 'project-city', p.city));
    button.addEventListener('click', () => openProject(p, button));
    const info = element('div', 'project-info');
    info.append(element('h3', '', p.name));
    const links = element('div', 'project-links');
    const disk = element('a', '', 'Все ракурсы ');
    disk.append(element('span', 'sr-only', NEW_TAB), icon('up-right'));
    disk.href = diskUrl(p);
    disk.target = '_blank';
    disk.rel = 'noopener';
    const download = element('a', '', 'Скачать превью ');
    download.append(icon('down'));
    download.href = p.image;
    download.download = p.name + '.webp';
    links.append(disk, download);
    info.append(links);
    card.append(button, info);
    grid.append(card);
  });
}
function setCity(next) {
  city = next;
  document.querySelectorAll('[data-city]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.city === city)));
}
document.querySelectorAll('[data-city]').forEach(button => button.addEventListener('click', () => {
  setCity(button.dataset.city);
  renderProjects({animate: true});
}));
$('#project-search').addEventListener('input', () => renderProjects());
$('#project-reset').addEventListener('click', () => {
  $('#project-search').value = '';
  setCity('Все');
  renderProjects({animate: true});
  document.querySelector('[data-city="Все"]').focus({preventScroll: true});
});

// ---- Project viewer: a critically damped spring keeps presentation and velocity when redirected ----
const dialog = $('#project-dialog');
let progress = 0, velocity = 0, target = 0, frame = 0, lastTime = 0, sourceButton = null;
let dragY = 0, dragV = 0, dragTarget = 0, dragFrame = 0, dragLast = 0;
function presentDialog() {
  const open = Math.max(0, Math.min(1, progress)), span = dialog.offsetHeight || 600, away = Math.max(0, Math.min(1, dragY / span));
  dialog.style.opacity = String(open * (1 - .4 * away));
  dialog.style.transform = `translateY(${dragY}px) ` + (reduceMotion.matches ? 'none' : `scale(${.94 + .06 * progress})`);
  dialog.style.setProperty('--scrim', String(.5 * open * (1 - away)));
}
function finishClose() {
  dialog.close();
  sourceButton?.focus({preventScroll: true});
}
function settleDialog() {
  progress = target;
  velocity = 0;
  frame = 0;
  presentDialog();
  if (target === 0 && dialog.open) finishClose();
}
function springStep(now) {
  const dt = Math.min((now - lastTime) / 1000, .064);
  lastTime = now;
  // Exact critical damping solution, omega=20: approximately .35s response.
  const omega = 20, displacement = progress - target;
  const coefficient = velocity + omega * displacement, decay = Math.exp(-omega * dt);
  progress = target + (displacement + coefficient * dt) * decay;
  velocity = (velocity - omega * coefficient * dt) * decay;
  presentDialog();
  // Below 0.3% opacity nothing is visible any more, so the dialog can close without waiting for the spring's long tail.
  if (Math.abs(progress - target) < .003 && Math.abs(velocity) < .05) settleDialog();
  else frame = requestAnimationFrame(springStep);
}
function moveDialog(next) {
  target = next;
  if (reduceMotion.matches) { cancelAnimationFrame(frame); settleDialog(); return; }
  if (!frame) { lastTime = performance.now(); frame = requestAnimationFrame(springStep); }
}
function openProject(p, button) {
  sourceButton = button;
  cancelAnimationFrame(dragFrame);
  dragFrame = 0; dragY = 0; dragV = 0;
  $('#dialog-title').textContent = p.name;
  $('#dialog-city').textContent = p.city;
  $('#dialog-image').src = p.image;
  $('#dialog-image').alt = 'Рендер ЖК ' + p.name;
  $('#dialog-download').href = p.image;
  $('#dialog-download').download = p.name + '.webp';
  $('#dialog-disk').href = diskUrl(p);
  $('#dialog-site').href = 'https://rsk-development.ru/projects/' + p.slug;
  if (!dialog.open) { progress = 0; velocity = 0; presentDialog(); dialog.showModal(); }
  const source = button.getBoundingClientRect(), surface = dialog.getBoundingClientRect();
  dialog.style.setProperty('--origin-x', `${Math.max(0, Math.min(100, (source.left + source.width / 2 - surface.left) / surface.width * 100))}%`);
  dialog.style.setProperty('--origin-y', `${Math.max(0, Math.min(100, (source.top + source.height / 2 - surface.top) / surface.height * 100))}%`);
  moveDialog(1);
}
$('#dialog-close').addEventListener('click', () => moveDialog(0));
// Sheet drag: 1:1 tracking with a rubber-banded upward pull. Release velocity is projected
// (Apple's exponential deceleration) to choose dismiss or return, then handed to the spring.
const project = (v, rate = .998) => v / 1000 * rate / (1 - rate);
const rubberband = (over, dim, k = .55) => over * dim * k / (dim + k * Math.abs(over));
function springDrag(now) {
  const dt = Math.min((now - dragLast) / 1000, .064);
  dragLast = now;
  const omega = 20, displacement = dragY - dragTarget, coefficient = dragV + omega * displacement, decay = Math.exp(-omega * dt);
  dragY = dragTarget + (displacement + coefficient * dt) * decay;
  dragV = (dragV - omega * coefficient * dt) * decay;
  presentDialog();
  if (Math.abs(dragY - dragTarget) < .5 && Math.abs(dragV) < 5) {
    dragFrame = 0;
    dragY = dragTarget;
    if (dragTarget > 0) { dragY = 0; dragV = 0; progress = 0; velocity = 0; target = 0; presentDialog(); finishClose(); }
    else presentDialog();
  } else dragFrame = requestAnimationFrame(springDrag);
}
function releaseDrag(vy) {
  const span = dialog.offsetHeight, close = dragY + project(vy) > span * .3;
  dragTarget = close ? span + 40 : 0;
  if (reduceMotion.matches) {
    dragV = 0;
    dragY = 0;
    if (close) { progress = 0; target = 0; presentDialog(); finishClose(); }
    else presentDialog();
    return;
  }
  dragV = vy;
  dragLast = performance.now();
  dragFrame = requestAnimationFrame(springDrag);
}
(() => {
  const zone = $('#dialog-image');
  let id = null, startY = 0, samples = [];
  zone.addEventListener('pointerdown', e => {
    if (e.button > 0) return;
    cancelAnimationFrame(dragFrame);
    dragFrame = 0;
    id = e.pointerId;
    zone.setPointerCapture(id);
    // Grab from the live on-screen offset so an interrupted release never jumps.
    startY = e.clientY - dragY;
    samples = [{t: e.timeStamp, y: dragY}];
  });
  zone.addEventListener('pointermove', e => {
    if (e.pointerId !== id) return;
    const raw = e.clientY - startY;
    dragY = raw < 0 ? -rubberband(-raw, dialog.offsetHeight) : raw;
    samples.push({t: e.timeStamp, y: dragY});
    if (samples.length > 6) samples.shift();
    presentDialog();
  });
  const end = e => {
    if (e.pointerId !== id) return;
    id = null;
    // Only motion in the last 100ms counts; holding still before release means zero velocity.
    const last = samples[samples.length - 1], first = samples.find(s => e.timeStamp - s.t <= 100);
    const dt = first ? (last.t - first.t) / 1000 : 0, vy = dt > 0 ? (last.y - first.y) / dt : 0;
    releaseDrag(vy);
  };
  zone.addEventListener('pointerup', end);
  zone.addEventListener('pointercancel', end);
})();
dialog.addEventListener('cancel', e => { e.preventDefault(); moveDialog(0); });
dialog.addEventListener('click', e => {
  if (e.target !== dialog) return;
  const r = dialog.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) moveDialog(0);
});
reduceMotion.addEventListener('change', () => { if (frame) { cancelAnimationFrame(frame); settleDialog(); } });

// ---- Wayfinding follows the visible section; no scroll handler or layout polling ----
if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) nav.querySelectorAll('a').forEach(link => {
      if (link.hash === '#' + visible.target.id) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }, {rootMargin: '-15% 0px -55% 0px', threshold: 0});
  // The cover is observed too, so no navigation item is highlighted while it fills the screen.
  document.querySelectorAll('main .hero, main .section').forEach(section => sectionObserver.observe(section));
}

renderProjects({animate: true, announce: false});

// ---- One entrance system: blocks rise once as they first enter the viewport ----
// It starts after load, once the browser has jumped to a #section or restored the scroll,
// and leaves blocks that are already on screen alone, so nothing visible ever blinks.
function startReveal() {
  if (!('IntersectionObserver' in window) || reduceMotion.matches) return;
  const targets = document.querySelectorAll('.heading,.logo-toolbar,.logo-item,.guidance,.swatch,.note,.specimens,.alphabet,.project-toolbar,.download-list>a,.map-frame,.map-links,.footer-main');
  const seen = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('in'); seen.unobserve(entry.target); }
  }), {rootMargin: '0px 0px -8% 0px', threshold: .08});
  const fold = innerHeight;
  targets.forEach(el => {
    if (el.getBoundingClientRect().top < fold) return;
    const siblings = [...el.parentElement.children].filter(c => c.matches('.logo-item,.swatch,.download-list>a'));
    el.style.setProperty('--i', Math.max(0, siblings.indexOf(el)));
    el.classList.add('reveal');
    seen.observe(el);
  });
}
function afterLoad() {
  document.documentElement.classList.add('smooth');
  startReveal();
}
if (document.readyState === 'complete') requestAnimationFrame(afterLoad);
else addEventListener('load', () => requestAnimationFrame(afterLoad), {once: true});
