# nothing.

A one-page site with a single choice: see nothing, or see everything.

## Structure

```
nothing/
├── firebase.json     # Hosting config
├── .firebaserc       # <-- set your Firebase project ID here
└── public/
    ├── index.html
    ├── style.css
    └── app.js
```

## How it works

- **Loader:** a thin rule fills over ~1.6s, then the wordmark "nothing."
  fades in with tightening letter-spacing. Purely CSS-driven (see
  `style.css` → `.loader-fill` / `.loader-word`), so it never actually
  waits on a network request — it's a deliberate pause, not a real loading
  state. If you later add real assets/fonts that take time to load, you
  may want to gate this on an actual `load` event condition rather than a
  fixed timeout.
- **Landing:** two buttons, "See nothing" and "See everything."
- **See nothing:** swaps to a full-viewport pure white view. No content,
  no message — a small circular back-arrow (top-left, low-opacity) is the
  only way out, or press Escape.
- **See everything:** swaps to a full-viewport near-black view with the
  word "Everything" centered in serif type. Same back-arrow / Escape
  pattern to leave.

## Deploy to Firebase Hosting

1. **Create a Firebase project** at https://console.firebase.google.com
   (Hosting doesn't require enabling any other product).

2. **Set your project ID** in `.firebaserc`, replacing
   `YOUR_FIREBASE_PROJECT_ID`.

3. **Install the Firebase CLI** if you don't have it:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

4. **Deploy:**
   ```bash
   cd nothing
   firebase deploy --only hosting
   ```
   Your site will be live at `https://YOUR_PROJECT.web.app`.

5. **Local preview:**
   ```bash
   firebase serve
   ```

## "See everything" paywall

Clicking "Unlock everything" (₹1 by default) opens a small picker with two
payment options: **Razorpay** and **PayPal**. Set both up, and you cover
Indian users (UPI included automatically) and international users.

### Razorpay (cards, UPI, netbanking)

1. Dashboard → Payment Pages → New. Set the amount (e.g. ₹1).
2. In its settings, set **Success redirect URL** to:
   ```
   https://nothing-82f21.web.app/?paid=true
   ```
3. UPI is included automatically alongside cards/netbanking on INR
   payment pages — no extra setup needed for this.
4. Copy the page URL into `app.js` → `PAYMENT_LINKS.razorpay`.

### PayPal (international cards, PayPal balance)

1. In your PayPal business account, create a **Buy Now / hosted button**
   (Website Payments Standard → "Buy Now" button, or the newer
   PayPal.com/ncp checkout link flow).
2. In **Profile → Website preferences**, turn on **Auto Return** and set
   the **Return URL** to the same address:
   ```
   https://nothing-82f21.web.app/?paid=true
   ```
3. Copy the resulting payment link into `app.js` →
   `PAYMENT_LINKS.paypal`.

4. Redeploy: `firebase deploy --only hosting`.

**How the unlock works:** whichever provider the visitor pays through,
success redirects back to your site with `?paid=true`. `app.js` detects
that, stores an `unlocked` flag in `localStorage`, and cleans the URL.
From then on (on that browser), the button opens the Everything view
directly and the payment picker no longer appears.

**Security caveat (same as before):** this is a client-side-only check —
someone could manually visit `?paid=true` and skip paying. Fine for a
small novelty project; for a tamper-proof version you'd need Cloud
Functions + provider webhooks on the Blaze plan.

## AdSense

The AdSense script and one ad unit are wired into the landing page only
(not inside the "nothing" or "everything" views, since a visible ad would
break the effect there).

1. In your AdSense dashboard, add `nothing-82f21.web.app` (or your custom
   domain) as a site if you haven't already, and create an **ad unit** to
   get a **slot ID**.
2. In `index.html`, find the `<ins class="adsbygoogle landing-ad" ...>`
   tag and replace `data-ad-slot="YOUR_AD_SLOT_ID"` with your real slot ID.
3. Redeploy: `firebase deploy --only hosting`.
4. It can take AdSense a little while (sometimes up to a day or two) to
   start actually serving ads on a newly added site, even once everything
   is correctly configured — an empty space where the ad unit sits at
   first is normal.

## SEO: favicon / logo not showing in search

The favicon setup here is actually complete — `favicon.svg`, `favicon.ico`,
16x16/32x32 PNGs, an Apple touch icon, and a `logo.svg` (now also wired in
as a `mask-icon`) are all linked correctly in `index.html`. If your logo or
favicon isn't showing next to your listing in Google search results yet,
it's almost always one of these, not a code problem:

1. **The site is brand new.** Google can take days to weeks to crawl and
   index a new site, and favicons show up even later than the listing
   itself.
2. **Google Search Console isn't set up.** Go to
   https://search.google.com/search-console, add your property
   (`nothing-82f21.web.app`), verify it (you already have
   `google61f475d2f0484c8e.html` for that), and submit
   `sitemap.xml` under Sitemaps.
3. **The favicon must be square and ≥48×48px** — yours qualifies, so once
   indexed it should appear.

There's nothing further to "fix" in code here; this is a wait-for-Google
situation, sped up by Search Console + the sitemap submission above.

## Admin panel, visitor analytics & custom ads

This adds a lightweight analytics + admin system using **Firebase
Firestore** and **Firebase Authentication** (both work on the free Spark
plan — no billing required).

### 1. Enable Firestore and Authentication

In the [Firebase console](https://console.firebase.google.com), open your
project:

- **Build → Firestore Database → Create database** → start in
  *Production mode* → pick a region.
- **Build → Authentication → Get started → Sign-in method** → enable
  **Email/Password**.
- **Authentication → Users → Add user** → create the login you'll use for
  `/admin.html` (this is your only admin account — there's no public
  sign-up).

### 2. Add your Firebase config

Open `public/firebase-init.js` and paste in your web app's `firebaseConfig`
(Project settings → General → Your apps → Web app, or add one if you
haven't).

### 3. Deploy the security rules once

```bash
firebase deploy --only firestore:rules
```

This lets any visitor's browser *write* a visit/click record, but only
your logged-in admin account can *read* the data back or edit the ad
config — see `firestore.rules`.

### 4. Deploy hosting

```bash
firebase deploy --only hosting
```

### What you get

- **`public/analytics.js`** — logs one `visits` doc per pageview (country,
  OS, browser, device type, screen size, language, referrer, page,
  timestamp) and one `events` doc per tracked click (which door was
  clicked, which payment link, ad clicks/impressions). Country comes from
  a free IP-lookup API called from the visitor's browser — no server
  needed.
- **`/admin.html`** — sign in with the account you created above to see:
  total visits, visits today, click counts, breakdowns by country /
  device / OS / browser / page / referrer, a table of the latest 500
  visits, and a **Download CSV** button that exports the raw visit log.
- **`public/ads.js`** — reads an ad config doc from Firestore. If you
  enable a custom ad in the admin panel's "Custom ad slot" section
  (image URL + click-through URL), it replaces the AdSense unit on the
  landing page; otherwise AdSense keeps showing as normal.

**Note on images for custom ads:** paste a URL to an already-hosted image
(e.g. one you upload to your own hosting, imgur, etc.) rather than a file
upload — this keeps the setup on the free plan with no Firebase Storage
needed.

## Customizing

- Swap the fonts by editing the Google Fonts `<link>` tags in
  `index.html` and the `--serif` / `--mono` variables in `style.css`.
- Timing for the loader lives in `style.css` (`fillRule`, `wordIn`
  animations) and is mirrored in the `setTimeout` in `app.js` — keep
  those two in sync if you change the durations.
