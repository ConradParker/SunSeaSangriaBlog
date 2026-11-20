// Click-to-play for the homepage YouTube cards (layouts/partials/home-youtube.html).
// Each card is a plain link to YouTube; on click we swap its thumbnail for the
// privacy-enhanced embed instead. Modified clicks (new tab etc.) fall through.
(function () {
  document.addEventListener('click', function (e) {
    var card = e.target.closest && e.target.closest('[data-yt-id]');
    if (!card) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var media = card.querySelector('.yt-card-media');
    if (!media || media.querySelector('iframe')) return;
    e.preventDefault();

    var id = encodeURIComponent(card.getAttribute('data-yt-id'));
    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1';
    iframe.title = card.querySelector('.yt-card-title')
      ? card.querySelector('.yt-card-title').textContent.trim()
      : 'YouTube video';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';

    media.textContent = '';
    media.appendChild(iframe);
    card.classList.add('is-playing');
  });
})();
