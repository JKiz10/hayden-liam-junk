/* Areas dropdown and phone menu. The menu is plain <details> and <a> HTML,
   so it works without this file. This closes it on an outside click or
   Escape, and runs the phone menu button on pages built on city.css. */
(function () {
  var areas = Array.prototype.slice.call(document.querySelectorAll('details.nav-areas'));
  var nav = document.querySelector('.nav');
  var burger = document.querySelector('[data-nav-burger]');

  function setMenu(open) {
    if (!burger || !nav) return;
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
  }

  areas.forEach(function (menu) {
    menu.addEventListener('toggle', function () {
      if (!menu.open) return;
      areas.forEach(function (other) { if (other !== menu) other.open = false; });
    });
  });

  if (burger) {
    burger.addEventListener('click', function () {
      setMenu(!nav.classList.contains('is-open'));
    });
  }

  document.addEventListener('click', function (event) {
    areas.forEach(function (menu) {
      if (menu.open && !menu.contains(event.target)) menu.open = false;
    });
    if (burger && nav.classList.contains('is-open') && !nav.contains(event.target)) setMenu(false);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    areas.forEach(function (menu) {
      if (!menu.open) return;
      menu.open = false;
      menu.querySelector('summary').focus();
    });
    if (burger && nav.classList.contains('is-open')) {
      setMenu(false);
      burger.focus();
    }
  });
})();
