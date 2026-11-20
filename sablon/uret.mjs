#!/usr/bin/env node
// NON STOP içerik üretici.
// Kullanım:  node uret.mjs icerik/<klasor>            -> video + kapak
//            node uret.mjs icerik/<klasor> --sadece-kapak
//            node uret.mjs icerik/<klasor> --taslak     (hızlı, düşük kalite önizleme)
//            node uret.mjs icerik/<klasor> --kare 3,12,20  (sadece bu saniyelerden PNG kare)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const HF = "hyperframes@0.9.72";
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const MARKA = path.join(ROOT, "marka");
const args = process.argv.slice(2);
const dir = path.resolve(args[0] || "");
if (!args[0] || !fs.existsSync(path.join(dir, "icerik.json"))) {
  console.error("Kullanım: node uret.mjs icerik/<klasor>   (klasörde icerik.json olmalı)");
  process.exit(1);
}
const flag = (f) => args.includes(f);
const flagVal = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const C = JSON.parse(fs.readFileSync(path.join(dir, "icerik.json"), "utf8"));

const W = 1080, H = 1920;
const RENK = { lacivert: "var(--navy)", kirmizi: "var(--red)", mavi: "var(--blue)", sari: "var(--yellow)", turuncu: "var(--orange)", yesil: "var(--green)" };
const YAZI_RENK = { lacivert: "var(--navy)", kirmizi: "var(--red)", mavi: "var(--blue)", sari: "var(--orange-ink)", turuncu: "var(--orange-ink)", yesil: "var(--green)" };
const renk = (r, def = "mavi") => RENK[r || def] || r;
const yrenk = (r, def = "mavi") => YAZI_RENK[r || def] || r;
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// *kelime* -> mavi vurgu
const fmt = (s) => esc(s).replace(/\*([^*]+)\*/g, "<em>$1</em>");
const r2 = (x) => Math.round(x * 100) / 100;

// ---------------------------------------------------------------- yardımcılar
function sesSuresi(file) {
  const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString().trim();
  return parseFloat(out);
}
function kopyala(src, dst) { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.cpSync(src, dst, { recursive: true }); }

// Whisper/HyperFrames transcript.json -> altyazı parçaları
function altyaziTranskripttten(file) {
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const words = (Array.isArray(raw) ? raw : raw.words || (raw.segments || []).flatMap((s) => s.words || []))
    .map((w) => ({ t: (w.word ?? w.text ?? "").trim(), s: w.start, e: w.end })).filter((w) => w.t);
  const out = []; let cur = [];
  const flush = () => { if (cur.length) out.push([cur[0].s, cur[cur.length - 1].e, cur.map((w) => w.t).join(" ")]); cur = []; };
  for (const w of words) {
    if (cur.length && (w.s - cur[cur.length - 1].e > 0.35)) flush();
    cur.push(w);
    const txt = cur.map((x) => x.t).join(" ");
    if (/[.,!?;:]$/.test(w.t) || cur.length >= 3 || txt.length > 22) flush();
  }
  flush();
  return out;
}

// ---------------------------------------------------------------- sahne yerleşimi
function manset(sc, id, top = 250) {
  const lines = Array.isArray(sc.manset) ? sc.manset : [sc.manset || ""];
  const fs_ = sc.manset_boyut || (lines.some((l) => l.length > 22) ? 66 : 76);
  const lh = Math.round(fs_ * 1.08);
  const dashTop = top + lines.length * lh + 22;
  let html = `<div class="hl" id="${id}h" style="top:${top}px;font-size:${fs_}px;line-height:1.08">${lines.map((l) => `<span class="ln">${fmt(l)}</span>`).join("")}</div>
  <div class="dash" id="${id}d1" style="left:72px;top:${dashTop}px;width:70px;background:var(--red)"></div>
  <div class="dash" id="${id}d2" style="left:154px;top:${dashTop}px;width:70px;background:var(--blue)"></div>`;
  let next = dashTop + 48;
  if (sc.ust) { html += `<div class="kicker" id="${id}k" style="top:${next}px">${esc(sc.ust)}</div>`; next += 70; }
  else next += 20;
  return { html, contentTop: next };
}

const S = []; // sahne html
const PRE = []; // sahne dışı medya (video) öğeleri
const T = []; // gsap satırları
const t = (s) => T.push(s);

