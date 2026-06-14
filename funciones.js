// ===== STATE =====
function loadCart() {
  try {
    const raw = localStorage.getItem('bubalu-cart');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveCart() {
  try {
    localStorage.setItem('bubalu-cart', JSON.stringify(cart));
  } catch (error) {
    // Ignore storage failures so the UI still works in restricted contexts.
  }
}

let cart = loadCart();
let designerBasePrice = 4000;
let designerModel = 'basica';
let selectedColorName = 'Blanco';

const garmentColors = [
  {id:'blanco', hex:'#ffffff', n:'Blanco'},
  {id:'negro', hex:'#1a1a1a', n:'Negro'},
  {id:'rojo', hex:'#d32f2f', n:'Rojo'},
  {id:'azul', hex:'#1a237e', n:'Azul'},
  {id:'amarillo', hex:'#f9c23c', n:'Amarillo'},
  {id:'verde', hex:'#2e7d32', n:'Verde'},
  {id:'burdeo', hex:'#800020', n:'Burdeo'},
  {id:'gris', hex:'#888888', n:'Gris'},
];

const textColors = ['#000000','#ffffff','#d32f2f','#1a237e','#f9c23c','#e21b79','#2e7d32','#ff6f00'];
const garmentPreviewMap = {
  basica: 'img/polera-basica-base2.png',
  oversize: 'img/polera-oversize-base.png',
  acidwash: 'img/polo-acidwash.png',
  canguro: 'img/poleron-canguro-base.png',
  polo_sc: 'img/poleron-polo-base.png',
};

let selectedDesignElement = null;

function escapeHTML(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getDesignArea() {
  return byId('design-area');
}

function clearSelectedDesignElement() {
  document.querySelectorAll('.design-layer.selected').forEach(el => el.classList.remove('selected'));
}

function isCustomDesignLayer(el) {
  return Boolean(el && el.dataset && el.dataset.userLayer === 'true');
}

function selectDesignElement(el) {
  if (!el) return;
  selectedDesignElement = el;
  clearSelectedDesignElement();
  el.classList.add('selected');
}

function getSelectedTextElement() {
  if (selectedDesignElement && selectedDesignElement.dataset.layerType === 'text') {
    return selectedDesignElement;
  }
  return byId('text-wrap');
}

function getSelectedImageElement() {
  if (selectedDesignElement && selectedDesignElement.dataset.layerType === 'image') {
    return selectedDesignElement;
  }
  return byId('logo-wrap');
}

function attachDesignLayer(el) {
  if (!el) return;
  el.addEventListener('mousedown', () => selectDesignElement(el));
  el.addEventListener('touchstart', () => selectDesignElement(el), { passive: true });
  makeDraggable(el);
}

function createTextLayer(initialText = 'TU TEXTO') {
  const area = getDesignArea();
  if (!area) return null;
  const baseText = byId('text-wrap');
  if (baseText) {
    baseText.style.display = 'none';
  }
  const layer = document.createElement('div');
  layer.className = 'draggable-el design-layer selected';
  layer.dataset.layerType = 'text';
  layer.dataset.userLayer = 'true';
  layer.style.top = '190px';
  layer.style.left = '110px';
  layer.innerHTML = `
    <span class="design-layer-content" style="font-size:28px; white-space:nowrap; display:block; font-family:'Bebas Neue'; color:#000; letter-spacing:1px;">${escapeHTML(initialText)}</span>
    <div class="resizer"></div>
  `;
  area.appendChild(layer);
  attachDesignLayer(layer);
  selectDesignElement(layer);
  const textInput = byId('designer-text-input');
  if (textInput) textInput.value = initialText;
  updateDesignCalc();
  return layer;
}

function createImageLayer(src, alt = 'Imagen') {
  const area = getDesignArea();
  if (!area || !src) return null;
  const baseImage = byId('logo-wrap');
  if (baseImage) {
    baseImage.style.display = 'none';
  }
  const layer = document.createElement('div');
  layer.className = 'draggable-el design-layer selected';
  layer.dataset.layerType = 'image';
  layer.dataset.userLayer = 'true';
  layer.style.top = '120px';
  layer.style.left = '120px';
  layer.style.width = '130px';
  layer.innerHTML = `
    <img class="design-layer-content" src="${src}" alt="${escapeHTML(alt)}" style="width:100%; display:block; pointer-events:none; border-radius:4px;">
    <div class="resizer"></div>
  `;
  area.appendChild(layer);
  attachDesignLayer(layer);
  selectDesignElement(layer);
  updateDesignCalc();
  return layer;
}

function triggerImageUpload() {
  const input = byId('designer-image-input');
  if (input) input.click();
}

function handleDesignImageUpload(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = event => {
      createImageLayer(event.target.result, input.files[0].name);
      input.value = '';
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function deleteSelectedDesignElement() {
  if (!isCustomDesignLayer(selectedDesignElement)) {
    showToast('Selecciona un texto o imagen agregada para eliminarlo');
    return false;
  }

  const removedLayer = selectedDesignElement;
  const layerType = removedLayer.dataset.layerType;
  removedLayer.remove();
  selectedDesignElement = null;
  clearSelectedDesignElement();

  if (layerType === 'text') {
    const textInput = byId('designer-text-input');
    const textRender = byId('text-render');
    if (textInput) textInput.value = '';
    if (textRender) textRender.textContent = 'TU TEXTO';
    const baseText = byId('text-wrap');
    if (baseText) baseText.style.display = 'none';
  }

  if (layerType === 'image') {
    const baseImage = byId('logo-wrap');
    const basePreview = byId('logo-preview');
    if (baseImage) baseImage.style.display = 'none';
    if (basePreview) basePreview.removeAttribute('src');
  }

  const fallback = layerType === 'image' ? byId('logo-wrap') : byId('text-wrap');
  if (fallback) selectDesignElement(fallback);
  updateDesignCalc();
  return true;
}

function byId(id) {
  return document.getElementById(id);
}

function hasEl(id) {
  return Boolean(byId(id));
}

function showPage(page) {
  const target = byId('page-' + page);
  if (target) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    target.classList.add('active');
    const pageNav = byId('page-nav');
    if (pageNav) pageNav.style.display = page === 'home' ? 'none' : 'flex';
    document.querySelectorAll('.page-tab').forEach(t => t.classList.remove('active'));
    if (page !== 'home') {
      const tab = byId('tab-' + page);
      if (tab) tab.classList.add('active');
    }
    window.scrollTo(0, 0);
    return;
  }

  const routes = {
    home: 'index.html',
    catalog: 'tienda.html',
    tienda: 'tienda.html',
    designer: 'personalizador.html',
    personalizador: 'personalizador.html',
    contact: 'contacto.html',
    contacto: 'contacto.html',
    cart: 'carrito.html',
    carrito: 'carrito.html',
  };
  window.location.href = routes[page] || 'index.html';
}

function filterCatalog(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.querySelectorAll('.product-card').forEach(card => {
    card.style.display = (cat === 'all' || card.dataset.cat === cat) ? '' : 'none';
  });
}

function openCart() {
  const overlay = byId('cart-overlay');
  if (overlay) {
    overlay.classList.add('open');
    return;
  }
  window.location.href = 'cart-sidebar.html';
}

function closeCart(e) {
  const overlay = byId('cart-overlay');
  if (!overlay) return;
  if (!e || e.target === overlay) {
    overlay.classList.remove('open');
  }
}

function closeCartBtn() {
  const overlay = byId('cart-overlay');
  if (overlay) overlay.classList.remove('open');
}

function addToCart(name, price, emoji) {
  const existing = cart.find(i => i.name === name);
  if (existing) existing.qty++;
  else cart.push({ name, price, emoji, qty: 1 });
  updateCart();
  openCart();
  showToast('✅ ' + name + ' agregado al carrito');
}

function updateCart() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const countEl = byId('cart-count');
  if (countEl) countEl.textContent = count;

  saveCart();

  const itemsEl = byId('cart-items');
  const emptyEl = byId('cart-empty');
  if (!itemsEl || !emptyEl) return;

  if (cart.length === 0) {
    emptyEl.style.display = '';
    itemsEl.querySelectorAll('.cart-item').forEach(e => e.remove());
  } else {
    emptyEl.style.display = 'none';
    itemsEl.querySelectorAll('.cart-item').forEach(e => e.remove());
    cart.forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <div class="cart-item-img">${item.emoji}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-detail">Talla: L · Color: Blanco</div>
          <div class="cart-item-price">$${(item.price * item.qty).toLocaleString('es-CL')}</div>
          <div class="cart-item-qty">
            <button class="qty-btn" onclick="changeQty(${idx}, -1)">−</button>
            <span style="font-weight:700; font-size:0.9rem;">${item.qty}</span>
            <button class="qty-btn" onclick="changeQty(${idx}, 1)">+</button>
            <button class="qty-btn" onclick="removeItem(${idx})" style="margin-left:5px; font-size:0.75rem;">✕</button>
          </div>
        </div>
      `;
      itemsEl.appendChild(div);
    });
  }

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const subtotalEl = byId('cart-subtotal');
  const totalEl = byId('cart-total-price');
  if (subtotalEl) subtotalEl.textContent = '$' + total.toLocaleString('es-CL');
  if (totalEl) totalEl.textContent = '$' + total.toLocaleString('es-CL');
}

function initCheckoutPage() {
  const summaryEl = byId('co-summary-items');
  const totalEl = byId('co-total');
  const countEl = byId('cart-count');
  if (!summaryEl || !totalEl) return;

  summaryEl.innerHTML = '';
  let total = 0;

  if (cart.length === 0) {
    const emptyRow = document.createElement('div');
    emptyRow.className = 'summary-row';
    emptyRow.innerHTML = '<span>Tu carrito está vacío</span><span>$0</span>';
    summaryEl.appendChild(emptyRow);
  } else {
    cart.forEach(item => {
      const div = document.createElement('div');
      div.className = 'summary-row';
      div.innerHTML = `<span>${item.emoji} ${item.name} ×${item.qty}</span><span>$${(item.price * item.qty).toLocaleString('es-CL')}</span>`;
      summaryEl.appendChild(div);
      total += item.price * item.qty;
    });
  }

  totalEl.textContent = '$' + total.toLocaleString('es-CL');
  if (countEl) countEl.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
}

function changeQty(idx, delta) {
  if (!cart[idx]) return;
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  updateCart();
}

function removeItem(idx) {
  cart.splice(idx, 1);
  updateCart();
}

function clearCart() {
  cart = [];
  updateCart();
}

function openCheckout() {
  const modal = byId('checkout-modal');
  if (!modal) {
    window.location.href = 'checkout.html';
    return;
  }
  closeCartBtn();
  const formView = byId('checkout-form-view');
  const successView = byId('checkout-success-view');
  if (formView) formView.style.display = '';
  if (successView) successView.style.display = 'none';

  const summaryEl = byId('co-summary-items');
  if (summaryEl) {
    summaryEl.innerHTML = '';
    let total = 0;
    cart.forEach(item => {
      const div = document.createElement('div');
      div.className = 'summary-row';
      div.innerHTML = `<span>${item.emoji} ${item.name} ×${item.qty}</span><span>$${(item.price * item.qty).toLocaleString('es-CL')}</span>`;
      summaryEl.appendChild(div);
      total += item.price * item.qty;
    });
    const totalEl = byId('co-total');
    if (totalEl) totalEl.textContent = '$' + total.toLocaleString('es-CL');
  }
  modal.classList.add('open');
}

function openDesignOrder() {
  let qty = 0;
  document.querySelectorAll('.size-input').forEach(i => qty += parseInt(i.value, 10) || 0);
  if (qty === 0) {
    showToast('⚠️ Agrega al menos 1 prenda');
    return;
  }

  const designArea = getDesignArea();
  const hasDesign = Boolean(designArea && Array.from(designArea.querySelectorAll('.design-layer')).some(layer => layer.style.display !== 'none'));
  const imp = hasDesign ? 3500 : 0;
  const total = (designerBasePrice + imp) * qty;

  cart = [{ name: 'Polera personalizada (' + designerModel + ')', price: designerBasePrice + imp, emoji: '🎨', qty }];
  updateCart();

  const modal = byId('checkout-modal');
  const formView = byId('checkout-form-view');
  const successView = byId('checkout-success-view');
  if (!modal) {
    window.location.href = 'checkout.html';
    return;
  }
  if (formView) formView.style.display = '';
  if (successView) successView.style.display = 'none';

  const summaryEl = byId('co-summary-items');
  if (summaryEl) {
    summaryEl.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'summary-row';
    div.innerHTML = `<span>🎨 Prenda personalizada ×${qty}</span><span>$${total.toLocaleString('es-CL')}</span>`;
    summaryEl.appendChild(div);
    if (hasDesign) {
      const div2 = document.createElement('div');
      div2.className = 'summary-row';
      div2.innerHTML = `<span style="color:var(--text-muted); font-size:0.8rem;">  ↳ Incluye estampado DTF</span><span style="font-size:0.8rem;">$${(imp * qty).toLocaleString('es-CL')}</span>`;
      summaryEl.appendChild(div2);
    }
  }
  const totalEl = byId('co-total');
  if (totalEl) totalEl.textContent = '$' + total.toLocaleString('es-CL');
  modal.classList.add('open');
}

function confirmOrder() {
  const nameEl = byId('co-fname');
  const emailEl = byId('co-email');
  if (!nameEl || !emailEl) return;
  if (!nameEl.value || !emailEl.value) {
    showToast('⚠️ Completa tu nombre y correo para continuar');
    return;
  }
  const formView = byId('checkout-form-view');
  const successView = byId('checkout-success-view');
  if (formView) formView.style.display = 'none';
  if (successView) successView.style.display = '';
  const orderNum = byId('order-num');
  if (orderNum) orderNum.textContent = Math.floor(Math.random() * 9000 + 1000);
}

function closeModal(id) {
  const modal = byId(id);
  if (modal) modal.classList.remove('open');
}

function selectModel(model, price, btn) {
  designerModel = model;
  designerBasePrice = price;
  document.querySelectorAll('.model-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const garmentImage = byId('garment-image');
  if (garmentImage) {
    garmentImage.src = garmentPreviewMap[model] || garmentPreviewMap.basica;
    garmentImage.alt = model;
    garmentImage.style.filter = 'none';
  }
  const defaultLayer = byId('logo-wrap');
  if (defaultLayer) selectDesignElement(defaultLayer);
  updateDesignCalc();
}

function initColorPicker() {
  const cp = byId('color-picker');
  if (!cp) return;
  cp.innerHTML = '';
  garmentColors.forEach((c, i) => {
    const dot = document.createElement('div');
    dot.className = 'color-dot' + (i === 0 ? ' active' : '');
    dot.style.background = c.hex;
    if (c.id === 'blanco') dot.style.border = '3px solid #ddd';
    const tt = document.createElement('div');
    tt.className = 'dot-tooltip';
    tt.textContent = c.n;
    dot.appendChild(tt);
    dot.onclick = () => {
      selectedColorName = c.n;
      document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      const bg = byId('garment-bg');
      const garmentImage = byId('garment-image');
      if (bg) bg.style.background = 'none';
      if (!garmentImage) return;
      const filterMap = {
        negro: 'brightness(0)',
        rojo: 'sepia(1) saturate(5) hue-rotate(320deg)',
        azul: 'sepia(1) saturate(3) hue-rotate(200deg)',
        amarillo: 'sepia(1) saturate(5) hue-rotate(20deg)',
        verde: 'sepia(1) saturate(3) hue-rotate(90deg)',
        burdeo: 'sepia(1) saturate(4) hue-rotate(295deg)',
        gris: 'grayscale(1) brightness(0.7)',
        blanco: 'none',
      };
      garmentImage.style.filter = filterMap[c.id] || 'none';
      updateDesignCalc();
    };
    cp.appendChild(dot);
  });
}

function initTextColors() {
  const el = byId('text-colors');
  if (!el) return;
  el.innerHTML = '';
  textColors.forEach(hex => {
    const dot = document.createElement('div');
    dot.style.cssText = `width:28px; height:28px; border-radius:50%; background:${hex}; cursor:pointer; border:3px solid transparent; box-shadow:0 0 0 1px rgba(0,0,0,0.12); transition:all 0.15s; flex-shrink:0;`;
    if (hex === '#ffffff') dot.style.boxShadow = '0 0 0 1.5px #ccc';
    dot.onclick = () => {
      const textLayer = getSelectedTextElement();
      const textRender = textLayer ? textLayer.querySelector('.design-layer-content') || byId('text-render') : byId('text-render');
      if (textRender) textRender.style.color = hex;
      el.querySelectorAll('div').forEach(d => d.style.borderColor = 'transparent');
      dot.style.borderColor = '#e21b79';
    };
    el.appendChild(dot);
  });
}

function handleLogo(input) {
  if (input.files && input.files[0]) {
    const r = new FileReader();
    r.onload = e => {
      const wrap = getSelectedImageElement();
      const preview = wrap ? wrap.querySelector('img') : byId('logo-preview');
      if (preview) preview.src = e.target.result;
      if (wrap) {
        wrap.style.display = 'block';
        selectDesignElement(wrap);
      }
      updateDesignCalc();
    };
    r.readAsDataURL(input.files[0]);
  }
}

function handleText(v) {
  let textWrap = getSelectedTextElement();
  if (!textWrap || textWrap.dataset.layerType !== 'text') {
    textWrap = byId('text-wrap');
  }
  const textRender = textWrap ? textWrap.querySelector('.design-layer-content') || byId('text-render') : byId('text-render');
  if (textRender) textRender.textContent = v || 'TU TEXTO';
  if (textWrap) {
    textWrap.style.display = v ? 'block' : 'none';
    if (v) selectDesignElement(textWrap);
  }
  updateDesignCalc();
}

function setFont(f) {
  const textWrap = getSelectedTextElement();
  const textRender = textWrap ? textWrap.querySelector('.design-layer-content') || byId('text-render') : byId('text-render');
  if (textRender) textRender.style.fontFamily = f;
}

function setTextSize(v) {
  const textWrap = getSelectedTextElement();
  const textRender = textWrap ? textWrap.querySelector('.design-layer-content') || byId('text-render') : byId('text-render');
  const sizeLabel = byId('size-label');
  if (textRender) textRender.style.fontSize = v + 'px';
  if (sizeLabel) sizeLabel.textContent = v + 'px';
}

function moveElement(id, top, left) {
  const el = byId(id);
  if (!el) return;
  el.style.top = top;
  el.style.left = left;
}

function updateDesignCalc() {
  const baseEl = byId('d-price-base');
  const impEl = byId('d-price-imp');
  const qtyEl = byId('d-qty');
  const totalEl = byId('d-total');
  if (!baseEl || !impEl || !qtyEl || !totalEl) return;

  let qty = 0;
  document.querySelectorAll('.size-input').forEach(i => qty += parseInt(i.value, 10) || 0);
  const designArea = getDesignArea();
  const hasDesign = Boolean(designArea && Array.from(designArea.querySelectorAll('.design-layer')).some(layer => layer.style.display !== 'none'));
  const imp = hasDesign ? 3500 : 0;
  baseEl.textContent = '$' + designerBasePrice.toLocaleString('es-CL');
  impEl.textContent = imp > 0 ? '$' + imp.toLocaleString('es-CL') : '$0';
  qtyEl.textContent = qty + ' unid.';
  totalEl.textContent = '$' + ((designerBasePrice + imp) * qty).toLocaleString('es-CL');
}

function makeDraggable(el) {
  if (!el) return;
  let isDrag = false, isResize = false, sx, sy, sw, sl, st;
  const resizer = el.querySelector('.resizer');
  const onStart = e => {
    const c = e.touches ? e.touches[0] : e;
    if (resizer && e.target === resizer) isResize = true; else isDrag = true;
    sx = c.clientX; sy = c.clientY;
    sw = el.offsetWidth; sl = el.offsetLeft; st = el.offsetTop;
    e.preventDefault();
  };
  const onMove = e => {
    if (!isDrag && !isResize) return;
    const c = e.touches ? e.touches[0] : e;
    if (isDrag) {
      el.style.left = (sl + c.clientX - sx) + 'px';
      el.style.top = (st + c.clientY - sy) + 'px';
    }
    if (isResize) {
      const nw = sw + c.clientX - sx;
      if (nw > 40) el.style.width = nw + 'px';
    }
    updateDesignCalc();
  };
  const onEnd = () => { isDrag = false; isResize = false; };
  el.addEventListener('mousedown', onStart);
  el.addEventListener('touchstart', onStart, { passive: false });
  document.addEventListener('mousemove', onMove);
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('mouseup', onEnd);
  document.addEventListener('touchend', onEnd);
}

function showToast(msg) {
  const t = byId('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  cart = loadCart();
  initColorPicker();
  initTextColors();
  attachDesignLayer(byId('logo-wrap'));
  attachDesignLayer(byId('text-wrap'));
  if (byId('text-wrap')) selectDesignElement(byId('text-wrap'));
  document.querySelectorAll('.size-input').forEach(i => i.addEventListener('input', updateDesignCalc));
  document.addEventListener('keydown', e => {
    if (e.key !== 'Delete' && e.key !== 'Backspace') return;
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;
    deleteSelectedDesignElement();
  });
  updateDesignCalc();
  updateCart();
  initCheckoutPage();
});
