/* Fig. 1 — illustrative multi-agent consensus / formation.
   Single-integrator agents. Each agent uses only neighbours inside its
   communication radius R:   u_i = k_c Σ_j (x_j − x_i − (d_j − d_i)) + k_l (ℓ − x_i)
   where d_i is the agent's slot on a ring around the leader point ℓ.
   This is a protocol demo, not a learned policy and not a result. */

(function () {
  "use strict";

  var canvas = document.getElementById("swarm");
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext("2d");
  var N = 24;
  var R = 0.34;            // comm radius, fraction of min(w,h)
  var KC = 1.6, KL = 0.9;  // consensus and leader gains
  var RING = 0.26;         // ring radius, fraction of min(w,h)

  var reduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var w = 0, h = 0, dpr = 1, s = 1;
  var agents = [];
  var leader = { x: 0, y: 0, set: false };
  var running = false, visible = true, last = 0, raf = 0;
  var readEdges = document.querySelector("[data-sim-edges]");
  var readErr = document.querySelector("[data-sim-err]");
  var readT = document.querySelector("[data-sim-t]");
  var t0 = 0;

  function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  var col = {};
  function readColours() {
    col.ink = css("--ink"); col.muted = css("--muted"); col.rule = css("--rule"); col.accent = css("--accent");
  }

  function scatter() {
    agents = [];
    for (var i = 0; i < N; i++) {
      agents.push({
        x: Math.random() * w, y: Math.random() * h,
        a: (i / N) * Math.PI * 2   // ring slot angle
      });
    }
    t0 = performance.now();
  }

  function resize() {
    var r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height; s = Math.min(w, h);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!leader.set) { leader.x = w / 2; leader.y = h / 2; }
    if (!agents.length) scatter();
  }

  function step(dt) {
    var r2 = (R * s) * (R * s), rr = RING * s, i, j;
    var ux = new Array(N), uy = new Array(N);
    for (i = 0; i < N; i++) {
      var a = agents[i], dxi = Math.cos(a.a) * rr, dyi = Math.sin(a.a) * rr;
      var sx = 0, sy = 0;
      for (j = 0; j < N; j++) {
        if (i === j) continue;
        var b = agents[j], dx = b.x - a.x, dy = b.y - a.y;
        if (dx * dx + dy * dy > r2) continue;
        sx += dx - (Math.cos(b.a) * rr - dxi);
        sy += dy - (Math.sin(b.a) * rr - dyi);
      }
      ux[i] = KC * sx + KL * (leader.x + dxi - a.x);
      uy[i] = KC * sy + KL * (leader.y + dyi - a.y);
    }
    // Slots rotate slowly so the formation visibly stays "alive".
    for (i = 0; i < N; i++) {
      agents[i].x += ux[i] * dt * 0.9;
      agents[i].y += uy[i] * dt * 0.9;
      agents[i].a += dt * 0.12;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    var r2 = (R * s) * (R * s), i, j, edges = 0, err = 0;

    ctx.lineWidth = 1;
    ctx.strokeStyle = col.rule;
    ctx.beginPath();
    for (i = 0; i < N; i++) {
      for (j = i + 1; j < N; j++) {
        var dx = agents[j].x - agents[i].x, dy = agents[j].y - agents[i].y;
        if (dx * dx + dy * dy <= r2) {
          edges++;
          ctx.moveTo(agents[i].x, agents[i].y);
          ctx.lineTo(agents[j].x, agents[j].y);
        }
      }
    }
    ctx.stroke();

    // leader marker
    ctx.strokeStyle = col.muted;
    ctx.beginPath();
    ctx.moveTo(leader.x - 6, leader.y); ctx.lineTo(leader.x + 6, leader.y);
    ctx.moveTo(leader.x, leader.y - 6); ctx.lineTo(leader.x, leader.y + 6);
    ctx.stroke();

    var rr = RING * s;
    for (i = 0; i < N; i++) {
      var a = agents[i];
      var ex = a.x - (leader.x + Math.cos(a.a) * rr), ey = a.y - (leader.y + Math.sin(a.a) * rr);
      err += Math.sqrt(ex * ex + ey * ey);
      ctx.fillStyle = i === 0 ? col.accent : col.ink;
      ctx.beginPath();
      ctx.arc(a.x, a.y, i === 0 ? 4.2 : 3, 0, Math.PI * 2);
      ctx.fill();
    }

    if (readEdges) readEdges.textContent = edges;
    if (readErr) readErr.textContent = (err / N / s).toFixed(3);
    if (readT) readT.textContent = ((performance.now() - t0) / 1000).toFixed(1) + " s";
  }

  function frame(now) {
    raf = 0;
    if (!running) return;
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    step(dt);
    draw();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduced || !visible || document.hidden) return;
    running = true; last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

  function point(e) {
    var r = canvas.getBoundingClientRect();
    leader.x = e.clientX - r.left; leader.y = e.clientY - r.top; leader.set = true;
  }
  canvas.addEventListener("pointermove", point);
  canvas.addEventListener("pointerdown", function (e) { point(e); scatter(); });
  canvas.addEventListener("pointerleave", function () { leader.set = false; leader.x = w / 2; leader.y = h / 2; });

  window.addEventListener("resize", function () { resize(); if (reduced) settle(); });
  document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
  new MutationObserver(function () { readColours(); if (!running) draw(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      visible ? start() : stop();
    }).observe(canvas);
  }

  // Reduced motion: integrate to convergence off-screen and draw one frame.
  function settle() {
    for (var k = 0; k < 600; k++) step(1 / 30);
    draw();
  }

  readColours();
  resize();
  if (reduced) { settle(); } else { start(); }
})();
