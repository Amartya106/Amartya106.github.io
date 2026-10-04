/* Pixel content: a 16x16 icon for each project, RPG-style callout boxes that reveal line by line,
   and a small achievements system whose progress is remembered in the browser.
   Everything here is additive: the page is complete without it. */

(function () {
  "use strict";

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- icons ---------- */
  var PAL = { B: "#29adff", S: "#c2c3c7", Y: "#ffec27", C: "#29adff", G: "#00e436", R: "#ff004d", O: "#ffa300", W: "#fff1e8", N: "#ab5236", K: "#1d2b53" };
  var ICONS = {
    arm: ["................", "................", "............CCC.", "......YYY...CCC.", "......YYYSSSCC..", "......YYYSSSCCC.", ".......SS...CCC.", ".......SS.......", ".......SS.......", "......YYY.......", ".....BYYYBB.....", ".....BYYYBB.....", "..BBBBBBBBBBBB..", "..BBBBBBBBBBBB..", "................", "................"],
    drone: ["................", "...G........G...", "..GGG......GGG..", ".GGGGG....GGGGG.", "..GGS......SGG..", "...G.S....S.G...", "......BBBB......", "......BYYB......", "......BYYB......", "......BBBB......", "...G.S....S.G...", "..GGS......SGG..", ".GGGGG....GGGGG.", "..GGG......GGG..", "...G........G...", "................"],
    shield: ["................", "...CCCCCCCCCC...", "...CCCCCCCCCC...", "...CCCCWWCCCC...", "...CCCCWWCCCC...", "...CCWWWWWWCC...", "...CCWWWWWWCC...", "...CCCCWWCCCC...", "...CCCCWWCCCC...", "....CCCWWCCC....", "....CCCCCCCC....", ".....CCCCCC.....", "......CCCC......", ".......CC.......", "................", "................"],
    pin: ["................", "........R.......", "......RRRRR.....", ".....RRRRRRR....", ".....RRRWRRR....", "....RRRWWWRRR...", ".....RRRWRRR....", ".....RRRRRRR....", "......RRRRR.....", ".......RR.......", ".......RR.......", ".......RR.......", "................", "..GGGGGGGGGGGG..", ".GG..........GG.", "................"],
    cartpole: ["........O.......", ".......OOO......", "......OOOOO.....", ".......OOO......", "........RR......", "........RR......", "........RR......", "........RR......", "........RR......", "..BBBBBBBBBBBB..", "..BBBBBBBBBBBB..", "..BBBBBBBBBBBB..", "..BBBBBBBBBBBB..", "...SSS....SSS...", "...SSS....SSS...", "................"],
    chair: ["................", "...NNNNNN.......", "...NNNNNN.......", "...NN...........", "...NN...........", "...NN...........", "...NN...........", "...YYYYYYYYYY...", "...YYYYYYYYYY...", "...NN......NN...", "...NN......NN...", "...NN......NN...", "...NN......NN...", "...NN......NN...", "................", "................"],
    chip: ["................", "....S..S..S.....", "....S..S..S.....", "...BBBBBBBBBB...", ".SSBBBBBBBBBBSS.", "...BBGGGGGGBB...", "...BBGGGGGGBB...", ".SSBBGGYYGGBBSS.", "...BBGGYYGGBB...", "...BBGGGGGGBB...", ".SSBBGGGGGGBBSS.", "...BBBBBBBBBB...", "...BBBBBBBBBB...", "....S..S..S.....", "....S..S..S.....", "................"],
    rover: ["............R...", "............S...", "............S...", "............S...", "....BBBBBBBBS...", "....BYYYBCCCB...", "....BYYYBCCCB...", "....BYYYBCCCB...", "....BBBBBBBBB...", "................", "..SSS.SSS.SSS...", "..SKS.SKS.SKS...", "..SKS.SKS.SKS...", "..SSS.SSS.SSS...", "................", "................"],
    eye: ["................", "................", "................", "................", ".....WWWWWW.....", "...WWWWWCWWWW...", "..WWWWWCCCWWWW..", ".WWWWWCKKCCWWWW.", ".WWWWWWKKCWWWWW.", "..WWWWWWCWWWWW..", "...WWWWWWWWWW...", ".....WWWWWW.....", "................", "................", "................", "................"],
    wave: ["................", "..S.............", "..S.............", "..S...GG........", "..S..GGGG.......", "..S..G..G.......", "..S.G....G......", "..S.G....G......", ".SSGSSSSSSSSSSSS", "..SG......G.....", "..S.......G.....", "..S........G....", "..S........GG.G.", "..S.........GGG.", "..S..........G..", "................"],
    nodes: ["................", "............C...", "....C......CCC..", "...CCC....CCCCC.", "..CCCCC....CCC..", "...CCC....S.C...", "....C.S.G.S.....", "....S..GGG......", "....S.GGGGG.....", "...S...GGG......", "...C....G.S.Y...", "..CCC......YYY..", ".CCCCC....YYYYY.", "..CCC......YYY..", "...C........Y...", "................"],
    flame: ["................", "........OO......", "........OOO.....", ".......OOOO.....", "......OOOOOO....", ".....OOOOOOO....", "....OOOOOOOOO...", "....OOYYYYYOO...", "...OOOYYYYYOO...", "...OOOYYYYYOO...", "...OOOYWWWYOO...", "....OOYWWWYO....", ".....OYWWWY.....", "......OOOO......", "................", "................"],
    star: ["................", "........Y.......", ".......YY.......", "........Y.......", "......YYYY......", "........Y.......", "..YYYYYYYYYYYY..", "...YYYYYYYYYY...", "....YYYYYYYY....", ".....YYYYYY.....", ".....YYYYYY.....", "....YYY.Y.YYY...", "...YYY..Y.YYY...", "........Y.......", "........Y.......", "................"]
  };
  var BY_SLUG = {
    "manipulator-rl": "arm", "px4-rotor-failure": "drone", "safe-rl-nav": "shield", "slam-nav-mecanum": "pin", "rl-cartpole-dqn": "cartpole",
    "chair-occupation": "chair", "uno-q-vision-servo": "chip", "irc-rover": "rover", "computer-vision-algorithms": "eye",
    "modern-control-engineering": "wave", "ros2-learning": "nodes", "neural-network-from-scratch": "nodes", "pytorch-implementation": "flame"
  };

  function slugOf(href) { var m = /\/([^\/]+)\/?$/.exec((href || "").replace(/[#?].*$/, "")); return m ? m[1] : ""; }
  function iconEl(name, size) {
    var rows = ICONS[name] || ICONS.star, c = document.createElement("canvas");
    c.width = 16; c.height = 16; c.className = "px-icon"; c.style.width = c.style.height = size + "px"; c.setAttribute("aria-hidden", "true");
    var g = c.getContext("2d");
    for (var y = 0; y < 16; y++) for (var x = 0; x < 16; x++) { var ch = rows[y][x]; if (ch === ".") continue; g.fillStyle = PAL[ch]; g.fillRect(x, y, 1, 1); }
    return c;
  }

  document.querySelectorAll(".index a.row").forEach(function (row) {
    var t = row.querySelector(".t"); if (!t) return;
    t.insertBefore(iconEl(BY_SLUG[slugOf(row.getAttribute("href"))] || "star", 28), t.firstChild);
  });
  var h1 = document.querySelector(".case h1");
  if (h1) { var slug = slugOf(location.pathname); if (BY_SLUG[slug]) { var big = iconEl(BY_SLUG[slug], 44); big.classList.add("px-icon-big"); h1.parentNode.insertBefore(big, h1); } }

  /* ---------- dialogue boxes: reveal line by line ---------- */
  document.querySelectorAll(".callout").forEach(function (box) {
    box.classList.add("dlg");
    if (reduced || !("IntersectionObserver" in window)) return;
    var lh = parseFloat(getComputedStyle(box).lineHeight) || 24;
    var io = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return; io.disconnect();
      var inner = box.querySelector("p") || box, lines = Math.max(1, Math.round(inner.getBoundingClientRect().height / lh));
      inner.style.setProperty("--lines", lines); inner.classList.add("dlg-type");
      inner.style.animationDuration = Math.min(3.2, 0.35 + lines * 0.32) + "s";
    }, { threshold: 0.6 });
    box.querySelector("p") && box.querySelector("p").classList.add("dlg-hide"); io.observe(box);
  });

  /* ---------- achievements ---------- */
  var KEY = "gw-achievements", LIST = {
    coins: "Collected every coin", learner: "Watched an agent learn", builder: "Edited the world", reader: "Read a case study", explorer: "Visited three pages"
  };
  var got = {};
  try { got = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { got = {}; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(got)); } catch (e) { /* private mode: progress stays in memory */ } }

  var toastEl = null, badge = document.createElement("span");
  badge.className = "ach-count"; var foot = document.querySelector(".footer-inner");
  if (foot) { foot.appendChild(badge); }
  function refresh() { var n = Object.keys(got).length, tot = Object.keys(LIST).length; badge.textContent = "ACHIEVEMENTS " + n + "/" + tot; badge.title = Object.keys(LIST).map(function (k) { return (got[k] ? "\u2713 " : "\u25a1 ") + LIST[k]; }).join("\n"); }
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "ach-toast"; toastEl.setAttribute("role", "status"); document.body.appendChild(toastEl); }
    toastEl.innerHTML = ""; var s = document.createElement("span"); s.textContent = "ACHIEVEMENT UNLOCKED"; var b = document.createElement("b"); b.textContent = msg;
    toastEl.appendChild(iconEl("star", 24)); var w = document.createElement("div"); w.appendChild(s); w.appendChild(b); toastEl.appendChild(w);
    toastEl.classList.remove("show"); void toastEl.offsetWidth; toastEl.classList.add("show");
    clearTimeout(toast.t); toast.t = setTimeout(function () { toastEl.classList.remove("show"); }, 4200);
  }
  function unlock(id) { if (got[id] || !LIST[id]) return; got[id] = Date.now(); save(); refresh(); toast(LIST[id]); }
  refresh();

  document.addEventListener("gw:allcoins", function () { unlock("coins"); });
  document.addEventListener("gw:learned", function () { unlock("learner"); });
  document.addEventListener("gw:edited", function () { unlock("builder"); });

  // reader: stayed on a case study for 12 s or scrolled most of the way down it
  if (/\/projects\/[^\/]+\/?$/.test(location.pathname)) {
    setTimeout(function () { unlock("reader"); }, 12000);
    window.addEventListener("scroll", function () { var max = document.documentElement.scrollHeight - innerHeight; if (max > 0 && scrollY / max > 0.6) unlock("reader"); }, { passive: true });
  }
  // explorer: three distinct pages
  try {
    var seen = JSON.parse(sessionStorage.getItem("gw-seen") || "[]"); if (seen.indexOf(location.pathname) === -1) seen.push(location.pathname);
    sessionStorage.setItem("gw-seen", JSON.stringify(seen)); if (seen.length >= 3) unlock("explorer");
  } catch (e) { /* storage unavailable */ }
})();
