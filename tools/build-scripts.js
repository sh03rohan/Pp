/* Builds the speaker-script documents from js/notes.js
   Usage (needs Node.js):  node tools/build-scripts.js            */
const fs = require("fs");
const path = require("path");
global.window = {};
require(path.join(__dirname, "..", "js", "notes.js"));
const { SPEAKERS, NOTES } = window;

const WPM = 105;
const words = (t) => t.trim().split(/\s+/).length;
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

const parts = SPEAKERS.map((sp) => {
  const slides = NOTES.map((n, i) => ({ ...n, num: i + 1 })).filter((n) => n.speaker === sp.id);
  const total = slides.reduce((a, n) => a + words(n.script), 0);
  return { sp, slides, total };
});
const grand = parts.reduce((a, p) => a + p.total, 0);

/* ---------- Markdown ---------- */
let md = `# Speaker Scripts\n\n**Importance and Applications of Physics in Computer Science and Engineering (CSE)**\n\n`;
md += `${SPEAKERS.length} speakers · ${NOTES.length} slides · about 2 minutes each · ${grand} words in total\n\n`;
md += `Tip: speak slowly and clearly. A calm pace is about ${WPM} words per minute.\n\n`;
parts.forEach(({ sp, slides, total }) => {
  md += `---\n\n## ${sp.name} — ${sp.topic}\n\nSlides ${slides[0].num}–${slides[slides.length - 1].num} · ${total} words · about ${fmt((total / WPM) * 60)}\n\n`;
  slides.forEach((n) => {
    md += `### Slide ${n.num}: ${n.title}\n\n${n.script}\n\n*Action: ${n.cue}*\n\n`;
  });
});
fs.writeFileSync(path.join(__dirname, "..", "speaker-scripts.md"), md);

/* ---------- Printable HTML ---------- */
let html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Speaker Scripts</title>
<style>
@font-face{font-family:Inter;font-weight:400;src:url(assets/fonts/inter-400.woff2) format("woff2")}
@font-face{font-family:Inter;font-weight:600;src:url(assets/fonts/inter-600.woff2) format("woff2")}
@font-face{font-family:Inter;font-weight:800;src:url(assets/fonts/inter-800.woff2) format("woff2")}
:root{--ink:#0B1530;--muted:#55627F;--blue:#2F7BFF;--cyan:#0AAFC9;--line:#DDE3EF}
*{box-sizing:border-box}body{margin:0;background:#F4F6FB;color:var(--ink);font-family:Inter,system-ui,sans-serif;line-height:1.55}
main{max-width:820px;margin:0 auto;padding:48px 28px 80px}
header{border-bottom:3px solid var(--blue);padding-bottom:20px;margin-bottom:28px}
.kicker{font-size:13px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--blue)}
h1{font-size:34px;line-height:1.15;margin:8px 0 10px;font-weight:800;letter-spacing:-.02em}
.meta{color:var(--muted);font-size:15px}
.speaker{background:#fff;border:1px solid var(--line);border-radius:16px;padding:26px 28px;margin:26px 0}
.speaker h2{display:flex;align-items:center;gap:12px;margin:0 0 4px;font-size:24px;font-weight:800}
.num{width:36px;height:36px;border-radius:10px;background:var(--blue);color:#fff;display:grid;place-items:center;font-size:18px}
.sub{color:var(--muted);font-size:14px;margin-bottom:8px}
.slide{border-top:1px solid var(--line);padding-top:12px;margin-top:12px;break-inside:avoid}
.slide h3{margin:0 0 6px;font-size:15px;font-weight:800;color:var(--cyan);letter-spacing:.04em;text-transform:uppercase}
.slide p{margin:0;font-size:16px}
.cue{margin-top:10px!important;font-size:14px!important;color:var(--muted);background:#EEF3FF;border-radius:8px;padding:8px 12px}
.cue b{color:var(--blue);font-size:12px;letter-spacing:.1em}
.handoff{margin-top:12px;font-size:14px;font-weight:600;color:var(--blue)}
@media print{body{background:#fff}main{padding:0}header{margin-bottom:14px;padding-bottom:12px}h1{font-size:26px}.speaker{margin:0;padding:20px 22px}.speaker{border:1px solid #ccd}.speaker+.speaker{break-before:page}}
</style></head><body><main>
<header><div class="kicker">Speaker Scripts</div><h1>Importance and Applications of Physics in Computer Science and Engineering (CSE)</h1>
<div class="meta">${SPEAKERS.length} speakers · ${NOTES.length} slides · about 2 minutes each · ${grand} words in total · speak slowly (about ${WPM} words per minute)</div></header>`;
parts.forEach(({ sp, slides, total }, k) => {
  html += `<section class="speaker"><h2><span class="num">${sp.id}</span>${esc(sp.name)} — ${esc(sp.topic)}</h2>
<div class="sub">Slides ${slides[0].num}–${slides[slides.length - 1].num} · ${total} words · about ${fmt((total / WPM) * 60)}</div>`;
  slides.forEach((n) => {
    html += `<div class="slide"><h3>Slide ${n.num} · ${esc(n.title)}</h3><p>${esc(n.script)}</p><p class="cue"><b>ACTION</b>&nbsp; ${esc(n.cue)}</p></div>`;
  });
  if (parts[k + 1]) html += `<div class="handoff">→ Hand over to ${esc(parts[k + 1].sp.name)}</div>`;
  html += `</section>`;
});
html += `</main></body></html>`;
fs.writeFileSync(path.join(__dirname, "..", "speaker-scripts.html"), html);
console.log("Wrote speaker-scripts.md and speaker-scripts.html", parts.map((p) => `${p.sp.name}: ${p.total} words`).join(", "));