function animManset(id, at, hasKicker) {
  t(`tl.fromTo("#${id}h .ln",{y:50,opacity:0},{y:0,opacity:1,duration:0.55,stagger:0.12,ease:E},${at});`);
  t(`tl.fromTo(["#${id}d1","#${id}d2"],{scaleX:0,transformOrigin:"left center"},{scaleX:1,duration:0.4,stagger:0.1,ease:E},${r2(at + 0.4)});`);
  if (hasKicker) t(`tl.fromTo("#${id}k",{opacity:0,x:-20},{opacity:1,x:0,duration:0.4},${r2(at + 0.6)});`);
}
function vurgu(sc, id, top = 1420) {
  if (!sc.vurgu) return "";
  const v = typeof sc.vurgu === "string" ? { yazi: sc.vurgu, an: sc.bas + 1 } : sc.vurgu;
  t(`tl.fromTo("#${id}v",{y:30,scale:0.9,opacity:0},{y:0,scale:1,opacity:1,duration:0.4,ease:"back.out(2)"},${v.an});`);
  return `<div class="callout" id="${id}v" style="top:${top}px">${fmt(v.yazi)}</div>`;
}
function dipnot(sc, id) {
  if (!sc.dipnot) return "";
  t(`tl.fromTo("#${id}n",{opacity:0},{opacity:1,duration:0.5},${r2(sc.bas + 1.5)});`);
  return `<div class="abs" id="${id}n" data-layout-ignore style="left:72px;top:1820px;font-size:20px;color:var(--muted)">${esc(sc.dipnot)}</div>`;
}
function cubukKart(rows, id, top, opts = {}) {
  const rowH = opts.rowH || 86, labelW = opts.labelW || 264, barMax = opts.barMax || 520;
  const h = rows.length * rowH + 40;
  let html = `<div class="card" id="${id}c" style="left:72px;top:${top}px;width:936px;height:${h}px">`;
  rows.forEach((r, i) => {
    const y = 20 + i * rowH; const w = Math.max(24, Math.round(barMax * (r.deger ?? 0.5)));
    html += `<div class="row-label" id="${id}l${i}" style="left:36px;top:${y + 4}px;font-size:30px">${esc(r.etiket)}</div>
      <div class="bar" id="${id}b${i}" style="left:${36 + labelW}px;top:${y}px;width:${w}px;height:46px;background:${renk(r.renk)}"></div>
      <div class="val" id="${id}y${i}" style="left:${36 + labelW + w + 16}px;top:${y + 4}px;font-size:30px;color:${yrenk(r.renk)}">${esc(r.yazi ?? "")}</div>`;
    const an = r.an ?? (opts.start + 0.8 + i * 0.4);
    t(`tl.fromTo("#${id}l${i}",{opacity:0,x:-20},{opacity:1,x:0,duration:0.3},${an});`);
    t(`tl.fromTo("#${id}b${i}",{scaleX:0},{scaleX:1,duration:0.7,ease:E},${r2(an + 0.05)});`);
    t(`tl.fromTo("#${id}y${i}",{opacity:0},{opacity:1,duration:0.3},${r2(an + 0.5)});`);
  });
  html += `</div>`;
  const first = Math.min(...rows.map((r, i) => r.an ?? (opts.start + 0.8 + i * 0.4)));
  t(`tl.fromTo("#${id}c",{y:50,opacity:0},{y:0,opacity:1,duration:0.5,ease:E},${r2(Math.max(opts.start + 0.3, first - 0.5))});`);
  return { html, bottom: top + h };
}

