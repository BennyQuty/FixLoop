/* ===================================================
   FIXLOOP — script.js
   Scroll animations, counters, nav, mobile menu
   =================================================== */

'use strict';

// ===== UTILITY: Check reduced motion preference =====
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===================================================
// 0. LOADING SCREEN
// ===================================================
(function initLoader() {
  const overlay = document.getElementById('loader-overlay');

  if (!overlay) return;

  // Lock scroll while loading
  document.body.classList.add('loading');

  // Minimum display time so it never flashes away instantly
  const MIN_DISPLAY = prefersReducedMotion ? 0 : 1600;
  const loadStart   = Date.now();

  function dismissLoader() {
    const elapsed   = Date.now() - loadStart;
    const remaining = Math.max(0, MIN_DISPLAY - elapsed);

    setTimeout(function () {
      overlay.classList.add('loader-hidden');
      document.body.classList.remove('loading');

      // Remove from DOM after fade completes (600ms transition)
      setTimeout(function () {
        overlay.remove();
      }, 650);
    }, remaining);
  }

  if (document.readyState === 'complete') {
    dismissLoader();
  } else {
    window.addEventListener('load', dismissLoader, { once: true });
  }
})();

// ===================================================
// 1. NAVIGATION — Blur on scroll + hamburger menu
// ===================================================
(function initNav() {
  const header    = document.getElementById('nav-header');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('nav-links');

  if (!header) return;

  // Scroll-based nav blur
  let lastScroll = 0;

  function onNavScroll() {
    const scrollY = window.scrollY;

    if (scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    lastScroll = scrollY;
  }

  window.addEventListener('scroll', onNavScroll, { passive: true });
  onNavScroll(); // run on load

  // Hamburger menu toggle
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      const isOpen = navLinks.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });

    // Close mobile menu on nav link click
    navLinks.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!header.contains(e.target)) {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }
})();

// ===================================================
// 2. SCROLL REVEAL — Fade + slide up via IntersectionObserver
// ===================================================
(function initScrollReveal() {
  if (prefersReducedMotion) {
    // Immediately show all elements for reduced motion
    document.querySelectorAll('.reveal-up').forEach(function (el) {
      el.classList.add('visible');
    });
    return;
  }

  const revealEls = document.querySelectorAll('.reveal-up');

  if (!revealEls.length) return;

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -48px 0px',
    }
  );

  revealEls.forEach(function (el) {
    observer.observe(el);
  });
})();

// ===================================================
// 3. ANIMATED COUNTERS — requestAnimationFrame
// ===================================================
(function initCounters() {
  const counters = document.querySelectorAll('.counter');

  if (!counters.length) return;

  // Helper: format number with suffix
  function formatValue(current, target, suffix) {
    if (suffix === 'M kg') {
      // Show one decimal place for M kg
      return current.toFixed(1) + suffix;
    }
    if (suffix === 'K+') {
      return Math.round(current) + suffix;
    }
    if (suffix === '%') {
      return Math.round(current) + suffix;
    }
    return Math.round(current);
  }

  // Easing: ease-out cubic
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animateCounter(el) {
    const targetStr = el.dataset.target;
    const suffix    = el.dataset.suffix || '';
    const target    = parseFloat(targetStr);
    const duration  = prefersReducedMotion ? 0 : 1800;
    const start     = performance.now();

    if (prefersReducedMotion) {
      el.textContent = formatValue(target, target, suffix);
      return;
    }

    function tick(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = easeOutCubic(progress);
      const current  = eased * target;

      el.textContent = formatValue(current, target, suffix);

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }

  // Observe counters and trigger when visible
  const counterObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  counters.forEach(function (counter) {
    counterObserver.observe(counter);
  });
})();

// ===================================================
// 4. SVG RING PROGRESS — Animate on scroll enter
// ===================================================
(function initRingProgress() {
  const rings = document.querySelectorAll('.ring-progress');

  if (!rings.length) return;

  const CIRCUMFERENCE = 326.7; // 2 * PI * 52

  // Map data-target (0–326.7) to dashoffset (326.7 → 0)
  // data-target here represents the filled arc length in the ring

  const ringObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const ring   = entry.target;
          const target = parseFloat(ring.dataset.target);

          if (prefersReducedMotion) {
            ring.style.strokeDashoffset = String(CIRCUMFERENCE - target);
          } else {
            // Small delay for stagger
            setTimeout(function () {
              ring.style.strokeDashoffset = String(CIRCUMFERENCE - target);
            }, 200);
          }

          ringObserver.unobserve(ring);
        }
      });
    },
    { threshold: 0.4 }
  );

  rings.forEach(function (ring) {
    ringObserver.observe(ring);
  });
})();

