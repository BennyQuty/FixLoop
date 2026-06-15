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

  const CIRCUMFERENCE = 452.4; // 2 * PI * 72

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

  // ── Switch: close signup, open sign-in ──
  window.closeSignupAndOpenSignin = function (e) {
    if (e) e.preventDefault();
    closeModal();
    // Small delay so the close animation finishes before signin opens
    setTimeout(function () {
      if (window.openSigninModal) window.openSigninModal();
    }, 280);
  };

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


// ===================================================
// 10. HOW IT WORKS � Interactive fee panels
// Panels are detached to <body> and positioned with
// fixed coords so the grid row never expands.
// ===================================================
(function initHiwFeePanels() {
  'use strict';

  var steps    = document.querySelectorAll('.hiw-step--interactive');
  var PANEL_W  = 320;
  var GAP      = 14;
  var EDGE_PAD = 10;

  // -- 1. Move every panel to <body> ------------------
  steps.forEach(function (step) {
    var id    = step.dataset.feeId;
    var panel = id ? document.getElementById(id) : null;
    if (!panel) return;

    document.body.appendChild(panel);

    // Base fixed-panel styles (overrides any CSS positioning)
    panel.style.cssText += [
      'position:fixed',
      'z-index:600',
      'width:' + PANEL_W + 'px',
      'max-height:80vh',
      'overflow-y:auto',
      'background:#fff',
      'border:1px solid rgba(29,183,217,0.22)',
      'border-radius:12px',
      'box-shadow:0 10px 40px rgba(0,63,125,0.18)',
      'margin:0',
      'transition:opacity 0.2s ease, transform 0.2s ease'
    ].join(';') + ';';
  });

  // -- 2. Compute & apply position --------------------
  function place(step, panel) {
    var rect = step.getBoundingClientRect();
    var dir  = step.dataset.flyout; // 'left' | 'right' | undefined = below

    var top, left;

    if (dir === 'left') {
      left = rect.left - PANEL_W - GAP;
      top  = rect.top;
    } else if (dir === 'right') {
      left = rect.right + GAP;
      top  = rect.top;
    } else {
      // Always place directly below the clicked step
      left = rect.left + rect.width / 2 - PANEL_W / 2;
      top  = rect.bottom + GAP;
    }

    // Clamp horizontally so it never runs off-screen
    left = Math.max(EDGE_PAD, Math.min(left, window.innerWidth - PANEL_W - EDGE_PAD));

    // Always start below/beside the step - never flip above
    top = Math.max(EDGE_PAD, top);

    // Constrain height to remaining viewport so it scrolls internally
    var availH = window.innerHeight - top - EDGE_PAD;
    panel.style.maxHeight = Math.max(200, availH) + 'px';

    panel.style.left = left + 'px';
    panel.style.top  = top  + 'px';
  }

  // -- 3. Wire up each step ---------------------------
  steps.forEach(function (step) {
    var id    = step.dataset.feeId;
    var panel = id ? document.getElementById(id) : null;
    if (!panel) return;

    function closeAll() {
      steps.forEach(function (s) {
        var oid = s.dataset.feeId;
        var o   = oid ? document.getElementById(oid) : null;
        if (o) { o.setAttribute('hidden', ''); s.setAttribute('aria-expanded', 'false'); }
      });
    }

    function open() {
      closeAll();
      place(step, panel);
      panel.removeAttribute('hidden');
      step.setAttribute('aria-expanded', 'true');
    }

    function close() {
      panel.setAttribute('hidden', '');
      step.setAttribute('aria-expanded', 'false');
    }

    function toggle() {
      panel.hasAttribute('hidden') ? open() : close();
    }

    step.addEventListener('click', toggle);
    step.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });

    // Reposition on scroll / resize while open
    window.addEventListener('scroll', function () {
      if (!panel.hasAttribute('hidden')) place(step, panel);
    }, { passive: true });
    window.addEventListener('resize', function () {
      if (!panel.hasAttribute('hidden')) place(step, panel);
    }, { passive: true });

    // Tab switching (Steps 2 & 3)
    panel.querySelectorAll('.hiw-fee-tab').forEach(function (tab) {
      tab.addEventListener('click', function (e) {
        e.stopPropagation();
        var tid = tab.dataset.tab;
        panel.querySelectorAll('.hiw-fee-tab').forEach(function (t) {
          t.classList.remove('hiw-fee-tab--active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('hiw-fee-tab--active');
        tab.setAttribute('aria-selected', 'true');
        panel.querySelectorAll('.hiw-fee-tabpanel').forEach(function (tp) {
          tp.id === tid ? tp.removeAttribute('hidden') : tp.setAttribute('hidden', '');
        });
      });
    });
  });

  // -- 4. Close on outside click ----------------------
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.hiw-step--interactive') && !e.target.closest('.hiw-fee-panel')) {
      steps.forEach(function (s) {
        var oid = s.dataset.feeId;
        var o   = oid ? document.getElementById(oid) : null;
        if (o) { o.setAttribute('hidden', ''); s.setAttribute('aria-expanded', 'false'); }
      });
    }
  });
})();
// ===================================================
// 11. SIGN IN MODAL
// ===================================================
(function initSigninModal() {
  var overlay    = document.getElementById('signin-modal');
  var closeBtn   = document.getElementById('signin-modal-close');
  var form       = document.getElementById('signin-form');
  var switchLink = document.getElementById('switch-to-signup');

  if (!overlay) return;

  // Open
  window.openSigninModal = function (e) {
    if (e) e.preventDefault();
    overlay.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    setTimeout(function () {
      var first = overlay.querySelector('input');
      if (first) first.focus();
    }, 360);
  };

  // Close
  function closeSignin() {
    overlay.classList.remove('modal-open');
    document.body.style.overflow = '';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeSignin);

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeSignin();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('modal-open')) {
      closeSignin();
    }
  });

  // Switch to sign-up
  if (switchLink) {
    switchLink.addEventListener('click', function (e) {
      e.preventDefault();
      closeSignin();
      if (window.openSignupModal) window.openSignupModal();
    });
  }

  // Sign-in form submit (demo handler)
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }

      var header  = overlay.querySelector('.modal-header');
      form.style.display = 'none';
      if (header) header.style.display = 'none';

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
          '<p class="modal-success__title">Welcome back!</p>',
          '<p class="modal-success__msg">You\'re now signed in to FixLoop.</p>',
          '<button class="btn btn-primary btn-lg" id="signin-success-close" style="margin-top:8px">Continue</button>',
        ].join('');
        overlay.querySelector('.modal-card').appendChild(success);
        document.getElementById('signin-success-close').addEventListener('click', closeSignin);
      }
      success.style.display = 'flex';

      setTimeout(function () {
        closeSignin();
        setTimeout(function () {
          form.reset();
          form.style.display = '';
          if (header) header.style.display = '';
          success.style.display = 'none';
        }, 400);
      }, 4000);
    });
  }
})();


