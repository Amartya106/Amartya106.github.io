/* Amartya Mishra — portfolio
   Theme toggle, project filtering, scroll reveal. No dependencies. */

(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  /* --- Theme ------------------------------------------------------------ */

  var root = document.documentElement;

  function label(theme) {
    var btn = document.querySelector(".theme-toggle");
    if (btn) {
      btn.setAttribute(
        "aria-label",
        theme === "light" ? "Switch to dark theme" : "Switch to light theme"
      );
    }
  }

  var toggle = document.querySelector(".theme-toggle");
  if (toggle) {
    // Only persist once the visitor actually picks a side; until then the
    // system preference (applied by the inline head script) stays in charge.
    toggle.addEventListener("click", function () {
      var next =
        root.getAttribute("data-theme") === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      label(next);
      try {
        localStorage.setItem("theme", next);
      } catch (e) {
        /* private mode — the in-page choice still applies */
      }
    });
    label(root.getAttribute("data-theme"));
  }

  /* --- Project filtering ------------------------------------------------ */

  var filters = document.querySelectorAll("[data-filter]");
  var counter = document.querySelector("[data-filter-count]");

  if (filters.length) {
    filters.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var tag = btn.getAttribute("data-filter");

        filters.forEach(function (b) {
          b.setAttribute("aria-pressed", String(b === btn));
        });

        var shown = 0;
        document.querySelectorAll("[data-tags]").forEach(function (card) {
          var tags = card.getAttribute("data-tags").split(" ");
          var match = tag === "all" || tags.indexOf(tag) !== -1;
          card.hidden = !match;
          if (match) shown++;
        });

        // Hide a group heading when the filter empties its grid entirely.
        document.querySelectorAll("[data-group]").forEach(function (group) {
          var visible = group.querySelectorAll("[data-tags]:not([hidden])");
          group.hidden = visible.length === 0;
        });

        if (counter) {
          counter.textContent =
            shown + (shown === 1 ? " project" : " projects");
        }
      });
    });
  }

  /* --- Scroll reveal ---------------------------------------------------- */

  var reveals = document.querySelectorAll(".reveal");

  if (!reveals.length) return;

  var reduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) {
      el.classList.add("in");
    });
    return;
  }

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
  );

  reveals.forEach(function (el, i) {
    el.style.transitionDelay = Math.min(i % 3, 2) * 70 + "ms";
    io.observe(el);
  });
})();
