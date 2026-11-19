/* ==========================================================
   Physics in CSE — presentation engine + interactive demos
   ========================================================== */
(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const SVGNS = "http://www.w3.org/2000/svg";
  const svgEl = (tag, attrs = {}) => {
    const el = document.createElementNS(SVGNS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  };

  const stage = $("#stage");
  const viewport = $("#viewport");
  const slides = $$(".slide");
  const TOTAL = slides.length;
  let current = 0;

  /* ---------- Fit 1600×900 stage into the viewport ---------- */
  function fit() {
    const w = viewport.clientWidth, h = viewport.clientHeight;
    const s = Math.min(w / 1600, h / 900);
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
  }
  window.addEventListener("resize", fit);
  [stage, viewport].forEach((el) => el.addEventListener("scroll", () => { el.scrollTop = 0; el.scrollLeft = 0; }));
  viewport.addEventListener("transitionend", fit);
  fit();

  /* ---------- Per-slide modules (start/stop on enter/leave) ---------- */
  const modules = {};

  /* Simple animation loop helper */
  function loop(fn) {
    let id = null, last = 0;
    const tick = (t) => {
      const dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
      last = t;
      fn(dt, t);
      id = requestAnimationFrame(tick);
    };
    return {
      start() { if (id === null) { last = 0; id = requestAnimationFrame(tick); } },
      stop() { if (id !== null) cancelAnimationFrame(id); id = null; }
    };
  }

  /* ==========================================================
     Navigation
     ========================================================== */
  const dotsWrap = $("#dots");
  const dots = [];
  [1, 2, 3, 4].forEach((sp) => {
    const g = document.createElement("div");
    g.className = "dot-group";
    slides.forEach((sl, i) => {
      if (+sl.dataset.speaker !== sp) return;
      const d = document.createElement("button");
      d.className = "dot";
      d.title = `Slide ${i + 1}: ${NOTES[i].title}`;
      d.setAttribute("aria-label", d.title);
      d.addEventListener("click", () => go(i));
      g.appendChild(d);
      dots[i] = d;
    });
    dotsWrap.appendChild(g);
  });

  function go(n) {
    n = Math.max(0, Math.min(TOTAL - 1, n));
    const prev = current;
    if (modules[prev] && modules[prev].leave && n !== prev) modules[prev].leave();
    current = n;
    slides.forEach((s, i) => {
      s.classList.toggle("active", i === n);
      s.classList.toggle("before", i < n);
      s.setAttribute("aria-hidden", i === n ? "false" : "true");
      if (i !== n) s.setAttribute("inert", ""); else s.removeAttribute("inert");
    });
    dots.forEach((d, i) => { d.classList.toggle("active", i === n); d.classList.toggle("seen", i < n); });
    $("#progressBar").style.width = ((n + 1) / TOTAL) * 100 + "%";
    $("#counter").innerHTML = `<b>${String(n + 1).padStart(2, "0")}</b> / ${TOTAL}`;
    const sp = SPEAKERS[+slides[n].dataset.speaker - 1];
    const chip = $("#speakerChip");
    chip.querySelector(".num").textContent = sp.id;
    chip.querySelector(".who").textContent = sp.name;
    chip.querySelector(".topic").textContent = sp.topic;
    $("#prevBtn").disabled = n === 0;
    $("#nextBtn").disabled = n === TOTAL - 1;
    if (history.replaceState) history.replaceState(null, "", "#" + (n + 1));
    renderNotes();
    if (modules[n] && modules[n].enter) modules[n].enter();
  }
  const next = () => go(current + 1);
  const prev = () => go(current - 1);

  $("#nextBtn").addEventListener("click", next);
  $("#prevBtn").addEventListener("click", prev);

  document.addEventListener("keydown", (e) => {
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" && e.target.type === "text") {
      if (e.key === "Escape") e.target.blur();
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    switch (e.key) {
      case "ArrowRight": case "PageDown": case " ": case "Spacebar":
        e.preventDefault(); next(); break;
      case "ArrowLeft": case "PageUp":
        e.preventDefault(); prev(); break;
      case "Home": e.preventDefault(); go(0); break;
      case "End": e.preventDefault(); go(TOTAL - 1); break;
      case "n": case "N": toggleNotes(); break;
      case "f": case "F": toggleFullscreen(); break;
      case "Escape": if (document.body.classList.contains("notes-open")) toggleNotes(false); break;
    }
  });

  // Mouse clicks should not leave focus on buttons (so Space always means "next")
  document.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b && e.detail > 0) b.blur();
  });
  // Range sliders: keep arrow keys for navigation after mouse use
  $$('input[type="range"]').forEach((r) => r.addEventListener("pointerup", () => r.blur()));

  /* Touch swipe */
  let tx = null, ty = null;
  stage.addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener("touchend", (e) => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && !e.target.closest("input,button")) (dx < 0 ? next : prev)();
    tx = null;
  });

  /* Fullscreen */
  function toggleFullscreen() {
    if (!document.fullscreenElement) (document.documentElement.requestFullscreen || function () {}).call(document.documentElement);
    else document.exitFullscreen && document.exitFullscreen();
  }
  $("#fsBtn").addEventListener("click", toggleFullscreen);
  document.addEventListener("fullscreenchange", () => { setTimeout(fit, 60); idleKick(); });

  /* Hide controls when idle in fullscreen */
  let idleTimer = null;
  function idleKick() {
    document.body.classList.remove("idle");
    clearTimeout(idleTimer);
    if (document.fullscreenElement && !document.body.classList.contains("notes-open")) {
      idleTimer = setTimeout(() => document.body.classList.add("idle"), 2500);
    }
  }
  document.addEventListener("mousemove", idleKick);

  /* ==========================================================
     Speaker notes + practice timer
     ========================================================== */
  const words = (t) => t.trim().split(/\s+/).length;
  const speakerWords = {};
  NOTES.forEach((n) => { speakerWords[n.speaker] = (speakerWords[n.speaker] || 0) + words(n.script); });
  const WPM = 105; // calm, clear speaking pace

  function renderNotes() {
    const n = NOTES[current];
    const sp = SPEAKERS[n.speaker - 1];
    const w = words(n.script);
    const secs = Math.round((w / WPM) * 60);
    const spSecs = Math.round((speakerWords[n.speaker] / WPM) * 60);
    const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    const nextNote = NOTES[current + 1];
    const handoff = nextNote && nextNote.speaker !== n.speaker;
    const idxInSpeaker = NOTES.filter((x, i) => x.speaker === n.speaker && i <= current).length;
    $("#notesContent").innerHTML = `
      <div class="n-speaker"><span class="num">${sp.id}</span><div><b>${sp.name}</b><span>${sp.topic} · slide ${idxInSpeaker} of 3</span></div></div>
      <div class="n-title">Slide ${current + 1}: <b>${n.title}</b></div>
      <p class="n-script">${n.script}</p>
      <div class="n-cue">${n.cue}</div>
      <div class="n-meta">${w} words · about ${fmt(secs)} for this slide · ${sp.name} total: ${speakerWords[n.speaker]} words ≈ ${fmt(spSecs)}</div>
      ${handoff ? `<div class="n-handoff">Hand over to ${SPEAKERS[nextNote.speaker - 1].name} after this slide.</div>` : ""}
      ${nextNote ? `<div class="n-next">Next: <b>${nextNote.title}</b></div>` : `<div class="n-next"><b>End of presentation.</b></div>`}
    `;
  }

  function toggleNotes(force) {
    const open = typeof force === "boolean" ? force : !document.body.classList.contains("notes-open");
    document.body.classList.toggle("notes-open", open);
    $("#notesBtn").setAttribute("aria-pressed", open);
    setTimeout(fit, 470);
    idleKick();
  }
  $("#notesBtn").addEventListener("click", () => toggleNotes());
  $("#notesClose").addEventListener("click", () => toggleNotes(false));

  // Practice timer (goal 2:00)
  let tRunning = false, tStartAt = 0, tElapsed = 0, tInt = null;
  function tRender() {
    const ms = tElapsed + (tRunning ? Date.now() - tStartAt : 0);
    const s = Math.floor(ms / 1000);
    const c = $("#clock");
    c.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    c.classList.toggle("warn", s >= 105 && s < 120);
    c.classList.toggle("over", s >= 120);
    $("#tBar").style.width = Math.min(100, (s / 120) * 100) + "%";
  }
  $("#tStart").addEventListener("click", () => {
    if (tRunning) { tElapsed += Date.now() - tStartAt; tRunning = false; clearInterval(tInt); $("#tStart").textContent = "Start"; }
    else { tStartAt = Date.now(); tRunning = true; tInt = setInterval(tRender, 250); $("#tStart").textContent = "Pause"; }
    tRender();
  });
  $("#tReset").addEventListener("click", () => { tElapsed = 0; tStartAt = Date.now(); tRender(); });

  /* ==========================================================
     Slide 3 — Why physics: step highlighter
     ========================================================== */
  (function () {
    const steps = $$("#whySteps .step");
    const comps = $$("#pcSvg .comp");
    let i = 0, timer = null, pinned = false;
    function show(n) {
      i = n;
      steps.forEach((s, k) => s.classList.toggle("on", k === n));
      // keep earlier parts lit so the chain builds up
      comps.forEach((c) => c.classList.toggle("on", +c.dataset.step <= n));
    }
    function auto() { clearInterval(timer); timer = setInterval(() => { if (!pinned) show((i + 1) % 4); }, 2600); }
    steps.forEach((s) => s.addEventListener("click", () => { pinned = true; show(+s.dataset.step); clearTimeout(s._t); s._t = setTimeout(() => (pinned = false), 6000); }));
    modules[2] = {
      enter() { pinned = false; show(0); auto(); },
      leave() { clearInterval(timer); }
    };
  })();

  /* ==========================================================
     Slide 4 — Electricity: moving charges + Ohm's law
     ========================================================== */
  (function () {
    const path = $("#loopPath");
    const g = $("#charges");
    const slider = $("#voltSlider");
    const led = $("#led"), ledGlow = $("#ledGlow");
    const R = 10;
    const N = 34;
    let L = 0, offset = 0, current = 0.6;
    const dots = [];
    function build() {
      L = path.getTotalLength();
      for (let k = 0; k < N; k++) { const c = svgEl("circle", { r: 6, class: "charge" }); g.appendChild(c); dots.push(c); }
    }
    function update() {
      const V = +slider.value;
      current = V / R;
      $("#vOut").innerHTML = V.toFixed(1) + "<em>V</em>";
      $("#iOut").innerHTML = current.toFixed(2) + "<em>A</em>";
      const k = current / 1.2; // 0..1
      led.style.fill = k === 0 ? "" : `rgba(233, 251, 255, ${0.25 + 0.75 * k})`;
      ledGlow.setAttribute("opacity", (0.6 * k).toFixed(2));
      ledGlow.setAttribute("r", 40 + 40 * k);
      dots.forEach((d) => d.setAttribute("opacity", k === 0 ? 0.35 : 1));
    }
    slider.addEventListener("input", update);
    const lp = loop((dt) => {
      offset = (offset + dt * current * 260) % L;
      for (let k = 0; k < N; k++) {
        const p = path.getPointAtLength((offset + (k * L) / N) % L);
        dots[k].setAttribute("cx", p.x); dots[k].setAttribute("cy", p.y);
      }
    });
    build(); update();
    modules[3] = { enter() { lp.start(); }, leave() { lp.stop(); } };
  })();

  /* ==========================================================
     Slide 5 — Transistor switch + byte builder
     ========================================================== */
  (function () {
    const demo = $("#trDemo");
    const tgl = $("#trToggle");
    const eg = $("#trElectrons");
    const route = svgEl("path", { d: "M10 140 H105 V161 H315 V140 H420", fill: "none" });
    eg.appendChild(route);
    const L = route.getTotalLength();
    const N = 14, es = [];
    for (let k = 0; k < N; k++) { const c = svgEl("circle", { r: 5, class: "e" }); eg.appendChild(c); es.push(c); }
    let on = false, off = 0;
    function set(v) {
      on = v;
      demo.classList.toggle("on", on);
      tgl.setAttribute("aria-pressed", on);
      $("#bigBit").textContent = on ? "1" : "0";
      $("#bitLabel").textContent = on ? "ON = 1" : "OFF = 0";
    }
    tgl.addEventListener("click", () => set(!on));
    const lp = loop((dt) => {
      if (!on) return;
      off = (off + dt * 160) % L;
      es.forEach((c, k) => { const p = route.getPointAtLength((off + (k * L) / N) % L); c.setAttribute("cx", p.x); c.setAttribute("cy", p.y); });
    });

    // Byte builder
    const bitsWrap = $("#bits");
    const bits = [0, 1, 0, 0, 0, 0, 0, 1]; // "A"
    const btns = bits.map((b, k) => {
      const el = document.createElement("button");
      el.className = "bit";
      el.innerHTML = `<b>0</b><small>${2 ** (7 - k)}</small>`;
      el.setAttribute("aria-label", `Bit worth ${2 ** (7 - k)}`);
      el.addEventListener("click", () => { bits[k] ^= 1; renderByte(); });
      bitsWrap.appendChild(el);
      return el;
    });
    function renderByte() {
      let n = 0;
      bits.forEach((b, k) => { n += b << (7 - k); btns[k].classList.toggle("on", !!b); btns[k].querySelector("b").textContent = b; btns[k].setAttribute("aria-pressed", !!b); });
      $("#byteNum").textContent = n;
      $("#byteChar").textContent = n >= 33 && n <= 126 ? String.fromCharCode(n) : (n === 32 ? "space" : "–");
    }
    renderByte();
    modules[4] = { enter() { lp.start(); }, leave() { lp.stop(); } };
  })();

  /* ==========================================================
     Slide 6 — Logic gates
     ========================================================== */
  (function () {
    const tabs = $$(".gate-tab");
    const groups = $$(".gate-svg .g");
    const inA = $("#inA"), inB = $("#inB");
    const lamp = $("#gLamp"), outV = $("#gOutV");
    const examples = {
      AND: "<b>Example:</b> A door opens only if you have the key <b>AND</b> the password.",
      OR: "<b>Example:</b> A room light turns on if switch A <b>OR</b> switch B is on.",
      NOT: "<b>Example:</b> If it is <b>NOT</b> day, the street light turns on."
    };
    const fn = { AND: (a, b) => a & b, OR: (a, b) => a | b, NOT: (a) => a ^ 1 };
    let gate = "AND", A = 0, B = 0;
    function render() {
      tabs.forEach((t) => t.classList.toggle("on", t.dataset.gate === gate));
      groups.forEach((g) => g.classList.toggle("show", g.dataset.g === gate));
      const single = gate === "NOT";
      inB.classList.toggle("hide", single);
      $("#gateInputs").style.gridTemplateRows = single ? "1fr" : "";
      inB.style.display = single ? "none" : "";
      const out = fn[gate](A, B);
      [[inA, A], [inB, B]].forEach(([el, v]) => { el.classList.toggle("on", !!v); el.querySelector(".v").textContent = v; el.setAttribute("aria-pressed", !!v); });
      const g = groups.find((x) => x.dataset.g === gate);
      g.querySelector(".wa").classList.toggle("on", !!A);
      const wb = g.querySelector(".wb"); if (wb) wb.classList.toggle("on", !!B);
      g.querySelector(".wo").classList.toggle("on", !!out);
      lamp.classList.toggle("on", !!out);
      outV.classList.toggle("on", !!out);
      outV.textContent = out;
      $("#gateExample").innerHTML = examples[gate];
      // truth table
      const rows = single ? [[0], [1]] : [[0, 0], [0, 1], [1, 0], [1, 1]];
      let html = `<tr><th>A</th>${single ? "" : "<th>B</th>"}<th>OUT</th></tr>`;
      rows.forEach((r) => {
        const o = fn[gate](r[0], r[1]);
        const cur = r[0] === A && (single || r[1] === B);
        html += `<tr class="${cur ? "cur" : ""}"><td>${r[0]}</td>${single ? "" : `<td>${r[1]}</td>`}<td>${o}</td></tr>`;
      });
      $("#truth").innerHTML = html;
    }
    tabs.forEach((t) => t.addEventListener("click", () => { gate = t.dataset.gate; render(); }));
    inA.addEventListener("click", () => { A ^= 1; render(); });
    inB.addEventListener("click", () => { B ^= 1; render(); });
    render();
  })();

  /* ==========================================================
     Slide 7 — Fiber optic: send a word as light pulses
     ========================================================== */
  (function () {
    const ray = $("#rayLine");
    const pg = $("#photons");
    const laser = $("#laser"), det = $("#detector");
    const input = $("#fiberInput");
    const stream = $("#bitstream");
    // Zig-zag path that bounces between the core walls (total internal reflection)
    const pts = [];
    const x0 = 170, x1 = 1222, top = 140, bot = 190, seg = 72;
    let x = x0, up = true;
    pts.push([x0, 165]);
    x += seg / 2;
    while (x < x1 - 10) { pts.push([x, up ? top : bot]); up = !up; x += seg; }
    pts.push([x1, 165]);
    ray.setAttribute("points", pts.map((p) => p.join(",")).join(" "));
    const zig = svgEl("path", { d: "M" + pts.map((p) => p.join(" ")).join(" L"), fill: "none" });
    pg.appendChild(zig);
    const L = zig.getTotalLength();

    const SPEED = 700;      // px per second along the zig-zag (slowed down for humans!)
    const BIT_GAP = 0.16;   // seconds between bits
    let tokens = [], queue = [], tSend = 0, received = "", rxBits = "", bitStr = "", sentCount = 0, running = false;

    function toBits(word) { return word.split("").map((c) => c.charCodeAt(0).toString(2).padStart(8, "0")).join(""); }
    function renderStream() {
      const groups = bitStr.match(/.{1,8}/g) || [];
      let out = "", idx = 0;
      groups.forEach((g) => {
        let s = "";
        for (const ch of g) { s += idx < sentCount ? `<span class="sent">${ch}</span>` : ch; idx++; }
        out += s + " ";
      });
      stream.innerHTML = out || "&nbsp;";
    }
    function send() {
      const word = (input.value || "HI").toUpperCase().replace(/[^A-Z0-9 !?]/g, "").slice(0, 5) || "HI";
      input.value = word;
      bitStr = toBits(word);
      queue = bitStr.split("").map(Number);
      tokens.forEach((t) => t.el && t.el.remove());
      tokens = []; received = ""; rxBits = ""; sentCount = 0; tSend = 0;
      $("#rxText").textContent = "–"; $("#rxBits").textContent = "receiving…";
      renderStream();
      running = true; lp.start();
    }
    $("#fiberSend").addEventListener("click", send);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") { send(); input.blur(); } });

    const lp = loop((dt) => {
      if (!running) return;
      tSend -= dt;
      if (queue.length && tSend <= 0) {
        const b = queue.shift();
        const t = { b, d: 0, el: null };
        if (b) {
          t.el = svgEl("circle", { r: 8, class: "photon" });
          pg.appendChild(t.el);
          laser.classList.add("flash"); setTimeout(() => laser.classList.remove("flash"), 90);
        }
        tokens.push(t); sentCount++; renderStream();
        tSend = BIT_GAP;
      }
      for (let k = tokens.length - 1; k >= 0; k--) {
        const t = tokens[k];
        t.d += dt * SPEED;
        if (t.d >= L) {
          if (t.el) { t.el.remove(); det.classList.add("flash"); setTimeout(() => det.classList.remove("flash"), 90); }
          rxBits += t.b;
          if (rxBits.length % 8 === 0) {
            received += String.fromCharCode(parseInt(rxBits.slice(-8), 2));
            $("#rxText").textContent = received;
          }
          $("#rxBits").textContent = rxBits.slice(-8).padEnd(8, "·");
          tokens.splice(k, 1);
          continue;
        }
        if (t.el) { const p = zig.getPointAtLength(t.d); t.el.setAttribute("cx", p.x); t.el.setAttribute("cy", p.y); }
      }
      if (!queue.length && !tokens.length) { running = false; $("#rxBits").textContent = "message received ✓"; }
    });

    let autoT = null;
    modules[6] = {
      enter() { lp.start(); clearTimeout(autoT); autoT = setTimeout(send, 900); },
      leave() { clearTimeout(autoT); lp.stop(); }
    };
    renderStream();
  })();

  /* ==========================================================
     Slide 8 — Wireless: rings + packets between devices
     ========================================================== */
  (function () {
    const tabs = $$("#wtabs .wtab");
    const links = $$("#wifiSvg .link");
    const emitters = $$("#wifiSvg .emitter");
    const devs = $$("#wifiSvg .devg");
    const pk = $("#packets");
    const wave = $("#emWave");
    let mode = "wifi", userPicked = false, autoT = null, phase = 0;
    const packets = [];
    const devMap = { wifi: ["wifi", "phone"], bt: ["phone", "bt"], mobile: ["mobile", "phone"] };

    function setMode(m) {
      mode = m;
      tabs.forEach((t) => t.classList.toggle("on", t.dataset.w === m));
      links.forEach((l) => l.classList.toggle("on", l.dataset.l === m));
      emitters.forEach((e) => e.classList.toggle("on", e.dataset.e === m));
      devs.forEach((d) => d.classList.toggle("dim", !devMap[m].includes(d.dataset.d)));
      packets.forEach((p) => p.el.remove()); packets.length = 0;
      links.filter((l) => l.dataset.l === m).forEach((l) => {
        for (let k = 0; k < 3; k++) {
          const el = svgEl("circle", { r: 7, class: "packet" });
          pk.appendChild(el);
          packets.push({ el, l, t: k / 3, back: false });
        }
      });
    }
    tabs.forEach((t) => t.addEventListener("click", () => { userPicked = true; setMode(t.dataset.w); }));

    const speeds = { wifi: 0.55, bt: 0.8, mobile: 0.35 };
    const lp = loop((dt) => {
      packets.forEach((p) => {
        p.t += dt * speeds[mode];
        if (p.t > 1) p.t -= 1;
        const x1 = +p.l.getAttribute("x1"), y1 = +p.l.getAttribute("y1"), x2 = +p.l.getAttribute("x2"), y2 = +p.l.getAttribute("y2");
        p.el.setAttribute("cx", x1 + (x2 - x1) * p.t);
        p.el.setAttribute("cy", y1 + (y2 - y1) * p.t);
        p.el.setAttribute("opacity", Math.sin(Math.PI * p.t).toFixed(2));
      });
      // travelling sine wave
      phase += dt * 4;
      let d = "";
      for (let x = 20; x <= 280; x += 4) {
        const y = 68 + 22 * Math.sin((x - 40) / 100 * 2 * Math.PI - phase);
        d += (x === 20 ? "M" : "L") + x + " " + y.toFixed(1);
      }
      wave.setAttribute("d", d);
    });
    setMode("wifi");
    modules[7] = {
      enter() {
        lp.start(); userPicked = false; setMode("wifi");
        clearInterval(autoT);
        const order = ["wifi", "bt", "mobile"];
        autoT = setInterval(() => { if (!userPicked) setMode(order[(order.indexOf(mode) + 1) % 3]); }, 4500);
      },
      leave() { lp.stop(); clearInterval(autoT); }
    };
  })();

  /* ==========================================================
     Slide 9 — Robot with ultrasonic distance sensor
     ========================================================== */
  (function () {
    const robot = $("#robot"), boxG = $("#boxObj");
    const led = $("#robotLed"), statusEl = $("#robotStatus");
    const slider = $("#boxSlider");
    const sg = $("#sndWaves");
    const ruler = $("#ruler"), distText = $("#distText");
    const w1 = $("#w1"), w2 = $("#w2");
    const START = 20, STOP_CM = 40, CM_PER_PX = 0.5;
    const SENSOR_DX = 160, SENSOR_Y = 260;
    let rx = START, boxX = +slider.value, state = "drive", stateT = 0, pingT = 0, wheelA = 0, measured = null;
    const waves = [];

    function setStatus(text, stop) { statusEl.textContent = text; statusEl.classList.toggle("stop", !!stop); led.classList.toggle("stop", !!stop); }
    function arc(cx, cy, r, dir) {
      const h = Math.min(56, 10 + r * 0.45), k = h * 0.45;
      const x = cx + dir * r;
      return `M${(x - dir * k).toFixed(1)} ${(cy - h).toFixed(1)} Q${(x + dir * k).toFixed(1)} ${cy} ${(x - dir * k).toFixed(1)} ${(cy + h).toFixed(1)}`;
    }
    slider.addEventListener("input", () => { boxX = +slider.value; if (state === "stop") { state = "drive"; } });

    function reset() {
      rx = START; state = "drive"; stateT = 0; measured = null;
      waves.forEach((w) => w.el.remove()); waves.length = 0;
      setStatus("Scanning…");
    }

    const lp = loop((dt) => {
      const sensorX = rx + SENSOR_DX;
      boxG.setAttribute("transform", `translate(${boxX} 0)`);
      // robot state
      if (state === "drive") {
        rx += dt * 70;
        wheelA += dt * 200;
        if (measured !== null && measured <= STOP_CM) { state = "stop"; stateT = 0; setStatus("Object detected! Robot stops.", true); }
        else if (measured !== null) setStatus("Path is clear. Moving…");
      } else if (state === "stop") {
        stateT += dt;
        if (stateT > 2.2) { state = "back"; setStatus("Turning back…"); }
      } else if (state === "back") {
        rx -= dt * 160; wheelA -= dt * 400;
        if (rx <= START) { rx = START; state = "drive"; measured = null; setStatus("Scanning…"); }
      }
      if (rx + SENSOR_DX > boxX - 4) rx = boxX - 4 - SENSOR_DX;
      robot.setAttribute("transform", `translate(${rx} 0)`);
      w1.setAttribute("transform", `translate(42 320) rotate(${wheelA})`);
      w2.setAttribute("transform", `translate(110 320) rotate(${wheelA})`);

      // pings
      pingT -= dt;
      if (pingT <= 0 && state !== "back") {
        pingT = 0.55;
        const el = svgEl("path", { class: "snd" });
        sg.appendChild(el);
        waves.push({ el, x: sensorX, r: 4, dir: 1 });
      }
      for (let k = waves.length - 1; k >= 0; k--) {
        const w = waves[k];
        w.r += dt * 520;
        if (w.dir === 1) {
          if (w.x + w.r >= boxX) { // hit the box → echo
            w.dir = -1; w.x = boxX; w.r = 4; w.el.classList.add("back");
          }
        } else if (w.x - w.r <= rx + SENSOR_DX) { // echo returns to sensor
          measured = (boxX - (rx + SENSOR_DX)) * CM_PER_PX;
          w.el.remove(); waves.splice(k, 1); continue;
        }
        w.el.setAttribute("d", arc(w.x, SENSOR_Y, w.r, w.dir));
        w.el.setAttribute("opacity", Math.max(0.15, 1 - w.r / 600).toFixed(2));
      }
      // ruler
      const sx = rx + SENSOR_DX;
      ruler.setAttribute("x1", sx); ruler.setAttribute("x2", boxX);
      distText.setAttribute("x", boxX + 48);
      distText.setAttribute("y", 204);
      distText.textContent = measured === null ? "measuring…" : `Distance: ${Math.round(measured)} cm`;
      distText.style.fill = measured !== null && measured <= STOP_CM ? "var(--stop)" : "";
    });
    modules[8] = { enter() { reset(); lp.start(); }, leave() { lp.stop(); } };
  })();

  /* ==========================================================
     Slide 10 — Quantum: qubit sphere + measurement
     ========================================================== */
  (function () {
    const vec = $("#qVec"), tip = $("#qTip"), flash = $("#qFlash");
    const CX = 300, CY = 200, R = 150;
    let theta = 1.4, phi = 0, t = 0, measured = null, tally = [0, 0], snap = 0, remixT = null, thetaMix = 1.4;
    const coin = $("#coinTxt");
    let coinT = 0;

    function draw() {
      const x = CX + R * Math.sin(theta) * Math.cos(phi);
      const y = CY - R * Math.cos(theta) + 0.27 * R * Math.sin(theta) * Math.sin(phi);
      vec.setAttribute("x2", x.toFixed(1)); vec.setAttribute("y2", y.toFixed(1));
      tip.setAttribute("cx", x.toFixed(1)); tip.setAttribute("cy", y.toFixed(1));
      const p0 = Math.cos(theta / 2) ** 2;
      const pct0 = Math.round(p0 * 100);
      $("#p0t").textContent = pct0 + "%"; $("#p1t").textContent = 100 - pct0 + "%";
      $("#p0b").style.width = p0 * 100 + "%"; $("#p1b").style.width = (1 - p0) * 100 + "%";
    }
    const lp = loop((dt) => {
      t += dt;
      thetaMix = 1.57 + 1.0 * Math.sin(t * 0.55);
      if (measured === null) {
        phi += dt * 1.6;
        theta += (thetaMix - theta) * Math.min(1, dt * 5);
      } else {
        const target = measured === 0 ? 0.0001 : Math.PI - 0.0001;
        theta += (target - theta) * Math.min(1, dt * 8);
      }
      if (snap > 0) { snap -= dt; flash.setAttribute("opacity", Math.max(0, snap * 0.6).toFixed(2)); }
      coinT += dt;
      if (coinT > 1.4) { coinT = 0; coin.textContent = coin.textContent === "0" ? "1" : "0"; }
      draw();
    });
    $("#qMeasure").addEventListener("click", () => {
      const p0 = Math.cos(thetaMix / 2) ** 2; // a new qubit, prepared in the current mix
      measured = Math.random() < p0 ? 0 : 1;
      tally[measured]++;
      snap = 0.8;
      $("#qResult").innerHTML = `Result: <b>${measured}</b><br><span>0s: ${tally[0]} · 1s: ${tally[1]}</span>`;
      clearTimeout(remixT);
      remixT = setTimeout(() => { measured = null; }, 1800);
    });
    $("#qReset").addEventListener("click", () => {
      clearTimeout(remixT); measured = null; tally = [0, 0];
      $("#qResult").innerHTML = `Result: <b>?</b><br><span>0s: 0 · 1s: 0</span>`;
    });
    draw();
    modules[9] = { enter() { lp.start(); }, leave() { lp.stop(); } };
  })();

  /* ==========================================================
     Slide 12 — Conclusion: light the recap chain in order
     ========================================================== */
  (function () {
    const items = $$("#recap .rc");
    let timers = [];
    modules[11] = {
      enter() {
        items.forEach((i) => i.classList.remove("lit"));
        timers.forEach(clearTimeout);
        timers = items.map((it, k) => setTimeout(() => it.classList.add("lit"), 700 + k * 350));
      },
      leave() { timers.forEach(clearTimeout); }
    };
  })();

  /* ---------- Start ---------- */
  const fromHash = parseInt((location.hash || "").slice(1), 10);
  go(Number.isFinite(fromHash) ? fromHash - 1 : 0);
})();
