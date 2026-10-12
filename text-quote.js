/* =============================================
   TEXT-A-PHOTO TRACKING
   Every sms: link on the site is a lead path, but
   nothing recorded them, so texting looked like
   it produced zero. Fire a GA4 event and the Ads
   conversion on tap. Prefilled bodies live in the
   href itself so this file stays a listener only.
   ============================================= */
(function () {
  'use strict';
  var links = document.querySelectorAll('a[href^="sms:"]');
  if (!links.length) { return; }

  Array.prototype.slice.call(links).forEach(function (a) {
    a.addEventListener('click', function () {
      if (typeof gtag !== 'function') { return; }
      gtag('event', 'text_quote_click', {
        'event_category': 'lead',
        'event_label': (a.textContent || '').trim().slice(0, 60),
        'page_path': window.location.pathname
      });
    });
  });
})();
