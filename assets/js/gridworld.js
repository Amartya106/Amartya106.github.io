/* Gridworld strip. The page is an environment: a small agent walks the floor as
   you scroll, collecting a coin at each section, with an RL-style HUD
   (episode / step / return). Decorative; scrolling back to the top starts a new
   episode. Static sprite under prefers-reduced-motion. */

(function () {
  "use strict";

  var S = 4, ROWS = 18, GROUND = 10;               // pixel scale, strip height, floor row
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var AGENT = {
    idle: ["...XX...", ".XXXXXX.", "XXOXXOXX", "XXXXXXXX", ".XXXXXX.", ".XXXXXX.", ".XX..XX.", ".XX..XX."],
    walk: ["...XX...", ".XXXXXX.", "XXOXXOXX", "XXXXXXXX", ".XXXXXX.", ".XXXXXX.", "..XXXX..", "..XXXX.."]
  };
  var COIN = [".YYY.", "YYWYY", "YYWYY", "YYWYY", ".YYY."];

  var cv = document.createElement("canvas");
  cv.id = "gw-floor"; cv.setAttribute("aria-hidden", "true");
  var hud = document.createElement("div");
  hud.className = "gw-hud"; hud.setAttribute("aria-hidden", "true");
  document.body.appendChild(cv); document.body.appendChild(hud);
  var ctx = cv.getContext("2d");

  var Wl = 0, coins = [], got = 0, ep = 1, maxP = 0, p = 0, lastP = 0, dir = 1, frame = 0, moving = false, lastMove = 0, raf = 0, flash = 0;

  function css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }

  function targets() {
    var els = document.querySelectorAll(".mast, .section, .case, .prose h2");
    var vh = window.innerHeight, max = Math.max(1, document.documentElement.scrollHeight - vh), out = [];
    els.forEach(function (el) {
      var y = el.getBoundingClientRect().top + window.scrollY;
      var c = Math.min(1, Math.max(0.02, (y - 0.35 * vh) / max));
      if (!out.some(function (o) { return Math.abs(o - c) < 0.025; })) out.push(c);
    });
    return out.sort(function (a, b) { return a - b; });
  }

  function layout() {
    Wl = Math.ceil(window.innerWidth / S);
    cv.width = Wl; cv.height = ROWS;
    cv.style.width = window.innerWidth + "px"; cv.style.height = ROWS * S + "px";
    coins = targets().map(function (c) { return { c: c, taken: false }; });
    update(true);
  }

  function spriteX() { return Math.round(6 + p * (Wl - 8 - 12)); }
  function coinX(c) { return Math.round(6 + c * (Wl - 8 - 12)) + 1; }

  function sprite(rows, x, y, flip, pal) {
    for (var r = 0; r < rows.length; r++) for (var c = 0; c < rows[r].length; c++) {
      var ch = rows[r][flip ? rows[r].length - 1 - c : c];
      if (ch === ".") continue;
      ctx.fillStyle = pal[ch]; ctx.fillRect(x + c, y + r, 1, 1);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, Wl, ROWS);
    var grass = css("--gw-grass"), da = css("--gw-dirt-a"), db = css("--gw-dirt-b");
    ctx.fillStyle = grass; ctx.fillRect(0, GROUND, Wl, 1);
    for (var y = GROUND + 1; y < ROWS; y++) for (var x = 0; x < Wl; x++) {
      ctx.fillStyle = ((x >> 1) + (y >> 1)) % 2 ? da : db; ctx.fillRect(x, y, 1, 1);
    }
    var pal = { X: css("--gw-agent"), O: css("--gw-eye"), Y: css("--gw-coin"), W: "#ffffff" };
    coins.forEach(function (k) { if (!k.taken) sprite(COIN, coinX(k.c), GROUND - 7, false, pal); });
    sprite(moving && frame ? AGENT.walk : AGENT.idle, spriteX(), GROUND - 8, dir < 0, pal);
  }

  function hudText() {
    hud.textContent = "EP " + String(ep).padStart(2, "0") + "  STEP " + String(Math.floor(window.scrollY / 16)).padStart(4, "0") +
      "  R " + got + "/" + coins.length;
    hud.classList.toggle("gw-flash", flash > 0);
  }

  function update(silent) {
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    p = Math.min(1, Math.max(0, window.scrollY / max));
    if (p > maxP) maxP = p;
    if (p < 0.02 && maxP > 0.96) { ep++; maxP = 0; got = 0; coins.forEach(function (k) { k.taken = false; }); }
    coins.forEach(function (k) { if (!k.taken && p >= k.c) { k.taken = true; got++; if (!silent) flash = 6; } });
    if (Math.abs(p - lastP) > 1e-4) dir = p > lastP ? 1 : -1;
    lastP = p;
    draw(); hudText();
  }

  function loop(now) {
    raf = 0;
    moving = now - lastMove < 160;
    if (!reduced) frame = Math.floor(now / 110) % 2;
    if (flash > 0) flash--;
    draw(); hudText();
    if (moving || flash > 0) raf = requestAnimationFrame(loop);
  }

  function onScroll() {
    lastMove = performance.now();
    update(false);
    if (!reduced && !raf) raf = requestAnimationFrame(loop);
  }

  var rt;
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(layout, 150); });
  new MutationObserver(function () { draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  window.addEventListener("load", layout);
  layout();
})();
