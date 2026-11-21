# NON STOP CREATIVE ENGINE

Remotion merkezli, kodla çalışan, modüler bir sinematik video üretim motoru. Bu ilk sürümle birlikte gelen ilk film: **"Disiplin, yetenekten önce gelir."** (30 sn, 9:16 / 16:9 / 1:1).

- Kaynak projelerin analizi ve lisans kararları: [`docs/ANALIZ.md`](docs/ANALIZ.md)
- Görsel ve hareket dili: [`docs/HAREKET_DILI.md`](docs/HAREKET_DILI.md)

## Hızlı başlangıç

```bash
cd engine
npm install
npm run audio      # müzik ve ses efektlerini koddan sentezler (public/sfx, public/audio), ~5 sn
npm run studio     # Remotion Studio: önizleme, sahne düzenleme, render
npm run render -- --comp=DisiplinYetenek,DisiplinYetenek-16x9,DisiplinYetenek-1x1
npm run stills -- --comp=DisiplinYetenek --times=1,5,16.2   # inceleme kareleri ve kontakt sayfası
```

**Gereksinimler:** Node 22.18 veya üstü (scriptler TypeScript'i doğrudan çalıştırır) ve ffmpeg.

İnternetsiz ya da CI ortamında, kurulu bir Chrome kullanmak için:

```bash
REMOTION_BROWSER_EXECUTABLE=/path/to/chrome-headless-shell
```

## Mimari

```
src/
  engine/                  ← motor kütüphanesi (belirli bir sahneyi bilmez)
    tokens.ts              renk, tipografi, derinlik, finish tokenları
    timing.ts              sn → kare, beat grid, standart süreler
    formats.ts             9:16, 16:9, 1:1 ve layout unit
    motion/                NS hareket sözlüğü, eğriler, deterministik random
    camera/                sanal kamera rig'i, Stage / DepthLayer (parallax, DOF)
    fx/                    su ışığı, kostik, kulvar ipleri, partikül, flash, grain/vinyet
    type/                  Text (tek tipografi primitifi), SliceText, Scatter
    collage/               Paper (yırtık kâğıt, stop-motion), Halftone, Dial
    transitions/           whip · flash · push · dissolve · wipe
    audio/SoundTrack.tsx   müzik yatağı + sahneye bağlı ses cue'ları
    scene/                 zaman çizelgesi (render ve ses üreticisi ortak), şema, layout
  scenes/                  sahne kütüphanesi: hook · movement · editorial · impact · statement · outro
  film/                    FilmSpec şeması ve Film (TransitionSeries + ses + finish)
  story/                   hikâye modları (9 mod) ve brief → film besteleyici
  films/disiplin.json      ilk filmin tamamı, veri olarak
scripts/
  generate-audio.ts        SFX paleti + filme göre kesilmiş müzik (örnek ses yok)
  render.ts                render → loudnorm mastering (−14 LUFS) → ffprobe doğrulama
  stills.ts                inceleme kareleri ve kontakt sayfası
```

### Bir film = bir JSON

Film, `src/films/*.json` dosyasındaki sahne listesinden oluşur. Her sahnenin şu alanları vardır:

- `type` (hangi sahne bileşeni)
- `duration`
- `transition` (bu sahneye giriş geçişi)
- `accent`
- `sound` (sahneye göre zamanlanmış ses cue'ları)
- sahneye özgü metin ve parametreler

Sahneler yeniden sıralanabilir, kopyalanabilir ya da başka filmlerde kullanılabilir. Film süresi her zaman JSON'dan hesaplanır (`calculateMetadata`).

Remotion Studio'da her kompozisyonun sağ panelinde, zod şemasından üretilen bir form vardır. Metinleri, süreleri ve geçişleri koda dokunmadan düzenleyebilirsiniz.

### Hikâye motoru

`story/modes.ts` dosyası altı anlatı vuruşunu (Hook → Problem → Development → Impact → Resolution → Ending) dokuz moda göre düzenler:

> cinematic · documentary · editorial · emotional · minimal · energetic · educational · sports · brand

Her mod şunları belirler:
- hangi vuruşların kullanılacağı
- her vuruşun ağırlığı
- vuruşlar arası geçişler
- grain / vinyet seviyesi

`composeFilm(brief)` kısa bir brief'ten tam bir FilmSpec üretir. Süreyi, geçiş örtüşmelerini hesaba katarak tam hedefe oturtur. Örnek kompozisyon: **`Composer-Minimal`** (aynı mesaj, 15 sn, minimal mod).

### Ses

`npm run audio` iki şey üretir:

1. **SFX paleti:** impact, whoosh, riser, shimmer, paper, tear, glint, sub.
2. **Filme özel müzik:** film JSON'unun zaman çizelgesinden üretilir. Akor değişimleri sahne sınırlarına, ritim beat grid'e oturur ve impact'ten 0.5 sn önce ritim durur.

Render ölçümü: impact sesi tam 16.000 sn'de, kesmeyle aynı karede başlıyor. Final miks −14 LUFS'e normalize ediliyor.

## Yeni bir film yapmak

1. `src/films/disiplin.json` dosyasını kopyalayın. Metinleri, süreleri, geçişleri ve sesleri değiştirin.
2. `src/Root.tsx` içine bir `Composition` ekleyin.
3. Filme özel müzik için `scripts/generate-audio.ts` içindeki `films` listesine ekleyip `npm run audio` çalıştırın.

Fotoğraf ve video asset'lerini `public/` altına koyun. `Img` ve `@remotion/media` `Video` bileşenleri `staticFile()` ile okur. Mevcut sahneler asset'siz, tamamen kodla üretiliyor.

## Durum: neler var, neler yok

**Çalışan ve render ile doğrulanan:**
- 6 sahne tipi
- 5 geçiş
- NS hareket sözlüğü
- kamera rig'i, parallax ve DOF
- FX katmanı
- prosedürel ses ve müzik, mastering
- 3 format
- hikâye modları ve composer
- Studio üzerinden parametre düzenleme

**Henüz yok (faz 2):**
- Özel web arayüzü (proje oluşturma, asset yükleme ve timeline için ayrı bir uygulama). Şu an arayüz olarak Remotion Studio kullanılıyor.
- Karakter / illüstrasyon sahnesi
- Data sahnesi (grafik)
- Fotoğraf ve video asset'i kullanan hazır sahne
- Seslendirme (TTS) ve altyazı
- Geçişlerde gerçek shutter motion blur. Şu an hareket blur'u CSS bulanıklığıyla simüle ediliyor.
