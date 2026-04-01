const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const $ = (sel, root = document) => root.querySelector(sel);

const welcome = $('#welcome');
const site = $('#site');

const DURATION = 650;
let state = 'WELCOME'; // WELCOME | SITE
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

  setTimeout(() => {
    forceSite();
  }, DURATION);
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

  setTimeout(() => {
    forceWelcome();
  }, DURATION);
}

window.addEventListener('wheel', (e) => {
  if (anim) {
    e.preventDefault();
    return;
  }

  if (state === 'WELCOME' && e.deltaY > 0) {
    e.preventDefault();
    goToSite();
    return;
  }

  if (state === 'SITE' && window.scrollY === 0 && e.deltaY < 0) {
    e.preventDefault();
    goToWelcome();
  }
}, { passive: false });

let startY = 0;
window.addEventListener('touchstart', (e) => {
  startY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchmove', (e) => {
  if (anim) {
    e.preventDefault();
    return;
  }

  const dy = startY - e.touches[0].clientY;

  if (state === 'WELCOME' && dy > 10) {
    e.preventDefault();
    goToSite();
    return;
  }

  if (state === 'SITE' && window.scrollY === 0 && dy < -10) {
    e.preventDefault();
    goToWelcome();
  }
}, { passive: false });

/* Reveal */
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

/* Menu mobile */
const menuBtn = $('#menuBtn');
const drawer = $('#drawer');

if (menuBtn && drawer) {
  menuBtn.addEventListener('click', () => drawer.classList.toggle('open'));
  $$('[data-nav]').forEach(a => {
    a.addEventListener('click', () => drawer.classList.remove('open'));
  });
}

/* Progress + backtotop */
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

/* Scrollspy */
const navLinks = $$('[data-nav]');
const navMap = new Map();

navLinks.forEach(a => {
  const href = a.getAttribute('href') || '';
  if (!href.startsWith('#')) return;
  const id = href.slice(1);
  if (!navMap.has(id)) navMap.set(id, []);
  navMap.get(id).push(a);
});

const targets = [
  ...$$('main > section[id]'),
  $('#contact')
].filter(Boolean);

function setActive(id) {
  navLinks.forEach(a => a.classList.remove('active'));
  const group = navMap.get(id);
  if (group) group.forEach(a => a.classList.add('active'));
}

function getCurrentSectionId() {
  const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--navH')) || 72;
  const y = window.scrollY + navH + 24;
  let current = targets[0]?.id || 'about-me';

  for (const sec of targets) {
    if (sec.offsetTop <= y) current = sec.id;
  }

  return current;
}

let spyRaf = 0;
function requestSpy() {
  if (spyRaf) return;
  spyRaf = requestAnimationFrame(() => {
    spyRaf = 0;
    setActive(getCurrentSectionId());
  });
}

window.addEventListener('scroll', () => {
  if (state !== 'SITE') return;
  updateProgress();
  updateBackToTop();
  requestSpy();
}, { passive: true });

/* =========================
   Projects step scroll + sync LEFT (image + tags + schema)
========================= */
function setupShowcase(root) {
  const frames = $$('.frame', root);
  const sticky = $('.sticky', root);
  if (!frames.length || !sticky) return;

  const leftImg = $('#showcaseImage', root) || document.getElementById('showcaseImage');
  const leftTags = $('#showcaseTags', root) || document.getElementById('showcaseTags');
  const schemaLink = $('#schemaLink', root) || document.getElementById('schemaLink');
  const schemaText = $('#schemaText', root) || document.getElementById('schemaText');

  function setLeftFromFrame(frameEl) {
    if (!frameEl) return;

    const img = frameEl.dataset.image;
    const alt = frameEl.dataset.alt || 'Visuel du projet';
    const schema = frameEl.dataset.schema || '';

    if (leftImg && img) {
      leftImg.style.transition = 'opacity 260ms ease';
      leftImg.style.opacity = '0';

      setTimeout(() => {
        leftImg.src = img;
        leftImg.alt = alt;
        leftImg.style.opacity = '1';
      }, 130);
    }

    if (leftTags) {
      const tagsRaw = frameEl.dataset.tags || '';
      const tags = tagsRaw.split(',').map(s => s.trim()).filter(Boolean);
      leftTags.innerHTML = tags.map(tag => `<span class="chip">${tag}</span>`).join('');
    }

    if (schemaLink && schemaText) {
      if (schema) {
        schemaLink.href = schema;
        schemaLink.style.display = 'inline-flex';
        schemaText.textContent = 'Consulter le schéma associé à ce projet.';
      } else {
        schemaLink.removeAttribute('href');
        schemaLink.style.display = 'none';
        schemaText.textContent = 'Aucun schéma disponible pour ce projet.';
      }
    }
  }

  let idx = 0;
  let busy = false;
  let last = 0;

  frames.forEach((f, i) => {
    f.style.opacity = i === 0 ? '1' : '0';
    f.style.transform = i === 0 ? 'translateY(0)' : 'translateY(18px)';
    f.style.transition = 'opacity 420ms ease, transform 420ms ease';
    f.style.pointerEvents = i === 0 ? 'auto' : 'none';
  });

  setLeftFromFrame(frames[idx]);

  function isActive() {
    const r = root.getBoundingClientRect();
    const navH = 72;
    const y = navH + 12;
    return r.top <= y && r.bottom >= y + sticky.offsetHeight * 0.6;
  }

  function show(next, dir) {
    if (busy || next === idx) return;
    busy = true;

    const cur = frames[idx];
    const inc = frames[next];

    setLeftFromFrame(inc);

    inc.style.opacity = '1';
    inc.style.transform = `translateY(${dir > 0 ? 22 : -22}px)`;
    inc.style.pointerEvents = 'none';
    inc.getBoundingClientRect();

    cur.style.opacity = '0';
    cur.style.transform = `translateY(${dir > 0 ? -16 : 16}px)`;

    inc.style.transform = 'translateY(0)';

    setTimeout(() => {
      frames.forEach((f, i) => {
        f.style.pointerEvents = i === next ? 'auto' : 'none';
      });
      idx = next;
      busy = false;
    }, 460);
  }

  root.addEventListener('wheel', (e) => {
    if (state !== 'SITE') return;
    if (!isActive()) return;

    const now = performance.now();
    if (now - last < 420) return;

    const dir = e.deltaY > 0 ? 1 : -1;
    const next = Math.max(0, Math.min(frames.length - 1, idx + dir));
    if (next === idx) return;

    e.preventDefault();
    last = now;
    show(next, dir);
  }, { passive: false });

  /* clic sur mobile / desktop */
  frames.forEach((frame, i) => {
    frame.addEventListener('click', () => {
      if (i === idx) return;
      const dir = i > idx ? 1 : -1;
      show(i, dir);
    });
  });
}

$$('[data-showcase]').forEach(setupShowcase);

/* Year */
const year = $('#year');
if (year) year.textContent = String(new Date().getFullYear());

/* Init */
forceWelcome();