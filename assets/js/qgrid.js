/* Fig. 1 — tabular Q-learning in a gridworld.
   The agent starts knowing nothing. Each step it picks an action epsilon-greedily, receives a
   reward (small step cost, a bump penalty, -10 for a pit, +10 for the goal) and updates
       Q(s,a) <- Q(s,a) + alpha * ( r + gamma * max_a' Q(s',a') - Q(s,a) )
   with no bootstrapping past a terminal state. Arrows show the greedy policy and the tint shows the
   learned state value. Click to add walls or pits or to move the goal and it re-learns; a second
   independent learner shares the same corridors. An illustration of the algorithm, not a result. */

(function () {
  "use strict";

  var canvas = document.getElementById("swarm");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var rEp = document.querySelector("[data-sim-edges]"), rSucc = document.querySelector("[data-sim-err]"), rEps = document.querySelector("[data-sim-t]"), rRet = document.querySelector("[data-q-ret]");
  var speedSel = document.getElementById("q-speed"), twoBox = document.getElementById("q-two"), resetBtn = document.getElementById("q-reset");

  var COLS = 12, ROWS = 7, FLOOR = 0, WALL = 1, PIT = 2, GOAL = 3;
  var MAP0 = ["S..#....P...", ".#.#.##...#.", ".#......#...", ".#####.P#.#.", "........#.G.", ".###.##...#.", ".......#P..."];
  var STARTS = [[0, 0], [0, 6]];
  var DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];                       // up, right, down, left
  var ALPHA = 0.25, GAMMA = 0.95, EPS_MIN = 0.04, EPS_DECAY = 0.985, STEP_R = -0.04, BUMP_R = -0.2, BLOCK_R = -0.5, PIT_R = -10, GOAL_R = 10, MAXSTEPS = 120;

  var learned = false, grid = [], agents = [], eps = 1, ep = 0, steps = 0, hist = [], wins = [], running = false, visible = true, last = 0, raf = 0, col = {};
  var w = 0, h = 0, dpr = 1, T = 20, mx = 0, my = 0, plot = null;

  var BOT = ["...XX...", ".XXXXXX.", "XXOXXOXX", "XXXXXXXX", ".XXXXXX.", ".XXXXXX.", ".XX..XX.", ".XX..XX."];
  var COIN = [".YYY.", "YYWYY", "YYWYY", "YYWYY", ".YYY."];

  function css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function colours() { ["ink", "paper", "paper-2", "accent", "rule", "ok", "gw-agent", "gw-eye", "gw-coin", "gw-dirt-a", "gw-dirt-b", "gw-grass"].forEach(function (k) { col[k] = css("--" + k); }); }
  function idx(x, y) { return y * COLS + x; }

  /* ----- environment ----- */
  function loadMap() {
    grid = [];
    for (var y = 0; y < ROWS; y++) for (var x = 0; x < COLS; x++) { var c = MAP0[y][x]; grid.push(c === "#" ? WALL : c === "P" ? PIT : c === "G" ? GOAL : FLOOR); }
  }
  function newAgent(i) { return { Q: new Float32Array(COLS * ROWS * 4), x: STARTS[i][0], y: STARTS[i][1], done: false, win: false, ret: 0 }; }
  function resetAll() {
    loadMap(); agents = [newAgent(0)]; if (twoBox && twoBox.checked) agents.push(newAgent(1));
    eps = 1; ep = 0; steps = 0; hist = []; wins = []; restartEpisode();
  }
  function restartEpisode() { agents.forEach(function (a, i) { a.x = STARTS[i][0]; a.y = STARTS[i][1]; a.done = false; a.win = false; a.ret = 0; }); steps = 0; }

  function argmax(Q, s) {
    var best = -1e9, ties = [], k;
    for (k = 0; k < 4; k++) { var v = Q[s * 4 + k]; if (v > best + 1e-9) { best = v; ties = [k]; } else if (Math.abs(v - best) <= 1e-9) ties.push(k); }
    return ties[Math.floor(Math.random() * ties.length)];
  }
  function maxQ(Q, s) { return Math.max(Q[s * 4], Q[s * 4 + 1], Q[s * 4 + 2], Q[s * 4 + 3]); }

  function stepAll() {
    for (var i = 0; i < agents.length; i++) {
      var a = agents[i]; if (a.done) continue;
      var s = idx(a.x, a.y), act = Math.random() < eps ? Math.floor(Math.random() * 4) : argmax(a.Q, s);
      var nx = a.x + DX[act], ny = a.y + DY[act], r = STEP_R;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || grid[idx(nx, ny)] === WALL) { nx = a.x; ny = a.y; r += BUMP_R; }
      else {
        for (var j = 0; j < agents.length; j++) if (j !== i && !agents[j].done && agents[j].x === nx && agents[j].y === ny) { nx = a.x; ny = a.y; r += BLOCK_R; break; }
      }
      a.x = nx; a.y = ny;
      var cell = grid[idx(nx, ny)], terminal = false;
      if (cell === PIT) { r = PIT_R; terminal = true; } else if (cell === GOAL) { r = GOAL_R; terminal = true; }
      var s2 = idx(nx, ny), target = r + (terminal ? 0 : GAMMA * maxQ(a.Q, s2));
      a.Q[s * 4 + act] += ALPHA * (target - a.Q[s * 4 + act]);
      a.ret += r; if (terminal) { a.done = true; a.win = cell === GOAL; }
    }
    steps++;
    if (agents.every(function (a) { return a.done; }) || steps >= MAXSTEPS) endEpisode();
  }
  function endEpisode() {
    hist.push(agents[0].ret); wins.push(agents[0].win ? 1 : 0); if (hist.length > 400) { hist.shift(); wins.shift(); }
    ep++; eps = Math.max(EPS_MIN, eps * EPS_DECAY); restartEpisode();
    if (!learned && ep >= 20 && successRate() >= 0.9) { learned = true; document.dispatchEvent(new CustomEvent("gw:learned")); }
  }
  function successRate() { var n = Math.min(20, wins.length); if (!n) return 0; var s = 0; for (var i = wins.length - n; i < wins.length; i++) s += wins[i]; return s / n; }

  /* ----- drawing ----- */
  function layout() {
    var r = canvas.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    T = Math.max(8, Math.floor(Math.min(w / COLS, h / ROWS))); mx = 8; my = Math.floor((h - T * ROWS) / 2);
    var mapW = T * COLS;
    if (w - mapW - mx >= 250) plot = { x: mx + mapW + 18, y: my, w: w - (mx + mapW + 18) - 8, h: T * ROWS };
    else if (h - T * ROWS >= 100) { mx = Math.floor((w - mapW) / 2); my = 4; plot = { x: 8, y: my + T * ROWS + 8, w: w - 16, h: h - (my + T * ROWS) - 14 }; }
    else { mx = Math.floor((w - mapW) / 2); plot = null; }
  }
  function sprite(rows, x, y, ps, pal) {
    for (var r = 0; r < rows.length; r++) for (var c = 0; c < rows[r].length; c++) { var ch = rows[r][c]; if (ch === ".") continue; ctx.fillStyle = pal[ch]; ctx.fillRect(x + c * ps, y + r * ps, ps, ps); }
  }
  function arrow(cx, cy, act, size, color) {
    ctx.fillStyle = color; ctx.beginPath();
    var dx = DX[act], dy = DY[act], px = -dy, py = dx;
    ctx.moveTo(cx + dx * size, cy + dy * size);
    ctx.lineTo(cx - dx * size * 0.6 + px * size * 0.7, cy - dy * size * 0.6 + py * size * 0.7);
    ctx.lineTo(cx - dx * size * 0.6 - px * size * 0.7, cy - dy * size * 0.6 - py * size * 0.7);
    ctx.closePath(); ctx.fill();
  }

  function draw() {
    var x, y, a0 = agents[0], ps = Math.max(1, Math.floor(T / 10));
    ctx.clearRect(0, 0, w, h);
    for (y = 0; y < ROWS; y++) for (x = 0; x < COLS; x++) {
      var px = mx + x * T, py = my + y * T, c = grid[idx(x, y)];
      ctx.fillStyle = (x + y) % 2 ? col["paper-2"] : col.paper; ctx.fillRect(px, py, T, T);
      if (c === WALL) {
        ctx.fillStyle = col["gw-dirt-a"]; ctx.fillRect(px, py, T, T);
        ctx.fillStyle = col["gw-dirt-b"]; ctx.fillRect(px, py + Math.floor(T / 2) - 1, T, 2); ctx.fillRect(px + Math.floor(T / 3), py, 2, Math.floor(T / 2)); ctx.fillRect(px + Math.floor(T * 2 / 3), py + Math.floor(T / 2), 2, Math.floor(T / 2));
        continue;
      }
      if (c === PIT) {
        ctx.fillStyle = "#0b1030"; ctx.fillRect(px + 2, py + 2, T - 4, T - 4); ctx.fillStyle = "#ff004d";
        for (var k = 0; k < 3; k++) { var bx = px + 4 + k * Math.floor((T - 8) / 3); ctx.beginPath(); ctx.moveTo(bx, py + T - 4); ctx.lineTo(bx + Math.floor((T - 8) / 6), py + T * 0.45); ctx.lineTo(bx + Math.floor((T - 8) / 3), py + T - 4); ctx.fill(); }
        continue;
      }
      if (c === GOAL) { sprite(COIN, px + Math.floor((T - 5 * ps * 1.6) / 2), py + Math.floor((T - 5 * ps * 1.6) / 2), Math.max(1, Math.floor(ps * 1.6)), { Y: col["gw-coin"], W: "#fff" }); continue; }
      // learned value tint + policy arrow
      var s = idx(x, y), v = maxQ(a0.Q, s);
      if (Math.abs(v) > 0.05) { ctx.globalAlpha = Math.min(0.55, Math.abs(v) / 10 * 0.8); ctx.fillStyle = v > 0 ? col.ok : "#ff004d"; ctx.fillRect(px, py, T, T); ctx.globalAlpha = 1; }
      if (Math.abs(v) > 0.02 || a0.Q[s * 4] !== a0.Q[s * 4 + 1]) {
        var best = 0; for (k = 1; k < 4; k++) if (a0.Q[s * 4 + k] > a0.Q[s * 4 + best]) best = k;
        ctx.globalAlpha = 0.9; arrow(px + T / 2, py + T / 2, best, Math.max(3, T * 0.2), col.ink); ctx.globalAlpha = 1;
      }
    }
    ctx.strokeStyle = col.rule; ctx.lineWidth = 1; ctx.strokeRect(mx - 0.5, my - 0.5, T * COLS + 1, T * ROWS + 1);
    // start marks
    ctx.fillStyle = col.ink; ctx.globalAlpha = 0.5;
    STARTS.slice(0, agents.length).forEach(function (st) { ctx.fillRect(mx + st[0] * T + 2, my + st[1] * T + 2, 4, 4); }); ctx.globalAlpha = 1;
    // agents
    agents.forEach(function (a, i) {
      if (a.done && !a.win) ctx.globalAlpha = 0.45;
      sprite(BOT, mx + a.x * T + Math.floor((T - 8 * ps) / 2), my + a.y * T + Math.floor((T - 8 * ps) / 2), ps, { X: i ? col["gw-coin"] : col["gw-agent"], O: col["gw-eye"] });
      ctx.globalAlpha = 1;
    });
    if (plot) drawPlot();
    if (rEp) rEp.textContent = ep;
    if (rSucc) rSucc.textContent = Math.round(successRate() * 100) + "%";
    if (rEps) rEps.textContent = eps.toFixed(2);
    if (rRet) rRet.textContent = hist.length ? hist[hist.length - 1].toFixed(1) : "–";
  }

  function drawPlot() {
    var p = plot, n = Math.min(hist.length, 80), i;
    ctx.fillStyle = col["paper-2"]; ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = col.rule; ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);
    ctx.fillStyle = col.ink; ctx.font = "10px 'Silkscreen', monospace"; ctx.fillText("RETURN / EPISODE", p.x + 8, p.y + 14);
    var gx = p.x + 8, gy = p.y + 24, gw = p.w - 16, gh = p.h - 56;
    if (gh < 20) return;
    function Y(v) { return gy + gh * (1 - (Math.max(-12, Math.min(12, v)) + 12) / 24); }
    ctx.strokeStyle = col.rule; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(gx, Y(0)); ctx.lineTo(gx + gw, Y(0)); ctx.stroke();
    ctx.strokeStyle = col.ok; ctx.beginPath(); ctx.moveTo(gx, Y(GOAL_R)); ctx.lineTo(gx + gw, Y(GOAL_R)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = col.ok; ctx.fillText("+10", gx + gw - 22, Y(GOAL_R) - 3);
    for (i = 0; i < n; i++) {
      var v = hist[hist.length - n + i], X = gx + (n > 1 ? gw * i / (n - 1) : 0);
      ctx.fillStyle = v > 0 ? col.ok : "#ff004d"; ctx.fillRect(Math.round(X) - 1, Math.round(Y(v)) - 1, 3, 3);
    }
    ctx.fillStyle = col.ink; ctx.fillText("ε", p.x + 8, p.y + p.h - 12);
    ctx.fillStyle = col.rule; ctx.fillRect(p.x + 22, p.y + p.h - 20, p.w - 30, 8);
    ctx.fillStyle = col.accent; ctx.fillRect(p.x + 22, p.y + p.h - 20, Math.max(2, (p.w - 30) * eps), 8);
  }

  /* ----- loop + controls ----- */
  function frame(now) {
    raf = 0; if (!running) return;
    last = now; var n = speedSel ? +speedSel.value : 3;
    for (var k = 0; k < n; k++) stepAll();
    draw(); raf = requestAnimationFrame(frame);
  }
  function start() { if (running || reduced || !visible || document.hidden) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
  function trainOffline(episodes) { var target = ep + episodes; var guard = 0; while (ep < target && guard++ < 400000) stepAll(); draw(); }

  function tool() { var r = document.querySelector('input[name="q-tool"]:checked'); return r ? r.value : "wall"; }
  canvas.addEventListener("pointerdown", function (e) {
    var r = canvas.getBoundingClientRect(), x = Math.floor((e.clientX - r.left - mx) / T), y = Math.floor((e.clientY - r.top - my) / T);
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return;
    var i = idx(x, y), isStart = STARTS.slice(0, agents.length).some(function (s) { return s[0] === x && s[1] === y; }), t = tool();
    if (isStart || grid[i] === GOAL && t !== "goal") return;
    if (t === "wall") grid[i] = grid[i] === WALL ? FLOOR : WALL;
    else if (t === "pit") grid[i] = grid[i] === PIT ? FLOOR : PIT;
    else if (t === "erase") grid[i] = FLOOR;
    else if (t === "goal") { if (grid[i] === WALL) return; for (var k = 0; k < grid.length; k++) if (grid[k] === GOAL) grid[k] = FLOOR; grid[i] = GOAL; }
    eps = Math.max(eps, 0.35); restartEpisode();
    document.dispatchEvent(new CustomEvent("gw:edited"));
    if (reduced) trainOffline(200); else draw();
  });
  if (resetBtn) resetBtn.addEventListener("click", function () { resetAll(); if (reduced) trainOffline(200); else draw(); });
  if (twoBox) twoBox.addEventListener("change", function () { resetAll(); if (reduced) trainOffline(200); else draw(); });
  window.addEventListener("resize", function () { layout(); draw(); });
  document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
  new MutationObserver(function () { colours(); draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; visible ? start() : stop(); }).observe(canvas);

  colours(); layout(); resetAll();
  if (reduced) trainOffline(200); else { draw(); start(); }
})();