const SAHNE = {
  // Başlık + isteğe bağlı büyük ifade + maddeler
  metin(sc, id) {
    const m = manset(sc, id); let html = m.html; let y = m.contentTop + 20;
    animManset(id, sc.manset_an ?? r2(sc.bas + 0.2), !!sc.ust);
    if (sc.buyuk) {
      const b = typeof sc.buyuk === "string" ? { yazi: sc.buyuk } : sc.buyuk;
      html += `<div class="abs" id="${id}big" style="left:72px;top:${y}px;width:936px;font-size:${b.boyut || 150}px;line-height:1;font-weight:800;letter-spacing:-0.04em;color:${yrenk(b.renk, "lacivert")}">${fmt(b.yazi)}</div>`;
      t(`tl.fromTo("#${id}big",{scale:0.85,opacity:0,transformOrigin:"left center"},{scale:1,opacity:1,duration:0.6,ease:"back.out(1.6)"},${b.an ?? r2(sc.bas + 0.8)});`);
      y += (b.boyut || 150) + 70;
    }
    (sc.maddeler || []).forEach((md, i) => {
      const o = typeof md === "string" ? { yazi: md } : md;
      html += `<div class="card" id="${id}m${i}" style="left:72px;top:${y}px;width:936px;height:110px">
        <div class="abs" style="left:32px;top:31px;width:48px;height:48px;border-radius:14px;background:${renk(o.renk, i % 2 ? "mavi" : "kirmizi")}"></div>
        <div class="abs" style="left:110px;top:30px;font-size:36px;font-weight:700;white-space:nowrap">${fmt(o.yazi)}</div></div>`;
      t(`tl.fromTo("#${id}m${i}",{x:80,opacity:0},{x:0,opacity:1,duration:0.5,ease:E},${o.an ?? r2(sc.bas + 1 + i * 0.6)});`);
      y += 132;
    });
    html += vurgu(sc, id) + dipnot(sc, id);
    return html;
  },

  // Çubuk grafik
  cubuk(sc, id) {
    const m = manset(sc, id); animManset(id, sc.manset_an ?? r2(sc.bas + 0.2), !!sc.ust);
    const k = cubukKart(sc.satirlar || [], id, m.contentTop + 20, { start: sc.bas, rowH: 110 });
    return m.html + k.html + vurgu(sc, id) + dipnot(sc, id);
  },

  // Risk/seviye göstergesi (+ isteğe bağlı çubuk kartı)
  gosterge(sc, id) {
    const m = manset(sc, id); animManset(id, sc.manset_an ?? r2(sc.bas + 0.2), !!sc.ust);
    const top = m.contentTop + 20; // gauge box 600x320 at x=240
    let html = m.html + `<svg class="abs" id="${id}g" style="left:240px;top:${top}px" width="600" height="320" viewBox="0 0 600 320">
      <path d="M60 300 A 240 240 0 0 1 130 130" fill="none" stroke="#2f6fd6" stroke-width="44" stroke-linecap="round"/>
      <path d="M150 112 A 240 240 0 0 1 450 112" fill="none" stroke="#f6b928" stroke-width="44"/>
      <path d="M470 130 A 240 240 0 0 1 540 300" fill="none" stroke="#d63228" stroke-width="44" stroke-linecap="round"/></svg>
      <div class="abs" id="${id}nd" style="left:536px;top:${top + 70}px;width:8px;height:230px;border-radius:4px;background:var(--navy);transform-origin:50% 100%"></div>
      <div class="abs" id="${id}hb" style="left:516px;top:${top + 276}px;width:48px;height:48px;border-radius:50%;background:var(--navy);border:8px solid #fff"></div>`;
    const st = sc.durumlar || [];
    t(`tl.fromTo("#${id}g",{scale:0.8,opacity:0,transformOrigin:"50% 100%"},{scale:1,opacity:1,duration:0.6,ease:E},${r2(sc.bas + 0.8)});`);
    t(`tl.fromTo(["#${id}nd","#${id}hb"],{opacity:0},{opacity:1,duration:0.4},${r2(sc.bas + 1.0)});`);
    t(`tl.fromTo("#${id}nd",{rotation:-88},{rotation:-75,duration:0.6,ease:E},${r2(sc.bas + 1.0)});`);
    st.forEach((d, i) => {
      const rot = Math.round(-75 + 150 * (d.seviye ?? 0.5));
      html += `<div class="abs" id="${id}s${i}" style="left:0;right:0;top:${top + 340}px;text-align:center;font-size:40px;font-weight:800;color:${yrenk(d.renk)}">${esc(d.etiket)}</div>`;
      t(`tl.set("#${id}s${i}",{opacity:0},${sc.bas});`);
      t(`tl.to("#${id}nd",{rotation:${rot},duration:0.7,ease:"back.out(1.6)"},${d.an});`);
      if (i > 0) t(`tl.to("#${id}s${i - 1}",{opacity:0,y:-20,duration:0.25},${d.an});`);
      t(`tl.fromTo("#${id}s${i}",{opacity:0,y:20},{opacity:1,y:0,duration:0.35,ease:E,immediateRender:false},${r2(d.an + 0.1)});`);
      if (d.titreme) t(`tl.to("#${id}nd",{rotation:${rot + 8},duration:0.25,yoyo:true,repeat:5,ease:"sine.inOut"},${r2(d.an + 0.9)});`);
    });
    if (sc.satirlar) html += cubukKart(sc.satirlar, id + "x", top + 420, { start: sc.bas, rowH: 76, barMax: 470 }).html;
    return html + vurgu(sc, id) + dipnot(sc, id);
  },

  // Numaralı adımlar
  adimlar(sc, id) {
    const m = manset(sc, id); animManset(id, sc.manset_an ?? r2(sc.bas + 0.2), !!sc.ust);
    const items = sc.adimlar || []; const top = m.contentTop + 10; const gap = items.length > 5 ? 128 : 150;
    let html = m.html + `<div class="abs" id="${id}rl" style="left:132px;top:${top + 60}px;width:8px;height:${(items.length - 1) * gap}px;border-radius:4px;background:var(--sky);transform-origin:top center"></div>`;
    items.forEach((a, i) => {
      const y = top + i * gap;
      html += `<div class="card" id="${id}a${i}" style="left:72px;top:${y}px;width:936px;height:${gap - 22}px;border-radius:24px">
        <div class="abs" style="left:26px;top:${(gap - 22 - 68) / 2}px;width:68px;height:68px;border-radius:18px;background:${i % 2 ? "var(--blue)" : "var(--red)"};color:#fff;font-size:30px;font-weight:800;display:flex;align-items:center;justify-content:center">${String(i + 1).padStart(2, "0")}</div>
        <div class="abs" style="left:124px;top:${a.aciklama ? 22 : 36}px;font-size:36px;font-weight:700;white-space:nowrap">${fmt(a.baslik)}</div>
        ${a.aciklama ? `<div class="abs" style="left:124px;top:70px;font-size:26px;font-weight:500;color:var(--muted);white-space:nowrap">${esc(a.aciklama)}</div>` : ""}
        <svg class="abs" id="${id}ck${i}" style="right:30px;top:${(gap - 22 - 60) / 2}px" width="60" height="60" viewBox="0 0 60 60"><circle cx="30" cy="30" r="30" fill="#e3f4e8"/><path d="M17 31 L26 40 L44 21" fill="none" stroke="#1f9d55" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`;
      const an = a.an ?? r2(sc.bas + 1.2 + i * 0.8);
      const nx = items[i + 1] ? (items[i + 1].an ?? r2(sc.bas + 1.2 + (i + 1) * 0.8)) : an + 1.2;
      t(`tl.fromTo("#${id}a${i}",{x:80,opacity:0},{x:0,opacity:1,duration:0.5,ease:E},${an});`);
      t(`tl.fromTo("#${id}ck${i}",{scale:0,transformOrigin:"50% 50%"},{scale:1,duration:0.35,ease:"back.out(2.4)"},${r2(nx - 0.1)});`);
    });
    if (items.length > 1) {
      const a0 = items[0].an ?? sc.bas + 1.2, aN = items[items.length - 1].an ?? sc.bas + 1.2 + (items.length - 1) * 0.8;
      t(`tl.fromTo("#${id}rl",{scaleY:0},{scaleY:1,duration:${r2(Math.max(0.5, aN - a0))},ease:"none"},${a0});`);
    }
    return html + vurgu(sc, id, Math.max(1420, top + items.length * gap + 10)) + dipnot(sc, id);
  },

  // Video / fotoğraf (ör. yapay zekâ ile üretilmiş çekim)
  medya(sc, id) {
    const src = "medya/" + path.basename(sc.kaynak);
    const isVid = /\.(mp4|mov|webm)$/i.test(src);
    const full = (sc.yerlesim || "tam") === "tam";
    const dur = r2(sc.son - sc.bas);
    let html = "";
    const box = full ? `left:0;top:0;width:${W}px;height:${H}px` : `left:72px;top:${sc.kart_ust || 600}px;width:936px;height:${sc.kart_yukseklik || 760}px;border-radius:30px;overflow:hidden;box-shadow:0 22px 50px rgba(11,26,61,0.18)`;
    html += `<div class="abs" id="${id}box" style="${box}">`;
    if (isVid) PRE.push(`<video id="${id}vid" class="clip" src="${src}" muted playsinline data-start="${sc.bas}" data-duration="${dur}" data-media-start="${sc.medya_bas || 0}" data-track-index="1" style="${full ? `inset:0;width:${W}px;height:${H}px` : `inset:auto;left:72px;top:${sc.kart_ust || 600}px;width:936px;height:${sc.kart_yukseklik || 760}px;border-radius:30px`};object-fit:cover"></video>`);
    if (isVid && !full) t(`tl.fromTo("#${id}vid",{y:60,opacity:0},{y:0,opacity:1,duration:0.6,ease:E},${r2(sc.bas + 0.3)});`);
    if (!isVid) html += `<img id="${id}img" src="${src}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" />`;
    if (full) html += `<div class="abs" style="inset:0;background:linear-gradient(180deg,rgba(11,26,61,0.72) 0%,rgba(11,26,61,0.15) 38%,rgba(11,26,61,0.0) 60%,rgba(11,26,61,0.55) 100%)"></div>`;
    html += `</div>`;
    if (!isVid) t(`tl.fromTo("#${id}img",{scale:1.0},{scale:1.12,duration:${dur},ease:"none"},${sc.bas});`);
    if (!full) t(`tl.fromTo("#${id}box",{y:60,opacity:0},{y:0,opacity:1,duration:0.6,ease:E},${r2(sc.bas + 0.3)});`);
    if (sc.manset) {
      const m = manset(sc, id); animManset(id, sc.manset_an ?? r2(sc.bas + 0.2), !!sc.ust);
      html += full ? `<div class="light">${m.html}</div>` : m.html;
    }
    return html + vurgu(sc, id) + dipnot(sc, id);
  },

  // Kapanış: lacivert zemin, logo, slogan, çağrı
  kapanis(sc, id) {
    const m = manset(sc, id); animManset(id, sc.manset_an ?? r2(sc.bas + 0.3), false);
    const la = sc.logo_an ?? r2(sc.bas + 1.2);
    let html = `<div class="light">${m.html}</div>
      <svg class="abs" style="left:320px;top:680px" width="440" height="440" viewBox="0 0 440 440"><defs><linearGradient id="${id}rg" x1="0" x2="1"><stop offset="0" stop-color="#d63228"/><stop offset="1" stop-color="#2f6fd6"/></linearGradient></defs><circle id="${id}ring" cx="220" cy="220" r="212" fill="none" stroke="url(#${id}rg)" stroke-width="8" stroke-dasharray="1332" stroke-dashoffset="1332" transform="rotate(-90 220 220)"/></svg>
      <img class="abs" id="${id}logo" src="marka/logo.png" alt="" style="left:340px;top:700px;width:400px;height:400px;border-radius:50%" />
      <div class="abs" id="${id}tag" style="left:0;right:0;top:1160px;text-align:center;color:#fff;font-size:34px;font-weight:700;letter-spacing:0.5em;padding-left:0.5em">${esc(sc.slogan ?? "SPOR HERKES İÇİN")}</div>
      <div class="abs" id="${id}cta" style="left:0;right:0;margin:0 auto;width:max-content;top:1260px;padding:22px 40px;border-radius:20px;background:var(--yellow);color:var(--navy);font-size:40px;font-weight:800;white-space:nowrap">${fmt(sc.cagri ?? "Bize yazın.")}</div>`;
    t(`tl.fromTo("#${id}ring",{attr:{"stroke-dashoffset":1332}},{attr:{"stroke-dashoffset":0},duration:1.0,ease:"power2.inOut"},${r2(la - 0.2)});`);
    t(`tl.fromTo("#${id}logo",{scale:0.86,opacity:0,transformOrigin:"50% 50%"},{scale:1,opacity:1,duration:0.8,ease:E},${la});`);
    t(`tl.fromTo("#${id}tag",{opacity:0,y:20},{opacity:1,y:0,duration:0.5,ease:E},${sc.slogan_an ?? r2(la + 0.6)});`);
    t(`tl.fromTo("#${id}cta",{opacity:0,y:30,scale:0.92},{opacity:1,y:0,scale:1,duration:0.45,ease:"back.out(2)"},${sc.cagri_an ?? r2(la + 1.2)});`);
    if (sc.not) {
      html += `<div class="abs" id="${id}not" style="left:72px;right:72px;top:1800px;text-align:center;font-size:20px;line-height:1.5;color:rgba(255,255,255,0.6)">${esc(sc.not)}</div>`;
      t(`tl.fromTo("#${id}not",{opacity:0},{opacity:1,duration:0.5},${r2(la + 1.6)});`);
    }
    return html;
  },
};

