// Runs synchronously in <head> (extension CSP forbids inline scripts) so the theme is set
// before first paint. Mirrors readMode/resolveTheme in src/ui/theme/theme.ts.
(function () {
  var mode = 'auto';
  try {
    var stored = localStorage.getItem('shopeestatx-color-mode');
    if (stored === 'light' || stored === 'dark') mode = stored;
  } catch (e) {}
  var dark = mode === 'dark' || (mode === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
})();
