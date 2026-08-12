/* Homepage hero carousel — crossfades the images set in
   Site Settings → Homepage → Hero → Background images.
   No-ops unless the markup actually has more than one slide. */
(function () {
  var root = document.querySelector('[data-hero-carousel]');
  if (!root) return;

  var slides = Array.prototype.slice.call(root.querySelectorAll('.home-hero-slide'));
  var dots = Array.prototype.slice.call(root.querySelectorAll('.home-hero-dot'));
  if (slides.length < 2) return;

  var interval = parseInt(root.getAttribute('data-interval'), 10);
  if (!interval || interval < 2000) interval = 6000;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var current = 0;
  var timer = null;
  var paused = false;

  /* Slides after the first carry their image in data-bg so first paint only
     fetches one. Pull the rest in once the page has finished loading. */
  function hydrate() {
    slides.forEach(function (slide) {
      var bg = slide.getAttribute('data-bg');
      if (!bg) return;
      slide.style.backgroundImage = "url('" + bg + "')";
      slide.removeAttribute('data-bg');
    });
  }

  function show(index) {
    if (index === current) return;
    slides[current].classList.remove('is-active');
    slides[index].classList.add('is-active');
    if (dots.length) {
      dots[current].classList.remove('is-active');
      dots[current].removeAttribute('aria-current');
      dots[index].classList.add('is-active');
      dots[index].setAttribute('aria-current', 'true');
    }
    current = index;
  }

  function next() {
    show((current + 1) % slides.length);
  }

  function stop() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function start() {
    stop();
    if (paused || reduced.matches || document.hidden) return;
    timer = window.setInterval(next, interval);
  }

  function applyMotionPreference() {
    /* Kills the CSS crossfade too, so dot clicks swap instantly. */
    root.classList.toggle('home-hero--no-motion', reduced.matches);
    start();
  }

  dots.forEach(function (dot, index) {
    dot.addEventListener('click', function () {
      show(index);
      start();
    });
  });

  /* WCAG 2.2.2 — auto-advancing content needs a way to stop it. Hovering or
     tabbing into the hero (e.g. to click the CTA) holds the current image. */
  root.addEventListener('mouseenter', function () { paused = true; stop(); });
  root.addEventListener('mouseleave', function () { paused = false; start(); });
  root.addEventListener('focusin', function () { paused = true; stop(); });
  root.addEventListener('focusout', function () { paused = false; start(); });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  if (reduced.addEventListener) {
    reduced.addEventListener('change', applyMotionPreference);
  } else if (reduced.addListener) {
    reduced.addListener(applyMotionPreference);
  }

  if (document.readyState === 'complete') hydrate();
  else window.addEventListener('load', hydrate);

  applyMotionPreference();
})();
