(() => {
  'use strict';

  const source = document.currentScript;
  const bootstrapKey = '__appAnalyticsBootstrapped';
  if (!source?.src || window[bootstrapKey]) return;
  window[bootstrapKey] = true;

  async function start() {
    const configUrl = new URL('app-config.json?v=12', source.src);
    const response = await fetch(configUrl.href, { cache: 'no-store' });
    if (!response.ok) return;
    const config = await response.json();
    const analytics = config?.analytics;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(config?.appId || '') ||
        typeof config?.name !== 'string' || !config.name.trim() ||
        typeof analytics?.propertyName !== 'string' || !analytics.propertyName.trim() ||
        !/^[1-9]\d*$/.test(String(analytics?.propertyId ?? '')) ||
        !/^G-[A-Z0-9]+$/.test(analytics?.measurementId || '')) return;

    const expected = new URL(config.publicUrl);
    const actual = new URL(window.location.href);
    if (expected.protocol !== 'https:' || expected.search || expected.hash) return;
    const basePath = expected.pathname.endsWith('/') ? expected.pathname : expected.pathname + '/';
    if (actual.origin !== expected.origin ||
        ![basePath, basePath + 'index.html'].includes(actual.pathname)) return;

    // A different existing tag must not receive another application's configuration.
    if (window.gtag || document.querySelector('script[src^="https://www.googletagmanager.com/gtag/js"]')) return;
    if (window.dataLayer && !Array.isArray(window.dataLayer)) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', analytics.measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_path: basePath,
      page_location: expected.origin + basePath
    });

    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(analytics.measurementId);
    tag.onerror = () => {};
    document.head.append(tag);
  }

  // Statistics are optional; configuration or network failures must not affect the agenda.
  start().catch(() => {});
})();
