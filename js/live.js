/* AANGAN live activity: "viewing now" + "recently chosen".
   mode "demo": SIMULATED numbers for design preview only (a "Preview" tag is shown). Do NOT launch with demo data —
   showing invented activity to real shoppers is misleading.
   mode "api": reads REAL data from your backend (needs presence tracking + order webhook). Expected endpoints:
     GET {endpoint}/presence/{productId} -> {count:number}
     GET {endpoint}/recent-orders        -> [{productId, city, minutesAgo}]   (city only, no names, with customer consent) */
(function () {
  const CFG = Object.assign({ mode: 'demo', endpoint: '', minViewers: 2, maxToasts: 3 }, window.AANGAN_LIVE || {});
  const SITE = Object.assign({ showViewingNow: true }, window.AANGAN_CONFIG || {});
  const P = window.AANGAN_PRODUCTS || []; if (!P.length) return;
  const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const tag = CFG.mode === 'demo' ? '<span class="pv">Preview</span>' : '';
  const seed = id => [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const demoCount = (id, t) => 2 + ((seed(id) + Math.floor(t / 25000)) % 5);          // 2–6, shifts slowly
  async function count(id) {
    if (CFG.mode === 'api') { try { const r = await fetch(`${CFG.endpoint}/presence/${encodeURIComponent(id)}`); return (await r.json()).count || 0 } catch (e) { return 0 } }
    return demoCount(id, Date.now())
  }
  async function paint() {
    if (!SITE.showViewingNow) { document.querySelectorAll('[data-live]').forEach(el => el.hidden = true); return }
    for (const el of document.querySelectorAll('[data-live]')) {
      const n = await count(el.dataset.live), big = el.classList.contains('live');
      if (n < CFG.minViewers) { el.hidden = true; continue }
      el.hidden = false; el.innerHTML = big ? `<span class="dot"></span>${n} people are viewing this piece right now ${tag}` : `<span class="dot"></span>${n} viewing`
    }
  }
  paint(); setInterval(paint, 25000);
  document.addEventListener('aangan:render', paint);
  /* Recently chosen toast */
  const key = 'aangan_toasts'; let shown = +(sessionStorage.getItem(key) || 0);
  const cities = ['Mumbai', 'Jaipur', 'Pune', 'Ahmedabad', 'Bengaluru', 'Delhi', 'Hyderabad', 'Udaipur'];
  async function nextOrder() {
    if (CFG.mode === 'api') { try { const o = await (await fetch(`${CFG.endpoint}/recent-orders`)).json(); const x = o[0]; return x && { p: P.find(p => p.id == x.productId), city: x.city, m: x.minutesAgo } } catch (e) { return null } }
    const p = P[Math.floor(Math.random() * P.length)]; return { p, city: cities[Math.floor(Math.random() * cities.length)], m: 3 + Math.floor(Math.random() * 40) }
  }
  const box = document.createElement('aside'); box.className = 'sale'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.appendChild(box);
  async function toast() {
    if (!SITE.showViewingNow || shown >= CFG.maxToasts) return; const o = await nextOrder(); if (!o || !o.p) return; shown++; sessionStorage.setItem(key, shown);
    box.innerHTML = `<img src="${o.p.cardImage || o.p.image}" alt="" width="52" height="69"><div><p class="k">Recently chosen ${tag}</p><p class="m">Someone in ${o.city} chose the <a href="${o.p.url || ('product.html?id=' + o.p.id)}">${o.p.name}</a></p><p class="t">${o.m} minutes ago</p></div><button aria-label="Dismiss">×</button>`;
    box.querySelector('button').onclick = () => box.classList.remove('show');
    requestAnimationFrame(() => box.classList.add('show')); setTimeout(() => box.classList.remove('show'), 9000)
  }
  setTimeout(function loop() { toast(); if (shown < CFG.maxToasts) setTimeout(loop, (reduce ? 60 : 50) * 1000) }, 14000);
})();
