// ================= VISITOR ANALYTICS =================
// Logs one "visit" document per pageview and one "event" document per
// tracked click, to Firestore collections `visits` and `events`.
// Requires firebase-init.js to have run first (window.db).
(function () {
  function getSessionId() {
    let id = sessionStorage.getItem('nothing_session_id');
    if (!id) {
      id = 'sid_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem('nothing_session_id', id);
    }
    return id;
  }

  function parseUA() {
    let os = 'Unknown', browser = 'Unknown', browserVersion = '', device = 'Desktop';
    try {
      if (window.UAParser) {
        const r = new UAParser().getResult();
        os = r.os.name ? (r.os.name + (r.os.version ? ' ' + r.os.version : '')) : 'Unknown';
        browser = r.browser.name || 'Unknown';
        browserVersion = r.browser.version || '';
        device = r.device.type
          ? r.device.type.charAt(0).toUpperCase() + r.device.type.slice(1)
          : 'Desktop';
      }
    } catch (e) { /* ignore, fall back to defaults */ }
    return { os, browser, browserVersion, device };
  }

  function logVisit(country, countryCode) {
    if (!window.db) return;
    const ua = parseUA();
    window.db.collection('visits').add({
      ts: firebase.firestore.FieldValue.serverTimestamp(),
      page: location.pathname,
      referrer: document.referrer || 'direct',
      country: country || 'Unknown',
      countryCode: countryCode || '',
      os: ua.os,
      browser: ua.browser,
      browserVersion: ua.browserVersion,
      device: ua.device,
      screen: screen.width + 'x' + screen.height,
      lang: navigator.language || '',
      sessionId: getSessionId(),
      userAgent: navigator.userAgent
    }).catch(function () { /* ignore write failures (e.g. offline) */ });
  }

  function logEvent(type, extra) {
    if (!window.db) return;
    const payload = Object.assign({
      ts: firebase.firestore.FieldValue.serverTimestamp(),
      type: type,
      page: location.pathname,
      sessionId: getSessionId()
    }, extra || {});
    window.db.collection('events').add(payload).catch(function () {});
  }
  window.logEvent = logEvent;

  // Country lookup — free, no API key needed, no server required.
  fetch('https://ipapi.co/json/')
    .then(function (r) { return r.json(); })
    .then(function (d) { logVisit(d.country_name, d.country_code); })
    .catch(function () { logVisit('Unknown', ''); });

  document.addEventListener('DOMContentLoaded', function () {
    const clickMap = {
      seeNothingBtn: 'see_nothing_click',
      seeEverythingBtn: 'see_everything_click',
      payRazorpay: 'pay_razorpay_click',
      payPaypal: 'pay_paypal_click',
      payPaytm: 'pay_paytm_click',
      leaveNothingBtn: 'leave_nothing_click',
      leaveEverythingBtn: 'leave_everything_click'
    };
    Object.keys(clickMap).forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', function () { logEvent(clickMap[id]); });
    });
  });
})();
