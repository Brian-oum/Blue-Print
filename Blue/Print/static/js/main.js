// ============================================================
// COOKIE CONSENT + GATED CHATWAY LOADING
// Runs immediately (not inside DOMContentLoaded) so consent state
// is resolved and the widget can start loading as early as possible.
// ============================================================
(function () {
  const CONSENT_KEY = 'bp_cookie_consent'; // {necessary, analytics, chat, ts}
  const CHATWAY_ID = 'VlCXxwg7Xa8x'; // your real Chatway widget id

  function getConsent() {
    try {
      return JSON.parse(localStorage.getItem(CONSENT_KEY));
    } catch (e) {
      return null;
    }
  }

  function setConsent(consent) {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    } catch (e) {
      /* localStorage unavailable — consent just won't persist across visits */
    }
    document.cookie =
      'bp_consent=' + (consent.chat ? '1' : '0') +
      ';path=/;max-age=' + (60 * 60 * 24 * 180) + ';SameSite=Lax';
  }

  function loadChatway() {
    if (document.getElementById('chatway')) return;
    const s = document.createElement('script');
    s.id = 'chatway';
    s.async = true;
    s.src = 'https://cdn.chatway.app/widget.js?id=' + CHATWAY_ID;
    document.body.appendChild(s);
  }

  function applyConsent(consent) {
    if (consent && consent.chat) loadChatway();
  }

  function showBanner() {
    const banner = document.getElementById('cookieConsentBanner');
    if (banner) banner.classList.add('show');
  }

  function hideBanner() {
    const banner = document.getElementById('cookieConsentBanner');
    if (banner) banner.classList.remove('show');
  }

  // Public API used by the banner buttons (onclick="bpConsent.saveFromBanner()" etc.)
  window.bpConsent = {
    // Reads the checkbox states straight out of the banner markup, so the
    // banner itself is the single source of truth for what gets saved.
    saveFromBanner: function () {
      const chatBox = document.getElementById('consentChat');
      const analyticsBox = document.getElementById('consentAnalytics');
      const c = {
        necessary: true,
        chat: chatBox ? chatBox.checked : true,
        analytics: analyticsBox ? analyticsBox.checked : true,
        ts: Date.now()
      };
      setConsent(c);
      applyConsent(c);
      hideBanner();
    },
    acceptAll: function () {
      const c = { necessary: true, analytics: true, chat: true, ts: Date.now() };
      setConsent(c);
      applyConsent(c);
      hideBanner();
    },
    rejectNonEssential: function () {
      const c = { necessary: true, analytics: false, chat: false, ts: Date.now() };
      setConsent(c);
      hideBanner();
    },
    savePreferences: function (chatEnabled, analyticsEnabled) {
      const c = {
        necessary: true,
        analytics: !!analyticsEnabled,
        chat: !!chatEnabled,
        ts: Date.now()
      };
      setConsent(c);
      applyConsent(c);
      hideBanner();
    },
    // Lets the privacy policy page offer a "change your mind" link
    resetAndShowBanner: function () {
      try {
        localStorage.removeItem(CONSENT_KEY);
      } catch (e) {}
      document.cookie = 'bp_consent=;path=/;max-age=0';
      showBanner();
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    const existing = getConsent();
    if (existing) {
      applyConsent(existing);
    } else {
      showBanner();
    }

    // Wire the banner's own buttons directly (more robust than inline
    // onclick — works regardless of script load order, and errors show
    // up clearly in the console if an element is missing).
    const rejectBtn = document.getElementById('cookieRejectBtn');
    const saveBtn = document.getElementById('cookieSaveBtn');

    if (rejectBtn) {
      rejectBtn.addEventListener('click', window.bpConsent.rejectNonEssential);
    }
    if (saveBtn) {
      saveBtn.addEventListener('click', window.bpConsent.saveFromBanner);
    } else {
      console.warn('[cookie-consent] #cookieSaveBtn not found in the DOM — check base.html includes the banner partial.');
    }
  });
})();

