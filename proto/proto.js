/* Lucca Ranna – sales-argument prototypes.
   ?option=0 (or none) keeps the live block untouched.
   ?option=1 stacking bands, ?option=2 focus list, ?option=3 3D cube. */
(function () {
  'use strict';

  var ARGS = [
    { title: 'TIPPARHITEKTID', text: 'Tipparhitektide poolt loodud elurajoon', img: 'assets/luccaranna/wp-content/uploads/2024/12/kaupokalda-com-DJI_20240807204435_0011_D.jpg' },
    { title: '5 AASTAT GARANTIID', text: 'Ainsana Eestis', img: 'assets/luccaranna/wp-content/uploads/2021/11/Lucaranna_Terass-scaled-1.jpg' },
    { title: 'KVALITEET', text: 'Avarad aknad, kõrgemad laed, suurem helipidavus, <br>rõdud ja terrassid', img: 'assets/luccaranna/wp-content/uploads/2026/06/1E2A9452-1.png' },
    { title: 'VÄRSKE MEREÕHK', text: 'Lai valik mängu- ja spordialasid', img: 'assets/luccaranna/wp-content/uploads/2021/02/11.jpg' }
  ];
  var N = ARGS.length;
  var num = function (i) { return '0' + (i + 1) + ' / 0' + N; }; // option 2 counter

  var option = parseInt(new URLSearchParams(location.search).get('option'), 10) || 0;

  // highlight the active menu link
  document.querySelectorAll('[data-option]').forEach(function (a) {
    if (+a.getAttribute('data-option') === option) a.parentNode.classList.add('current-menu-item');
  });

  // menu links reload with #arguments; images above load late and shift the jump, so redo it after load
  window.addEventListener('load', function () {
    if (location.hash !== '#arguments') return;
    setTimeout(function () {
      var a = document.getElementById('arguments');
      var hdrH = (document.querySelector('.header_container') || {}).offsetHeight || 0;
      window.scrollTo({ top: a.getBoundingClientRect().top + scrollY - hdrH, behavior: 'instant' });
    }, 50);
  });

  if (!option) return;

  var block = document.querySelector('.values-block');
  if (!block) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var html = '';

  // live band markup (options 1 and 3 only change how the four bands move)
  var bands = ARGS.map(function (a, i) {
    return '<div class="args-face" style="--i:' + i + '"><div class="container">' +
      '<p class="large-text">' + a.title + '</p>' +
      '<p class="small-text">' + a.text + '</p>' +
    '</div></div>';
  }).join('');

  if (option === 1) html = '<section class="args args--stack"><div class="args-box">' + bands + '</div></section>';
  if (option === 3) html = '<section class="args args--cube"><div class="args-box">' + bands + '</div></section>';

  if (option === 2) {
    html = '<section class="args args--focus"><div class="args-sticky"><div class="container args-focus">' +
      '<div class="args-focus__list"><div class="args-focus__track">' +
        ARGS.map(function (a) { return '<p class="args-title">' + a.title + '</p>'; }).join('') +
      '</div></div>' +
      '<div class="args-focus__media">' +
        ARGS.map(function (a, i) {
          return '<figure class="args-focus__slide"><img src="' + a.img + '" alt="">' +
            '<figcaption><span class="args-num">' + num(i) + '</span><span class="args-desc">' + a.text + '</span></figcaption></figure>';
        }).join('') +
      '</div>' +
      '<div class="args-progress"><span></span></div>' +
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

  // GSAP + ScrollTrigger are already loaded by the live site
  window.addEventListener('load', function () {
    gsap.registerPlugin(ScrollTrigger);
    ({ 1: stack, 2: focus, 3: cube })[option](section);
    ScrollTrigger.refresh();
  });

  // Options 1 + 3 pin the page like the live site (band held mid-screen), but the change
  // between arguments is scrubbed to the scroll. SCROLL_PER_STEP = scroll distance per change,
  // as a share of the viewport height – lower = more sensitive.
  var SCROLL_PER_STEP = 0.35;
  function pinned(el, extra) {
    return gsap.timeline(Object.assign({
      scrollTrigger: {
        trigger: el, start: 'center center',
        end: function () { return '+=' + (N - 1) * innerHeight * SCROLL_PER_STEP; },
        pin: '#content', pinSpacing: true, anticipatePin: 1, scrub: 0.3
      }
    }, extra));
  }

  // Option 1: each new band materialises (fades + rises) on top of the previous one.
  function stack(el) {
    var faces = gsap.utils.toArray('.args-face', el);
    gsap.set(faces.slice(1), { autoAlpha: 0, yPercent: 60 });
    var tl = pinned(el);
    for (var i = 1; i < N; i++) {
      var prev = faces[i - 1].querySelector('.container');
      tl.to(prev, { autoAlpha: 0, yPercent: -25, duration: 0.5, ease: 'power1.in' }, i === 1 ? 0 : '>0.15')
        .to(faces[i], { autoAlpha: 1, yPercent: 0, duration: 1, ease: 'power2.out' }, '<0.1');
    }
    tl.to({}, { duration: 0.25 });
  }

  // Option 2: one scrubbed timeline – titles glide through a focus line, photos wipe in.
  function focus(el) {
    var titles = gsap.utils.toArray('.args-title', el);
    var slides = gsap.utils.toArray('.args-focus__slide', el);
    var track = el.querySelector('.args-focus__track');

    gsap.set(titles, { opacity: 0.2 });
    gsap.set(titles[0], { opacity: 1 });
    gsap.set(slides.slice(1), { clipPath: 'inset(100% 0% 0% 0%)' });

    var tl = gsap.timeline({
      defaults: { ease: 'power2.inOut', duration: 1 },
      scrollTrigger: { trigger: el, start: function () { return 'top ' + hdr(); }, end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true }
    });
    for (var i = 1; i < N; i++) {
      tl.to({}, { duration: 0.6 }) // hold: each argument rests readable for a beat
        .to(track, { y: (function (k) { return function () { return -titles[k].offsetTop; }; })(i) }, '>')
        .to(titles[i - 1], { opacity: 0.2 }, '<')
        .to(titles[i], { opacity: 1 }, '<')
        .to(slides[i], { clipPath: 'inset(0% 0% 0% 0%)' }, '<')
        .fromTo(slides[i].querySelector('img'), { scale: 1.15 }, { scale: 1 }, '<');
    }
    tl.to({}, { duration: 0.6 });
    tl.to(el.querySelector('.args-progress span'), { scaleY: 1, ease: 'none', duration: tl.duration() }, 0);
  }

  // Option 3: four bands on the faces of a box that tumbles forward with scroll.
  function cube(el) {
    var box = el.querySelector('.args-box');
    var faces = gsap.utils.toArray('.args-face', el);
    var state = { rot: 0 };

    function render() {
      var r = state.rot;
      gsap.set(box, { rotateX: r * 90 });
      faces.forEach(function (f, i) {
        // shade faces as they turn away from the viewer
        var a = (r - i) * Math.PI / 2;
        f.style.filter = 'brightness(' + (0.75 + 0.25 * Math.max(0, Math.cos(a))).toFixed(3) + ')';
      });
    }

    var tl = pinned(el, { onUpdate: render });
    for (var i = 1; i < N; i++) {
      tl.to(state, { rot: i, duration: 1, ease: 'power2.inOut' }, i === 1 ? 0 : '>0.15');
    }
    tl.to({}, { duration: 0.25 });
    render();
  }
})();
