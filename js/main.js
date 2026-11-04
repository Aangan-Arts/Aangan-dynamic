/* AANGAN main.js — header/footer, search, bag, forms, reveals */
(function () {
  const P = window.AANGAN_PRODUCTS || [], C = window.AANGAN_COLLECTIONS;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = { get: k => { try { return JSON.parse(localStorage.getItem(k)) || [] } catch (e) { return [] } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { } } };
  /* Price format: selling prices without a comma (reads as smaller), struck-out actual prices with a comma (reads as larger) */
  const inr = n => n == null ? 'Price on request' : `₹${String(Math.round(Number(n)))}`;
  const inrWas = n => `₹${Number(n).toLocaleString('en-IN')}`;
  const inrDisplay = n => n == null ? 'Price on request' : `<span class="currency">₹</span>${String(Math.round(Number(n)))}`;
  const inrWasDisplay = n => `<span class="currency">₹</span>${Number(n).toLocaleString('en-IN')}`;
  const CFG = Object.assign({ whatsappNumber: '', siteUrl: '', instagramUrl: '', salePercent: null, saleLabel: 'Sale offers', saleHeadline: '', deliveryCutoff: '', deliveryFestival: 'the festival', freeShippingAbove: 0 }, window.AANGAN_CONFIG || {});
  /* Order-by date (js/config.js deliveryCutoff), counted in India time; null once the date has passed */
  const DLV = (() => {
    const c = String(CFG.deliveryCutoff || ''); if (!/^\d{4}-\d{2}-\d{2}$/.test(c)) return null;
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    const left = Math.round((Date.parse(c) - Date.parse(today)) / 864e5); if (left < 0) return null;
    const label = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(c + 'T00:00:00Z'));
    return { label, left, fest: CFG.deliveryFestival, leftText: left == 0 ? 'Last day to order' : left == 1 ? '1 day left' : `${left} days left` }
  })();
  const fillDelivery = () => {
    document.querySelectorAll('[data-dlv]').forEach(el => {
      if (!DLV) { el.hidden = true; return }
      el.hidden = false;
      el.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/></svg><span><b>${DLV.left == 0 ? 'Order today' : 'Order by ' + DLV.label}</b> to get it before ${DLV.fest}</span><span class="dlv-left">${DLV.leftText}</span>`
    })
  };
  /* Free shipping (js/config.js freeShippingAbove) */
  const FREE = Number(CFG.freeShippingAbove) || 0;
  /* product link: clean address like p/handcrafted-ganesha-lotus-pearl-toran/ (falls back to product.html?id=) */
  const purl = p => p.url || ('product.html?id=' + p.id);
  /* every WhatsApp link on the site uses the number in js/config.js */
  const wa = text => `https://wa.me/${String(CFG.whatsappNumber).replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
  const off = p => { if (!(p.price != null && p.mrp && p.mrp > p.price)) return 0; const r = Math.round((p.mrp - p.price) / p.mrp * 100); return CFG.salePercent ? Math.min(r, CFG.salePercent) : r };
  const was = p => off(p) ? `<s class="was">${inrWasDisplay(p.mrp)}</s>` : '';
  const offer = p => off(p) ? `<span class="off">${off(p)}% off</span>` : '';
  const ic = { s: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>', b: '<path d="M5 8h14l-1 12H6zM9 8a3 3 0 0 1 6 0"/>', m: '<path d="M4 8h16M4 16h16"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>' };
  const svg = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${ic[k]}</svg>`;
  const page = document.body.dataset.page || '';
  const cols = Object.entries(C);
  const menu = cols.map(([k, v]) => `<a href="${v.page}"><b>${v.name}</b><small>${v.desc}</small></a>`).join('');
  const mmenu = cols.map(([k, v]) => `<a href="${v.page}">${v.name}</a>`).join('');
  const hdr = `<div class="announce${DLV ? ' dl' : ''}">${DLV ? (DLV.left == 0 ? `Last day: order today for delivery before ${DLV.fest}` : `Order by ${DLV.label} for delivery before ${DLV.fest}`) : 'Handcrafted with love. Inspired by tradition.'}</div>
<header class="site-header"><div class="container toprow">
<div class="hs"><a class="emb" href="index.html" aria-label="AANGAN home"><img src="images/brand/aangan-lotus.png" alt="AANGAN lotus" width="245" height="145"></a></div>
<a class="logo" href="index.html" aria-label="AANGAN home"><img src="images/logo/aangan-wordmark.webp" alt="AANGAN" width="213" height="34"></a>
<div class="hs end"><button class="tb" data-open="bag" aria-label="Shopping bag">${svg('b')}<span class="bagl">Bag</span><span class="bcn" id="bc"></span></button></div></div></header>
<div class="scrim" id="scrim"></div>
<aside class="panel" id="p-custom" aria-label="Request a custom creation"><button class="ib" data-close aria-label="Close">${svg('x')}</button><h3>Custom creation</h3><div id="cc"></div></aside>
<aside class="panel" id="p-bag" aria-label="Shopping bag"><button class="ib" data-close aria-label="Close">${svg('x')}</button><h3>Your bag</h3><div id="bl"></div><div id="bf"></div></aside>`;
  const ft = `<footer class="foot"><div class="container">
<div class="fcta"><div><h2>Imagine it in your home.</h2><p>Have a corner, a celebration or a gift in mind? Tell us and we will explore a creation made for you.</p></div><button class="btn-a" type="button" data-open="custom">Request a custom creation <i>→</i></button></div>
<img class="fwm" src="images/logo/aangan-wordmark.webp" alt="AANGAN" width="800" height="128"><p class="ftag">Where Tradition Glows.</p>
<div class="row g-4 mt-4"><div class="col-6 col-lg-3"><h4>Reach us</h4><ul class="soc"><li><a href="${CFG.instagramUrl || '#'}" target="_blank" rel="noopener" aria-label="AANGAN on Instagram"><svg class="si-c" viewBox="0 0 48 48" aria-hidden="true"><defs><radialGradient id="igg" cx="0.3" cy="1.07" r="1.2"><stop offset="0" stop-color="#FFDD55"/><stop offset=".1" stop-color="#FFDD55"/><stop offset=".5" stop-color="#FF543E"/><stop offset="1" stop-color="#C837AB"/></radialGradient><radialGradient id="igb" cx="-0.17" cy="0.07" r="0.7"><stop offset="0" stop-color="#3771C8"/><stop offset=".13" stop-color="#3771C8"/><stop offset="1" stop-color="#6600FF" stop-opacity="0"/></radialGradient></defs><rect width="48" height="48" rx="12" fill="url(#igg)"/><rect width="48" height="48" rx="12" fill="url(#igb)"/><rect x="11" y="11" width="26" height="26" rx="8" fill="none" stroke="#fff" stroke-width="3"/><circle cx="24" cy="24" r="6.3" fill="none" stroke="#fff" stroke-width="3"/><circle cx="31.6" cy="16.4" r="1.9" fill="#fff"/></svg></a></li><li><a href="${wa('')}" target="_blank" rel="noopener" aria-label="Chat with AANGAN on WhatsApp"><svg class="si-c" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="24" fill="#25D366"/><path d="M12.6 35.4l1.6-5.8a11.9 11.9 0 1 1 4.6 4.4z" fill="none" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/><path d="M19.6 17.9c.3-.7.7-.7 1.1-.7h.7c.3 0 .6 0 .8.6l1 2.4c.1.3 0 .6-.1.8l-.7.9c-.2.2-.3.4 0 .7.7 1.3 1.9 2.4 3.3 3.2.3.1.5.1.7-.1l.9-1c.2-.3.5-.3.8-.2l2.3 1.1c.3.2.5.4.5.7 0 .6-.2 1.4-.9 2-.7.6-1.7.8-2.8.5-2-.6-4.6-2.1-6.3-4.6-1.6-2.4-1.9-4.6-1.3-6.3z" fill="#fff"/></svg></a></li></ul></div></div>
<div class="bt d-flex justify-content-between flex-wrap gap-2"><span>© <span id="yr"></span> AANGAN. All rights reserved.</span><a href="#main">Back to top ↑</a></div></div></footer>`;
  document.body.insertAdjacentHTML('afterbegin', hdr); document.body.insertAdjacentHTML('beforeend', ft);
  $('#yr').textContent = new Date().getFullYear();
  /* Panels */
  const scrim = $('#scrim'); const closeAll = () => { $$('.panel').forEach(p => p.classList.remove('open')); scrim.classList.remove('open') };
  const open = id => { closeAll(); $('#p-' + id).classList.add('open'); scrim.classList.add('open') };
  $$('[data-open]').forEach(b => b.onclick = () => { if (b.dataset.open == 'bag' && step != 'done') step = 'bag'; if (b.dataset.open == 'custom') customForm(); open(b.dataset.open); render() });
  $$('[data-close]').forEach(b => b.onclick = closeAll); scrim.onclick = closeAll; document.addEventListener('keydown', e => { if (e.key == 'Escape') closeAll() });
  const ddb = $('.dd button'); if (ddb) ddb.onclick = () => { const d = ddb.parentElement; d.classList.toggle('open'); ddb.setAttribute('aria-expanded', d.classList.contains('open')) };
  /* Product card */
  const card = p => `<article class="pc"><a href="${purl(p)}" class="pimg" aria-label="View ${p.name}"><div class="ph"><img src="${p.cardSrc || p.cardImage || p.image}"${p.cardSet ? ` srcset="${p.cardSet}" sizes="(min-width: 992px) 30vw, 50vw"` : ''} alt="${p.alt || p.name}" loading="lazy" decoding="async" width="${p.cardW || 600}" height="${p.cardH || 800}"></div></a>
<div class="body"><h3><a href="${purl(p)}">${p.name}</a></h3><div class="pr">${inrDisplay(p.price)} ${was(p)} ${offer(p)}</div><div class="live-sm" data-live="${p.id}" hidden></div>
<div class="d-flex gap-2 flex-wrap mt-3">${p.available === false ? '<span class="small align-self-center">Currently unavailable</span>' : `<button class="btn-b sm" data-add="${p.id}">Add to bag</button><button class="btn-a sm" data-buy="${p.id}">Buy now</button>`}</div></div></article>`;
  const emptyMsg = t => `<div class="empty"><h3>${t}</h3><p>Products appear here once they are added to <code>js/products.js</code>. In the meantime, tell us what you are looking for.</p></div>`;
  function grid(el, list) { if (!el) return; el.innerHTML = list.length ? `<div class="row g-4">${list.map(p => `<div class="col-6 col-lg-4">${card(p)}</div>`).join('')}</div>` : emptyMsg(el.dataset.empty || 'New pieces are on their way') }
  const shopCat = new URLSearchParams(location.search).get('c');
  /* Bag: ids with repeats = quantity */
  function bag() {
    const ids = store.get('ab'), map = {}; ids.forEach(i => map[i] = (map[i] || 0) + 1);
    const rows = Object.entries(map).map(([i, q]) => ({ p: P.find(p => p.id == i), q })).filter(r => r.p);
    $('#bc').textContent = ids.length || '';
    if (step == 'done') { doneView(); return }
    if (step == 'form' && rows.length) { formView(rows); return }
    if (step == 'form') step = 'bag';
    $('#bl').innerHTML = rows.length ? rows.map(({ p, q }) => `<div class="bi"><a href="${purl(p)}"><img src="${p.cardImage || p.image}" alt="${p.alt || p.name}" width="64" height="85"></a>
 <div class="bt2"><a class="bn" href="${purl(p)}">${p.name}</a><span class="bp">${inrDisplay(p.price)}${p.mrp > p.price ? ` <s class="was">${inrWasDisplay(p.mrp)}</s>` : ''}</span>
 <div class="qty"><button data-dec="${p.id}" aria-label="Decrease quantity">−</button><span>${q}</span><button data-inc="${p.id}" aria-label="Increase quantity">+</button><button class="rm" data-rm="${p.id}">Remove</button></div></div></div>`).join('') : '<p class="mt-3">Your bag is empty.</p><a class="btn-b" href="index.html">Continue shopping</a>';
    const priced = rows.filter(r => r.p.price != null), sub = priced.reduce((a, r) => a + r.p.price * r.q, 0);
    $('#bf').innerHTML = rows.length ? `${priced.length ? shipBox(sub, rows) : ''}<div class="sub"><span>Subtotal</span><b>${priced.length ? inrDisplay(sub) : '—'}</b></div><p class="co-h">How would you like to order?</p>
 <button class="co-opt main" id="coWa" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.6-1.8-.9-.8.8a4 4 0 0 1-2.7-2.7l.8-.8-.9-1.8z"/></svg><span><b>Order on WhatsApp</b><small>Send your order now and share your address in the chat</small></span><i aria-hidden="true">→</i></button>
 <button class="co-opt" id="coForm" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"/><path d="M9 11h7M9 15h7M9 7h4"/></svg><span><b>Enter delivery details first</b><small>Fill in your address here, then send it all on WhatsApp in one go</small></span><i aria-hidden="true">→</i></button>
 <p class="small mt-3 mb-0">Either way, you pay only after we confirm availability, shipping and your total. Nothing is charged now.</p>` : '';
    const cf = $('#coForm'); if (cf) cf.onclick = () => { step = 'form'; bag() };
    const cw = $('#coWa'); if (cw) cw.onclick = () => placeOrder(null);
    $('#bc').textContent = ids.length || ''
  }

  /* Free-shipping progress in the bag, plus one or two pieces that would get the shopper there */
  function shipBox(sub, rows) {
    if (!FREE) return '';
    const need = FREE - sub, pct = Math.min(100, Math.round(sub / FREE * 100));
    const bar = `<div class="shipbar" role="progressbar" aria-label="Progress to free shipping" aria-valuemin="0" aria-valuemax="${FREE}" aria-valuenow="${Math.min(sub, FREE)}"><span style="width:${pct}%"></span></div>`;
    if (need <= 0) return `<div class="ship ok"><p><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4 10-10"/></svg>You’ve unlocked <b>free shipping</b></p>${bar}</div>`;
    const inBag = rows.map(r => r.p.id), fits = x => !inBag.includes(x.id) && x.available !== false && x.price != null && x.price >= need;
    const near = [...new Set(rows.flatMap(r => r.p.related || []))].map(i => P.find(x => x.id == i)).filter(x => x && fits(x));
    const rank = x => x.price - need - (near.includes(x) ? 200 : 0);   // closest to the gap, matching pieces first
    const picks = P.filter(fits).sort((a, b) => rank(a) - rank(b)).slice(0, 2);
    return `<div class="ship"><p>Add <b>${inrDisplay(need)}</b> more for <b>free shipping</b></p>${bar}
 ${picks.length ? `<div class="ship-add">${picks.map(x => `<div class="sa"><img src="${x.cardImage || x.image}" alt="" width="44" height="58"><span class="san">${x.name}</span><span class="sap">${inrDisplay(x.price)}</span><button class="btn-b sm" data-add="${x.id}" aria-label="Add ${x.name} to bag">Add</button></div>`).join('')}</div>` : ''}</div>`
  }
  /* Checkout: delivery details -> order reference -> WhatsApp with the order filled in (pay after confirmation) */
  let step = 'bag', lastRef = '';
  const DK = 'aangan_details';
  const getD = () => { try { return JSON.parse(localStorage.getItem(DK)) || {} } catch (e) { return {} } };
  function orderMessage(ref, d) {
    const quick = !d; d = d || {}; const ids = store.get('ab'), map = {}; ids.forEach(i => map[i] = (map[i] || 0) + 1);
    const base = CFG.siteUrl || (/^https?:/.test(location.href) ? new URL('./', document.baseURI).href : ''); let sub = 0, req = false;
    const lines = Object.entries(map).map(([i, q], k) => {
      const p = P.find(x => x.id == i); if (!p) return ''; let l = `${k + 1}. ${p.name}\n   `;
      if (p.price == null) { req = true; l += `Qty ${q} · Price on request` } else { sub += p.price * q; l += `Qty ${q} × ${inr(p.price)} = ${inr(p.price * q)}` }
      if (base) l += `\n   ${base}${purl(p)}`; return l
    }).filter(Boolean);
    const x = [`Name: ${d.n || ''}`, `WhatsApp: ${d.ph || ''}`, `Address: ${d.ad || ''}, ${d.ct || ''} - ${d.pc || ''}`];
    if (d.nt) x.push(`Note: ${d.nt}`);
    return `Hello AANGAN! I'd like to place an order (Ref ${ref || '-'}):\n\n${lines.join('\n\n')}\n\nSubtotal: ${inr(sub)}${req ? ' + items on request' : ''}${FREE && sub >= FREE ? ' · Free shipping (order above ' + inr(FREE) + ')' : ' (shipping to be confirmed)'}\n\n${quick ? 'I will share my name and delivery address here.' : `Delivery details\n${x.join('\n')}`}\n\nPlease confirm availability, shipping and the final total. Thank you!`
  }
  const waLink = (ref, d) => wa(orderMessage(ref, d));
  function goWA(ref, d) { const u = waLink(ref, d), w = window.open(u, '_blank'); if (!w) location.href = u }
  /* order reference: AGN-261031-K7Q2 (date + 4 random letters/digits, easy to read out on a call) */
  const orderRef = () => { const t = new Date(), A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = crypto.getRandomValues(new Uint8Array(4)); return 'AGN-' + String(t.getFullYear()).slice(2) + String(t.getMonth() + 1).padStart(2, '0') + String(t.getDate()).padStart(2, '0') + '-' + [...r].map(x => A[x % A.length]).join('') };
  /* saves the order in the shop's database (js/config.js orderApi). Never waits and never blocks WhatsApp: if saving fails, the order still reaches you on WhatsApp. */
  function saveOrder(ref, d) {
    if (!CFG.orderApi || !window.fetch) return;
    const map = {}; store.get('ab').forEach(i => map[i] = (map[i] || 0) + 1);
    const body = { ref, method: d ? 'details_form' : 'whatsapp_direct', items: Object.entries(map).map(([id, qty]) => ({ id, qty })), details: d || undefined };
    try { fetch(CFG.orderApi, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), keepalive: true }).catch(() => { }) } catch (e) { }
  }
  const fld = (l, id, type, v, req, ph) => `<div class="mb-3"><label for="${id}">${l}${req ? '' : ' (optional)'}</label>${type == 'ta' ? `<textarea id="${id}" rows="2" ${req ? 'required' : ''} placeholder="${ph || ''}">${v || ''}</textarea>` : `<input id="${id}" type="${type}" value="${v || ''}" ${req ? 'required' : ''} placeholder="${ph || ''}" ${type == 'tel' ? 'inputmode="tel" autocomplete="tel"' : ''}>`}<div class="err" aria-live="polite"></div></div>`;
  function formView(rows) {
    const d = getD(), n = rows.reduce((a, r) => a + r.q, 0), priced = rows.filter(r => r.p.price != null), sub = priced.reduce((a, r) => a + r.p.price * r.q, 0);
    $('#bl').innerHTML = `<button class="back" id="bk">← Back to bag</button><h4 class="mt-3">Delivery details</h4><p class="small">Used only to confirm and deliver your order.</p>
 <div class="sumline"><span>${n} ${n == 1 ? 'piece' : 'pieces'}</span><b>${priced.length ? inrDisplay(sub) : '—'}</b></div>
 <form id="cf" class="fm" novalidate>${fld('Full name', 'n', 'text', d.n, 1)}${fld('WhatsApp number', 'ph', 'tel', d.ph, 1, '10-digit mobile number')}${fld('Address', 'ad', 'ta', d.ad, 1, 'House, street, area')}
 <div class="row g-2"><div class="col-7">${fld('City', 'ct', 'text', d.ct, 1)}</div><div class="col-5">${fld('Pincode', 'pc', 'text', d.pc, 1, '6 digits')}</div></div>
 ${fld('Note', 'nt', 'ta', '', 0, 'Gift note, colours or anything we should know')}
 <button class="btn-a w-100 justify-content-center" type="submit">Continue on WhatsApp</button></form>
 <ol class="steps small"><li>WhatsApp opens with your order details ready.</li><li>We confirm availability, shipping and your total.</li><li>You pay once we confirm. Nothing is charged before this.</li></ol>`;
    $('#bf').innerHTML = ''; $('#bk').onclick = () => { step = 'bag'; bag() };
    const f = $('#cf');
    const getOrderDetails = () => {
      const v = {};['n', 'ph', 'ad', 'ct', 'pc', 'nt'].forEach(k => v[k] = f.querySelector('#' + k).value.trim());
      const ph = v.ph.replace(/[\s-]/g, ''), bad = {}; if (!v.n) bad.n = 'Please enter your name.'; if (!/^(\+?91)?[6-9]\d{9}$/.test(ph)) bad.ph = 'Enter a valid 10-digit mobile number.'; if (!v.ad) bad.ad = 'Please enter your address.'; if (!v.ct) bad.ct = 'Please enter your city.'; if (!/^\d{6}$/.test(v.pc)) bad.pc = 'Enter a 6-digit pincode.';
      ['n', 'ph', 'ad', 'ct', 'pc'].forEach(k => { const i = f.querySelector('#' + k); i.parentElement.querySelector('.err').textContent = bad[k] || ''; i.setAttribute('aria-invalid', !!bad[k]) });
      if (Object.keys(bad).length) { const first = f.querySelector('[aria-invalid=true]'); if (first) first.focus(); return null }
      try { localStorage.setItem(DK, JSON.stringify({ n: v.n, ph: v.ph, ad: v.ad, ct: v.ct, pc: v.pc })) } catch (e) { }
      return v;
    };
    f.onsubmit = e => {
      e.preventDefault(); const v = getOrderDetails();
      if (!v) return;
      placeOrder(v)
    }
  }
  /* both checkout choices end here: d = delivery details from the form, or null for "Order on WhatsApp" */
  let lastQuick = false;
  function placeOrder(d) {
    lastRef = orderRef(); lastQuick = !d; step = 'done';
    { const ids = store.get('ab'), items = ids.map(i => P.find(p => p.id == i)).filter(Boolean); window.AANGAN_TRACK && AANGAN_TRACK('whatsapp_order', { transaction_id: lastRef, currency: 'INR', value: items.reduce((a, p) => a + (p.price || 0), 0), checkout_method: d ? 'details_form' : 'whatsapp_direct', items: items.map(p => ({ item_id: p.id, item_name: p.name, price: p.price || 0, quantity: 1 })) }) }
    saveOrder(lastRef, d); goWA(lastRef, d); bag()
  }
  function doneView() {
    $('#bl').innerHTML = `<div class="done"><h4>Almost there</h4><p class="ref">${lastRef}</p><p>WhatsApp should have opened with your order ready. Send the message${lastQuick ? ' and share your name and delivery address in the chat' : ''}, and we will confirm availability, shipping and your total.</p>
 <button class="btn-a w-100 justify-content-center" id="rw">Open WhatsApp again</button><button class="btn-b w-100 justify-content-center mt-2" id="nb2">Start a new bag</button></div>`; $('#bf').innerHTML = '';
    $('#rw').onclick = () => goWA(lastRef, lastQuick ? null : getD()); $('#nb2').onclick = () => { store.set('ab', []); step = 'bag'; render() }
  }

  /* Custom creation: brief details -> WhatsApp */
  function customForm() {
    const el = $('#cc'); if (!el) return; const d = getD();
    el.innerHTML = `<p class="small">Tell us briefly what you have in mind. WhatsApp then opens with your request ready to send, and we will reply with ideas and a price.</p>
 <form id="ccf" class="fm" novalidate>${fld('What would you like us to make?', 'cw', 'ta', '', 1, 'e.g. a pair of Shubh Labh hangings in red and gold with my family name')}
 ${fld('Occasion or date needed', 'co2', 'text', '', 0, 'e.g. Diwali, a wedding on 5 December')}${fld('Budget', 'cb', 'text', '', 0, 'e.g. around 1500')}
 ${fld('Your name', 'cn', 'text', d.n, 1)}${fld('WhatsApp number', 'cp', 'tel', d.ph, 1, '10-digit mobile number')}
 <button class="btn-a w-100 justify-content-center" type="submit">Continue on WhatsApp</button></form>`;
    const f = $('#ccf'); f.onsubmit = e => {
      e.preventDefault(); const v = {};['cw', 'co2', 'cb', 'cn', 'cp'].forEach(k => v[k] = f.querySelector('#' + k).value.trim());
      const bad = {}; if (!v.cw) bad.cw = 'Please tell us what you would like.'; if (!v.cn) bad.cn = 'Please enter your name.'; if (!/^(\+?91)?[6-9]\d{9}$/.test(v.cp.replace(/[\s-]/g, ''))) bad.cp = 'Enter a valid 10-digit mobile number.';
      ['cw', 'cn', 'cp'].forEach(k => { const i = f.querySelector('#' + k); i.parentElement.querySelector('.err').textContent = bad[k] || ''; i.setAttribute('aria-invalid', !!bad[k]) });
      if (Object.keys(bad).length) { const first = f.querySelector('[aria-invalid=true]'); if (first) first.focus(); return }
      const x = [`What I'd like: ${v.cw}`]; if (v.co2) x.push(`Occasion / needed by: ${v.co2}`); if (v.cb) x.push(`Budget: ${v.cb}`);
      const text = `Hello AANGAN! I'd like to request a custom creation.\n\n${x.join('\n')}\n\nName: ${v.cn}\nWhatsApp: ${v.cp}\n\nPlease let me know what is possible. Thank you!`;
      window.AANGAN_TRACK && AANGAN_TRACK('custom_request_sent', { has_budget: !!v.cb, has_date: !!v.co2 });
      const u = wa(text), w = window.open(u, '_blank'); if (!w) location.href = u;
      el.innerHTML = `<div class="done"><h4>Almost there</h4><p>WhatsApp should have opened with your request ready. Send the message, and we will reply with ideas and a price.</p><button class="btn-a w-100 justify-content-center" id="ccw">Open WhatsApp again</button><button class="btn-b w-100 justify-content-center mt-2" id="ccn">Start a new request</button></div>`;
      $('#ccw').onclick = () => { const w2 = window.open(u, '_blank'); if (!w2) location.href = u }; $('#ccn').onclick = customForm
    }
  }
  /* Sale offers block */
  function saleRender() {
    const sec = $('#sale'); if (!sec) return; const l = P.filter(p => off(p)).sort((a, b) => off(b) - off(a) || (b.mrp - b.price) - (a.mrp - a.price));
    sec.hidden = !l.length; if (!l.length) return; $('#saleTop').textContent = CFG.salePercent || off(l[0]);
    const sl = $('#saleLabel span'); if (sl) sl.textContent = CFG.saleLabel; if (CFG.saleHeadline && $('#saleHead')) $('#saleHead').textContent = CFG.saleHeadline;
    const ss = $('#saleSub'); if (ss) ss.textContent = `${CFG.salePercent ? 'Flat ' + CFG.salePercent : 'Up to ' + off(l[0])}% off ${l.length == P.filter(p => p.price != null).length ? 'every handmade piece' : 'selected handmade pieces'}. The offer price is shown on each one.`;
    const su = $('.sale-num .up'); if (su) su.textContent = CFG.salePercent ? 'Flat' : 'Up to';
    $('#saleGrid').innerHTML = l.slice(0, 3).map(p => `<a class="stile" href="${purl(p)}"><div class="simg"><img src="${p.cardSrc || p.cardImage || p.image}"${p.cardSet ? ` srcset="${p.cardSet}" sizes="(min-width: 992px) 30vw, 50vw"` : ''} alt="${p.alt || p.name}" fetchpriority="high" decoding="async" width="${p.cardW || 600}" height="${p.cardH || 800}"></div><div class="scap"><h3>${p.name}</h3><div class="sp"><span class="now">${inrDisplay(p.price)}</span><s class="was">${inrWasDisplay(p.mrp)}</s></div><span class="soff">${off(p)}% off · Save ${inrDisplay(p.mrp - p.price)}</span></div></a>`).join('')
  }
  /* Shop: price filter + sort (dropdowns above the grid) */
  const S = { max: null, sort: 'featured' };
  function shopList() {
    const l = P.filter(p => (!shopCat || p.category == shopCat) && (S.max == null || (p.price != null && p.price < S.max)));
    const v = p => p.price == null ? Infinity : p.price;
    if (S.sort == 'lo') l.sort((a, b) => v(a) - v(b));
    if (S.sort == 'hi') l.sort((a, b) => (b.price == null ? -1 : b.price) - (a.price == null ? -1 : a.price));
    return l
  }
  function shopRender() {
    const el = $('#shopgrid'); if (!el) return; const l = shopList();
    const c = $('#pcount'); if (c) c.textContent = `${l.length} ${l.length == 1 ? 'piece' : 'pieces'}`;
    if (!l.length && P.length) { el.innerHTML = '<div class="empty"><h3>No pieces in this price range</h3><p>Choose a higher range to see more pieces.</p><button class="btn-b" id="clr">Show all prices</button></div>'; $('#clr').onclick = () => { S.max = null; $('#pf').value = ''; render() }; return }
    grid(el, l)
  }
  const pf = $('#pf'), so = $('#so');
  if (pf) pf.onchange = e => { S.max = e.target.value ? +e.target.value : null; render() };
  if (so) so.onchange = e => { S.sort = e.target.value; render() };
  function render() { saleRender(); grid($('#featured'), P.slice(0, 6)); shopRender(); grid($('#colgrid'), P.filter(p => p.category == document.body.dataset.cat)); bag(); document.dispatchEvent(new Event('aangan:render')) }
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-add],[data-buy],[data-inc],[data-dec],[data-rm]'); if (!t) return; let a = store.get('ab');
    const id = t.dataset.add || t.dataset.buy || t.dataset.inc;
    if (id && !(t.dataset.buy && a.includes(id))) a.push(id);
    if (t.dataset.dec) { const i = a.indexOf(t.dataset.dec); if (i > -1) a.splice(i, 1) }
    if (t.dataset.rm) a = a.filter(x => x != t.dataset.rm);
    store.set('ab', a); if (t.dataset.add) { step = 'bag'; open('bag') } if (t.dataset.buy) { step = 'bag'; open('bag') } render()
  });
  /* Collection preview (home) */
  const pv = $('.colprev'); if (pv) $$('.crow').forEach(r => { const set = () => { const img = $('img.pi', pv), bl = $('.blank', pv); if (r.dataset.img) { img.src = r.dataset.img; img.hidden = false; bl.hidden = true } else { img.hidden = true; bl.hidden = false } $$('.crow').forEach(x => x.classList.toggle('on', x == r)) }; r.addEventListener('mouseenter', set); r.addEventListener('focus', set) });
  /* Forms (demo — no backend) */
  $$('form[data-demo]').forEach(f => {
    f.noValidate = true; f.onsubmit = e => {
      e.preventDefault(); let bad = 0;
      $$('[required]', f).forEach(i => {
        const er = i.parentElement.querySelector('.err'); let m = '';
        if (!i.value.trim()) m = 'Please fill in this field.'; else if (i.type == 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(i.value)) m = 'Enter a valid email address.';
        er.textContent = m; i.setAttribute('aria-invalid', !!m); if (m) bad++
      });
      const s = $('.status', f); s.className = 'status note' + (bad ? '' : ' ok'); s.setAttribute('role', 'alert');
      s.textContent = bad ? 'Please correct the highlighted fields.' : 'Demo only: your details are valid, but nothing was sent. Connect a form service (e.g. Formspree) to receive enquiries.';
      if (!bad) f.reset()
    }
  });
  if ('IntersectionObserver' in window) { const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target) } }), { threshold: .1 }); $$('.rv').forEach(n => io.observe(n)) } else $$('.rv').forEach(n => n.classList.add('in'));
  render();
  fillDelivery();
  window.AANGAN = { card, store, inr, inrWas, inrDisplay, inrWasDisplay, was, offer, off, purl, fillDelivery };
})();
