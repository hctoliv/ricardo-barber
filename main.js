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
  let cur = 0, timer = null;
  const showCol = i => {
    cols.forEach((c, k) => {
      const v = $('video', c);
      c.classList.toggle('is-on', k === i);
      if (k === i) { v.currentTime = 0; v.play().catch(() => {}); } else v.pause();
    });
  };
  /* só reinicia quando muda de modo: no iPhone a barra de endereço dispara resize ao rolar */
  const mobileHero = () => {
    if (!isMobile()) {
      clearInterval(timer); timer = null;
      cols.forEach(c => c.classList.remove('is-on'));
      return;
    }
    if (timer) return;
    cols.forEach(c => { c.style.transform = ''; load($('video', c)); });
    showCol(cur);
    timer = setInterval(() => { cur = (cur + 1) % cols.length; showCol(cur); }, 4000);
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
      'Olá, Ricardo! Gostaria de solicitar um orçamento de tatuagem.',
      `Estilo: ${val('estilo')}`,
      `Região do corpo: ${val('local')}`,
      `Tamanho aproximado: ${cm.value} cm`,
      ideia ? `Ideia: ${ideia}` : '',
      $('#corte').checked ? 'Também gostaria de cortar o cabelo no mesmo dia.' : ''
    ].filter(Boolean);
    window.open(WA + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
  });

  /* reels do Instagram: lê reels/reels.json quando a seção chega perto da tela */
  const igr = $('#reels');
  if (igr) {
    const row = $('#igrRow'), modal = $('#igrModal'), frame = $('#igrFrame');
    const prev = $('#igrPrev'), next = $('#igrNext');
    const fmt = n => n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.', ',') + ' mil' : String(n);
    const quando = d => {
      const dias = Math.round((Date.now() - new Date(d + 'T12:00:00')) / 864e5);
      if (dias <= 0) return 'hoje';
      if (dias === 1) return 'ontem';
      if (dias < 30) return `há ${dias} dias`;
      const m = Math.round(dias / 30);
      return m < 12 ? `há ${m} ${m > 1 ? 'meses' : 'mês'}` : `há ${Math.round(m / 12)} ano${m >= 24 ? 's' : ''}`;
    };
    const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const arrows = () => {
      prev.disabled = row.scrollLeft < 8;
      next.disabled = row.scrollLeft + row.clientWidth > row.scrollWidth - 8;
    };
    const step = dir => row.scrollBy({ left: dir * row.clientWidth * .8, behavior: reduce ? 'auto' : 'smooth' });
    prev.addEventListener('click', () => step(-1));
    next.addEventListener('click', () => step(1));
    row.addEventListener('scroll', arrows, { passive: true });

    const abrir = r => {
      if (!modal.showModal) { window.open(r.url, '_blank', 'noopener'); return; }
      frame.innerHTML = `<iframe src="https://www.instagram.com/reel/${encodeURIComponent(r.code)}/embed/" title="Reel do Instagram" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
      $('#igrOpen').href = r.url;
      modal.showModal();
      document.body.style.overflow = 'hidden';
    };
    const fechar = () => modal.close();
    modal.addEventListener('close', () => { frame.innerHTML = ''; document.body.style.overflow = ''; });
    $('#igrClose').addEventListener('click', fechar);
    modal.addEventListener('click', e => { if (e.target === modal) fechar(); });

    const render = data => {
      const reels = (data.reels || []).slice(0, 12);
      if (!reels.length) { igr.hidden = true; return; }
      row.innerHTML = reels.map((r, i) => `<li><button class="igr__card" type="button" data-i="${i}" aria-label="Assistir reel${r.legenda ? ': ' + esc(r.legenda) : ''}">
        <span class="igr__cover"><img src="${esc(r.capa)}" width="360" height="640" alt="" loading="lazy" decoding="async"><span class="igr__play" aria-hidden="true"></span>
        <span class="igr__stats" aria-hidden="true"><span>${r.views ? '▶ ' + fmt(r.views) : ''}</span><span>${quando(r.data)}</span></span></span>
        ${r.legenda ? `<span class="igr__cap">${esc(r.legenda)}</span>` : ''}</button></li>`).join('');
      row.removeAttribute('aria-busy');
      $$('.igr__card', row).forEach(b => b.addEventListener('click', () => abrir(reels[+b.dataset.i])));
      arrows();
    };
    const io = new IntersectionObserver(es => {
      if (!es.some(e => e.isIntersecting)) return;
      io.disconnect();
      fetch('reels/reels.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : Promise.reject())
        .then(render).catch(() => { igr.hidden = true; });
    }, { rootMargin: '800px 0px' });
    io.observe(igr);
  }

  $('#yr').textContent = new Date().getFullYear();
})();
