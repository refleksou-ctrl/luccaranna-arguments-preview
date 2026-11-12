/* Lucca Ranna – sales-argument prototypes.
   ?option=0 (or none) keeps the live block untouched.
   ?option=1 stacking bands, ?option=2 3D cube, ?option=3 editorial split (the "extra"). */
(function () {
  'use strict';

  var ARGS = [
    { title: 'TIPPARHITEKTID', text: 'Tipparhitektide poolt loodud elurajoon', img: 'assets/luccaranna/wp-content/uploads/2024/12/kaupokalda-com-DJI_20240807204435_0011_D.jpg' },
    { title: '5 AASTAT GARANTIID', text: 'Ainsana Eestis', img: 'assets/luccaranna/wp-content/uploads/2021/11/Lucaranna_Terass-scaled-1.jpg' },
    { title: 'KVALITEET', text: 'Avarad aknad, kõrgemad laed, suurem helipidavus, <br>rõdud ja terrassid', img: 'assets/luccaranna/wp-content/uploads/2026/06/1E2A9452-1.png' },
    { title: 'VÄRSKE MEREÕHK', text: 'Lai valik mängu- ja spordialasid', img: 'assets/luccaranna/wp-content/uploads/2021/02/11.jpg' }
  ];
  var N = ARGS.length;

  var option = parseInt(new URLSearchParams(location.search).get('option'), 10) || 0;

  // highlight the active menu link
  document.querySelectorAll('[data-option]').forEach(function (a) {
    if (+a.getAttribute('data-option') === option) a.parentNode.classList.add('current-menu-item');
  });

  // every option opens at the top of the page so the viewer scrolls into the block
  // (again after load and on back/forward-cache restores, since the option 2 page pin can re-measure late)
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  var toTop = function () { window.scrollTo({ top: 0, behavior: 'instant' }); };
  toTop();
  window.addEventListener('load', function () { setTimeout(toTop, 0); });
  window.addEventListener('pageshow', function (e) { if (e.persisted) toTop(); });

  if (!option) return;

  var block = document.querySelector('.values-block');
  if (!block) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var html = '';

  // live band markup (options 1 and 3 only change how the four bands move)
  var bands = ARGS.map(function (a, i) {
    return '<div class="args-face" style="--i:' + i + '"><i class="args-shade"></i><div class="container">' +
      '<p class="large-text">' + a.title + '</p>' +
      '<p class="small-text">' + a.text + '</p>' +
    '</div></div>';
  }).join('');

  if (option === 1) html = '<section class="args args--stack"><div class="args-box">' + bands + '</div></section>';
  if (option === 2) html = '<section class="args args--cube"><div class="args-box">' + bands + '</div></section>';

  // Option 3 (the "extra"): editorial split – full-bleed photo left, argument + index right
  if (option === 3) {
    html = '<section class="args args--split"><div class="args-sticky"><div class="split">' +
      '<div class="split__media">' + ARGS.map(function (a) {
        return '<figure class="split__slide"><img src="' + a.img + '" alt=""></figure>';
      }).join('') + '</div>' +
      '<div class="split__panel">' +
        '<div class="split__copy">' + ARGS.map(function (a) {
          return '<div class="split__item"><p class="args-title">' + a.title + '</p><p class="args-desc">' + a.text + '</p></div>';
        }).join('') + '</div>' +
        '<ol class="split__index">' + ARGS.map(function (a) {
          return '<li><button type="button"><span class="split__bar"><i></i></span><span class="split__label">' + a.title + '</span></button></li>';
        }).join('') + '</ol>' +
      '</div>' +
    '</div></div></section>';
  }

  var wrap = document.createElement('div');
  wrap.innerHTML = html;
  var section = wrap.firstChild;
  if (reduce) section.classList.add('args--static');
  block.replaceWith(section); // the live script's valuesScroll() now finds no .values-block and skips itself

  // sticky offsets must clear the fixed site header
  var header = document.querySelector('.header_container');
  var hdr = function () { return header ? header.offsetHeight : 0; };
  var setHdr = function () { section.style.setProperty('--hdr', hdr() + 'px'); };
  setHdr();
  window.addEventListener('resize', setHdr);

  if (reduce) return;

  // Custom curves. GSAP has no cubic-bezier() support without its CustomEase plugin (strings like
  // 'cubic-bezier(...)' silently fall back to the default), so solve the bezier here.
  function bezier(x1, y1, x2, y2) {
    var at = function (t, a, b) { return ((1 - 3 * b + 3 * a) * t + (3 * b - 6 * a)) * t * t + 3 * a * t; };
    return function (x) {
      var lo = 0, hi = 1, t = x;
      for (var k = 0; k < 20; k++) { t = (lo + hi) / 2; if (at(t, x1, x2) < x) lo = t; else hi = t; }
      return at(t, y1, y2);
    };
  }
  var EASE_OUT = bezier(0.23, 1, 0.32, 1);     // strong ease-out: responds immediately
  var EASE_MOVE = bezier(0.77, 0, 0.175, 1);   // strong ease-in-out: on-screen movement

  // GSAP + ScrollTrigger are already loaded by the live site
  window.addEventListener('load', function () {
    gsap.registerPlugin(ScrollTrigger);
    ({ 1: stack, 2: cube, 3: split })[option](section);
    ScrollTrigger.refresh();
  });

  // Options 1 + 2 pin the page like the live site (band held mid-screen), but the change
  // between arguments is scrubbed to the scroll. SCROLL_PER_STEP = scroll distance per change,
  // as a share of the viewport height – lower = more sensitive.
  var SCROLL_PER_STEP = 0.35;
  function pinned(el, extra) {
    return gsap.timeline(Object.assign({
      scrollTrigger: {
        trigger: el, start: 'center center',
        end: function () { return '+=' + (N - 1) * innerHeight * SCROLL_PER_STEP; },
        pin: '#content', pinSpacing: true, anticipatePin: 1, scrub: 0.3, invalidateOnRefresh: true
      }
    }, extra));
  }

  // Option 1: each band arrives slightly deeper (a teal overlay), sweeps up over the previous one,
  // then the overlay fades so it settles into the live light blue. Text swaps with a short blur.
  var STACK_TINT = [0.05, 0.07, 0.09, 0.11]; // overlay strength per argument
  function stack(el) {
    var faces = gsap.utils.toArray('.args-face', el);
    var shades = faces.map(function (f) { return f.querySelector('.args-shade'); });
    var texts = faces.map(function (f) { return f.querySelector('.container'); });
    gsap.set(faces.slice(1), { yPercent: 100 });
    gsap.set(texts.slice(1), { autoAlpha: 0, y: 20, filter: 'blur(4px)' });
    gsap.set(shades, { opacity: function (i) { return STACK_TINT[i]; } });

    // first band: tinted while the block scrolls into view, plain by the time it pins
    gsap.to(shades[0], {
      opacity: 0, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'center center', scrub: true }
    });

    var tl = pinned(el);
    for (var i = 1; i < N; i++) {
      tl.to(texts[i - 1], { autoAlpha: 0, yPercent: -25, filter: 'blur(4px)', duration: 0.45, ease: EASE_OUT }, i === 1 ? 0 : '>0.15')
        .to(faces[i], { yPercent: 0, duration: 0.8, ease: 'power3.out' }, '<')
        .to(texts[i], { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.5, ease: EASE_OUT }, '<0.35')
        .to(shades[i], { opacity: 0, duration: 0.6, ease: 'power1.inOut' }, '<0.1');
    }
    tl.to({}, { duration: 0.25 });
  }

  // Option 3: scrubbed editorial sequence. Photo wipes up with a slow settle, copy swaps with a
  // short blur (masks the crossfade), index tabs fill while each argument is on and jump on click.
  function split(el) {
    var slides = gsap.utils.toArray('.split__slide', el);
    var items = gsap.utils.toArray('.split__item', el);
    var labels = gsap.utils.toArray('.split__index li', el);
    var bars = gsap.utils.toArray('.split__bar i', el);

    gsap.set(slides.slice(1), { clipPath: 'inset(100% 0% 0% 0%)' });
    gsap.set(items.slice(1), { autoAlpha: 0, y: 24, filter: 'blur(6px)' });
    labels[0].classList.add('on');

    var HOLD = 0.6;
    var STEP = HOLD + 1; // timeline time per argument: one transition + one hold
    var tl = gsap.timeline({
      scrollTrigger: { trigger: el, start: function () { return 'top ' + hdr(); }, end: 'bottom bottom', scrub: 0.3 },
      onUpdate: function () {
        // label switches halfway through each transition
        var active = Math.min(N - 1, Math.floor((tl.time() + 0.5) / STEP));
        labels.forEach(function (l, i) { l.classList.toggle('on', i === active); });
      }
    });
    // bar i fills while argument i is on screen (linear: it is a progress indicator)
    bars.forEach(function (b, i) {
      tl.fromTo(b, { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: STEP }, i * STEP);
    });
    for (var i = 1; i < N; i++) {
      var t = i * STEP - 1; // transition i ends exactly where bar i starts
      tl.to(slides[i], { clipPath: 'inset(0% 0% 0% 0%)', ease: EASE_MOVE, duration: 1 }, t)
        .fromTo(slides[i].querySelector('img'), { scale: 1.12 }, { scale: 1, ease: 'power3.out', duration: 1.4 }, t)
        .to(slides[i - 1].querySelector('img'), { scale: 0.96, ease: EASE_MOVE, duration: 1 }, t)
        .to(items[i - 1], { autoAlpha: 0, y: -24, filter: 'blur(6px)', ease: EASE_OUT, duration: 0.4 }, t)
        .to(items[i], { autoAlpha: 1, y: 0, filter: 'blur(0px)', ease: 'power3.out', duration: 0.6 }, t + 0.35);
    }

    // clicking a tab scrolls to the middle of that argument's resting moment
    labels.forEach(function (l, i) {
      l.querySelector('button').addEventListener('click', function () {
        var st = tl.scrollTrigger;
        var at = (i * STEP + HOLD / 2) / tl.duration();
        window.scrollTo({ top: st.start + (st.end - st.start) * at, behavior: 'smooth' });
      });
    });
  }

  // Option 2: four bands on the faces of a box that tumbles forward with scroll.
  function cube(el) {
    var box = el.querySelector('.args-box');
    var faces = gsap.utils.toArray('.args-face', el);
    var shades = faces.map(function (f) { return f.querySelector('.args-shade'); });
    var state = { rot: 0 };

    function render() {
      var r = state.rot;
      gsap.set(box, { rotateX: r * 90 });
      shades.forEach(function (s, i) {
        // darken faces as they turn away (overlay opacity: compositor-only, no repaint)
        var a = (r - i) * Math.PI / 2;
        s.style.opacity = (0.25 * (1 - Math.max(0, Math.cos(a)))).toFixed(3);
      });
    }

    var tl = pinned(el, { onUpdate: render });
    for (var i = 1; i < N; i++) {
      tl.to(state, { rot: i, duration: 1, ease: EASE_MOVE }, i === 1 ? 0 : '>0.15');
    }
    tl.to({}, { duration: 0.25 });
    render();
  }
})();
