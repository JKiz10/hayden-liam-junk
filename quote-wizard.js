/* =============================================
   QUOTE WIZARD
   Asks an existing form one question at a time
   in a modal. The real form is never moved:
   answers are written back to it and the page's
   own submit handler does the sending, so the
   email format and the conversion tag are
   unchanged. With JS off, nothing here runs and
   the normal form still works.

   One wizard per form. With no setup the page
   gets the junk-removal quote wizard (#quoteForm).
   A page can instead declare its own before this
   script runs:
     window.HL_WIZARDS = [{ formId: 'x', steps: [...], text: {...} }]
   Anything a config leaves out falls back to the
   quote wizard's value, so a config only lists
   what differs (other questions, Spanish text).
   openOnHash: '#apply' opens the wizard when the
   page loads (or the hash changes) with that hash.
   ============================================= */
(function () {
  'use strict';

  var PHONE = '832-425-7749';
  var PHONE_HREF = '8324257749';

  var QUOTE = {
    formId: 'quoteForm',
    successId: 'quoteSuccess',
    errorId: 'qfError',
    consentId: 'smsConsent',
    triggers: 'a[href="#quote"], a[href$="#quote"], .js-quote-wizard',
    openEvent: 'quote_wizard_open',
    /* Order matters: three no-typing taps first to build momentum,
       contact details last, once the visitor is already invested. */
    steps: [
      { id: 'qf-service', q: 'What do you need removed?', hint: 'Pick the closest one. We will sort out the details.', required: true },
      { id: 'qf-amount',  q: 'About how much is there?',  hint: 'A rough guess is fine.', required: false },
      { id: 'qf-when',    q: 'When do you need it gone?', hint: 'Same day is often possible.', required: false },
      { id: 'qf-zip',     q: 'Where is the job?',         hint: 'Street address or just a ZIP code.', required: true },
      { id: 'qf-name',    q: 'What is your name?',        hint: '', required: true },
      { id: 'qf-phone',   q: 'Best number to reach you?', hint: 'We call or text back with your price.', required: true, consent: true },
      { id: 'qf-details', q: 'Anything else we should know?', hint: 'Optional. Gate codes, stairs, heavy items.', required: false, last: true }
    ],
    text: {
      count: 'Question {n} of {total}',
      next: 'Continue',
      submit: 'Get My Free Quote',
      sending: 'Sending...',
      retry: 'Try Again',
      skip: 'Skip this',
      back: 'Previous question',
      close: 'Close',
      alt: 'Rather not type? <a href="sms:{phoneHref}">Text a photo to {phone}</a>',
      consent: 'Text me about my job. Message and data rates may apply. Reply STOP to opt out.',
      required: 'Please answer this one so we can quote you.',
      phoneShort: 'That phone number looks too short.',
      emailBad: 'That email address does not look right.',
      doneTitle: 'Got it, thank you',
      doneText: 'Your request is in. We will call or text you back shortly with a free, no obligation price.',
      doneSooner: 'Need it sooner? Call or text <a href="tel:{phoneHref}">{phone}</a>.',
      error: 'That did not send. Please call or text {phone} and we will take care of you.'
    }
  };

  function merge(base, over) {
    var out = {}, k;
    for (k in base) { if (Object.prototype.hasOwnProperty.call(base, k)) { out[k] = base[k]; } }
    for (k in over) { if (Object.prototype.hasOwnProperty.call(over, k)) { out[k] = over[k]; } }
    return out;
  }

  function fill(str) {
    return String(str).replace(/\{phoneHref\}/g, PHONE_HREF).replace(/\{phone\}/g, PHONE);
  }

  function create(config) {
    var cfg = merge(QUOTE, config || {});
    var T = merge(QUOTE.text, (config && config.text) || {});

    var form = document.getElementById(cfg.formId);
    if (!form) { return; }

    var steps = cfg.steps.filter(function (s) { return document.getElementById(s.id); });
    if (!steps.length) { return; }

    var index = 0;
    var lastFocus = null;
    var scrim = buildShell();
    var els = {
      panel:  scrim.querySelector('.qw-panel'),
      back:   scrim.querySelector('.qw-back'),
      close:  scrim.querySelector('.qw-close'),
      fill:   scrim.querySelector('.qw-meter-fill'),
      body:   scrim.querySelector('.qw-body'),
      foot:   scrim.querySelector('.qw-foot'),
      count:  scrim.querySelector('.qw-step-count'),
      q:      scrim.querySelector('.qw-q'),
      hint:   scrim.querySelector('.qw-hint'),
      slot:   scrim.querySelector('.qw-slot'),
      err:    scrim.querySelector('.qw-err'),
      next:   scrim.querySelector('.qw-next'),
      skip:   scrim.querySelector('.qw-skip')
    };

    function buildShell() {
      var qid = 'qwQ-' + cfg.formId;
      var el = document.createElement('div');
      el.className = 'qw-scrim';
      el.setAttribute('data-open', 'false');
      el.innerHTML =
        '<div class="qw-panel" role="dialog" aria-modal="true" aria-labelledby="' + qid + '">' +
          '<div class="qw-head">' +
            '<button type="button" class="qw-back" aria-label="' + fill(T.back) + '">&#8592;</button>' +
            '<span class="qw-meter"><span class="qw-meter-fill"></span></span>' +
            '<button type="button" class="qw-close" aria-label="' + fill(T.close) + '">&#10005;</button>' +
          '</div>' +
          '<div class="qw-body">' +
            '<p class="qw-step-count"></p>' +
            '<h2 class="qw-q" id="' + qid + '"></h2>' +
            '<p class="qw-hint"></p>' +
            '<div class="qw-slot"></div>' +
            '<p class="qw-err" role="alert"></p>' +
          '</div>' +
          '<div class="qw-foot">' +
            '<button type="button" class="qw-next"></button>' +
            '<button type="button" class="qw-skip">' + fill(T.skip) + '</button>' +
            '<p class="qw-alt">' + fill(T.alt) + '</p>' +
          '</div>' +
        '</div>';
      document.body.appendChild(el);
      return el;
    }

    /* ---------- rendering ---------- */

    function render() {
      var step = steps[index];
      var field = document.getElementById(step.id);
      els.count.textContent = T.count.replace('{n}', index + 1).replace('{total}', steps.length);
      els.q.textContent = step.q;
      els.hint.textContent = step.hint;
      els.hint.style.display = step.hint ? '' : 'none';
      els.err.textContent = '';
      els.back.hidden = index === 0;
      els.fill.style.transform = 'scaleX(' + ((index) / steps.length) + ')';
      els.slot.innerHTML = '';

      if (field.tagName === 'SELECT') { renderOptions(field); }
      else { renderInput(step, field); }

      els.next.textContent = step.last ? T.submit : T.next;
      els.next.style.display = field.tagName === 'SELECT' ? 'none' : '';
      els.skip.style.display = step.required ? 'none' : '';
    }

    /* A select becomes tap tiles, so multiple-choice steps need no typing. */
    function renderOptions(field) {
      var wrap = document.createElement('div');
      wrap.className = 'qw-opts';
      Array.prototype.slice.call(field.options).forEach(function (opt, i) {
        if (i === 0 && !opt.value) { return; } /* the placeholder option */
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'qw-opt';
        b.textContent = opt.textContent;
        b.setAttribute('aria-pressed', String(field.value === opt.value));
        b.addEventListener('click', function () {
          field.value = opt.value;
          advance();
        });
        wrap.appendChild(b);
      });
      els.slot.appendChild(wrap);
    }

    function renderInput(step, field) {
      var wrap = document.createElement('div');
      wrap.className = 'qw-field';
      var proxy = document.createElement(field.tagName === 'TEXTAREA' ? 'textarea' : 'input');
      if (field.tagName !== 'TEXTAREA') { proxy.type = field.type || 'text'; }
      proxy.value = field.value;
      proxy.setAttribute('aria-label', step.q);
      if (field.getAttribute('autocomplete')) { proxy.setAttribute('autocomplete', field.getAttribute('autocomplete')); }
      if (field.getAttribute('placeholder')) { proxy.placeholder = field.getAttribute('placeholder'); }
      proxy.addEventListener('input', function () { field.value = proxy.value; els.err.textContent = ''; });
      proxy.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && field.tagName !== 'TEXTAREA') { e.preventDefault(); advance(); }
      });
      wrap.appendChild(proxy);
      els.slot.appendChild(wrap);

      if (step.consent) { els.slot.appendChild(buildConsent()); }
      window.setTimeout(function () { proxy.focus(); }, 90);
    }

    function buildConsent() {
      var real = document.getElementById(cfg.consentId);
      var label = document.createElement('label');
      label.className = 'qw-consent';
      var box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = real ? real.checked : false;
      box.addEventListener('change', function () {
        if (real) { real.checked = box.checked; real.dispatchEvent(new Event('change', { bubbles: true })); }
      });
      var span = document.createElement('span');
      span.textContent = T.consent;
      label.appendChild(box);
      label.appendChild(span);
      return label;
    }

    /* ---------- flow ---------- */

    function validate() {
      var step = steps[index];
      var field = document.getElementById(step.id);
      var value = (field.value || '').trim();
      if (step.required && !value) { els.err.textContent = T.required; return false; }
      if (field.type === 'tel' && value && value.replace(/\D/g, '').length < 10) {
        els.err.textContent = T.phoneShort;
        return false;
      }
      if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        els.err.textContent = T.emailBad;
        return false;
      }
      return true;
    }

    function advance() {
      if (!validate()) { return; }
      if (index < steps.length - 1) { index += 1; render(); return; }
      submit();
    }

    function submit() {
      els.fill.style.transform = 'scaleX(1)';
      els.next.disabled = true;
      els.next.textContent = T.sending;
      /* Hand off to the page's own handler so the email and the
         conversion tag stay exactly as they were. */
      if (typeof form.requestSubmit === 'function') { form.requestSubmit(); }
      else { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); }
    }

    function showDone() {
      els.panel.innerHTML =
        '<div class="qw-done">' +
          '<div class="qw-done-check">&#10003;</div>' +
          '<h3>' + fill(T.doneTitle) + '</h3>' +
          '<p>' + fill(T.doneText) + '</p>' +
          '<p>' + fill(T.doneSooner) + '</p>' +
        '</div>';
      window.setTimeout(function () { close(); }, 5200);
    }

    function showError() {
      els.next.disabled = false;
      els.next.textContent = T.retry;
      els.err.textContent = fill(T.error);
    }

    /* The page handler reveals the success / error nodes rather than
       returning a promise, so watch those instead of re-sending. Both
       the style attribute and the hidden attribute count as revealing. */
    function watchOutcome() {
      var ok = document.getElementById(cfg.successId);
      var bad = document.getElementById(cfg.errorId);
      var seen = false;
      [ok, bad].forEach(function (node) {
        if (!node) { return; }
        new MutationObserver(function () {
          if (seen || !isOpen()) { return; }
          var shown = !node.hidden && node.style.display !== 'none' &&
            (node.style.display || !node.hasAttribute('hidden'));
          if (shown) {
            seen = true;
            if (node === ok) { showDone(); } else { showError(); seen = false; }
          }
        }).observe(node, { attributes: true, attributeFilter: ['style', 'hidden'] });
      });
    }

    /* ---------- open / close ---------- */

    function isOpen() { return scrim.getAttribute('data-open') === 'true'; }

    function open(e) {
      if (e) { e.preventDefault(); }
      lastFocus = document.activeElement;
      index = 0;
      render();
      scrim.setAttribute('data-open', 'true');
      document.body.style.overflow = 'hidden';
      if (typeof gtag === 'function') { gtag('event', cfg.openEvent); }
    }

    function close() {
      scrim.setAttribute('data-open', 'false');
      document.body.style.overflow = '';
      if (lastFocus && typeof lastFocus.focus === 'function') { lastFocus.focus(); }
    }

    function trapFocus(e) {
      if (e.key !== 'Tab') { return; }
      var f = els.panel.querySelectorAll('button, input, textarea, a[href], select');
      if (!f.length) { return; }
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    /* ---------- wiring ---------- */

    els.next.addEventListener('click', advance);
    els.skip.addEventListener('click', function () {
      var f = document.getElementById(steps[index].id);
      if (f) { f.value = ''; }
      if (index < steps.length - 1) { index += 1; render(); } else { submit(); }
    });
    els.back.addEventListener('click', function () { if (index > 0) { index -= 1; render(); } });
    els.close.addEventListener('click', close);
    scrim.addEventListener('click', function (e) { if (e.target === scrim) { close(); } });
    document.addEventListener('keydown', function (e) {
      if (!isOpen()) { return; }
      if (e.key === 'Escape') { close(); }
      trapFocus(e);
    });

    Array.prototype.slice.call(document.querySelectorAll(cfg.triggers))
      .forEach(function (trigger) { trigger.addEventListener('click', open); });

    watchOutcome();

    /* A link from another page can arrive already asking for the survey
       (/commercial-accounts/#apply), so open it on arrival. */
    if (cfg.openOnHash) {
      var openFromHash = function () {
        if (window.location.hash === cfg.openOnHash && !isOpen()) { open(); }
      };
      openFromHash();
      window.addEventListener('hashchange', openFromHash);
    }
  }

  var configs = window.HL_WIZARDS && window.HL_WIZARDS.length ? window.HL_WIZARDS : [{}];
  configs.forEach(create);
})();
