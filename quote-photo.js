/* =============================================
   QUOTE PHOTO
   Sends a junk quote form to FormSubmit with an
   optional photo of the job attached.

   FormSubmit documents file uploads but not file
   uploads over AJAX, so the photo is a bonus and
   never a risk to the lead:
     1. The photo is shrunk in the browser (phone
        photos run 3-8 MB; FormSubmit caps a send
        at 10 MB) and sent with the answers.
     2. If that send fails for any reason, the
        answers go again as plain JSON, with a note
        asking the crew to get the photo by text.
   The email always says whether a photo was
   meant to be there, so a missing attachment is
   never a silent loss.

   window.HLQuoteSend(url, fields, photoInput)
     fields:     plain object of text answers
     photoInput: the <input type="file">, or null
   Resolves with FormSubmit's JSON reply. The page
   still decides what counts as success.
   ============================================= */
(function () {
  'use strict';

  var MAX_SIDE = 1600;            /* px, longest edge after shrinking */
  var JPEG_QUALITY = 0.8;
  var MAX_SEND_BYTES = 9 * 1024 * 1024;
  var NOTE_ATTACHED = 'Attached to this email';
  var NOTE_FAILED = 'Customer added a photo but it did not come through. Ask them to text it to 832-425-7749.';

  function isOk(res) {
    return res && (res.success === 'true' || res.success === true);
  }

  function postJson(url, fields) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(fields)
    }).then(function (r) { return r.json(); });
  }

  function postWithPhoto(url, fields, blob) {
    var fd = new FormData();
    Object.keys(fields).forEach(function (k) { fd.append(k, fields[k]); });
    fd.append('Photo', NOTE_ATTACHED);
    fd.append('attachment', blob, 'job-photo.jpg');
    return fetch(url, { method: 'POST', headers: { 'Accept': 'application/json' }, body: fd })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!isOk(res)) { throw new Error('photo send failed'); }
        return res;
      });
  }

  /* Redraw on a canvas: smaller file, EXIF (and any GPS) dropped.
     Anything the browser cannot decode (HEIC on some desktops) goes
     as the original file, and the size check below still applies. */
  function shrink(file) {
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        canvas.toBlob(function (blob) { resolve(blob || file); }, 'image/jpeg', JPEG_QUALITY);
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  function withNote(fields, note) {
    var out = {};
    Object.keys(fields).forEach(function (k) { out[k] = fields[k]; });
    out.Photo = note;
    return out;
  }

  window.HLQuoteSend = function (url, fields, photoInput) {
    var file = photoInput && photoInput.files && photoInput.files[0];
    if (!file) { return postJson(url, fields); }

    return shrink(file)
      .then(function (blob) {
        if (blob.size > MAX_SEND_BYTES) { throw new Error('photo too large'); }
        return postWithPhoto(url, fields, blob);
      })
      .catch(function () { return postJson(url, withNote(fields, NOTE_FAILED)); });
  };

  /* Text answers only: file fields stay out of the JSON body and the
     honeypot never leaves the page. */
  window.HLQuoteFields = function (form) {
    var out = {};
    new FormData(form).forEach(function (v, k) {
      if (k !== '_honey' && typeof v === 'string') { out[k] = v; }
    });
    return out;
  };
})();
