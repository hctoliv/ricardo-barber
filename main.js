(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WA = 'https://wa.me/5511983959470?text=';

  /* intro: uma vez por sessão; ?intro repete */
  const intro = $('#intro');
  const hero = $('.hero');
  let seen = false;
  try { seen = sessionStorage.getItem('rb-intro') === '1'; } catch (e) {}
  const replay = new URLSearchParams(location.search).has('intro');
  const startHero = () => hero.classList.add('is-in');
  if (!reduce && (!seen || replay)) {
    root.classList.add('intro-on');
    let done = false;
    const end = () => {
      if (done) return; done = true;
      intro.classList.add('out');
      startHero();
      setTimeout(() => root.classList.remove('intro-on'), 1000);
      try { sessionStorage.setItem('rb-intro', '1'); } catch (e) {}
    };
    intro.addEventListener('click', end);
    addEventListener('keydown', end, { once: true });
    setTimeout(end, 2700);
  } else {
    requestAnimationFrame(startHero);
  }

  /* menu */
  const hd = $('#hd');
  const burger = $('#burger');
  burger.addEventListener('click', () => {
    const open = hd.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('#nav a').forEach(a => a.addEventListener('click', () => {
    hd.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }));

  /* vídeos: carregam perto da tela, pausam fora dela */
  const isMobile = () => innerWidth <= 760;
  const load = v => { if (!v.src && v.dataset.src) v.src = v.dataset.src; };
  const vio = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (v.closest('.hero__col') && isMobile()) return;
    if (e.isIntersecting) { load(v); v.play().catch(() => {}); } else v.pause();
  }), { rootMargin: '200px 0px' });
  $$('video[data-src]').forEach(v => vio.observe(v));

  /* hero no celular: um vídeo por vez, em rodízio */
  const cols = $$('.hero__col');
  let cur = 0, timer;
  const showCol = i => {
    cols.forEach((c, k) => {
      const v = $('video', c);
      c.classList.toggle('is-on', k === i);
      if (k === i) { load(v); v.currentTime = 0; v.play().catch(() => {}); } else v.pause();
    });
  };
  const mobileHero = () => {
    clearInterval(timer);
    if (!isMobile()) { cols.forEach(c => c.classList.remove('is-on')); return; }
    showCol(cur);
    timer = setInterval(() => { cur = (cur + 1) % cols.length; showCol(cur); }, 5500);
  };
  mobileHero();

  /* reveal */
  const rio = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); rio.unobserve(e.target); }
  }), { threshold: .15 });
  $$('[data-reveal]').forEach(el => rio.observe(el));

  /* manifesto palavra por palavra */
  const mani = $('#mani');
  mani.innerHTML = mani.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
  const words = $$('.w', mani);

  /* linha do traço */
  const tPath = $('#tracoPath path');
  const tLen = tPath.getTotalLength();
  tPath.style.strokeDasharray = tLen;
  tPath.style.strokeDashoffset = tLen;

  /* portfólio horizontal */
  const port = $('#portfolio');
  const track = $('#portTrack');
  const bar = $('#portBar');
  const now = $('#portNow');
  const pieces = $$('.piece:not(.piece--end)', track);
  let maxX = 0;
  const sizePort = () => {
    if (isMobile()) { port.style.height = ''; maxX = 0; return; }
    maxX = Math.max(0, track.scrollWidth - innerWidth);
    port.style.height = (innerHeight + maxX) + 'px';
  };
  $('#stencilBtn').addEventListener('click', e => {
    const on = port.classList.toggle('stencil');
    e.currentTarget.setAttribute('aria-pressed', on);
  });
  $('#portView').addEventListener('scroll', e => {
    const v = e.currentTarget;
    const i = Math.round(v.scrollLeft / (pieces[0].offsetWidth + 14));
    now.textContent = String(Math.min(i + 1, pieces.length)).padStart(2, '0');
  }, { passive: true });

  /* header claro/escuro */
  const zones = $$('[data-hd]');
  const fab = $('.fab');

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  let lastY = scrollY, ticking = false;

  const frame = () => {
    ticking = false;
    const y = scrollY, vh = innerHeight;

    hd.classList.toggle('is-scrolled', y > 40);
    if (!hd.classList.contains('menu-open')) hd.classList.toggle('is-hidden', y > lastY && y > vh * .6);
    lastY = y;
    fab.classList.toggle('show', y > vh * .8);

    const probe = 40;
    const z = zones.find(el => { const r = el.getBoundingClientRect(); return r.top <= probe && r.bottom > probe; });
    hd.classList.toggle('is-light', !!z && z.dataset.hd === 'light');

    if (reduce) return;

    /* hero: colunas deslizam em sentidos opostos */
    const hr = hero.getBoundingClientRect();
    const hp = clamp(-hr.top / (hr.height - vh));
    if (!isMobile()) {
      cols[0].style.transform = `translateY(${-hp * 12}vh)`;
      cols[1].style.transform = `translateY(${4 + hp * 10}vh)`;
      cols[2].style.transform = `translateY(${-hp * 16}vh)`;
    }
    $('.hero__copy').style.opacity = 1 - clamp((hp - .55) / .4);

    /* manifesto */
    const mr = mani.getBoundingClientRect();
    const mp = clamp((vh * .85 - mr.top) / (mr.height + vh * .35));
    const lit = Math.round(mp * words.length);
    words.forEach((w, i) => w.classList.toggle('on', i < lit));

    /* traço */
    const sr = $('.traco__steps').getBoundingClientRect();
    const tp = clamp((vh * .7 - sr.top - 200) / (sr.height - 200));
    tPath.style.strokeDashoffset = tLen * (1 - tp);

    /* portfólio */
    if (maxX) {
      const pr = port.getBoundingClientRect();
      const pp = clamp(-pr.top / (pr.height - vh));
      track.style.transform = `translate3d(${-pp * maxX}px,0,0)`;
      bar.style.transform = `scaleX(${pp})`;
      now.textContent = String(Math.min(pieces.length, Math.floor(pp * pieces.length) + 1)).padStart(2, '0');
    }
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', onScroll, { passive: true });
  let rT;
  addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { sizePort(); mobileHero(); frame(); }, 150); });
  addEventListener('load', () => { sizePort(); frame(); });
  sizePort(); frame();

  /* orçamento → WhatsApp */
  const form = $('#orcForm');
  const cm = $('#cm');
  const cmOut = $('#cmOut');
  const tkt = $('#tkt');
  const val = n => (form.querySelector(`input[name="${n}"]:checked`) || {}).value;
  const sync = () => {
    cmOut.textContent = `~${cm.value} cm`;
    const corte = $('#corte').checked ? ' + corte' : '';
    tkt.textContent = `${val('estilo')} · ${val('local')} · ~${cm.value} cm${corte}`;
  };
  form.addEventListener('input', sync);
  sync();
  form.addEventListener('submit', e => {
    e.preventDefault();
    const ideia = $('#ideia').value.trim();
    const lines = [
      'Oi Ricardo! Quero um orçamento de tattoo.',
      `Estilo: ${val('estilo')}`,
      `Lugar: ${val('local')}`,
      `Tamanho: uns ${cm.value} cm`,
      ideia ? `Ideia: ${ideia}` : '',
      $('#corte').checked ? 'Quero aproveitar e cortar o cabelo no mesmo dia.' : ''
    ].filter(Boolean);
    window.open(WA + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
  });

  $('#yr').textContent = new Date().getFullYear();
})();
