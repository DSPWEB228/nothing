const loader = document.getElementById('loader');
const landing = document.getElementById('landing');
const viewNothing = document.getElementById('viewNothing');
const viewEverything = document.getElementById('viewEverything');

// ================= PAYWALL CONFIG =================
// Replace with your real payment page URLs once created.
//
// Razorpay: dashboard → Payment Pages → New. Set "Success redirect URL" to:
//   https://nothing-82f21.web.app/?paid=true
// (UPI is included automatically alongside cards/netbanking for INR pages —
// no extra setup needed for Indian users.)
//
// PayPal: create a "Buy Now" / hosted button (Website Payments Standard) in
// your PayPal business account. In Profile → Website preferences, turn on
// "Auto Return" and set the Return URL to the same address:
//   https://nothing-82f21.web.app/?paid=true
//
// Paytm: create a Payment Link in Paytm for Business dashboard → Payment
// Links → New Link. Set the amount, and under "Redirect URL after payment"
// point it to the same address:
//   https://nothing-82f21.web.app/?paid=true
const PAYMENT_LINKS = {
  razorpay: 'https://rzp.io/rzp/jLI2wZnT',
  paypal: 'https://www.paypal.com/ncp/payment/YOUR_BUTTON_ID_HERE', // <-- placeholder
  paytm: 'https://paytm.me/YOUR_LINK_ID_HERE' // <-- placeholder
};
const PAID_QUERY_PARAM = 'paid';
const PAID_STORAGE_KEY = 'nothing_everything_unlocked';

const everythingBtn = document.getElementById('seeEverythingBtn');
const everythingLabel = document.getElementById('everythingLabel');
const everythingPrice = document.getElementById('everythingPrice');
const payPanel = document.getElementById('payPanel');
const payRazorpay = document.getElementById('payRazorpay');
const payPaypal = document.getElementById('payPaypal');
const payPaytm = document.getElementById('payPaytm');

payRazorpay.href = PAYMENT_LINKS.razorpay;
payPaypal.href = PAYMENT_LINKS.paypal;
payPaytm.href = PAYMENT_LINKS.paytm;

// Hide any payment option whose link is still a placeholder, so visitors
// never land on a broken page.
[[payRazorpay, PAYMENT_LINKS.razorpay], [payPaypal, PAYMENT_LINKS.paypal], [payPaytm, PAYMENT_LINKS.paytm]]
  .forEach(([el, url]) => { if (!url || url.includes('YOUR_')) el.classList.add('hidden'); });

function isUnlocked() {
  return localStorage.getItem(PAID_STORAGE_KEY) === 'true';
}

function unlock() {
  localStorage.setItem(PAID_STORAGE_KEY, 'true');
  refreshEverythingButton();
}

function refreshEverythingButton() {
  if (isUnlocked()) {
    everythingBtn.classList.add('unlocked');
    everythingLabel.textContent = 'See everything';
    everythingPrice.textContent = '';
    payPanel.classList.add('hidden');
  } else {
    everythingBtn.classList.remove('unlocked');
    everythingLabel.textContent = 'Unlock everything';
  }
}

// Check for a successful-payment redirect (?paid=true) on load
(function checkPaymentReturn() {
  const params = new URLSearchParams(window.location.search);
  if (params.get(PAID_QUERY_PARAM) === 'true') {
    unlock();
    // Clean the URL so refreshing doesn't re-trigger anything visibly
    params.delete(PAID_QUERY_PARAM);
    const cleanUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.history.replaceState({}, document.title, cleanUrl);
  }
})();

// Loader -> Landing
window.addEventListener('load', () => {
  setTimeout(() => {
    loader.classList.add('hidden');
    landing.classList.remove('hidden');
    // Request the AdSense ad now that its container is visible
    // Skipped until a real slot ID is set in index.html (a placeholder ID
    // makes AdSense throw errors); Auto ads still work from the page script.
    try {
      const adEl = document.querySelector('.landing-ad');
      const slot = adEl ? adEl.getAttribute('data-ad-slot') : '';
      if (adEl && slot && !slot.includes('YOUR_')) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } else if (adEl) {
        adEl.closest('.ad-wrap').classList.add('hidden');
      }
    } catch (e) {
      console.warn('AdSense push failed:', e);
    }
  }, 2100); // matches loader rule fill (1.6s) + word fade (1.1s @ 0.9s delay)
});

function showView(view) {
  landing.classList.add('hidden');
  view.classList.remove('hidden');
}

function backToLanding(view) {
  view.classList.add('hidden');
  landing.classList.remove('hidden');
}

document.getElementById('seeNothingBtn').addEventListener('click', () => showView(viewNothing));

everythingBtn.addEventListener('click', () => {
  if (isUnlocked()) {
    showView(viewEverything);
    return;
  }
  const isOpen = !payPanel.classList.contains('hidden');
  payPanel.classList.toggle('hidden', isOpen);
  everythingBtn.setAttribute('aria-expanded', String(!isOpen));
});

// Close the picker if clicking outside it
document.addEventListener('click', (e) => {
  if (!payPanel.classList.contains('hidden') &&
      !payPanel.contains(e.target) &&
      e.target !== everythingBtn &&
      !everythingBtn.contains(e.target)) {
    payPanel.classList.add('hidden');
    everythingBtn.setAttribute('aria-expanded', 'false');
  }
});

refreshEverythingButton();
document.getElementById('leaveNothingBtn').addEventListener('click', () => backToLanding(viewNothing));
document.getElementById('leaveEverythingBtn').addEventListener('click', () => backToLanding(viewEverything));

// Keyboard escape returns to landing from either view
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!viewNothing.classList.contains('hidden')) backToLanding(viewNothing);
    if (!viewEverything.classList.contains('hidden')) backToLanding(viewEverything);
  }
});
