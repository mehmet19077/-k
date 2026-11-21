# Kaynak Proje Analizi

Beş açık kaynak proje klonlandı (Kasım 2026, `main` dalının son hâli), kodları ve lisansları okundu. Hiçbirinin kodu NON STOP motoruna kopyalanmadı. Aşağıda her projeden **hangi fikrin** alındığı ve motorda **nasıl yeniden yazıldığı** var.

## Özet karar tablosu

| Proje | Lisans | Teknoloji | API / ücretli servis / GPU | Kararımız |
|---|---|---|---|---|
| Lemo Opuscar | Kod MIT · Doküman ve stil prompt'ları CC BY-NC 4.0 · Filmler CC BY 4.0 · Clawd karakteri hariç | HTML sayfası + `window.render(t)`, playwright-core ile kare kare yakalama, three.js, Python (TTS, sampler, sfx), ffmpeg | Yerel çalışır. 3D/shader stilleri GPU ister. Görsel üretimi isteğe bağlı (Codex) | Fikir alındı, kod alınmadı. STYLE.md metinleri ticari olmayan lisansta: kopyalanmadı |
| OneTake | **PolyForm Noncommercial 1.0.0** | Tek HTML kompozisyon + `__seek(t)`, `lib/motion.js` hareket kütüphanesi, Python render (shutter motion blur), süreklilik denetleyicisi | Yerel çalışır | **Kodu kullanılamaz** (kulüp ticari bir kullanıcı). Yalnızca fikir düzeyinde ilham alındı |
| gbro Collage B-Roll | MIT | Agent skill: Codex `image_gen` + **Gemini Omni Flash** (ücretli, `GEMINI_API_KEY`) + ffmpeg | Ücretli API zorunlu, yerel değil | Estetik fikir alındı, AI üretimi tamamen kodla yeniden yazıldı (API yok) |
| Claude Animation Base | MIT (Clawd karakteri Anthropic'e ait, lisansa dahil değil) | p5.js + p5.brush + puppeteer-core | Yerel; GPU olmadan suluboya dolguları kare başına saniyeler sürüyor | MVP'ye alınmadı. Karakter sahnesi faz 2 (aşağıya bakın) |
| HyperFrames | Apache-2.0 | HTML + GSAP, Bun monorepo, CLI producer, 210 blok / 239 bileşenlik katalog | Yerel çalışır | Bağımlılık olarak eklenmedi: ikinci bir render motoru karmaşıklık getirir. Mevcut `saglik-video/` ve `sablon/` projeleri bağımsız kalıyor |
| Remotion | Remotion License (bireyler ve 3 kişiye kadar şirketler ücretsiz; daha büyük şirketler şirket lisansı alır) | React + TypeScript, `@remotion/transitions`, `@remotion/media`, `@remotion/noise` | Yerel çalışır | **Ana motor.** 4.0.545 (en güncel) |

> Not: Brief'te "66 video stili" yazıyordu. Depo şu an 99 stil içeriyor (12 Kasım 2026 güncellemesi). Analiz 99 stil üzerinden yapıldı.

## 1. Lemo Opuscar

**Çalışıyor mu?** Evet. Mimari çok temiz: her film, `window.render(t)` fonksiyonu olan deterministik bir web sayfası. Headless Chrome her kareyi ayrı yakalıyor. Ses, TTS, altyazı ve mix aynı zaman çizelgesinden üretiliyor ve −14 LUFS'e normalize ediliyor.

**Aldığımız fikirler:**
- *Tek doğruluk kaynağı olarak zaman çizelgesi* → `src/engine/scene/timeline.ts`. Hem görüntü render'ı hem müzik üreticisi (`scripts/generate-audio.ts`) aynı dosyayı çalıştırıyor. Bu sayede impact sesi tam 16.000 sn'de, kesmeyle aynı karede başlıyor (render sonrası ölçüldü).
- *Prosedürel ses* (sfx.py, sampler) → `scripts/audio/`: örnek ses yok, her ses koddan sentezleniyor. Böylece lisans sorunu olmuyor.
- *Stil = kurallar + malzeme + ne olmadığı* → `docs/HAREKET_DILI.md` ve tokenlar.
- *Mastering:* iki geçişli loudnorm → `scripts/render.ts` içindeki `master()`.

**Uyumsuz ya da gereksiz olanlar:** 99 stilin her biri ayrı bir dünya. Bizim hedefimiz tek ve tutarlı bir marka dili. Python ortamı, Kokoro TTS ve three.js bu aşamada gereksiz bağımlılık olurdu.

## 2. OneTake

**Çalışıyor mu?** Evet (Python + Playwright). En güçlü fikri şu: iki sahne arasındaki sınırı *tasarlanacak bir nesne* olarak ele almak. Bir sahnedeki şey bir sonrakine dönüşüyor ("carry"), sahneler birbirinin yerine geçmiyor.

**Lisans:** PolyForm Noncommercial, yani ticari kullanım yasak. NON STOP Spor Kulübü bir işletme olduğu için **tek satır kodu bile kullanılmadı**. Fikirler telif konusu değildir; uygulama sıfırdan yazıldı.

**Fikir düzeyinde ilham:**
- Kamera, sahne bileşeni değil bir *rig* olarak tanımlandı → `src/engine/camera/` (keyframe'li sanal kamera, `Stage` / `DepthLayer` ile parallax ve alan derinliği, gürültü tabanlı el kamerası, sönümlenen impact sarsıntısı).
- Geçiş, ortamın hareketini taşıyor: whip geçişi kamera yönünde akıyor, push geçişinde kamera bir sahnenin içinden geçip diğerine çıkıyor.
- Hareketler stil değil, sayı: NS hareket sözlüğü saf fonksiyon (`poseAt(move, t, start)`).

## 3. gbro Collage B-Roll

**Çalışıyor mu?** Yalnızca Codex ortamında ve ücretli Gemini API anahtarıyla. Yerelde, API'siz çalışmıyor.

**Estetik fikir:** düz renk kâğıt zemin, halftone baskı, yırtık kenarlar, boş alandan parça parça "kurulan" stop-motion kolaj.

**Kodla yeniden yazıldı** (`src/engine/collage/`):
- `tornPath()` → tohumlu (seeded) yırtık kenar poligonu. Her karede aynı kalır.
- `Paper` → kadraj dışından kayarak gelen, hafif rotasyonla oturan, **2 karede bir adım atan** (stop-motion) kâğıt parçası. Çıkışı da var.
- `Halftone` → CSS ile baskı noktası alanı.
- `SliceText` → kelime yatay şeritlere bölünüp kayık gelir, hizaya oturur, sonra yırtılır.
- `Dial` → yüzme havuzu tempo saati (pace clock).

## 4. Claude Animation Base

**Çalışıyor mu?** Evet. Ancak GPU olmadan p5.brush suluboya dolguları çok yavaş. Asıl değeri ANIMATION_GUIDE.md'deki karakter animasyonu ilkeleri (anticipation, follow-through, "boiling" çizgi, duygu sözlüğü).

**Karar:** MVP'ye girmedi. Sebepleri:
1. Clawd karakteri Anthropic'e ait, kulüp filminde kullanılamaz.
2. El çizimi estetik, "dark cinematic sports editorial" kimliğiyle çatışıyor.
3. p5.brush ağır bir bağımlılık.

**Faz 2 önerisi:** Kulübe özgü bir maskot ya da sporcu silüeti için SVG/canvas tabanlı bir `CharacterScene`. p5 kullanılmadan, aynı ilkelerle (anticipation → action → follow-through) yazılmalı.

## 5. HyperFrames

**Çalışıyor mu?** Evet. Bu depoda daha önce sağlık videosu için kullanıldı. HTML + GSAP, Apache-2.0.

**Karar:** Motorumuz Remotion. İki render motorunu birbirine bağlamak, briefin uyardığı "5 uygulamanın birbirine bağlandığı karmaşık yapı" olurdu.

**Alınan fikir:** Blok / bileşen kataloğu → bizim **sahne kayıt defterimiz** (`src/scenes/index.ts`). Yeni sahne bir kez yazılır, bütün filmlerde kullanılır.

Mevcut HyperFrames projeleri (`saglik-video/`, `sablon/`) dokunulmadan, bağımsız kalıyor.

## 6. Remotion (ana motor)

`remotion.dev` dokümantasyon sitesine bu oturumdaki ağ ortamından erişilemedi (DNS reddi). Bu yüzden güncel API, kurulan **4.0.545** paketlerinin tip tanımlarından (`.d.ts`) doğrulandı:

- Ses: `remotion` içindeki `Audio` artık kullanımdan kalktı (`Html5Audio` adını aldı). Önerilen bileşen `@remotion/media` paketindeki `Audio`. `startFrom`/`endAt` yerine `trimBefore` / `durationInFrames` kullanılıyor.
- Geçişler: `TransitionSeries` (`Sequence`, `Transition`, `Overlay`) + `linearTiming`. Özel geçişler `TransitionPresentation` + `presentationProgress` / `presentationDirection` ile yazılıyor.
- Kompozisyon: zod şeması + `calculateMetadata`. Film süresi her zaman film JSON'undan hesaplanıyor.

**Lisans notu:** Remotion bireyler ve küçük ekipler (3 kişiye kadar) için ücretsizdir. Daha büyük şirketlerin ticari kullanımda şirket lisansı alması gerekir. Kulübün ekip büyüklüğüne göre kontrol edilmesi gerekiyor. **Bu bir karar noktasıdır.**
