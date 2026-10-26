// ================= CUSTOM AD SLOT =================
// Reads config/ad from Firestore. If an admin has enabled a custom ad
// (image + click-through URL) in /admin.html, it replaces the AdSense
// unit on the landing page. Otherwise AdSense keeps showing as-is.
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    if (!window.db) return;
    window.db.collection('config').doc('ad').get().then(function (doc) {
      if (!doc.exists) return;
      const data = doc.data();
      if (!data.enabled || !data.imageUrl) return;

      const slot = document.querySelector('.landing-ad');
      if (!slot) return;
      slot.style.display = 'none';

      const wrap = document.createElement('a');
      wrap.href = data.linkUrl || '#';
      wrap.target = '_blank';
      wrap.rel = 'noopener sponsored';
      wrap.className = 'custom-ad';
      wrap.addEventListener('click', function () {
        if (window.logEvent) window.logEvent('ad_click');
      });

      const img = document.createElement('img');
      img.src = data.imageUrl;
      img.alt = data.altText || 'Advertisement';
      wrap.appendChild(img);

      slot.parentNode.insertBefore(wrap, slot.nextSibling);
      if (window.logEvent) window.logEvent('ad_impression');
    }).catch(function () {});
  });
})();
