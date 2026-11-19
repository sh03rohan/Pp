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
  /* Two layouts:
     - "stage" mode: the 16:9 canvas is scaled to fit (laptops, projectors, landscape tablets)
     - "flow" mode: content reflows into one scrollable column (phones, portrait tablets, small windows)
     Flow mode is used when the scaled canvas would be too small to read, or the screen is tall/narrow. */
  function fit() {
    const W = window.innerWidth, Hh = window.innerHeight;
    const flow = Math.min(W / 1600, Hh / 900) < 0.55 || W / Hh < 1.2;
    document.body.classList.toggle("flow", flow);
    if (flow) { stage.style.transform = ""; return; }
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
    const mPrev = modules[slides[prev].dataset.module];
    if (mPrev && mPrev.leave && n !== prev) mPrev.leave();
    current = n;
    slides[n].scrollTop = 0;
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
    const mNext = modules[slides[n].dataset.module];
    if (mNext && mNext.enter) mNext.enter();
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
      <div class="n-speaker"><span class="num">${sp.id}</span><div><b>${sp.name}</b><span>${sp.topic} · slide ${idxInSpeaker} of ${NOTES.filter((x) => x.speaker === n.speaker).length}</span></div></div>
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
    modules.why = {
      enter() { pinned = false; show(0); auto(); },
      leave() { clearInterval(timer); }
    };
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
    modules.trans = { enter() { lp.start(); }, leave() { lp.stop(); } };
  })();

  /* ==========================================================
     Electricity: moving charges + Ohm's law (V and R sliders)
     ========================================================== */
  (function () {
    const path = $("#loopPath");
    const g = $("#charges");
    const vS = $("#voltSlider"), rS = $("#resSlider");
    const led = $("#led"), ledGlow = $("#ledGlow");
    const box = $("#circuitSvg").parentElement;
    const N = 34;
    let L = 0, offset = 0, current = 0.6;
    const dots = [];
    L = path.getTotalLength();
    for (let k = 0; k < N; k++) { const c = svgEl("circle", { r: 6, class: "charge" }); g.appendChild(c); dots.push(c); }
    function update() {
      const V = +vS.value, R = +rS.value;
      current = V / R;
      $("#vOut").textContent = V.toFixed(1) + " V";
      $("#rOut").textContent = R + " Ω";
      $("#iOut").textContent = current.toFixed(2) + " A";
      const k = Math.min(1, current / 1.2);
      led.style.fill = k === 0 ? "" : `rgba(233, 251, 255, ${0.25 + 0.75 * k})`;
      ledGlow.setAttribute("opacity", (0.6 * k).toFixed(2));
      ledGlow.setAttribute("r", 40 + 40 * k);
      dots.forEach((d) => d.setAttribute("opacity", k === 0 ? 0.3 : 1));
      const off = V === 0;
      box.classList.toggle("powered", !off);
      $("#cpuTxt").textContent = off ? "OFF" : "CPU";
      $("#noPower").classList.toggle("off", off);
      $("#noPowerTxt").textContent = off ? "No electricity → the computer cannot function." : "Without electricity, computers cannot function.";
    }
    vS.addEventListener("input", update);
    rS.addEventListener("input", update);
    const lp = loop((dt) => {
      offset = (offset + dt * Math.min(current, 2.4) * 260) % L;
      for (let k = 0; k < N; k++) {
        const p = path.getPointAtLength((offset + (k * L) / N) % L);
        dots[k].setAttribute("cx", p.x); dots[k].setAttribute("cy", p.y);
      }
    });
    update();
    modules.elec = { enter() { lp.start(); }, leave() { lp.stop(); } };
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
      $("#rxText").textContent = "–"; $("#rxOut").textContent = "…"; $("#rxBits").textContent = "receiving…";
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
            $("#rxText").textContent = received; $("#rxOut").textContent = received;
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
    // Travelling EM wave in the "Wireless" card
    const wave = $("#emWave");
    let phase = 0;
    const wl = loop((dt) => {
      phase += dt * 4;
      let d = "";
      for (let x = 20; x <= 280; x += 4) {
        const y = 55 + 26 * Math.sin(((x - 40) / 100) * 2 * Math.PI - phase);
        d += (x === 20 ? "M" : "L") + x + " " + y.toFixed(1);
      }
      wave.setAttribute("d", d);
    });
    modules.comm = {
      enter() { lp.start(); wl.start(); clearTimeout(autoT); autoT = setTimeout(send, 900); },
      leave() { clearTimeout(autoT); lp.stop(); wl.stop(); }
    };
    renderStream();
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
    modules.robot = { enter() { reset(); lp.start(); }, leave() { lp.stop(); } };
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
    modules.quantum = { enter() { lp.start(); }, leave() { lp.stop(); } };
  })();

  /* ---------- Start ---------- */
  const fromHash = parseInt((location.hash || "").slice(1), 10);
  go(Number.isFinite(fromHash) ? fromHash - 1 : 0);
})();
