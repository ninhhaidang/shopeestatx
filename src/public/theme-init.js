// Runs synchronously in <head> (extension CSP forbids inline scripts) so the theme is set
// before first paint. Mirrors readMode in src/ui/theme/theme.ts: light unless 'dark' is stored.
(function () {
  var dark = false;
  try {
    dark = localStorage.getItem('shopeestatx-color-mode') === 'dark';
  } catch (e) {}
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
})();
