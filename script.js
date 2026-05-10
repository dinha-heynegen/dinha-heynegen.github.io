const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const $ = (sel, root = document) => root.querySelector(sel);
 
const welcome = $('#welcome');
const site = $('#site');
 
const DURATION = 650;
let state = 'WELCOME';
let anim = false;
 
function lock(lockIt) {
  document.body.style.overflow = lockIt ? 'hidden' : '';
}
 
function forceWelcome() {
  state = 'WELCOME';
  anim = false;
  welcome.style.display = 'flex';
  welcome.style.opacity = '1';
  welcome.style.pointerEvents = 'auto';
  welcome.style.zIndex = '9999';
  site.classList.remove('visible');
  window.scrollTo(0, 0);
  lock(true);
}
 
function forceSite() {
  state = 'SITE';
  anim = false;
  welcome.style.opacity = '0';
  welcome.style.pointerEvents = 'none';
  site.classList.add('visible');
  window.scrollTo(0, 0);
  lock(false);
  setTimeout(() => {
    if (state === 'SITE') welcome.style.display = 'none';
  }, 10);
}
 
function goToSite() {
  if (anim || state !== 'WELCOME') return;
  anim = true;
  lock(true);
  welcome.style.transition = `opacity ${DURATION}ms ease`;
  site.style.transition = `opacity ${DURATION}ms ease, transform ${DURATION}ms ease`;
  site.classList.add('visible');
  welcome.style.opacity = '0';
  welcome.style.pointerEvents = 'none';
  setTimeout(() => { forceSite(); }, DURATION);
}
 
function goToWelcome() {
  if (anim || state !== 'SITE') return;
  anim = true;
  lock(true);
  welcome.style.display = 'flex';
  welcome.style.zIndex = '9999';
  welcome.style.transition = `opacity ${DURATION}ms ease`;
  site.style.transition = `opacity ${DURATION}ms ease, transform ${DURATION}ms ease`;
  welcome.style.opacity = '0';
  site.classList.remove('visible');
  requestAnimationFrame(() => {
    welcome.style.opacity = '1';
    welcome.style.pointerEvents = 'auto';
  });
  setTimeout(() => { forceWelcome(); }, DURATION);
}
 
window.addEventListener('wheel', (e) => {
  if (anim) { e.preventDefault(); return; }
  if (state === 'WELCOME' && e.deltaY > 0) { e.preventDefault(); goToSite(); return; }
  if (state === 'SITE' && window.scrollY === 0 && e.deltaY < 0) { e.preventDefault(); goToWelcome(); }
}, { passive: false });
 
let startY = 0;
window.addEventListener('touchstart', (e) => { startY = e.touches[0].clientY; }, { passive: true });
 
window.addEventListener('touchmove', (e) => {
  if (anim) { e.preventDefault(); return; }
  const dy = startY - e.touches[0].clientY;
  if (state === 'WELCOME' && dy > 10) { e.preventDefault(); goToSite(); return; }
  if (state === 'SITE' && window.scrollY === 0 && dy < -10) { e.preventDefault(); goToWelcome(); }
}, { passive: false });
 
const revealEls = $$('.reveal');
const io = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    }
  }
}, { threshold: 0.12 });
revealEls.forEach(el => io.observe(el));
 
const menuBtn = $('#menuBtn');
const drawer = $('#drawer');
if (menuBtn && drawer) {
  menuBtn.addEventListener('click', () => drawer.classList.toggle('open'));
  $$('[data-nav]').forEach(a => { a.addEventListener('click', () => drawer.classList.remove('open')); });
}
 
const backToTop = $('#backToTop');
const progress = $('#progress');
 
function updateProgress() {
  const doc = document.documentElement;
  const max = (doc.scrollHeight - doc.clientHeight) || 1;
  const pct = Math.min(100, Math.max(0, (window.scrollY / max) * 100));
  if (progress) progress.style.width = pct + '%';
}
 
function updateBackToTop() {
  backToTop?.classList.toggle('show', window.scrollY > 650);
}
 
const navLinks = $$('[data-nav]');
const navMap = new Map();
navLinks.forEach(a => {
  const href = a.getAttribute('href') || '';
  if (!href.startsWith('#')) return;
  const id = href.slice(1);
  if (!navMap.has(id)) navMap.set(id, []);
  navMap.get(id).push(a);
});
 