// ===================================================
// 5. CONNECTOR LINE DRAW — SVG stroke animation
// ===================================================
(function initConnectorLine() {
  const connectorPath = document.querySelector('.connector-path');

  if (!connectorPath) return;

  if (prefersReducedMotion) {
    connectorPath.classList.add('drawn');
    return;
  }

  const lineObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          connectorPath.classList.add('drawn');
          lineObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  lineObserver.observe(connectorPath);
})();

// ===================================================
// 6. SMOOTH SCROLL — For all anchor links
// ===================================================
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const href = anchor.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      const navHeight = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--nav-height') || '72',
        10
      );

      const targetTop = target.getBoundingClientRect().top + window.scrollY - navHeight;

      if (prefersReducedMotion) {
        window.scrollTo(0, targetTop);
      } else {
        window.scrollTo({
          top: targetTop,
          behavior: 'smooth',
        });
      }
    });
  });
})();

// ===================================================
// 7. HERO ARC ROTATION — CSS-driven, fallback JS
// ===================================================
// Arcs are handled entirely by CSS @keyframes.
// This block watches for visibility to pause off-screen.
(function initArcVisibility() {
  if (prefersReducedMotion) return;

  const arcs = document.querySelectorAll('.hero-arc, .blob');
  if (!arcs.length) return;

  const visObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        entry.target.style.animationPlayState = entry.isIntersecting
          ? 'running'
          : 'paused';
      });
    },
    { threshold: 0 }
  );

  arcs.forEach(function (arc) {
    visObserver.observe(arc);
  });
})();

// ===================================================
// 8. KEYBOARD NAVIGATION — Skip to main content
// ===================================================
(function initSkipLink() {
  // Ensure focus is always visible during keyboard nav
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-nav');
    }
  });

  document.addEventListener('mousedown', function () {
    document.body.classList.remove('keyboard-nav');
  });
})();

// ===================================================
// 9. SIGN UP MODAL
// ===================================================
(function initSignupModal() {
  var overlay  = document.getElementById('signup-modal');
  var closeBtn = document.getElementById('modal-close');
  var form     = document.getElementById('signup-form');

  if (!overlay) return;

  // ── Open (called by any "Start With FixLoop" / "Get Started" button) ──
  window.openSignupModal = function (e) {
    if (e) e.preventDefault();
    overlay.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    // Focus first field after animation
    setTimeout(function () {
      var first = overlay.querySelector('input, select');
      if (first) first.focus();
    }, 360);
  };

  // ── Close ──
  function closeModal() {
    overlay.classList.remove('modal-open');
    document.body.style.overflow = '';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  // Click the backdrop (outside the card) to close
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });

  // Escape key closes
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('modal-open')) {
      closeModal();
    }
  });

  // ── Form submit — show success then auto-close ──
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }

      // Hide form and header, show success message
      var header = overlay.querySelector('.modal-header');
      form.style.display = 'none';
      if (header) header.style.display = 'none';

      // Build or reveal success panel
      var success = overlay.querySelector('.modal-success');
      if (!success) {
        success = document.createElement('div');
        success.className = 'modal-success';
        success.innerHTML = [
          '<div class="modal-success__icon">',
            '<svg width="28" height="28" viewBox="0 0 28 28" fill="none">',
              '<path d="M6 14 L11 19 L22 9" stroke="#58C14D" stroke-width="2.5"',
              ' stroke-linecap="round" stroke-linejoin="round"/>',
            '</svg>',
          '</div>',
          '<p class="modal-success__title">You\'re in!</p>',
          '<p class="modal-success__msg">Welcome to FixLoop. Check your inbox for a confirmation email to get started.</p>',
          '<button class="btn btn-primary btn-lg" id="success-close-btn" style="margin-top:8px">Back to Site</button>',
        ].join('');
        overlay.querySelector('.modal-card').appendChild(success);

        document.getElementById('success-close-btn').addEventListener('click', closeModal);
      }
      success.style.display = 'flex';

      // Auto-close after 5 seconds and reset the form
      setTimeout(function () {
        closeModal();
        setTimeout(function () {
          form.reset();
          form.style.display = '';
          if (header) header.style.display = '';
          success.style.display = 'none';
        }, 400);
      }, 5000);
    });
  }
})();