document.addEventListener('DOMContentLoaded', function () {
  const header = document.getElementById('siteHeader');
  const backToTopBtn = document.getElementById('backToTop');
  const searchModal = document.getElementById('searchModal');

  // Header elevation on scroll
  window.addEventListener('scroll', function () {
    if (window.scrollY > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Smooth scroll to top
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', function () {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // Auto-focus search field inside modal
  if (searchModal) {
    searchModal.addEventListener('shown.bs.modal', function () {
      const searchInput = searchModal.querySelector('input[type="search"]');
      if (searchInput) searchInput.focus();
    });
  }

  // Right-side mobile nav (offcanvas): morph the hamburger into a close
  // mark while open, and auto-close the panel when a link is tapped.
  const mainNavOffcanvasEl = document.getElementById('mainNav');
  const navToggler = document.querySelector('.custom-toggler');

  if (mainNavOffcanvasEl && navToggler) {
    mainNavOffcanvasEl.addEventListener('show.bs.offcanvas', function () {
      navToggler.classList.add('active');
    });
    mainNavOffcanvasEl.addEventListener('hidden.bs.offcanvas', function () {
      navToggler.classList.remove('active');
    });

    mainNavOffcanvasEl.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        const instance = bootstrap.Offcanvas.getInstance(mainNavOffcanvasEl);
        if (instance) instance.hide();
      });
    });
  }

  // "Write for us" testimonial modal: AJAX submit, inline validation
  // errors, success state, and a clean reset each time it's reopened.
  const testimonialModalEl = document.getElementById('testimonialModal');

  if (testimonialModalEl) {
    const testimonialForm = document.getElementById('testimonialForm');
    const testimonialAlert = document.getElementById('testimonialAlert');
    const submitBtn = document.getElementById('testimonialSubmitBtn');
    const submitBtnLabel = submitBtn.querySelector('.btn-label');
    const bsModal = bootstrap.Modal.getOrCreateInstance(testimonialModalEl);

    function clearFieldErrors() {
      testimonialForm.querySelectorAll('.is-invalid').forEach(function (el) {
        el.classList.remove('is-invalid');
      });
      testimonialForm.querySelectorAll('[data-error-for]').forEach(function (el) {
        el.textContent = '';
      });
    }

    function showAlert(type, message) {
      testimonialAlert.hidden = false;
      testimonialAlert.className = 'testimonial-alert testimonial-alert-' + type;
      testimonialAlert.textContent = message;
    }

    function hideAlert() {
      testimonialAlert.hidden = true;
      testimonialAlert.textContent = '';
    }

    function setSubmitting(isSubmitting) {
      submitBtn.disabled = isSubmitting;
      submitBtnLabel.textContent = isSubmitting ? 'SUBMITTING…' : 'SUBMIT TESTIMONIAL';
    }

    function resetForm() {
      testimonialForm.reset();
      clearFieldErrors();
      hideAlert();
      setSubmitting(false);
    }

    // Always start from a clean slate when the modal is opened
    testimonialModalEl.addEventListener('show.bs.modal', resetForm);

    testimonialForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearFieldErrors();
      hideAlert();
      setSubmitting(true);

      const formData = new FormData(testimonialForm);

      fetch(testimonialForm.action, {
        method: 'POST',
        body: formData,
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      })
        .then(function (response) {
          return response.json().then(function (data) {
            return { ok: response.ok, data: data };
          });
        })
        .then(function (result) {
          if (result.ok && result.data.success) {
            showAlert('success', result.data.message || "Thanks for sharing your experience!");
            testimonialForm.reset();
            window.setTimeout(function () {
              bsModal.hide();
            }, 1800);
          } else {
            const errors = result.data.errors || {};
            const fieldNames = Object.keys(errors);

            if (fieldNames.length) {
              fieldNames.forEach(function (field) {
                const input = testimonialForm.querySelector('[name="' + field + '"]');
                const errorEl = testimonialForm.querySelector('[data-error-for="' + field + '"]');
                const messages = errors[field].map(function (err) { return err.message || err; }).join(' ');

                if (input) input.classList.add('is-invalid');
                if (errorEl) errorEl.textContent = messages;
              });
              showAlert('error', "Please check the highlighted fields.");
            } else {
              showAlert('error', result.data.error || "Something went wrong. Please try again.");
            }
          }
        })
        .catch(function () {
          showAlert('error', "Couldn't submit right now. Please check your connection and try again.");
        })
        .finally(function () {
          setSubmitting(false);
        });
    });
  }

  // Testimonials: rotate through pages, crossfading every few seconds.
  // On desktop each page groups 2 cards; on phones it regroups down to
  // 1 card per page and rebuilds the dots — same "one by one" behaviour
  // as the client logos carousel below.
  (function initTestimonialSlider() {
    const pagesContainer = document.querySelector('.testimonial-pages');
    const dotsContainer = document.querySelector('.testimonial-dots');
    const testimonialSlider = document.querySelector('.testimonial-slider');
    if (!pagesContainer || !dotsContainer) return;

    const MOBILE_QUERY = window.matchMedia('(max-width: 767.98px)');

    // Flatten every card out of its original page div, in document order,
    // once up front so we can regroup them for any breakpoint.
    const allCards = Array.from(pagesContainer.querySelectorAll('.testimonial-card'));
    if (!allCards.length) return;

    let activeIndex = 0;
    let rotateTimer = null;
    const intervalMs = 4500;
    let currentGroupSize = null;

    function cardsPerPage() {
      return MOBILE_QUERY.matches ? 1 : 2;
    }

    function showTestimonialPage(index, pages, dots) {
      if (index === activeIndex && pages[index].classList.contains('active')) return;

      const outgoing = pages[activeIndex];
      const incoming = pages[index];

      outgoing.classList.remove('active');
      outgoing.classList.add('leaving');
      window.setTimeout(function () {
        outgoing.classList.remove('leaving');
      }, 600);

      incoming.classList.add('active');

      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
      activeIndex = index;
    }

    function stopRotation() {
      clearInterval(rotateTimer);
    }

    function build() {
      const groupSize = cardsPerPage();
      if (groupSize === currentGroupSize) return;
      currentGroupSize = groupSize;

      stopRotation();
      activeIndex = 0;

      pagesContainer.innerHTML = '';
      dotsContainer.innerHTML = '';

      for (let i = 0; i < allCards.length; i += groupSize) {
        const page = document.createElement('div');
        page.className = 'testimonial-page' + (i === 0 ? ' active' : '');
        allCards.slice(i, i + groupSize).forEach(function (card) {
          page.appendChild(card);
        });
        pagesContainer.appendChild(page);

        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'testimonial-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Show testimonials ' + (i / groupSize + 1));
        dotsContainer.appendChild(dot);
      }

      const pages = Array.from(pagesContainer.querySelectorAll('.testimonial-page'));
      const dots = Array.from(dotsContainer.querySelectorAll('.testimonial-dot'));

      dots.forEach(function (dot, i) {
        dot.addEventListener('click', function () {
          stopRotation();
          showTestimonialPage(i, pages, dots);
          startRotation(pages, dots);
        });
      });

      if (pages.length > 1) {
        startRotation(pages, dots);
      }
    }

    function startRotation(pages, dots) {
      stopRotation();
      if (pages.length <= 1) return;
      rotateTimer = setInterval(function () {
        showTestimonialPage((activeIndex + 1) % pages.length, pages, dots);
      }, intervalMs);
    }

    if (testimonialSlider) {
      testimonialSlider.addEventListener('mouseenter', stopRotation);
      testimonialSlider.addEventListener('mouseleave', function () {
        const pages = Array.from(pagesContainer.querySelectorAll('.testimonial-page'));
        const dots = Array.from(dotsContainer.querySelectorAll('.testimonial-dot'));
        startRotation(pages, dots);
      });
    }

    build();

    // Rebuild the grouping only when crossing the mobile breakpoint
    if (MOBILE_QUERY.addEventListener) {
      MOBILE_QUERY.addEventListener('change', build);
    } else if (MOBILE_QUERY.addListener) {
      MOBILE_QUERY.addListener(build);
    }
  })();

  // Reusable fade-hint for any horizontally-scrolling card strip: hides
  // the right-edge fade once scrolled (near) to the end, and shows it
  // again if the strip is scrolled back. No-op on desktop, where the
  // strip in question isn't scrollable and the fade element/CSS simply
  // don't apply. Shared by the mobile flip-card strip (services page),
  // the "What We Do" cards, and the "Featured Works" cards (home page).
  function initScrollHint(gridSelector, colSelector) {
    const grid = document.querySelector(gridSelector);
    const col = document.querySelector(colSelector);
    if (!grid || !col) return;

    function updateHint() {
      const atEnd = grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 8;
      col.classList.toggle('scroll-end', atEnd);
    }

    grid.addEventListener('scroll', updateHint, { passive: true });
    window.addEventListener('resize', updateHint);
    updateHint();
  }

  // Services page: mobile flip-card strip
  initScrollHint('.service-flip-grid', '.services-hero-cards-col');

  // Home page: "What We Do" cards strip
  initScrollHint('.services-cards-grid', '.services-cards-col');

  // Home page: "Featured Works" cards strip
  initScrollHint('.featured-cards-grid', '.featured-cards-col');

  // Services page: feature slideshow — image slides in from the left
  // while its matching text slides in from the right; the outgoing
  // pair keeps travelling the direction it entered from, so both
  // halves always read as one continuous motion.
  (function initFeatureSlideshow() {
    const mediaWrapper = document.querySelector('.feature-media-wrapper');
    const textWrapper = document.querySelector('.feature-slide-text-wrapper');
    const dotsContainer = document.querySelector('.feature-slide-dots');
    if (!mediaWrapper || !textWrapper || !dotsContainer) return;

    const images = Array.from(mediaWrapper.querySelectorAll('.feature-slide-image'));
    const texts = Array.from(textWrapper.querySelectorAll('.feature-slide-text'));
    const dots = Array.from(dotsContainer.querySelectorAll('.feature-slide-dot'));
    if (!images.length || !texts.length) return;

    let activeIndex = 0;
    let rotateTimer = null;
    const intervalMs = 5000;

    function goTo(index) {
      if (index === activeIndex) return;

      images.forEach(function (img, i) {
        img.classList.remove('active', 'leaving');
        if (i === activeIndex) img.classList.add('leaving');
        if (i === index) img.classList.add('active');
      });

      texts.forEach(function (text, i) {
        text.classList.remove('active', 'leaving');
        if (i === activeIndex) text.classList.add('leaving');
        if (i === index) text.classList.add('active');
      });

      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });

      activeIndex = index;

      window.setTimeout(function () {
        images.forEach(function (img) { img.classList.remove('leaving'); });
        texts.forEach(function (text) { text.classList.remove('leaving'); });
      }, 700);
    }

    function next() {
      goTo((activeIndex + 1) % images.length);
    }

    function stopRotation() {
      clearInterval(rotateTimer);
    }

    function startRotation() {
      stopRotation();
      if (images.length <= 1) return;
      rotateTimer = setInterval(next, intervalMs);
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        stopRotation();
        goTo(i);
        startRotation();
      });
    });

    const featureSection = document.querySelector('.services-feature-section');
    if (featureSection) {
      featureSection.addEventListener('mouseenter', stopRotation);
      featureSection.addEventListener('mouseleave', startRotation);
    }

    startRotation();
  })();

  // Stats section + core values dark band: canvas particle tunnel background
  // (adapted from the Originkit ParticleVoid React component into
  // plain JS/canvas — same math, no framework, one instance per canvas)
  function initParticleTunnel(canvas, options) {
    const opts = Object.assign({
      x: 50,
      y: 50,
      radius: 26,
      density: 34,
      gap: 34,
      particleSize: 3,
      colors: ['#2AAAE1', '#67c8f5', '#ffffff'],
      direction: 'inside',
      speed: 2,
      voidColor: '#0b0f17', // matches the dark region's background so the
                             // "hole" reads as a seamless void, not a black dot
      getWidth: null,  // () => number, overrides the canvas's own parent width
      getHeight: null, // () => number, overrides the canvas's own parent height
      observe: []      // elements to watch for size changes that should re-fit the canvas
    }, options);

    const ctx = canvas.getContext('2d');
    const perspective = 200;
    const tunnelSpread = 1;
    const maxDepth = 600;

    const speedAmt = Math.max(0, opts.speed) / 2;
    const flowSpeed = opts.direction === 'inside' ? -speedAmt : speedAmt;

    let offset = 0;
    let size = { w: canvas.clientWidth || 600, h: canvas.clientHeight || 400 };
    let lastTime = performance.now();
    let rafId = null;

    function wrap(val, max) {
      return ((val % max) + max) % max;
    }

    // Resize the backing canvas (with DPR) to whatever width/height the
    // caller reports — for this section that's the stats section's
    // height PLUS the values dark band's height, so the tunnel covers
    // the full dark stretch across both sections and stops exactly
    // where the white area begins.
    function updateSize() {
      const dpr = window.devicePixelRatio || 1;
      const width = opts.getWidth ? opts.getWidth() : (canvas.parentElement ? canvas.parentElement.clientWidth : canvas.clientWidth);
      const height = opts.getHeight ? opts.getHeight() : (canvas.parentElement ? canvas.parentElement.clientHeight : canvas.clientHeight);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      size = { w: width, h: height };
    }

    updateSize();

    let resizeRaf = null;
    function scheduleResize() {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(function () {
        resizeRaf = null;
        updateSize();
      });
    }

    window.addEventListener('resize', scheduleResize);

    let ro = null;
    if (opts.observe && opts.observe.length) {
      ro = new ResizeObserver(scheduleResize);
      opts.observe.forEach(function (el) {
        if (el) ro.observe(el);
      });
    }

    function draw(now) {
      const dt = Math.min((now - lastTime) / 16.667, 3); // normalize to ~60fps
      lastTime = now;

      const w = size.w;
      const h = size.h;
      const dpr = window.devicePixelRatio || 1;

      offset = wrap(offset - flowSpeed * dt, maxDepth);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const centreCx = (opts.x / 100) * w;
      const centreCy = (opts.y / 100) * h;
      const oxPx = centreCx - cx;
      const oyPx = centreCy - cy;

      const scaleVoid = perspective / (perspective + maxDepth);
      const rCentre3d = opts.radius / scaleVoid;

      const activeDensity = Math.max(opts.density, 1);
      const activeGap = Math.max(opts.gap, 10);
      const particlesPerSpoke = Math.max(1, Math.round(maxDepth / activeGap));
      const effGap = maxDepth / particlesPerSpoke;

      const projected = [];

      for (let i = 0; i < activeDensity; i++) {
        const baseAngle = (i / activeDensity) * Math.PI * 2;

        for (let k = 0; k < particlesPerSpoke; k++) {
          const z = wrap(offset + k * effGap, maxDepth);
          const depthFactor = z / maxDepth;
          const scale = perspective / (perspective + z);

          const projCx = cx + oxPx * depthFactor;
          const projCy = cy + oyPx * depthFactor;

          const r3d = rCentre3d + (1 - depthFactor) * tunnelSpread * (w / 2);
          const rProj = r3d * scale;

          const px = projCx + rProj * Math.cos(baseAngle);
          const py = projCy + rProj * Math.sin(baseAngle);

          if (px < -20 || px > w + 20 || py < -20 || py > h + 20) continue;

          const particleSize = Math.max(0.4, opts.particleSize * scale);
          const alpha = Math.max(0.05, 1 - depthFactor * 0.9);
          const colorIdx = (i + k) % opts.colors.length;

          projected.push({
            x: px,
            y: py,
            size: particleSize,
            alpha: alpha,
            z: z,
            color: opts.colors[colorIdx]
          });
        }
      }

      // Back-to-front so nearer particles draw over farther ones
      projected.sort(function (a, b) { return b.z - a.z; });

      for (let i = 0; i < projected.length; i++) {
        const pt = projected[i];
        ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // Solid void at the tunnel's center
      ctx.fillStyle = opts.voidColor;
      ctx.beginPath();
      ctx.arc(centreCx, centreCy, opts.radius, 0, Math.PI * 2);
      ctx.fill();

      rafId = requestAnimationFrame(draw);
    }

    rafId = requestAnimationFrame(draw);

    return function destroy() {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', scheduleResize);
      if (ro) ro.disconnect();
    };
  }

  const particleCanvas = document.querySelector('.stats-particle-canvas');
  const darkCanvasRegion = document.querySelector('.dark-canvas-region');
  const statsSectionEl = document.querySelector('.stats-section');
  const valuesDarkBand = document.querySelector('.values-dark-band');
  const valuesSectionEl = document.querySelector('.values-section');
  const firstValueCard = document.querySelector('.value-card');

  // Stretch the (invisible) values-dark-band measuring element down to
  // the vertical midpoint of the core value cards, so the shared canvas
  // behind it covers exactly the top half of those cards instead of a
  // fixed CSS height. Recomputed on every resize since card height and
  // position shift across breakpoints.
  function sizeValuesDarkBand() {
    if (!valuesDarkBand || !valuesSectionEl || !firstValueCard) return;
    const sectionTop = valuesSectionEl.getBoundingClientRect().top;
    const cardTop = firstValueCard.getBoundingClientRect().top;
    const cardHeight = firstValueCard.offsetHeight;
    const bandHeight = (cardTop - sectionTop) + (cardHeight / 2);
    valuesDarkBand.style.height = Math.max(0, Math.round(bandHeight)) + 'px';
  }

  if (particleCanvas && darkCanvasRegion && statsSectionEl && valuesDarkBand) {
    sizeValuesDarkBand();

    initParticleTunnel(particleCanvas, {
      getWidth: function () {
        return darkCanvasRegion.clientWidth;
      },
      getHeight: function () {
        // Re-measure the band (card position/height can shift on resize)
        // before summing: stats section height + the values dark band
        // height = exactly the dark stretch the tunnel should cover.
        sizeValuesDarkBand();
        return statsSectionEl.offsetHeight + valuesDarkBand.offsetHeight;
      },
      observe: [darkCanvasRegion, statsSectionEl, valuesDarkBand, firstValueCard]
    });

    window.addEventListener('resize', sizeValuesDarkBand);
  }

  // Stats section: count-up animation for the numbers, triggered once
  // when the section scrolls into view
  const statNumbers = document.querySelectorAll('.stat-number[data-count-to]');

  if (statNumbers.length) {
    function formatCount(value) {
      return Math.round(value).toLocaleString('en-US');
    }

    function runCountUp(el) {
      const target = parseFloat(el.getAttribute('data-count-to'), 10);
      const suffix = el.getAttribute('data-suffix') || '';
      const duration = 1600;
      let startTime = null;

      function step(timestamp) {
        if (startTime === null) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        // ease-out for a natural deceleration into the final number
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = formatCount(target * eased) + suffix;

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = formatCount(target) + suffix;
        }
      }

      requestAnimationFrame(step);
    }

    const statsObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          runCountUp(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    statNumbers.forEach(function (el) {
      statsObserver.observe(el);
    });
  }

  // Clients section: previously paginated the logos and auto-rotated them
  // in a sliding carousel. That animation has been removed — the clients
  // card now simply shows every logo at once via the plain flex-wrap grid
  // in .clients-logos (see CSS), so this carousel is disabled. The
  // .clients-logos-static class on the markup opts a container out of it.
  (function initClientsCarousel() {
    const LOGOS_PER_PAGE_DESKTOP = 4;
    const ROTATE_MS = 3500;
    const MOBILE_QUERY = window.matchMedia('(max-width: 767.98px)');

    const originalContainer = document.querySelector('.clients-logos:not(.clients-logos-static)');
    if (!originalContainer) return;

    const allLogos = Array.from(originalContainer.querySelectorAll('.client-logo'));
    if (!allLogos.length) return;

    // Build a persistent viewport/track once; regroup logos into pages
    // inside it whenever the grouping size needs to change.
    const viewport = document.createElement('div');
    viewport.className = 'clients-logos-viewport';

    const track = document.createElement('div');
    track.className = 'clients-logos-track';
    viewport.appendChild(track);

    originalContainer.replaceWith(viewport);

    let current = 0;
    let timer = null;
    let currentGroupSize = null;

    function logosPerPage() {
      return MOBILE_QUERY.matches ? 1 : LOGOS_PER_PAGE_DESKTOP;
    }

    function goTo(index) {
      current = index;
      track.style.transform = 'translateX(-' + (index * 100) + '%)';
    }

    function next() {
      goTo((current + 1) % track.children.length);
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function start() {
      stop();
      if (track.children.length > 1) {
        timer = setInterval(next, ROTATE_MS);
      }
    }

    function build() {
      const groupSize = logosPerPage();
      if (groupSize === currentGroupSize) return;
      currentGroupSize = groupSize;

      stop();
      track.innerHTML = '';
      track.style.transform = 'translateX(0)';
      current = 0;

      // With a single logo per page, only build pages if there's more
      // than one logo to page through; otherwise show the logos plainly.
      if (groupSize === 1 && allLogos.length <= 1) {
        allLogos.forEach(function (logo) {
          track.appendChild(logo);
        });
        return;
      }

      for (let i = 0; i < allLogos.length; i += groupSize) {
        const page = document.createElement('div');
        page.className = 'clients-logos-page';
        allLogos.slice(i, i + groupSize).forEach(function (logo) {
          page.appendChild(logo);
        });
        track.appendChild(page);
      }

      start();
    }

    build();

    // Pause the rotation while a visitor is looking at the logos
    viewport.addEventListener('mouseenter', stop);
    viewport.addEventListener('mouseleave', start);

    // Rebuild the grouping only when crossing the mobile breakpoint
    if (MOBILE_QUERY.addEventListener) {
      MOBILE_QUERY.addEventListener('change', build);
    } else if (MOBILE_QUERY.addListener) {
      MOBILE_QUERY.addListener(build);
    }
  })();

  // Products page: category select drives navigation directly
  const categorySelect = document.getElementById('categorySelect');
  if (categorySelect) {
    categorySelect.addEventListener('change', function () {
      if (this.value) window.location.href = this.value;
    });
  }
});