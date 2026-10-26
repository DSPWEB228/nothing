(function () {
  const auth = firebase.auth();
  const db = window.db;

  const loginScreen = document.getElementById('loginScreen');
  const dashboard = document.getElementById('dashboard');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');

  auth.onAuthStateChanged(function (user) {
    if (user) {
      loginScreen.classList.add('hidden');
      dashboard.classList.remove('hidden');
      loadEverything();
    } else {
      loginScreen.classList.remove('hidden');
      dashboard.classList.add('hidden');
    }
  });

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    loginError.textContent = '';
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    auth.signInWithEmailAndPassword(email, password).catch(function (err) {
      loginError.textContent = err.message || 'Sign in failed.';
    });
  });

  document.getElementById('logoutBtn').addEventListener('click', function () {
    auth.signOut();
  });
  document.getElementById('refreshBtn').addEventListener('click', loadEverything);

  let lastVisits = [];

  function loadEverything() {
    Promise.all([
      db.collection('visits').orderBy('ts', 'desc').limit(500).get(),
      db.collection('events').orderBy('ts', 'desc').limit(2000).get(),
      db.collection('config').doc('ad').get()
    ]).then(function (results) {
      const visitsSnap = results[0];
      const eventsSnap = results[1];
      const adSnap = results[2];

      lastVisits = visitsSnap.docs.map(function (d) { return d.data(); });
      const events = eventsSnap.docs.map(function (d) { return d.data(); });

      renderStats(lastVisits, events);
      renderBreakdown('tableCountry', countBy(lastVisits, 'country'));
      renderBreakdown('tableDevice', countBy(lastVisits, 'device'));
      renderBreakdown('tableOS', countBy(lastVisits, 'os'));
      renderBreakdown('tableBrowser', countBy(lastVisits, 'browser'));
      renderBreakdown('tablePage', countBy(lastVisits, 'page'));
      renderBreakdown('tableReferrer', countBy(lastVisits, 'referrer'));
      renderVisitsTable(lastVisits);

      if (adSnap.exists) {
        const ad = adSnap.data();
        document.getElementById('adEnabled').checked = !!ad.enabled;
        document.getElementById('adImageUrl').value = ad.imageUrl || '';
        document.getElementById('adLinkUrl').value = ad.linkUrl || '';
        document.getElementById('adAltText').value = ad.altText || '';
      }
    }).catch(function (err) {
      console.error(err);
    });
  }

  function countBy(arr, field) {
    const map = {};
    arr.forEach(function (item) {
      const key = item[field] || 'Unknown';
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).sort(function (a, b) { return b[1] - a[1]; });
  }

  function renderBreakdown(tableId, rows) {
    const tbody = document.querySelector('#' + tableId + ' tbody');
    tbody.innerHTML = '';
    if (rows.length === 0) {
      tbody.innerHTML = '<tr><td>No data yet</td></tr>';
      return;
    }
    rows.slice(0, 10).forEach(function (row) {
      const tr = document.createElement('tr');
      const tdKey = document.createElement('td');
      tdKey.textContent = row[0];
      const tdVal = document.createElement('td');
      tdVal.textContent = row[1];
      tr.appendChild(tdKey);
      tr.appendChild(tdVal);
      tbody.appendChild(tr);
    });
  }

  function renderVisitsTable(visits) {
    const tbody = document.querySelector('#tableVisits tbody');
    tbody.innerHTML = '';
    visits.forEach(function (v) {
      const tr = document.createElement('tr');
      [
        formatTs(v.ts), v.page, v.country, v.device, v.os, v.browser, v.referrer
      ].forEach(function (val) {
        const td = document.createElement('td');
        td.textContent = val || '';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  function formatTs(ts) {
    if (!ts || !ts.toDate) return '';
    return ts.toDate().toLocaleString();
  }

  function renderStats(visits, events) {
    document.getElementById('statTotalVisits').textContent = visits.length;
    const todayStr = new Date().toDateString();
    const todayCount = visits.filter(function (v) {
      return v.ts && v.ts.toDate && v.ts.toDate().toDateString() === todayStr;
    }).length;
    document.getElementById('statToday').textContent = todayCount;

    function countEvent(type) {
      return events.filter(function (e) { return e.type === type; }).length;
    }
    document.getElementById('statNothingClicks').textContent = countEvent('see_nothing_click');
    document.getElementById('statEverythingClicks').textContent = countEvent('see_everything_click');
    document.getElementById('statPaidClicks').textContent =
      countEvent('pay_razorpay_click') + countEvent('pay_paypal_click') + countEvent('pay_paytm_click');
    document.getElementById('statAdClicks').textContent = countEvent('ad_click');
  }

  // ---------- Ad manager ----------
  document.getElementById('saveAdBtn').addEventListener('click', function () {
    const status = document.getElementById('adSaveStatus');
    const data = {
      enabled: document.getElementById('adEnabled').checked,
      imageUrl: document.getElementById('adImageUrl').value.trim(),
      linkUrl: document.getElementById('adLinkUrl').value.trim(),
      altText: document.getElementById('adAltText').value.trim(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    db.collection('config').doc('ad').set(data).then(function () {
      status.textContent = 'Saved.';
      setTimeout(function () { status.textContent = ''; }, 2500);
    }).catch(function (err) {
      status.textContent = 'Error: ' + err.message;
    });
  });

  // ---------- CSV export ----------
  document.getElementById('downloadCsvBtn').addEventListener('click', function () {
    const cols = ['ts', 'page', 'referrer', 'country', 'countryCode', 'os', 'browser', 'browserVersion', 'device', 'screen', 'lang', 'sessionId', 'userAgent'];
    const header = cols.join(',');
    const rows = lastVisits.map(function (v) {
      return cols.map(function (c) {
        let val = c === 'ts' ? formatTs(v.ts) : (v[c] || '');
        val = String(val).replace(/"/g, '""');
        return '"' + val + '"';
      }).join(',');
    });
    const csv = [header].concat(rows).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nothing-visits-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
})();
