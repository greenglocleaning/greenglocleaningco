/**
 * GreenGlo Clickable Images
 * Maps every service image across the site to its checkout/booking page.
 * Injects click handlers + hover overlays automatically.
 */

(function () {

  // ── Service map: filename → { title, serviceId, isHourly } ─────────────────
  const IMAGE_SERVICE_MAP = {
    'bathroom.png':      { title: 'Bathroom Deep Clean',        serviceId: 5,  isHourly: false },
    'kitchen.png':       { title: 'Kitchen Deep Clean',         serviceId: 3,  isHourly: false },
    'carpet.png':        { title: 'Carpet Cleaning',            serviceId: 7,  isHourly: false },
    'afterbuilders.png': { title: 'After Builders Cleaning',    serviceId: 11, isHourly: false },
    'domestic.png':      { title: 'Regular Domestic Clean',     serviceId: 8,  isHourly: false },
    'deep.png':          { title: 'One-Off Deep Clean',         serviceId: 9,  isHourly: false },
    'tenancy.png':       { title: 'End of Tenancy Cleaning',    serviceId: 6,  isHourly: false },
    'ovenafter.png':     { title: 'Oven Deep Clean',            serviceId: 4,  isHourly: false },
    'furniture.png':     { title: 'Upholstery Cleaning',        serviceId: 12, isHourly: false },
    'patio.png':         { title: 'Patio & Decking Cleaning',   serviceId: 13, isHourly: false },
    'office.png':        { title: 'Office Cleaning',            serviceId: 2,  isHourly: true  },
    'commercial.png':    { title: 'Commercial Cleaning',        serviceId: 14, isHourly: true  },
    'windows.png':       { title: 'Window Cleaning',            serviceId: 10, isHourly: false },
    'emergency.png':     { title: 'Emergency Cleaning',         serviceId: null, isHourly: true },
    'flooring.png':      { title: 'Property Maintenance',       serviceId: null, isHourly: true },
    'turf.png':          { title: 'Garden Maintenance',         serviceId: null, isHourly: true },
    'livingroom.png':    { title: 'Regular Domestic Clean',     serviceId: 8,  isHourly: false },
  };

  const WHATSAPP_NUMBER = '447827784204';

  // ── Resolve the filename from a src string ─────────────────────────────────
  function getFilename(src) {
    if (!src) return null;
    return src.split('/').pop().split('?')[0].toLowerCase();
  }

  // ── Resolve the filename from a CSS background-image string ───────────────
  function getBgFilename(el) {
    const bg = getComputedStyle(el).backgroundImage;
    const match = bg && bg.match(/url\(["']?([^"')]+)["']?\)/i);
    return match ? getFilename(match[1]) : null;
  }

  // ── Build the checkout URL for a bookable (non-hourly) service ─────────────
  function buildCheckoutUrl(service) {
    const price  = service.basePrice || 0;
    const deposit = (Math.round(price * 25) / 100).toFixed(2);
    const balance = (price - parseFloat(deposit)).toFixed(2);
    const ref = 'GG' + Date.now().toString().slice(-8);

    const p = new URLSearchParams({
      ref,
      service: service.title,
      price,
      deposit,
      balance,
      date: '',
      time: '',
      bedrooms: '',
      name: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
    });
    return 'services.html#book-' + service.serviceId;
  }

  // ── Build a WhatsApp URL for hourly/quote services ─────────────────────────
  function buildWhatsAppUrl(title) {
    const msg = `Hello GreenGlo Cleaners, I'm interested in ${title}. Please provide more information.`;
    return `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(msg)}`;
  }

  // ── Create a subtle hover overlay ──────────────────────────────────────────
  function createOverlay(label, isHourly) {
    const overlay = document.createElement('div');
    overlay.className = 'gg-click-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    const icon  = isHourly ? 'fa-whatsapp fab' : 'fa-calendar-check fas';
    const badge = document.createElement('div');
    badge.className = 'gg-click-badge';
    badge.innerHTML = `<i class="${icon}"></i> ${isHourly ? 'Get Quote' : 'Book Now'}`;

    overlay.appendChild(badge);
    return overlay;
  }

  // ── Inject styles once ─────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('gg-clickable-styles')) return;
    const style = document.createElement('style');
    style.id = 'gg-clickable-styles';
    style.textContent = `
      .gg-clickable-img {
        position: relative;
        cursor: pointer;
        overflow: hidden;
        display: block; /* ensure block so overlay can fill it */
      }
      .gg-clickable-img img {
        transition: transform 0.4s ease, filter 0.4s ease;
        display: block;
        width: 100%;
      }
      .gg-clickable-img:hover img {
        transform: scale(1.04);
        filter: brightness(0.82);
      }
      /* For div-based background images */
      .gg-clickable-bg {
        cursor: pointer;
        position: relative;
        overflow: hidden;
      }
      .gg-clickable-bg:hover {
        filter: brightness(0.9);
      }
      /* Overlay badge */
      .gg-click-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: flex-end;
        padding: 12px;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s ease;
        background: linear-gradient(to top, rgba(6,95,70,0.7) 0%, transparent 60%);
        z-index: 5;
      }
      .gg-clickable-img:hover .gg-click-overlay,
      .gg-clickable-bg:hover .gg-click-overlay {
        opacity: 1;
      }
      .gg-click-badge {
        background: rgba(16,185,129,0.92);
        color: white;
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.4px;
        font-family: 'Montserrat', sans-serif;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 6px;
      }
      /* Pulse on hover for extra affordance */
      .gg-clickable-img:hover,
      .gg-clickable-bg:hover {
        box-shadow: 0 0 0 3px rgba(16,185,129,0.4);
        border-radius: inherit;
      }
    `;
    document.head.appendChild(style);
  }

  // ── Make a wrapper div (for <img> elements) clickable ──────────────────────
  function wrapImg(img, service) {
    const parent = img.parentElement;
    if (!parent) return;

    // Already wrapped?
    if (parent.classList.contains('gg-clickable-img')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'gg-clickable-img';
    wrapper.style.borderRadius = getComputedStyle(parent).borderRadius || '0';

    // Copy relevant parent styles that affect layout
    const cs = getComputedStyle(img);
    wrapper.style.height = img.style.height || '';

    parent.insertBefore(wrapper, img);
    wrapper.appendChild(img);

    const overlay = createOverlay(service.title, service.isHourly);
    wrapper.appendChild(overlay);

    wrapper.addEventListener('click', () => handleClick(service));
    wrapper.setAttribute('role', 'button');
    wrapper.setAttribute('tabindex', '0');
    wrapper.setAttribute('aria-label', service.isHourly
      ? `Get a quote for ${service.title}`
      : `Book ${service.title}`);
    wrapper.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') handleClick(service);
    });
  }

  // ── Make a background-image div clickable ─────────────────────────────────
  function makeBgClickable(el, service) {
    if (el.dataset.ggClickable) return;
    el.dataset.ggClickable = '1';
    el.classList.add('gg-clickable-bg');

    const overlay = createOverlay(service.title, service.isHourly);
    el.appendChild(overlay);

    el.addEventListener('click', e => {
      // Don't interfere with existing buttons inside
      if (e.target.closest('button, a, .btn')) return;
      handleClick(service);
    });
    el.style.cursor = 'pointer';
  }

  // ── Handle the click ───────────────────────────────────────────────────────
  function handleClick(service) {
    if (service.isHourly || service.serviceId === null) {
      window.open(buildWhatsAppUrl(service.title), '_blank');
    } else {
      // Go to services.html and trigger booking modal
      const isOnServices = window.location.pathname.endsWith('services.html');
      if (isOnServices && typeof openBookingModal === 'function') {
        // We're already on services.html – use the existing modal function
        const allServices = typeof domesticServicesData !== 'undefined' ? domesticServicesData : [];
        const svc = allServices.find(s => s.id === service.serviceId);
        if (svc) openBookingModal(svc.title, svc.id, svc);
      } else {
        // Navigate to services.html with a hash so it opens the modal
        window.location.href = `services.html?book=${service.serviceId}`;
      }
    }
  }

  // ── Scan the page and wire up everything ──────────────────────────────────
  function wireUpImages() {
    injectStyles();

    // 1. Plain <img> tags
    document.querySelectorAll('img').forEach(img => {
      const filename = getFilename(img.getAttribute('src'));
      if (!filename) return;
      const service = IMAGE_SERVICE_MAP[filename];
      if (!service) return;
      // Skip logo / nav images
      if (img.closest('.nav-logo, .navbar, footer, .whatsapp-float, .hero-badge')) return;
      wrapImg(img, service);
    });

    // 2. Divs with background-image (e.g. .service-image in services.html)
    document.querySelectorAll('div[style*="background-image"], [class*="service-image"]').forEach(el => {
      if (el.dataset.ggClickable) return;
      // Skip if already has an onclick handler or existing badge (services.html cards)
      if (el.getAttribute('onclick') || el.querySelector('.gg-click-badge')) return;
      const filename = getBgFilename(el) || getFilename(el.style.backgroundImage);
      if (!filename) return;
      const service = IMAGE_SERVICE_MAP[filename];
      if (!service) return;
      if (el.closest('.navbar, footer, .whatsapp-float')) return;
      makeBgClickable(el, service);
    });
  }

  // ── On services.html: handle ?book=ID query param to auto-open modal ──────
  function handleAutoBook() {
    if (!window.location.pathname.endsWith('services.html')) return;
    const params = new URLSearchParams(window.location.search);
    const bookId = parseInt(params.get('book'));
    if (!bookId) return;

    // Wait for domesticServicesData and openBookingModal to be available
    const tryOpen = (attempts) => {
      if (typeof domesticServicesData !== 'undefined' && typeof openBookingModal === 'function') {
        const svc = domesticServicesData.find(s => s.id === bookId);
        if (svc) openBookingModal(svc.title, svc.id, svc);
        // Clean the URL
        window.history.replaceState({}, '', 'services.html');
      } else if (attempts > 0) {
        setTimeout(() => tryOpen(attempts - 1), 150);
      }
    };
    setTimeout(() => tryOpen(20), 300);
  }

  // ── Boot ───────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { wireUpImages(); handleAutoBook(); });
  } else {
    wireUpImages();
    handleAutoBook();
  }

  // Re-run after dynamic content (gallery renders images via JS)
  const observer = new MutationObserver(() => wireUpImages());
  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, { childList: true, subtree: true });
  });

})();
