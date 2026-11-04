/* Moving strip of Google reviews, placed under the hero on most pages.
   The page ships a short static line (rating and a link to the profile),
   so it still works without this file. This fills in the scrolling quotes.
   Quotes are copied word for word from the Google profile; refresh them
   monthly from the live listing and keep the count in step. Never add the
   review posted from the owner's own account. No review schema on purpose:
   Google does not give stars to reviews a business shows about itself. */
(function () {
  var PROFILE = 'https://g.page/r/CUoEnjQdISJpEBM';
  var RATING = '4.9';
  var COUNT = 31; /* read from the Google listing 2026-11-04 */
  /* All 31 read 2026-11-04; the full list and the ones left out on purpose
     (owner and family accounts, the 1-star, "same day" and price-superlative
     quotes) are in the H&L folder: Google Reviews Snapshot 2026-11-04.md. */
  var REVIEWS = [
    { name: 'Tracy B.', text: 'These guys worked so hard and went above and beyond for me. They were so nice and easy to work with! The price was very fair.' },
    { name: 'Jonathon', text: 'They arrived right on time and removed everything quickly and efficiently.' },
    { name: 'Vasilio H.', text: 'The guys were awesome. On time! Cleaned up junk from my garage in less than an hour.' },
    { name: 'Char M.', text: 'Javan & team were so straight forward & ready to assist!! Flat price, sent pics, very flexible etc!!!' },
    { name: 'Jerry M.', text: 'They delivered and picked up exactly on time. They were such a pleasure to work with.' },
    { name: 'Randa A.', text: 'These guys are super efficient, dependable and professional. I can’t say enough good things about them.' },
    { name: 'Sydney S.', text: 'H&L’s services were perfect for our company office clean out.' },
    { name: 'Tina', text: 'The entire process was smooth from start to finish. Scheduling was easy, communication was excellent, and the job was completed quickly and efficiently.' },
    { name: 'L. C.', text: 'I’ve used these guys twice now and they do not disappoint! They are clean cut and honest guys and they’re always on time.' },
    { name: 'Natalie K.', text: 'The guys were very respectful and professional. I had all my junk removed within less than 15 minutes.' },
    { name: 'Chris S.', text: 'Guys got me on their schedule with very little notice and showed up early which really helped me out.' },
    { name: 'Josh J.', text: 'Incredible experience! Fantastic communication, very professional, super fast. HIGHLY RECOMMEND!' },
    { name: 'Tim R.', text: 'Extremely professional, efficient, courteous. The price for the job was extremely reasonable for the job.' },
    { name: 'Summer L.', text: 'Excellent service, friendly, and reliable. I will definitely be calling them again!' },
    { name: 'Samuel V.', text: 'These guys were great! Quick service very nice guys and took care of our stuff.' },
    { name: 'Anthony A.', text: 'Great pricing and fast service!' }
  ];
  var PX_PER_SECOND = 40;

  var es = (document.documentElement.lang || '').slice(0, 2) === 'es';
  var T = es ? {
    region: 'Reseñas de Google',
    badge: RATING + ' en Google',
    count: COUNT + ' reseñas',
    source: 'Reseña de Google',
    stars: '5 de 5 estrellas',
    pause: 'Pausar reseñas',
    play: 'Reanudar reseñas'
  } : {
    region: 'Google reviews',
    badge: RATING + ' on Google',
    count: COUNT + ' reviews',
    source: 'Google review',
    stars: '5 out of 5 stars',
    pause: 'Pause reviews',
    play: 'Play reviews'
  };

  var ICON_PAUSE = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><rect x="3" y="2" width="3.5" height="12" fill="currentColor"/><rect x="9.5" y="2" width="3.5" height="12" fill="currentColor"/></svg>';
  var ICON_PLAY = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 2l10 6-10 6z" fill="currentColor"/></svg>';

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  }

  function item(review, hidden) {
    var li = el('li', 'hl-tick');
    if (hidden) li.setAttribute('aria-hidden', 'true');
    var stars = el('span', 'hl-tick-stars', '★★★★★');
    stars.setAttribute('role', 'img');
    stars.setAttribute('aria-label', T.stars);
    li.appendChild(stars);
    li.appendChild(el('span', 'hl-tick-text', '“' + review.text + '”'));
    li.appendChild(el('span', 'hl-tick-name', review.name + ' · ' + T.source));
    return li;
  }

  function build(strip) {
    strip.setAttribute('aria-label', T.region);

    var badge = strip.querySelector('.hl-ticker-badge');
    if (badge) {
      badge.textContent = '';
      badge.appendChild(el('span', 'hl-ticker-star', '★'));
      badge.appendChild(el('span', 'hl-ticker-rating', T.badge));
      badge.appendChild(el('span', 'hl-ticker-count', T.count));
    }

    var view = el('div', 'hl-ticker-view');
    var track = el('ul', 'hl-ticker-track');
    REVIEWS.forEach(function (r) { track.appendChild(item(r, false)); });
    /* Second copy so the loop has no gap; hidden from screen readers. */
    REVIEWS.forEach(function (r) { track.appendChild(item(r, true)); });
    view.appendChild(track);
    strip.appendChild(view);

    var button = el('button', 'hl-ticker-pause');
    button.type = 'button';
    function setPaused(paused) {
      strip.classList.toggle('is-paused', paused);
      button.setAttribute('aria-pressed', String(paused));
      button.setAttribute('aria-label', paused ? T.play : T.pause);
      button.innerHTML = paused ? ICON_PLAY : ICON_PAUSE;
    }
    button.addEventListener('click', function () {
      setPaused(!strip.classList.contains('is-paused'));
    });
    setPaused(false);
    strip.appendChild(button);

    /* Same speed on every screen: duration follows the length of one copy. */
    var oneCopy = track.scrollWidth / 2;
    if (oneCopy > 0) track.style.animationDuration = Math.round(oneCopy / PX_PER_SECOND) + 's';
    strip.classList.add('is-ready');
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-hl-ticker]'), build);
})();
