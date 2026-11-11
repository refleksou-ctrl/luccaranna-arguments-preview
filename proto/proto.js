/* Lucca Ranna – sales-argument prototypes.
   ?option=0 (or none) keeps the live block untouched.
   ?option=1 stacking cards, ?option=2 focus list, ?option=3 3D cube. */
(function () {
  'use strict';

  var ARGS = [
    { title: 'TIPPARHITEKTID', text: 'Tipparhitektide poolt loodud elurajoon', img: 'assets/luccaranna/wp-content/uploads/2024/12/kaupokalda-com-DJI_20240807204435_0011_D.jpg' },
    { title: '5 AASTAT GARANTIID', text: 'Ainsana Eestis', img: 'assets/luccaranna/wp-content/uploads/2021/11/Lucaranna_Terass-scaled-1.jpg' },
    { title: 'KVALITEET', text: 'Avarad aknad, kõrgemad laed, suurem helipidavus, <br>rõdud ja terrassid', img: 'assets/luccaranna/wp-content/uploads/2026/06/1E2A9452-1.png' },
    { title: 'VÄRSKE MEREÕHK', text: 'Lai valik mängu- ja spordialasid', img: 'assets/luccaranna/wp-content/uploads/2021/02/11.jpg' }
  ];
  var N = ARGS.length;
  var num = function (i) { return '0' + (i + 1) + ' / 0' + N; };

  var option = parseInt(new URLSearchParams(location.search).get('option'), 10) || 0;

  // highlight the active menu link
  document.querySelectorAll('[data-option]').forEach(function (a) {
    if (+a.getAttribute('data-option') === option) a.parentNode.classList.add('current-menu-item');
  });

  if (!option) return;

  var block = document.querySelector('.values-block');
  if (!block) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var html = '';

  if (option === 1) {
    html = '<section class="args args--stack">' + ARGS.map(function (a, i) {
      return '<div class="args-card" style="--i:' + i + '">' +
        '<div class="args-band"><div class="container args-band__inner">' +
          '<span class="args-num">' + num(i) + '</span>' +
          '<p class="args-title">' + a.title + '</p>' +
          '<p class="args-desc">' + a.text + '</p>' +
        '</div></div>' +
        '<div class="container args-card__media"><img src="' + a.img + '" alt=""></div>' +
      '</div>';
    }).join('') + '<div class="args-hold"></div></section>';
  }

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

  if (option === 3) {
    html = '<section class="args args--cube"><div class="args-sticky"><div class="container args-stage">' +
      '<div class="args-cube">' + ARGS.map(function (a, i) {
        return '<div class="args-face" style="--i:' + i + '"><div class="args-band__inner">' +
          '<span class="args-num">' + num(i) + '</span>' +
          '<p class="args-title">' + a.title + '</p>' +
          '<p class="args-desc">' + a.text + '</p>' +
        '</div></div>';
      }).join('') + '</div>' +
      '<div class="args-dots">' + ARGS.map(function () { return '<span></span>'; }).join('') + '</div>' +
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

  // Option 1: covered cards recede slightly; photos drift (parallax) as each card slides in
  function stack(el) {
    var cards = gsap.utils.toArray('.args-card', el);
    // Sticky elements confuse ScrollTrigger's measuring, so compute scroll positions from the
    // (non-sticky) section: card i sits i card-heights down and sticks at its CSS `top`.
    var natTop = function (i) { return el.getBoundingClientRect().top + scrollY + i * cards[0].offsetHeight; };
    var enters = function (i) { return function () { return natTop(i) - innerHeight; }; };
    var sticks = function (i) { return function () { return natTop(i) - parseFloat(getComputedStyle(cards[i]).top); }; };
    cards.forEach(function (card, i) {
      gsap.fromTo(card.querySelector('img'), { yPercent: -12 }, {
        yPercent: 0, ease: 'none',
        scrollTrigger: { start: enters(i), end: sticks(i), scrub: true }
      });
      if (i === cards.length - 1) return;
      gsap.to(card.querySelector('.args-card__media'), {
        scale: 0.94, opacity: 0.35, ease: 'none',
        scrollTrigger: { start: enters(i + 1), end: sticks(i + 1), scrub: true }
      });
    });
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
    var box = el.querySelector('.args-cube');
    var faces = gsap.utils.toArray('.args-face', el);
    var dots = gsap.utils.toArray('.args-dots span', el);
    var state = { rot: 0 };

    function render() {
      var r = state.rot;
      gsap.set(box, { rotateX: r * 90 });
      faces.forEach(function (f, i) {
        // shade faces as they turn away from the viewer
        var a = (r - i) * Math.PI / 2;
        f.style.filter = 'brightness(' + (0.7 + 0.3 * Math.max(0, Math.cos(a))).toFixed(3) + ')';
      });
      var active = Math.round(r);
      dots.forEach(function (d, i) { d.classList.toggle('on', i === active); });
    }

    var tl = gsap.timeline({
      onUpdate: render,
      scrollTrigger: { trigger: el, start: function () { return 'top ' + hdr(); }, end: 'bottom bottom', scrub: 0.8 }
    });
    for (var i = 1; i < N; i++) {
      tl.to({}, { duration: 0.6 })
        .to(state, { rot: i, duration: 1, ease: 'power2.inOut' });
    }
    tl.to({}, { duration: 0.6 });
    render();
  }
})();