// ---------------------------------------------------------------- video kurulumu
function videoKur(projDir) {
  fs.rmSync(projDir, { recursive: true, force: true });
  fs.mkdirSync(projDir, { recursive: true });
  kopyala(MARKA, path.join(projDir, "marka"));
  const scenes = C.sahneler;
  let ses = null, sesSure = 0;
  if (C.ses) { ses = path.join(dir, C.ses); kopyala(ses, path.join(projDir, "medya", path.basename(ses))); sesSure = sesSuresi(ses); }
  scenes.forEach((sc) => { if (sc.kaynak) kopyala(path.join(dir, sc.kaynak), path.join(projDir, "medya", path.basename(sc.kaynak))); });
  const anaSure = C.sure || scenes[scenes.length - 1].son || sesSure;
  const bitis = C.bitis !== false;
  const BIT = 5;
  const total = r2(anaSure + (bitis ? BIT : 0));

  let altyazi = C.altyazi || [];
  // Seslendirme varsa ve altyazı verilmemişse: otomatik Türkçe yazıya dökme (bir kez yapılır, transcript.json'a kaydedilir)
  if (!altyazi.length && !C.altyazi_dosya && ses && C.otomatik_altyazi !== false) {
    const tj = path.join(dir, "transcript.json");
    if (!fs.existsSync(tj)) {
      console.log("Seslendirme yazıya dökülüyor (ilk seferde model indirilir)...");
      execFileSync("npx", ["--yes", HF, "transcribe", ses, "--model", C.altyazi_model || "small", "--language", "tr"],
        { stdio: "inherit", env: { ...process.env, NODE_USE_ENV_PROXY: "1" } });
    }
    C.altyazi_dosya = "transcript.json";
  }
  if (!altyazi.length && C.altyazi_dosya) altyazi = altyaziTranskripttten(path.join(dir, C.altyazi_dosya));
  // Yanlış duyulan kelimeler için düzeltme listesi: { "Kurbalama": "Kurbağalama" }
  const DZ = C.duzeltmeler || {};
  altyazi = altyazi.map(([s, e, txt]) => [s, e, Object.entries(DZ).reduce((a, [k, v]) => a.split(k).join(v), txt)]);
  if (C.altyazi_dosya) fs.writeFileSync(path.join(dir, "altyazi_kontrol.txt"), altyazi.map(([s, e, x]) => `${s.toFixed(2)}-${e.toFixed(2)}  ${x}`).join("\n"));

  // sahneler
  scenes.forEach((sc, i) => {
    const id = "s" + i; const dur = r2(sc.son - sc.bas);
    const dark = sc.tip === "kapanis" || sc.tema === "koyu";
    const inner = SAHNE[sc.tip](sc, id);
    S.push(`<div id="${id}" class="clip" data-start="${sc.bas}" data-duration="${dur}" data-track-index="2">${dark ? `<div class="abs" style="inset:0;background:var(--navy)"></div>` : ""}${inner}</div>`);
  });

  // üst bar: bölüm ilerlemesi
  const n = scenes.length, gapX = 19, segW = Math.floor((936 - gapX * (n - 1)) / n);
  let top = `<div id="top" class="clip" data-start="0" data-duration="${r2(anaSure)}" data-track-index="3">`;
  scenes.forEach((sc, i) => {
    top += `<div class="abs" style="left:${72 + i * (segW + gapX)}px;top:96px;width:${segW}px;height:6px;border-radius:3px;background:rgba(127,134,150,0.28);overflow:hidden"><i id="p${i}" style="position:absolute;inset:0;background:var(--navy);transform-origin:left center;transform:scaleX(0)"></i></div>`;
    t(`tl.fromTo("#p${i}",{scaleX:0},{scaleX:1,duration:${r2(sc.son - sc.bas)},ease:"none"},${sc.bas});`);
    if (sc.tip === "kapanis" || sc.tema === "koyu" || (sc.tip === "medya" && (sc.yerlesim || "tam") === "tam")) t(`tl.set("#p0,#p1,#p2,#p3,#p4,#p5,#p6,#p7".split(",").slice(0,${n}).join(","),{backgroundColor:"#ffffff"},${sc.bas});`);
    else t(`tl.set("#p0,#p1,#p2,#p3,#p4,#p5,#p6,#p7".split(",").slice(0,${n}).join(","),{backgroundColor:"#0b1a3d"},${sc.bas});`);
  });
  top += `<img src="marka/logo.png" alt="" style="position:absolute;right:72px;top:132px;width:84px;height:84px;border-radius:50%;box-shadow:0 4px 14px rgba(11,26,61,0.25)" /></div>`;
  scenes.forEach((sc, i) => {
    const light = sc.tip === "kapanis" || sc.tema === "koyu" || (sc.tip === "medya" && (sc.yerlesim || "tam") === "tam");
    if (sc.bolum) top += `<div class="clip abs" style="inset:auto;left:72px;top:150px;font-size:26px;font-weight:700;letter-spacing:0.22em;color:${light ? "#fff" : "var(--navy)"}" data-start="${sc.bas}" data-duration="${r2(sc.son - sc.bas)}" data-track-index="4"><b style="color:var(--red);margin-right:10px">${String(i + 1).padStart(2, "0")}</b>${esc(sc.bolum)}</div>`;
  });

  // geçişler
  let wipes = `<div id="wipes" class="clip" data-start="0" data-duration="${total}" data-track-index="6">`;
  scenes.slice(1).forEach((sc, i) => {
    wipes += `<div class="abs" id="wp${i}" style="top:-200px;left:0;width:1500px;height:2400px;transform:skewX(-12deg);background:var(--navy)"><div class="abs" style="top:0;bottom:0;left:-34px;width:14px;background:var(--red)"></div><div class="abs" style="top:0;bottom:0;left:-16px;width:14px;background:var(--blue)"></div></div>`;
    t(`tl.fromTo("#wp${i}",{x:1300},{x:-1800,duration:0.75,ease:"power2.inOut"},${r2(sc.bas - 0.25)});`);
  });
  wipes += `</div>`;

  // altyazılar
  let caps = "";
  altyazi.forEach(([s, e, txt], i) => {
    const sc = scenes.find((x) => s >= x.bas && s < x.son) || {};
    const inv = sc.tip === "kapanis" || sc.tema === "koyu";
    caps += `<div class="clip abs" id="cap${i}" style="inset:auto;left:0;right:0;top:1590px;display:flex;justify-content:center" data-start="${s}" data-duration="${r2(e - s)}" data-track-index="5"><span style="padding:16px 34px;border-radius:22px;background:${inv ? "#fff" : "var(--navy)"};color:${inv ? "var(--navy)" : "#fff"};font-size:54px;font-weight:700;white-space:nowrap;box-shadow:0 12px 30px rgba(11,26,61,0.28)">${esc(txt)}</span></div>`;
    t(`tl.fromTo("#cap${i} span",{y:26,scale:0.94,opacity:0},{y:0,scale:1,opacity:1,duration:0.22,ease:"back.out(2)"},${s});`);
  });

  // arka plan
  const bg = `<div id="bg" class="clip" data-start="0" data-duration="${total}" data-track-index="0"><div class="grid"></div>
    <div class="blob" id="b1" style="left:-120px;top:300px;width:420px;height:760px"></div>
    <div class="blob" id="b2" style="left:640px;top:120px;width:380px;height:680px"></div>
    <div class="blob" id="b3" style="left:300px;top:1100px;width:460px;height:820px"></div>
    <div class="blob" id="b4" style="left:700px;top:1250px;width:360px;height:640px"></div></div>`;
  [["#b1", 60, 120], ["#b2", -50, 140], ["#b3", 70, -110], ["#b4", -60, -90]].forEach(([b, dx, dy]) => t(`tl.fromTo("${b}",{x:0,y:0},{x:${dx},y:${dy},duration:${total},ease:"sine.inOut"},0);`));

  const bitisHtml = bitis ? `<video id="bitis" class="clip" src="marka/bitis_9x16.mp4" muted playsinline data-start="${r2(anaSure)}" data-duration="${BIT}" data-track-index="8" style="width:${W}px;height:${H}px;object-fit:cover"></video>` : "";
  const sesHtml = ses ? `<audio id="vo" src="medya/${path.basename(ses)}" data-start="0" data-duration="${r2(Math.min(sesSure, anaSure))}" data-track-index="7" data-volume="1"></audio>` : "";
  const muzikHtml = C.muzik ? (kopyala(path.join(dir, C.muzik), path.join(projDir, "medya", path.basename(C.muzik))), `<audio id="mz" src="medya/${path.basename(C.muzik)}" data-start="0" data-duration="${total}" data-track-index="9" data-volume="${C.muzik_ses ?? 0.15}" data-fade-out="2"></audio>`) : "";

  const html = `<!doctype html>
<html lang="tr" data-resolution="portrait">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=${W}, height=${H}" />
<script src="marka/gsap.min.js"></script>
<link rel="stylesheet" href="marka/stil.css" />
<style>#root{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:var(--ground)} .clip{position:absolute;inset:0}</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}">
${bg}
${PRE.join("\n")}
${S.join("\n")}
${C.ust_bar === false ? "" : top}
${caps}
${wipes}
${bitisHtml}
${sesHtml}
${muzikHtml}
</div>
<script>
const tl = gsap.timeline({ paused: true });
const E = "power3.out";
${T.join("\n")}
window.__timelines = window.__timelines || {};
window.__timelines["main"] = tl;
tl.seek(0);
</script>
</body></html>`;
  fs.writeFileSync(path.join(projDir, "index.html"), html);
  fs.writeFileSync(path.join(projDir, "package.json"), JSON.stringify({ name: "nonstop-video", private: true, type: "module" }, null, 2));
  fs.writeFileSync(path.join(projDir, "meta.json"), JSON.stringify({ id: path.basename(dir), name: C.baslik || path.basename(dir) }, null, 2));
  return total;
}

