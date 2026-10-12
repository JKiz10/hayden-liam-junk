/* =============================================
   QUOTE WIZARD
   Asks the existing #quoteForm one question at a
   time in a modal. The real form is never moved:
   answers are written back to it and the page's
   own submit handler does the sending, so the
   email format and the conversion tag are
   unchanged. With JS off, nothing here runs and
   the normal form still works.
   ============================================= */
(function () {
  'use strict';

  var PHONE = '832-425-7749';
  var PHONE_HREF = '8324257749';

  /* Order matters: three no-typing taps first to build momentum,
     contact details last, once the visitor is already invested. */
  var STEPS = [
    { id: 'qf-service', q: 'What do you need removed?', hint: 'Pick the closest one. We will sort out the details.', required: true },
    { id: 'qf-amount',  q: 'About how much is there?',  hint: 'A rough guess is fine.', required: false },
    { id: 'qf-when',    q: 'When do you need it gone?', hint: 'Same day is often possible.', required: false },
    { id: 'qf-zip',     q: 'Where is the job?',         hint: 'Street address or just a ZIP code.', required: true },
    { id: 'qf-name',    q: 'What is your name?',        hint: '', required: true },
    { id: 'qf-phone',   q: 'Best number to reach you?', hint: 'We call or text back with your price.', required: true, consent: true },
    { id: 'qf-details', q: 'Anything else we should know?', hint: 'Optional. Gate codes, stairs, heavy items.', required: false, last: true }
  ];

  var form = document.getElementById('quoteForm');
  if (!form) { return; }

  var steps = STEPS.filter(function (s) { return document.getElementById(s.id); });
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
    var el = document.createElement('div');
    el.className = 'qw-scrim';
    el.setAttribute('data-open', 'false');
    el.innerHTML =
      '<div class="qw-panel" role="dialog" aria-modal="true" aria-labelledby="qwQ">' +
        '<div class="qw-head">' +
          '<button type="button" class="qw-back" aria-label="Previous question">&#8592;</button>' +
          '<span class="qw-meter"><span class="qw-meter-fill"></span></span>' +
          '<button type="button" class="qw-close" aria-label="Close">&#10005;</button>' +
        '</div>' +
        '<div class="qw-body">' +
          '<p class="qw-step-count"></p>' +
          '<h2 class="qw-q" id="qwQ"></h2>' +
          '<p class="qw-hint"></p>' +
          '<div class="qw-slot"></div>' +
          '<p class="qw-err" role="alert"></p>' +
        '</div>' +
        '<div class="qw-foot">' +
          '<button type="button" class="qw-next"></button>' +
          '<button type="button" class="qw-skip">Skip this</button>' +
          '<p class="qw-alt">Rather not type? <a href="sms:' + PHONE_HREF + '">Text a photo to ' + PHONE + '</a></p>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);
    return el;
  }

  /* ---------- rendering ---------- */

  function render() {
    var step = steps[index];
    var field = document.getElementById(step.id);
    els.count.textContent = 'Question ' + (index + 1) + ' of ' + steps.length;
    els.q.textContent = step.q;
    els.hint.textContent = step.hint;
    els.hint.style.display = step.hint ? '' : 'none';
    els.err.textContent = '';
    els.back.hidden = index === 0;
    els.fill.style.transform = 'scaleX(' + ((index) / steps.length) + ')';
    els.slot.innerHTML = '';

    if (field.tagName === 'SELECT') { renderOptions(field); }
    else { renderInput(step, field); }

    els.next.textContent = step.last ? 'Get My Free Quote' : 'Continue';
    els.next.style.display = field.tagName === 'SELECT' ? 'none' : '';
    els.skip.style.display = step.required ? 'none' : '';
  }

  /* A select becomes tap tiles, so three of the seven steps need no typing. */
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
    var real = document.getElementById('smsConsent');
    var label = document.createElement('label');
    label.className = 'qw-consent';
    var box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = real ? real.checked : false;
    box.addEventListener('change', function () {
      if (real) { real.checked = box.checked; real.dispatchEvent(new Event('change', { bubbles: true })); }
    });
    var span = document.createElement('span');
    span.textContent = 'Text me about my job. Message and data rates may apply. Reply STOP to opt out.';
    label.appendChild(box);
    label.appendChild(span);
    return label;
  }

  /* ---------- flow ---------- */

  function validate() {
    var step = steps[index];
    var field = document.getElementById(step.id);
    var value = (field.value || '').trim();
    if (step.required && !value) { els.err.textContent = 'Please answer this one so we can quote you.'; return false; }
    if (step.id === 'qf-phone' && value && value.replace(/\D/g, '').length < 10) {
      els.err.textContent = 'That phone number looks too short.';
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
    els.next.textContent = 'Sending...';
    /* Hand off to the page's own handler so the email and the
       conversion tag stay exactly as they were. */
    if (typeof form.requestSubmit === 'function') { form.requestSubmit(); }
    else { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); }
  }

  function showDone() {
    els.panel.innerHTML =
      '<div class="qw-done">' +
        '<div class="qw-done-check">&#10003;</div>' +
        '<h3>Got it, thank you</h3>' +
        '<p>Your request is in. We will call or text you back shortly with a free, no obligation price.</p>' +
        '<p>Need it sooner? Call or text <a href="tel:' + PHONE_HREF + '">' + PHONE + '</a>.</p>' +
      '</div>';
    window.setTimeout(function () { close(); }, 5200);
  }

  function showError() {
    els.next.disabled = false;
    els.next.textContent = 'Try Again';
    els.err.textContent = 'That did not send. Please call or text ' + PHONE + ' and we will take care of you.';
  }

  /* The page handler reveals #quoteSuccess / #qfError rather than
     returning a promise, so watch those instead of re-sending. */
  function watchOutcome() {
    var ok = document.getElementById('quoteSuccess');
    var bad = document.getElementById('qfError');
    var seen = false;
    [ok, bad].forEach(function (node) {
      if (!node) { return; }
      new MutationObserver(function () {
        if (seen || !isOpen()) { return; }
        if (node.style.display && node.style.display !== 'none') {
          seen = true;
          if (node === ok) { showDone(); } else { showError(); seen = false; }
        }
      }).observe(node, { attributes: true, attributeFilter: ['style'] });
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
    if (typeof gtag === 'function') { gtag('event', 'quote_wizard_open'); }
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

  Array.prototype.slice.call(
    document.querySelectorAll('a[href="#quote"], a[href$="#quote"], .js-quote-wizard')
  ).forEach(function (trigger) { trigger.addEventListener('click', open); });

  watchOutcome();
})();
