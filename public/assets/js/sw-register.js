/**
 * Service worker registration (deferred, external file so a future
 * Content-Security-Policy never needs 'unsafe-inline' for it).
 *
 * Registration is a progressive enhancement: if SW is unsupported, the
 * file 404s, or the context is insecure, the site works exactly as before.
 */
(function registerRevelTekServiceWorker() {
  try {
    if (!('serviceWorker' in navigator)) return;
    if (!/^https?:$/.test(window.location.protocol)) return;
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function () {
        // Offline support unavailable — site remains fully functional.
      });
    });
  } catch (e) {
    // Never let registration break page scripts.
  }
})();
