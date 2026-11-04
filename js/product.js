/* Product detail page */
(function () {
    const A = window.AANGAN, P = window.AANGAN_PRODUCTS, C = window.AANGAN_COLLECTIONS, el = document.getElementById('pdp');
    const id = window.AANGAN_PID || new URLSearchParams(location.search).get('id'), p = P.find(x => x.id == id);
    /* old product.html?id= links move to the product's own address (keeps one address per product for Google) */
    if (!window.AANGAN_PID && p && p.url && /^https?:/.test(location.protocol)) { location.replace(new URL(p.url, document.baseURI).href); return }
    function draw() {
        if (!p) { el.innerHTML = '<div class="empty"><h3>We could not find that piece</h3><p>It may have been moved or is no longer listed.</p><a class="btn-a" href="index.html">Back to shop</a></div>'; return }
        document.title = p.name + ' | AANGAN';
        const rel = (p.related || []).map(i => P.find(x => x.id == i)).filter(Boolean);
        if (rel.length < 4) rel.push(...P.filter(x => x.id != p.id && !rel.includes(x)).slice(0, 4 - rel.length));
        el.innerHTML = `<nav class="crumb" aria-label="Breadcrumb"><a href="index.html">Shop</a> / ${p.name}</nav>
 <div class="pdp-grid"><div class="pdp-img" role="button" tabindex="0" aria-label="Zoom product image"><img src="${p.detailSrc || p.image}"${p.detailSet ? ` srcset="${p.detailSet}" sizes="(min-width: 992px) 50vw, 100vw"` : ''} alt="${p.alt}"${p.zoomSrc ? ` data-zoom="${p.zoomSrc}"` : ''} width="${p.detailW || 1086}" height="${p.detailH || 1448}" fetchpriority="high"></div>
 <div class="pdp"><h1>${p.name}</h1><p class="price">${A.inrDisplay(p.price)} ${A.was(p)} ${A.offer(p)}</p>${A.off(p) ? `<p class="save">You save ${A.inrDisplay(p.mrp - p.price)}</p>` : ''}<div class="dlv" data-dlv hidden></div><div class="live" data-live="${p.id}" hidden></div>
 <p class="mt-4">${p.desc}</p>
 <div class="ctas">${p.available === false ? '<span class="note">Currently unavailable</span>' : `<button class="btn-b" data-add="${p.id}">Add to bag</button><button class="btn-a" data-buy="${p.id}">Buy now</button>`}</div>
 <div class="acc mt-4">${Object.keys(p.details || {}).length ? `<details open><summary>Details</summary><dl>${Object.entries(p.details).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl></details>` : ''}
 ${p.care && p.care.length ? `<details><summary>Care</summary>${Array.isArray(p.care) ? `<ul>${p.care.map(c => `<li>${c}</li>`).join('')}</ul>` : `<p>${p.care}</p>`}</details>` : ''}${p.dispatch ? `<details><summary>Dispatch</summary><p>${p.dispatch}</p></details>` : ''}</div>
 ${p.dummy ? '<p class="small mt-3 sample">Sample listing details for preview. Replace in js/products.js.</p>' : ''}</div></div>
 <div class="mt-5 pt-5 look"><h2 class="mb-2">Complete the look</h2><p class="mb-5 look-sub">Pieces made to go with this one.</p><div class="row g-4">${rel.map(x => `<div class="col-6 col-lg-3">${A.card(x)}</div>`).join('')}</div></div>`
    }
    draw();
    if (A.fillDelivery) A.fillDelivery();
    const zoom = document.createElement('dialog');
    zoom.className = 'image-zoom';
    zoom.innerHTML = '<div class="image-zoom-stage" tabindex="-1"><img alt=""></div>';
    document.body.appendChild(zoom);
    const zoomImage = zoom.querySelector('img');
    const zoomStage = zoom.querySelector('.image-zoom-stage');
    const minZoom = 1, maxZoom = 4;
    const pointers = new Map();
    let zoomScale = 1, offsetX = 0, offsetY = 0, dragX = 0, dragY = 0;
    let pinchDistance = 0, pinchScale = 1;
    const updateZoom = () => {
        const maxX = zoomImage.offsetWidth * (zoomScale - 1) / 2;
        const maxY = zoomImage.offsetHeight * (zoomScale - 1) / 2;
        offsetX = Math.max(-maxX, Math.min(maxX, offsetX));
        offsetY = Math.max(-maxY, Math.min(maxY, offsetY));
        zoomImage.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(${zoomScale})`;
        zoomImage.classList.toggle('is-zoomed', zoomScale > 1);
    };
    const zoomAt = (clientX, clientY, nextScale) => {
        const bounds = zoomStage.getBoundingClientRect();
        const pointX = clientX - bounds.left - bounds.width / 2;
        const pointY = clientY - bounds.top - bounds.height / 2;
        const imageX = (pointX - offsetX) / zoomScale;
        const imageY = (pointY - offsetY) / zoomScale;
        zoomScale = Math.max(minZoom, Math.min(maxZoom, nextScale));
        offsetX = pointX - imageX * zoomScale;
        offsetY = pointY - imageY * zoomScale;
        updateZoom();
    };
    const pointerDistance = () => {
        const [first, second] = [...pointers.values()];
        return Math.hypot(second.x - first.x, second.y - first.y);
    };
    const openZoom = image => {
        zoomImage.src = image.currentSrc || image.src;   // show the photo already on screen straight away
        zoomImage.alt = image.alt;
        const full = image.dataset.zoom;                   // then swap in the full-detail photo once it has loaded
        if (full && !zoomImage.src.endsWith(full)) {
            const hi = new Image();
            hi.onload = () => { if (zoom.open) { zoomImage.src = full; } };
            hi.src = full;
        }
        zoomScale = 1;
        offsetX = 0;
        offsetY = 0;
        zoomImage.onload = updateZoom;
        zoom.showModal();
        updateZoom();
        zoomStage.focus({ preventScroll: true });
    };
    el.addEventListener('click', event => {
        const trigger = event.target.closest('.pdp-img[role="button"]');
        if (trigger) openZoom(trigger.querySelector('img'));
    });
    el.addEventListener('keydown', event => {
        const trigger = event.target.closest('.pdp-img[role="button"]');
        if (trigger && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            openZoom(trigger.querySelector('img'));
        }
    });
    zoomStage.addEventListener('pointerdown', event => {
        if (event.target !== zoomImage) return;
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        zoomStage.setPointerCapture(event.pointerId);
        dragX = event.clientX - offsetX;
        dragY = event.clientY - offsetY;
        if (pointers.size === 2) {
            pinchDistance = pointerDistance();
            pinchScale = zoomScale;
        } else if (zoomScale > minZoom) {
            zoomImage.classList.add('is-dragging');
        }
    });
    zoomStage.addEventListener('pointermove', event => {
        if (!zoomStage.hasPointerCapture(event.pointerId)) return;
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pointers.size >= 2) {
            const [first, second] = [...pointers.values()];
            const midpointX = (first.x + second.x) / 2;
            const midpointY = (first.y + second.y) / 2;
            zoomAt(midpointX, midpointY, pinchScale * pointerDistance() / pinchDistance);
        } else if (zoomScale > minZoom) {
            offsetX = event.clientX - dragX;
            offsetY = event.clientY - dragY;
            updateZoom();
        }
    });
    const stopDragging = event => {
        if (zoomStage.hasPointerCapture(event.pointerId)) zoomStage.releasePointerCapture(event.pointerId);
        pointers.delete(event.pointerId);
        if (pointers.size === 1) {
            const remaining = [...pointers.values()][0];
            dragX = remaining.x - offsetX;
            dragY = remaining.y - offsetY;
        }
        zoomImage.classList.remove('is-dragging');
    };
    zoomStage.addEventListener('pointerup', stopDragging);
    zoomStage.addEventListener('pointercancel', stopDragging);
    zoomStage.addEventListener('wheel', event => {
        event.preventDefault();
        zoomAt(event.clientX, event.clientY, zoomScale * Math.exp(-event.deltaY * 0.002));
    }, { passive: false });
    zoomStage.addEventListener('dblclick', event => {
        zoomAt(event.clientX, event.clientY, zoomScale === minZoom ? 2 : minZoom);
    });
    zoom.addEventListener('keydown', event => {
        const step = 40;
        if (event.key === '+' || event.key === '=') zoomAt(innerWidth / 2, innerHeight / 2, zoomScale * 1.25);
        else if (event.key === '-' || event.key === '_') zoomAt(innerWidth / 2, innerHeight / 2, zoomScale / 1.25);
        else if (event.key === '0') {
            zoomScale = minZoom;
            offsetX = 0;
            offsetY = 0;
            updateZoom();
        } else if (event.key.startsWith('Arrow') && zoomScale > minZoom) {
            event.preventDefault();
            if (event.key === 'ArrowLeft') offsetX += step;
            if (event.key === 'ArrowRight') offsetX -= step;
            if (event.key === 'ArrowUp') offsetY += step;
            if (event.key === 'ArrowDown') offsetY -= step;
            updateZoom();
        } else return;
        event.preventDefault();
    });
    zoom.addEventListener('click', event => {
        if (event.target === zoom || event.target === zoomStage) zoom.close();
    });
    document.dispatchEvent(new Event('aangan:render'));
})();
