# NON STOP Spor Kulübü — video çalışma kuralları

- Yeni videolar `engine/` (NON STOP CREATIVE ENGINE, Remotion) ile yapılır. Mimari: `engine/README.md`, hareket dili: `engine/docs/HAREKET_DILI.md`.
- **Seslendirme her zaman marka sesiyle:** ElevenLabs "Furkan - Bilingual Turkish Narrator" (`engine/voice.config.json`), sakin okuma ayarları. Metin sahnenin `voice.text` alanına yazılır, `npm run voice -- --film=src/films/<ad>.json` ile üretilir. API anahtarı yalnızca `ELEVENLABS_API_KEY` ortam değişkeninden okunur; asla dosyaya ya da repoya yazılmaz.
- **Repo herkese açık.** Kişilerin (özellikle çocukların) fotoğraf ve videoları yalnızca `engine/public/private/` altına konur, bunlardan çıkan render'lar `engine/renders/private/` altına yazılır. İkisi de git-ignored; asla commit edilmez. Render kullanıcıya doğrudan gönderilir.
- Render öncesi `stills` ile kontakt sayfası alınıp kareler kontrol edilir; render sonrası ffprobe + loudness (−14 LUFS) doğrulanır.
- Bu konteynerde Chrome: `REMOTION_BROWSER_EXECUTABLE=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`.
