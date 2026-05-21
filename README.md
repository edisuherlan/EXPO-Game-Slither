# 🐍 EXPO Game Slither

**Slither.io versi pembelajaran** — game mobile multiplayer sederhana pakai **Expo (React Native)** + **Firebase Firestore**. Cocok untuk mencoba langsung, belajar game loop, real-time database, dan memodifikasi kode sendiri.

| | |
|---|---|
| **Author** | [Edi Suherlan](https://github.com/edisuherlan) |
| **Repository** | [github.com/edisuherlan/EXPO-Game-Slither](https://github.com/edisuherlan/EXPO-Game-Slither) |
| **Firebase project (default)** | `gameslither-28be8` |
| **Package Android** | `com.audhighasu.slither` |
| **Versi app** | 1.0.0 |
| **Expo SDK** | 54 |

---

## 📲 Coba game tanpa coding (APK)

Kalau Anda hanya ingin **main dulu** di Android:

1. Unduh file release di repo: [`docs/game_slither-v1.0.0.apk`](docs/game_slither-v1.0.0.apk)  
   (atau buka folder `docs/` di GitHub → download APK)
2. Di HP Android: aktifkan **Install dari sumber tidak dikenal** untuk browser / file manager Anda.
3. Install APK → buka app → isi nama → **Main**.
4. Pastikan HP terhubung **internet** (Wi‑Fi atau data) agar multiplayer & makanan shared dari Firestore berjalan.

> APK ini memakai Firebase project bawaan (`gameslither-28be8`). Anda **tidak** perlu setup database sendiri hanya untuk bermain.

**Multiplayer:** buka app di 2 HP atau lebih (bisa satu Wi‑Fi, bisa beda jaringan). Lihat angka **Online: N** di HUD naik saat pemain lain masuk ruang `global`.

---

## 📸 Cuplikan aplikasi

### Menu utama
Layar pertama: isi nama pemain, lalu **Main** atau lihat **Leaderboard**.

![Menu utama — Home Screen](docs/Screenshot_20260521_004846.png)

### Saat bermain
Ular hijau kamu, makanan merah shared (sama di semua HP), HUD skor & jumlah pemain online.

![Gameplay — Game Screen](docs/Screenshot_20260521_004953.png)

---

## ✨ Fitur singkat

- 🎮 **Kendali ular** — sentuh layar, arah mengikuti jari (seperti Slither.io)
- 🌍 **Dunia besar** — peta 5× lebih luas dari layar HP, kamera mengikuti kepala ular
- 🍎 **Makanan shared** — titik merah di Firestore; makan → skor +10 & ular memanjang
- 👥 **Multiplayer** — ular pemain lain real-time (`games/global/live`)
- 🏆 **Leaderboard** — skor terbaik tersimpan di Firestore
- 📦 **Build APK** — EAS Build (profil `preview`)

Penjelasan konsep (Bahasa Indonesia, narasi + tur kode): [`docs/penjelasan-ulat-dan-gameplay.md`](docs/penjelasan-ulat-dan-gameplay.md)

---

## 🛠️ Instalasi untuk development & modifikasi

### Prasyarat

| Kebutuhan | Keterangan |
|-----------|------------|
| [Node.js](https://nodejs.org/) | LTS 18 atau 20+ |
| npm | Ikut Node.js |
| [Git](https://git-scm.com/) | Clone repo |
| [Expo Go](https://expo.dev/go) | Di HP fisik — **SDK 54** (harus sesuai project) |
| Akun [Firebase](https://firebase.google.com/) | Wajib jika pakai DB sendiri; opsional jika pakai project default |
| (Opsional) Android Studio | Emulator Android |
| (Opsional) [EAS CLI](https://docs.expo.dev/build/setup/) | Build APK sendiri |

### 1. Clone & install dependency

```bash
git clone https://github.com/edisuherlan/EXPO-Game-Slither.git
cd EXPO-Game-Slither

npm install
```

### 2. Jalankan di development

```bash
npx expo start
```

- Scan **QR code** dengan **Expo Go** (Android/iOS), atau  
- Tekan `a` → emulator Android, `w` → web (fitur multiplayer penuh diutamakan di mobile).

Cache bermasalah:

```bash
npx expo start -c
```

### 3. Pilih mode Firebase

Ada **dua jalur** — pilih salah satu.

#### Opsi A — Pakai Firebase project bawaan (paling cepat)

Config sudah di `constants/firebaseConfig.ts` mengarah ke project **`gameslither-28be8`**.

Yang perlu Anda lakukan:

1. Pastikan **Firestore Rules** di Console project tersebut sudah di-**Publish** (salin dari `firestore.rules` di repo ini — lihat [Konfigurasi database](#-konfigurasi-database-firestore) di bawah).
2. Jalankan `npx expo start` → main di Expo Go.

> Anda **tidak** mengubah `firebaseConfig.ts` / `google-services.json` jika hanya ingin fork & modifikasi gameplay di client yang masih menulis ke project yang sama. Untuk kelas kecil ini biasanya cukup.

#### Opsi B — Firebase project sendiri (disarankan untuk fork serius)

Gunakan project Firebase **milik Anda** agar data multiplayer & leaderboard terpisah.

**Langkah di [Firebase Console](https://console.firebase.google.com/):**

1. **Create project** (misalnya `my-slither-lab`).
2. **Build → Firestore Database → Create database**  
   - Mode **test** / production bebas untuk lab; yang penting **Rules** nanti disesuaikan.
   - Pilih region terdekat (mis. `asia-southeast1`).
3. **Project settings → General → Your apps → Add app → Android**  
   - Package name: **`com.audhighasu.slither`** (sama dengan `app.json` → `android.package`), atau ganti package di `app.json` jika Anda pakai nama sendiri.
   - Unduh **`google-services.json`** → letakkan di **root project** (ganti file lama).
4. **Project settings → General → Your apps** — jika belum ada app Web, tambahkan **Web app** → salin config object.
5. Edit **`constants/firebaseConfig.ts`** — ganti semua field:

```ts
export const firebaseConfig = {
  apiKey: '...',
  authDomain: '....firebaseapp.com',
  projectId: '....',
  storageBucket: '....',
  messagingSenderId: '...',
  appId: '...',
};
```

6. **Firestore → Rules** → salin isi file **`firestore.rules`** dari repo → **Publish** (wajib).
7. Restart Metro: `npx expo start -c`.

**Catatan keamanan:** `apiKey` di mobile/web **bukan** rahasia mutlak; yang melindungi data adalah **Firestore Rules**. Jangan commit service account / private key.

---

## 🗄️ Konfigurasi database (Firestore)

App ini **tidak** pakai server backend terpisah. Semua sinkronisasi multiplayer & makanan lewat **Cloud Firestore**.

### Diagram data

```
Firestore
├── slither_foods/{foodId}          → makanan shared { x, y, roomId }
├── slither_room/global             → metadata ruang
├── games/global/live/{playerId}    → posisi ular realtime
├── scores/{autoId}                 → riwayat tiap game over
└── leaderboard/{playerId}          → skor terbaik per pemain
```

### Deploy Rules (wajib)

Tanpa Rules yang benar, gejala di app:

- HUD menampilkan peringatan Firestore,
- makanan hanya **fallback lokal** (tidak sinkron antar HP),
- multiplayer / leaderboard gagal tulis.

**Cara deploy:**

1. Buka Firebase Console → project Anda → **Firestore Database** → tab **Rules**.
2. Salin seluruh isi file [`firestore.rules`](firestore.rules) di repo.
3. Klik **Publish**.

Isi rules saat ini **`allow read, write: if true`** — sengaja untuk **lab / simulasi**, bukan production publik. Untuk rilis nyata, ganti dengan **Firebase Auth** + rules ketat.

### Koleksi & path (referensi modifikasi)

| Path / koleksi | File kode terkait | Fungsi |
|----------------|-------------------|--------|
| `slither_foods` | `services/sharedFoodService.ts` | Makanan shared |
| `slither_room` | `sharedFoodService.ts` | Meta ruang `global` |
| `games/global/live/{playerId}` | `services/multiplayerService.ts` | Ular online |
| `scores` | `services/firestoreService.ts` | Log setiap mati |
| `leaderboard/{playerId}` | `firestoreService.ts` | Best score |

Nama koleksi terpusat di [`constants/firestoreCollections.ts`](constants/firestoreCollections.ts) — jika rename koleksi, ubah **constants + rules + service** sekaligus.

### Konstanta multiplayer (opsional)

[`constants/multiplayer.ts`](constants/multiplayer.ts):

| Konstanta | Default | Efek |
|-----------|---------|------|
| `MULTIPLAYER_ROOM_ID` | `global` | Satu dunia bersama |
| `SYNC_INTERVAL_MS` | `200` | Seberapa sering posisi dikirim |
| `PLAYER_STALE_MS` | `8000` | Pemain dianggap offline |
| `MAX_SYNC_SEGMENTS` | `18` | Banyak titik tubuh ke cloud |

### Cek koneksi berhasil

1. Jalankan app → **Main** → HUD: **Online: 1** (minimal Anda).
2. Buka Firestore Console → tab **Data** — harus muncul dokumen di `games/global/live/...` saat bermain.
3. Koleksi `slither_foods` terisi setelah app seed pool (bisa butuh beberapa detik pertama kali).
4. Dua HP → **Online: 2** dan terlihat ulat warna lain.

---

## 🔧 Memodifikasi game

### Balance & feel gameplay

Edit [`constants/game.ts`](constants/game.ts):

- `baseSpeed`, `turnSpeed`, `worldScale`
- `growPerFood`, `scorePerFood`, `initialLength`

Restart Metro setelah ubah constants.

### Alur baca kode (disarankan)

```
App.tsx → screens/ → components/game/GameBoard.tsx
       → hooks/useGameLoop.ts → game/engine.ts → game/snakeBody.ts
       → hooks/useMultiplayer.ts → services/multiplayerService.ts
       → hooks/useSharedFoods.ts → services/sharedFoodService.ts
```

Dokumen narasi lengkap: [`docs/penjelasan-ulat-dan-gameplay.md`](docs/penjelasan-ulat-dan-gameplay.md)

### Build APK sendiri

```bash
npx eas-cli login
npm run build:apk
```

Setara dengan:

```bash
npx eas build -p android --profile preview
```

- Butuh akun Expo & project EAS (lihat `app.json` → `extra.eas.projectId` — untuk fork, buat project EAS baru atau hapus/ ganti `projectId`).
- `google-services.json` di root wajib cocok dengan Firebase Android app Anda.
- Hasil build: unduh `.apk` dari dashboard Expo.

---

## 🧱 Arsitektur singkat

```
index.ts → App.tsx (navigasi 3 layar)
              ├── HomeScreen        → nama + AsyncStorage
              ├── GameScreen        → hooks multiplayer & makanan
              │     └── GameBoard   → render + game loop
              └── LeaderboardScreen → query Firestore

game/engine.ts      → physics ular (tick, makan, tabrakan)
hooks/useGameLoop   → requestAnimationFrame
services/*          → Firestore (skor, live players, makanan)
lib/firebase.ts     → inisialisasi Firebase
```

**Alur data saat main:**

1. `GameBoard` loop ~60 FPS → `tick()` geser kepala  
2. Tabrakan makanan → skor/panjang naik, hapus `slither_foods`  
3. Setiap ~200 ms posisi ke `games/global/live/{playerId}`  
4. HP lain `onSnapshot` → gambar ular remote  
5. Game over → `scores` + update `leaderboard` jika rekor  

---

## 🛠️ Tech stack

| Lapisan | Teknologi |
|---------|-----------|
| Mobile | [Expo](https://expo.dev) ~54, React Native 0.81, TypeScript |
| Backend | [Firebase Firestore](https://firebase.google.com/docs/firestore) |
| Storage lokal | `@react-native-async-storage/async-storage` |
| Build | [EAS Build](https://docs.expo.dev/build/introduction/) |

---

## 📁 Struktur folder

| Folder / file | Isi |
|---------------|-----|
| `screens/` | Home, Game, Leaderboard |
| `components/game/` | `GameBoard` — render, input, loop |
| `game/` | Engine, kamera, tubuh ular, tabrakan |
| `hooks/` | `useGameLoop`, `useMultiplayer`, `useSharedFoods` |
| `services/` | Firestore & AsyncStorage |
| `constants/` | Balance, koleksi, `firebaseConfig.ts` |
| `firestore.rules` | Rules lab — **Publish ke Console** |
| `docs/` | APK release, screenshot, penjelasan gameplay |
| `eas.json` | Profil build APK |

---

## 📜 Scripts npm

| Perintah | Keterangan |
|----------|------------|
| `npm start` | Expo dev server |
| `npm run android` | Expo → Android |
| `npm run ios` | Expo → iOS |
| `npm run web` | Expo web |
| `npm run build:apk` | EAS build APK (preview) |
| `npm run build:apk:prod` | EAS build APK (production profile) |

---

## ❓ Troubleshooting

| Masalah | Kemungkinan penyebab | Solusi |
|---------|----------------------|--------|
| Tidak ada makanan merah / peringatan di HUD | Rules belum Publish atau project Firebase salah | Deploy `firestore.rules`, cek `firebaseConfig.ts` |
| Online selalu 1 | Satu device saja, atau listener gagal | Dua HP + internet; cek Rules path `games/.../live` |
| Expo Go error SDK | Versi Expo Go tidak 54 | Update Expo Go atau sesuaikan SDK di `package.json` |
| Build APK gagal | `google-services.json` tidak cocok | Unduh ulang dari Firebase Android app yang package-nya sama |
| Skor tidak masuk leaderboard | Firestore write ditolak | Rules `scores` & `leaderboard` harus allow (lab: `if true`) |

---

## ⚠️ Keamanan (penting)

- Rules **`if true`** hanya untuk **kelas / demo**.
- Production: Firebase Auth, validasi field di rules, rate limiting, monitoring.
- Jangan commit **service account JSON** atau private key.

---

## 🎓 Untuk dosen / mahasiswa

- Komentar pembelajaran (Bahasa Indonesia) di banyak file `.ts` / `.tsx`.
- Uji multiplayer: minimal **2 perangkat**, nama berbeda.
- Eksperimen: `constants/game.ts`, `constants/multiplayer.ts`, Firestore Rules.

---

## 🤝 Kontribusi & lisensi

Project edukatif — fork, modifikasi, dan pakai di materi kuliah boleh; sebut sumbernya.

**Dibuat oleh [Edi Suherlan](https://github.com/edisuherlan)** · [audhighasu.com](https://audhighasu.com)

---

<p align="center">
  <sub>⭐ Kalau bermanfaat untuk praktikum, star repo-nya di GitHub!</sub>
</p>
