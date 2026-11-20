# NON STOP Hareket Dili

## Karakter

**Hızlı gelir, uzun oturur.** Her nesnenin bir kütlesi ve sürtünmesi var. Varış hızlıdır (kısa atak), duruş uzundur (yumuşak sönüm). Çıkışlar girişlerden kısadır: nesneler solarak kaybolmaz, çekilerek gider. Yazıda zıplama (bounce) olmaz. Hafif taşma (overshoot) yalnızca fiziksel nesnelerde (kâğıt, logo) kullanılır.

**Her filmde tek bir vurgu kelimesi.** Impact hareketi film başına bir kez kullanılır ve her zaman bir sesle birlikte gelir.

**Kontrast tek renktir.** Zemin soğuk ve koyudur. Sinyal kırmızısı (marka kırmızısı) her planda en fazla bir öğede kullanılır. Işık her zaman sudan gelir (`caustic` tonu).

## Eğriler (`src/engine/motion/easing.ts`)

| Ad | Bezier | Kullanım |
|---|---|---|
| `arrive` | 0.16, 1, 0.3, 1 | Varsayılan giriş |
| `depart` | 0.7, 0, 0.84, 0 | Çıkış: hızlanarak terk eder |
| `camera` | 0.45, 0, 0.15, 1 | Kamera: başlangıç ve duruşta görünür ivme kenarı yok |
| `impact` | 0.05, 0.9, 0.1, 1 | Neredeyse anlık varış |
| `wipe` | 0.76, 0, 0.24, 1 | Maske ve silme kenarları |
| `sine` | — | Nefes ve döngüler |

## NS hareket sözlüğü (`src/engine/motion/motion.ts`)

| Hareket | Başlangıç | Bitiş | Süre | Eğri | Yön | Amaç |
|---|---|---|---|---|---|---|
| **NS Rise** | opaklık 0, y +46, bulanıklık 10 | dinlenme | 0.6 sn | arrive | yukarı | Gövde metni, kicker, ikincil satırlar |
| **NS Reveal** | maske 0, y +70 | dinlenme | 1.0 sn | arrive | yukarı | Başlıklar: satır karanlıktan kesilir, solarak gelmez |
| **NS Focus** | opaklık 0, bulanıklık 34, ölçek 1.08 | dinlenme | 1.6 sn | arrive | içeri | Düşünülmüş cümleler, çözüm anları (rack focus) |
| **NS Impact** | opaklık 0, ölçek 1.75, bulanıklık 26 | dinlenme | 0.35 sn | impact | içeri | Film başına bir kelime, her zaman ses vuruşunda |
| **NS Flow** | opaklık 0, x +120, bulanıklık 14 | dinlenme | 0.6 sn | arrive | sola | Kamera hareketini ya da whip geçişini taşıyan kelimeler |
| **NS Gather** | opaklık 0, harf aralığı +0.6em | dinlenme | 1.6 sn | arrive | içeri | Wordmark, marka adı, kapanış kartı |
| **NS Exit** | dinlenme | opaklık 0, y −40, bulanıklık 12 | 0.35 sn | depart | yukarı | Bir anı terk etmek. Asla düz fade değil |
| **NS Fade** | dinlenme | opaklık 0, bulanıklık 6 | 1.0 sn | sine | — | Yalnızca final ve sessiz sahne sonları |

Kullanım: `animate(t, 'Reveal', 2.0, { at: 4.5 })` → giriş 2.0 sn'de, çıkış 4.5 sn'de. `Text` bileşeni harf ya da kelime bölmeyi (`split`) ve kademeli gecikmeyi (`stagger`) otomatik yapar.

## Kamera (`src/engine/camera/`)

- **Keyframe'li rig:** `cameraAt([{t, x, y, zoom, roll}], t)`. Anahtarlar arasında her zaman `camera` eğrisi kullanılır.
- **Derinlik düzlemleri** (`tokens.depth`): far 0.18 · back 0.4 · **type 0.35** · mid 0.7 · subject 1 · front 1.45. Her katman kameranın hareketini kendi derinliği oranında izler; parallax buradan doğar.
- **Alan derinliği:** `Stage dof={…} focus={…}`. Odak düzleminden uzaklaşan katman bulanıklaşır.
- **El kamerası:** gürültü tabanlı, yumuşak. Kare başına rastgele titreme değildir.
- **Impact sarsıntısı:** vuruş anında güçlü, 0.6 sn içinde üstel olarak söner.
- **Type düzlemi (0.35):** yazı dünyayla birlikte hareket eder ama kamera zoom'u onu güvenli alanın dışına itemez.

## Geçişler (`src/engine/transitions/presentations.tsx`)

| Geçiş | Davranış | Ne zaman |
|---|---|---|
| `whip` | İki plan da kamera yönünde akar, bulanıklık hareketin ortasında zirve yapar | Momentum, bölüm değişimi |
| `flash` | Işık patlaması altında kesme | Enerjik modlar, vuruşlar |
| `push` | Kamera giden planın içinden geçer, yeni plan arkadan çıkar | Vurgudan çözüme geçiş |
| `dissolve` | Yumuşak, hafif bulanık çapraz geçiş | Sakin, sinematik bağlantılar |
| `wipe` | Eğik maske silmesi | Editoryal bölümler |
| `cut` | Geçiş yok | Impact: sert kesme + ses |

## FX katmanı (`src/engine/fx/`)

`WaterGlints` (suyun üzerinde ışık yolu) · `CausticField` (havuz tabanında kostik) · `LaneRopes` (gerçek perspektif projeksiyonlu kulvar ipleri) · `Particles` (asılı toz / su sıçraması) · `Flash` · `Finish` (film grain, vinyet, letterbox). Hepsi deterministiktir: aynı kare her zaman aynı sonucu verir. Bu yüzden Remotion paralel render alabilir.

## Ses dili (`scripts/audio/`)

Bütün sesler koddan sentezlenir, kayıt ya da örnek ses kullanılmaz.

| Ses | Kullanım |
|---|---|
| `impact` | Film başına bir kez |
| `whoosh` | Whip geçişi |
| `riser` | Impact'e giden 1.9 sn. Son örnekte keser |
| `shimmer` | Işık süpürmesi |
| `paper` | Kolaj parçası oturması |
| `tear` | Kolajın parçalanması |
| `glint` | Işığın ilk görünüşü |
| `sub` | Logo varışı |

**Kurallar:**
- Ses, sahneye göre konumlanır. Sahneyi yeniden zamanlamak sesini de taşır.
- Müzik, filmin zaman çizelgesinden üretilir. Impact'ten 0.5 sn önce ritim durur (vakum anı).
- Final miks iki geçişte −14 LUFS / −1.5 dBTP'ye normalize edilir.
