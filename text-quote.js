/* =============================================
   TEXT-A-PHOTO TRACKING
   Every sms: link on the site is a lead path, but
   nothing recorded them, so texting looked like
   it produced zero. One listener on the page, so
   sms: links added after load (the quote survey,
   its thank-you screen) are counted too. Fires a
   GA4 event and the Ads conversion on tap.
   Prefilled bodies live in the href itself so this
   file stays a listener only.
   ============================================= */
(function () {
  'use strict';
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href^="sms:"]') : null;
    if (!a || typeof gtag !== 'function') { return; }
    /* GA4, for reporting */
    gtag('event', 'text_quote_click', {
      'event_category': 'lead',
      'event_label': (a.textContent || '').trim().slice(0, 60),
      'page_path': window.location.pathname
    });
    /* Google Ads conversion action 7840864684 "Text Click (SMS)".
       Secondary on purpose: a tap is not a sent message, so this
       records without steering Smart Bidding until the tap-to-text
       ratio is known. No event_callback, so the tap is never delayed. */
    gtag('event', 'conversion', {
      'send_to': 'AW-18264252114/WDElCKyz6JodENK9iYVE',
      'value': 75.0,
      'currency': 'USD'
    });
  }, true);
})();