// ===================================================
// 12. PARTNER CARD BUTTONS — Open signup with pre-selected role
// ===================================================
window.openSignupModalWithRole = function (e, role) {
  if (e) e.preventDefault();

  // Open the signup modal via the existing function
  if (window.openSignupModal) {
    window.openSignupModal();
  }

  // Pre-select the role after the modal opens (wait for animation)
  setTimeout(function () {
    var roleSelect = document.getElementById('signup-role');
    if (roleSelect && role) {
      roleSelect.value = role;

      // Fire a change event so any listeners pick it up
      var evt = new Event('change', { bubbles: true });
      roleSelect.dispatchEvent(evt);

      // Update the modal badge/subtitle to reflect the role context
      var roleLabelMap = {
        business:   'Join as a Business Partner',
        technician: 'Join as a Repair Technician',
        recycler:   'Join as a Recycler / Refurbisher'
      };

      var badge = document.querySelector('#signup-modal .modal-badge');
      var sub   = document.querySelector('#signup-modal .modal-sub');

      if (badge && roleLabelMap[role]) {
        badge.textContent = roleLabelMap[role];
      }
      if (sub && role !== 'consumer') {
        sub.textContent = 'Complete your partner application below.';
      }
    }
  }, 380); // matches the modal open focus delay
};