// ---------------------------------------------------------------- kapak
async function kapakUret() {
  const K = C.kapak; if (!K) return;
  const satirlar = K.satirlar || [];
  const rowsHtml = satirlar.map((r, i) => {
    const w = Math.max(30, Math.round(420 * (r.deger ?? 0.5)));
    return `<div class="row-label" style="left:40px;top:${44 + i * 98}px;font-size:38px;font-weight:700">${esc(r.etiket)}</div>
      <div class="bar" style="left:340px;top:${42 + i * 98}px;width:${w}px;height:50px;border-radius:12px;background:${renk(r.renk)}"></div>
      <div class="val" style="left:${360 + w}px;top:${44 + i * 98}px;font-size:34px;color:${yrenk(r.renk)}">${esc(r.yazi ?? "")}</div>`;
  }).join("");
  const lines = Array.isArray(K.manset) ? K.manset : [K.manset];
  const fsz = K.manset_boyut || (lines.some((l) => l.replace(/\*/g, "").length > 14) ? 96 : 118);
  const dashTop = 600 + lines.length * fsz + 30;
  const html = `<!doctype html><html lang="tr"><head><meta charset="UTF-8" /><link rel="stylesheet" href="marka/stil.css" /></head><body>
  <div class="grid"></div>
  <div class="blob" style="left:-140px;top:120px;width:420px;height:760px"></div>
  <div class="blob" style="left:700px;top:40px;width:380px;height:680px"></div>
  <div class="blob" style="left:760px;top:1000px;width:360px;height:600px"></div>
  ${K.arka_gorsel ? `<img class="abs" src="medya/${esc(path.basename(K.arka_gorsel))}" style="left:0;top:0;width:1080px;height:1920px;object-fit:cover;opacity:0.18" />` : ""}
  <img class="abs" src="marka/logo.png" style="left:72px;top:330px;width:120px;height:120px;border-radius:50%;box-shadow:0 6px 18px rgba(11,26,61,.25)" />
  <div class="abs" style="left:212px;top:352px;font-size:30px;font-weight:800;letter-spacing:.04em;line-height:1.15">NON STOP<small style="display:block;font-size:20px;font-weight:700;letter-spacing:.32em;color:var(--muted)">SPOR KULÜBÜ</small></div>
  ${K.etiket ? `<div class="abs" style="left:72px;top:520px;padding:10px 22px;border-radius:14px;background:var(--red);color:#fff;font-size:34px;font-weight:800;letter-spacing:.04em">${esc(K.etiket)}</div>` : ""}
  <div class="hl" style="top:600px;font-size:${fsz}px;line-height:1.0;letter-spacing:-.035em">${lines.map((l) => `<span class="ln">${fmt(l)}</span>`).join("")}</div>
  <div class="dash" style="left:72px;top:${dashTop}px;width:110px;height:12px;border-radius:6px;background:var(--red)"></div>
  <div class="dash" style="left:198px;top:${dashTop}px;width:110px;height:12px;border-radius:6px;background:var(--blue)"></div>
  ${K.alt ? `<div class="abs" style="left:72px;top:${dashTop + 45}px;font-size:52px;font-weight:800"><span style="background:var(--yellow);padding:4px 18px;border-radius:14px">${fmt(K.alt)}</span></div>` : ""}
  ${satirlar.length ? `<div class="card" style="left:72px;top:${dashTop + 170}px;width:936px;height:${satirlar.length * 98 + 40}px;border-radius:34px">${rowsHtml}</div>` : ""}
  <div class="abs" style="left:0;top:1560px;width:1080px;height:400px;background:linear-gradient(180deg,#5d93e6,#2f6fd6)">
    <svg class="abs" style="left:0;top:-28px" width="1080" height="30" viewBox="0 0 1080 30" preserveAspectRatio="none"><path d="M0 15 Q 67.5 0 135 15 T 270 15 T 405 15 T 540 15 T 675 15 T 810 15 T 945 15 T 1080 15 V 30 H 0 Z" fill="#5d93e6"/></svg></div>
  ${K.buton ? `<div class="abs" style="left:0;right:0;margin:0 auto;width:max-content;top:1650px;padding:20px 40px;border-radius:22px;background:#fff;font-size:40px;font-weight:800;box-shadow:0 14px 30px rgba(11,26,61,.25)">${fmt(K.buton)}</div>` : ""}
  </body></html>`;
  const kdir = path.join(dir, "cikti", ".kapak");
  fs.rmSync(kdir, { recursive: true, force: true });
  kopyala(MARKA, path.join(kdir, "marka"));
  if (K.arka_gorsel) kopyala(path.join(dir, K.arka_gorsel), path.join(kdir, "medya", path.basename(K.arka_gorsel)));
  fs.writeFileSync(path.join(kdir, "kapak.html"), html);
  const require = createRequire(import.meta.url);
  const { chromium } = require("playwright");
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto("file://" + path.join(kdir, "kapak.html")); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  const out9 = path.join(dir, "cikti", "kapak_9x16.png"), out4 = path.join(dir, "cikti", "kapak_4x5.png");
  await p.screenshot({ path: out9 });
  await p.screenshot({ path: out4, clip: { x: 0, y: 285, width: 1080, height: 1350 } });
  await b.close();
  console.log("Kapak:", out9, out4);
}

// ---------------------------------------------------------------- çalıştır
fs.mkdirSync(path.join(dir, "cikti"), { recursive: true });
if (!flag("--sadece-kapak")) {
  const proj = path.join(dir, "cikti", ".proje");
  const total = videoKur(proj);
  const hf = (...a) => execFileSync("npx", ["--yes", HF, ...a], { cwd: proj, stdio: "inherit", env: { ...process.env, HYPERFRAMES_NO_TELEMETRY: "1" } });
  try { hf("lint"); } catch { console.error("Uyarı: lint hata verdi, yine de devam ediliyor."); }
  const kare = flagVal("--kare");
  if (kare) { hf("snapshot", "--at", kare, "--no-end", "-o", path.join(dir, "cikti", "kareler")); }
  else {
    const out = path.join(dir, "cikti", (C.dosya_adi || path.basename(dir)) + ".mp4");
    hf("render", "-q", flag("--taslak") ? "draft" : "standard", "-o", out);
    console.log(`Video: ${out} (${total} sn)`);
  }
}
if (!flag("--kare")) await kapakUret();
