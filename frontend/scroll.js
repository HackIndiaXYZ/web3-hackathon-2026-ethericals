/**
 * SharpKit — Scroll Animation Engine
 * Uses IntersectionObserver (no library needed).
 * Classes:
 *   sr        — fade up on enter
 *   sr-scale  — scale + fade on enter
 *   sr-left   — slide from left
 *   sr-right  — slide from right
 *   sr-d1..5  — stagger delays (80ms increments)
 *   count-up  — animates textContent as a number when visible
 */
(function () {
  "use strict";

  /* ── Observer ── */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add("in");
        if (el.dataset.countTo) animateCount(el);
        io.unobserve(el);
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -32px 0px" }
  );

  /* ── Observe all animated elements ── */
  function observe() {
    document
      .querySelectorAll(".sr, .sr-scale, .sr-left, .sr-right, .count-up")
      .forEach((el) => io.observe(el));
  }

  /* ── Number count-up ── */
  function animateCount(el) {
    const raw = el.dataset.countTo;
    // Strip non-numeric suffix (e.g. "1,325 SHRP" → "1325")
    const target = parseFloat(raw.replace(/,/g, "")) || 0;
    const suffix = raw.replace(/[\d,\.]/g, "").trim();
    const duration = 1200;
    const start = performance.now();

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(ease * target);
      el.textContent =
        current.toLocaleString() + (suffix ? " " + suffix : "");
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ── Auto-stagger children of .sr-group ── */
  function staggerGroups() {
    document.querySelectorAll(".sr-group").forEach((group) => {
      Array.from(group.children).forEach((child, i) => {
        child.classList.add("sr-scale");
        if (i > 0) child.classList.add(`sr-d${Math.min(i, 5)}`);
        io.observe(child);
      });
    });
  }

  /* ── Parallax on .parallax elements ── */
  function initParallax() {
    const els = document.querySelectorAll(".parallax");
    if (!els.length) return;
    window.addEventListener(
      "scroll",
      () => {
        const sy = window.scrollY;
        els.forEach((el) => {
          const speed = parseFloat(el.dataset.speed || "0.3");
          el.style.transform = `translateY(${sy * speed}px)`;
        });
      },
      { passive: true }
    );
  }

  /* ── Page entrance — first visible section fades in immediately ── */
  function pageEntrance() {
    document.querySelectorAll(".sr-hero").forEach((el) => {
      // Small rAF delay so CSS transitions fire correctly after paint
      requestAnimationFrame(() => {
        requestAnimationFrame(() => el.classList.add("in"));
      });
    });
  }

  /* ── Expose observer so dynamic content (e.g. marketplace cards) can re-observe ── */
  window._scrollObserver = io;

  /* ── Init ── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function init() {
    staggerGroups();
    observe();
    initParallax();
    pageEntrance();
  }
})();
