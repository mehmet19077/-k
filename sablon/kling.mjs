#!/usr/bin/env node
// Kling API yardımcı aracı (api-singapore.klingai.com)
//   node kling.mjs bakiye
//   node kling.mjs uret --istem "..." [--sure 5] [--oran 9:16] [--cozunurluk 1080p] [--model kling-4.0] --cikti icerik/x/klip.mp4
//   node kling.mjs durum <gorev_id> [--cikti dosya.mp4]
// Anahtar: KLING_API_KEY ortam değişkeni ya da ~/.config/nonstop/kling_key dosyası.
// (Ortamın ağ ayarlarında anahtar kayıtlıysa proxy onu kendisi ekler; o durumda dosya gerekmez.)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

// Node'un fetch'i HTTPS_PROXY'yi ancak NODE_USE_ENV_PROXY=1 ile kullanır; gerekirse kendini yeniden başlat.
if ((process.env.HTTPS_PROXY || process.env.https_proxy) && process.env.NODE_USE_ENV_PROXY !== "1") {
  const r = spawnSync(process.execPath, process.argv.slice(1), { stdio: "inherit", env: { ...process.env, NODE_USE_ENV_PROXY: "1" } });
  process.exit(r.status ?? 1);
}

const BASE = "https://api-singapore.klingai.com";
const keyFile = path.join(os.homedir(), ".config/nonstop/kling_key");
const KEY = process.env.KLING_API_KEY || (fs.existsSync(keyFile) ? fs.readFileSync(keyFile, "utf8").trim() : "proxy-injected");
const H = { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` };

const args = process.argv.slice(2);
const cmd = args[0];
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(method, p, body) {
  const r = await fetch(BASE + p, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.code !== 0) throw new Error(`Kling hata ${r.status} code=${j.code} ${j.message || ""}`);
  return j.data;
}

async function bekleVeIndir(id, out) {
  const t0 = Date.now();
  for (;;) {
    const [task] = await api("GET", `/tasks?task_ids=${id}`);
    process.stdout.write(`\r${task.status} (${Math.round((Date.now() - t0) / 1000)} sn)   `);
    if (task.status === "succeeded") {
      const v = (task.outputs || []).find((o) => o.type === "video");
      console.log("\nBitti. Faturalanan süre:", task.usage?.output_duration, "sn");
      if (out && v?.url) {
        const r = await fetch(v.url);
        if (!r.ok) throw new Error("İndirme hatası " + r.status + " (" + new URL(v.url).host + ")");
        fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
        fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
        console.log("Kaydedildi:", out);
      } else console.log("URL:", v?.url);
      return task;
    }
    if (task.status === "failed") throw new Error("Görev başarısız: " + task.message);
    await sleep(10000);
  }
}

if (cmd === "bakiye") {
  const now = Date.now();
  const d = await api("GET", `/account/costs?start_time=${now - 365 * 86400000}&end_time=${now}`);
  const list = d.resource_pack_subscribe_infos || [];
  if (!list.length) console.log("Bağlantı tamam. Hesapta kaynak paketi görünmüyor (bakiye ile ödeme yapılıyor olabilir ya da kredi yok).");
  for (const p of list) console.log(`${p.resource_pack_name}: ${p.remaining_quantity}/${p.total_quantity} kaldı (${p.status})`);
} else if (cmd === "uret") {
  const prompt = opt("--istem");
  if (!prompt) { console.error("--istem gerekli"); process.exit(1); }
  const model = opt("--model", "kling-4.0");
  const body = { prompt, settings: { duration: +opt("--sure", 5), aspect_ratio: opt("--oran", "9:16"), resolution: opt("--cozunurluk", "1080p") }, options: { watermark_info: { enabled: false } } };
  const d = await api("POST", `/text-to-video/${model}`, body);
  console.log("Görev:", d.id);
  await bekleVeIndir(d.id, opt("--cikti"));
} else if (cmd === "durum") {
  await bekleVeIndir(args[1], opt("--cikti"));
} else {
  console.log("Komutlar: bakiye | uret --istem ... --cikti dosya.mp4 | durum <id>");
}