const targets = [...$$('main > section[id]'), $('#contact')].filter(Boolean);
 
function setActive(id) {
  navLinks.forEach(a => a.classList.remove('active'));
  const group = navMap.get(id);
  if (group) group.forEach(a => a.classList.add('active'));
}
 
function getCurrentSectionId() {
  const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--navH')) || 72;
  const y = window.scrollY + navH + 24;
  let current = targets[0]?.id || 'about-me';
  for (const sec of targets) { if (sec.offsetTop <= y) current = sec.id; }
  return current;
}
 
let spyRaf = 0;
function requestSpy() {
  if (spyRaf) return;
  spyRaf = requestAnimationFrame(() => { spyRaf = 0; setActive(getCurrentSectionId()); });
}
 
window.addEventListener('scroll', () => {
  if (state !== 'SITE') return;
  updateProgress();
  updateBackToTop();
  requestSpy();
}, { passive: true });
 
function setupCarousel(carouselEl) {
  const imgs = $$('.carousel-img', carouselEl);
  const prevBtn = $('.carousel-btn.prev', carouselEl);
  const nextBtn = $('.carousel-btn.next', carouselEl);
  const curEl = $('.cur', carouselEl);
  const totEl = $('.tot', carouselEl);
 
  if (!imgs.length) return;
 
  let idx = 0;
  const total = imgs.length;
 
  if (totEl) totEl.textContent = total;
 
  function updateButtons() {
    if (prevBtn) prevBtn.classList.toggle('hidden', idx === 0);
    if (nextBtn) nextBtn.classList.toggle('hidden', idx === total - 1);
  }
 
  function goTo(next) {
    imgs[idx].classList.remove('active');
    idx = Math.max(0, Math.min(total - 1, next));
    imgs[idx].classList.add('active');
    if (curEl) curEl.textContent = idx + 1;
    updateButtons();
  }
 
  if (prevBtn) prevBtn.addEventListener('click', () => goTo(idx - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(idx + 1));
 
  goTo(0);
}
 
$$('.carousel').forEach(setupCarousel);
 
const btnZabbix = $('#btnZabbix');
const btnVPN = $('#btnVPN');
const panelZabbix = $('#panelZabbix');
const panelVPN = $('#panelVPN');
const toggleThumb = $('#toggleThumb');
 
function updateThumb(activeBtn) {
  if (!toggleThumb || !activeBtn) return;
  toggleThumb.style.left = activeBtn.offsetLeft + 'px';
  toggleThumb.style.width = activeBtn.offsetWidth + 'px';
}
 
function activateProject(project) {
  if (project === 'zabbix') {
    btnZabbix.classList.add('active');
    btnVPN.classList.remove('active');
    updateThumb(btnZabbix);
    panelZabbix.classList.remove('hidden');
    panelVPN.classList.add('hidden');
  } else {
    btnVPN.classList.add('active');
    btnZabbix.classList.remove('active');
    updateThumb(btnVPN);
    panelVPN.classList.remove('hidden');
    panelZabbix.classList.add('hidden');
  }
}
 
if (btnZabbix) btnZabbix.addEventListener('click', () => activateProject('zabbix'));
if (btnVPN) btnVPN.addEventListener('click', () => activateProject('vpn'));
 
window.addEventListener('load', () => { if (btnZabbix) updateThumb(btnZabbix); });
window.addEventListener('resize', () => {
  const active = btnZabbix?.classList.contains('active') ? btnZabbix : btnVPN;
  updateThumb(active);
});
 
$$('[data-accordion]').forEach(header => {
  const key = header.dataset.accordion;
  const body = document.getElementById('accordion-' + key);
  const arrow = header.querySelector('.accordion-arrow');
 
  header.addEventListener('click', () => {
    const isOpen = body.classList.contains('open');
    body.classList.toggle('open', !isOpen);
    arrow.classList.toggle('open', !isOpen);
  });
});
 
$$('.veille-item').forEach(item => {
  item.addEventListener('click', () => {
    const source = item.dataset.source;
 
    $$('.veille-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
 
    $$('.veille-content').forEach(c => c.classList.remove('active'));
    const target = document.getElementById(source);
    if (target) target.classList.add('active');
  });
});
 
const year = $('#year');
if (year) year.textContent = String(new Date().getFullYear());
 
forceWelcome();