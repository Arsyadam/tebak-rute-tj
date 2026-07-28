# PRD — TransitGuessr

## 1. Summary

**TransitGuessr** adalah game kuis berbasis pengetahuan rute transportasi umum Jakarta. Pemain melatih dan menguji ingatan tentang kode rute, nama halte, dan jalur di peta lewat beberapa mode permainan. Target MVP: web app mobile-first yang bisa dimainkan dalam sesi singkat (2–5 menit per round).

## 2. Contacts

| Name | Role | Comment |
|------|------|---------|
| Arsyad | Product Owner / Builder | Keputusan produk & prioritas |
| TBD | Design | UX flow & visual map |
| TBD | Engineering | Data rute TJ + game loop |
| TBD | Data / Ops | Sumber data halte & rute (GTFS / dump TJ) |

## 3. Background

### Context
Banyak warga Jakarta naik Transjakarta setiap hari, tapi sering hanya hafal 1–2 koridor favorit. Kode rute (mis. `1`, `9N`, `B11`), urutan halte, dan jalur di peta masih membingungkan — terutama untuk rute non-BRT / feeders.

Belajar dari peta resmi atau aplikasi navigasi terasa pasif. Belum ada game ringan yang khusus melatih “mental map” jaringan TJ.

### Why now?
- Data rute & halte Transjakarta sudah tersedia (GTFS publik / dump internal).
- Format quiz game (Wordle-like / GeoGuessr-like) sudah familiar di audiens digital.
- Ada peluang konten shareable (skor harian, streak, challenge teman).

### What changed?
AI coding tools mempercepat build prototipe web + integrasi data peta. Fokus awal bisa ke gameplay, bukan infrastruktur berat.

## 4. Objective

### Objective
Membuat game yang membuat pengguna **lebih cepat mengenali** hubungan antara: kode rute ↔ halte awal/akhir ↔ urutan halte ↔ bentuk jalur di peta.

### Why it matters
- Untuk pemain: naik TJ lebih percaya diri, lebih jarang salah naik/turun.
- Untuk produk: jadi “habit app” ringan (daily quiz) dengan potensi viral lokal Jakarta.

### Alignment
Produk edukasi + hiburan lokal, bukan competitor aplikasi transit (Tije, Google Maps). Positioning: **belajar sambil main**, bukan navigasi.

### Key Results (MVP, 8–12 minggu setelah soft launch)
| KR | Target | Cara ukur |
|----|--------|-----------|
| KR1 — Activation | ≥ 40% pengunjung baru menyelesaikan 1 full round | Analytics event `round_complete` |
| KR2 — Retention D1 | ≥ 20% kembali bermain keesokan hari | Cohort D1 |
| KR3 — Learning signal | Rata-rata akurasi naik ≥ 10pp setelah 10 round | Skor per mode |
| KR4 — Share | ≥ 8% round selesai menghasilkan share/skor | Share click / image save |

## 5. Market Segment(s)

### Primary segment — “Daily TJ rider yang ingin lebih hafal”
- **Job to be done:** Ingin tahu rute alternatif / koridor lain tanpa harus hafalan formal.
- **Constraint:** Waktu luang pendek (di halte, di bus, istirahat). Butuh sesi 2–5 menit.
- **Context:** Sering buka HP; suka konten lokal Jakarta.

### Secondary segment — “Transit nerd / map lover”
- Suka GeoGuessr, quiz transport, community map.
- Mau mode sulit, leaderboard, daily challenge.

### Non-goals (bukan segmen MVP)
- Turis asing (UI bahasa Inggris full) — bisa belakangan.
- Operator / planner TJ (bukan tools operasional).
- Anak SD (butuh UX & konten berbeda).

## 6. Value Proposition(s)

### Jobs / needs
- Mengingat nama halte di satu rute
- Menghubungkan halte awal–akhir ke kode rute
- Mengenali bentuk jalur di peta
- Membaca kode rute → membayangkan ujung ke ujung

### Gains
- Hafalan aktif lewat kuis, bukan baca daftar
- Feedback langsung (benar/salah + penjelasan singkat)
- Progress terasa (skor, streak, level kesulitan)

### Pains yang dihindari
- Bingung bedakan rute mirip (mis. feeder vs BRT)
- Malas buka peta panjang saat cuma mau “tes diri”
- Konten belajar yang kaku / textbook

### Diferensiasi
| Alternatif | Kelemahan vs kita |
|------------|-------------------|
| Aplikasi Tije / Maps | Fokus navigasi, bukan latihan hafalan |
| Quiz umum / trivia | Tidak spesifik jaringan TJ |
| Baca peta PDF / Wikipedia | Pasif, tidak ada game loop |

**Value curve fokus:** spekularitas lokal TJ + kecepatan sesi + 4 mode saling melengkapi.

## 7. Solution

### 7.1 UX / User flows

**Home**
1. Pilih mode (4 kartu)
2. Opsional: pilih kesulitan (Mudah / Sedang / Sulit) & jumlah soal (5 / 10)
3. Mulai round → soal per soal → ringkasan skor

**Flow umum per soal**
```
Tampil prompt → Pemain jawab → Reveal benar/salah
→ Fakta singkat (1–2 baris) → Soal berikutnya
→ End screen (skor, akurasi, CTA main lagi / share)
```

**Mode 1 — Tebak Nama Halte di Rute**
- Prompt: kode rute + posisi (contoh: “Halte ke-3 di rute `9` arah Blok M → Pinang Ranti”) **atau** daftar halte dengan 1 slot kosong.
- Jawaban: multiple choice (4 opsi) di MVP; free-text fuzzy match di v2.
- Reveal: urutan halte singkat di sekitar jawaban.

**Mode 2 — Tebak Rute dari Halte Awal & Akhir**
- Prompt: “Halte A → Halte B” (ujung rute atau pair yang unik/ambigu terkontrol).
- Jawaban: pilih kode rute dari 4 opsi.
- Edge case: beberapa rute bisa share ujung mirip → soal harus punya **satu jawaban benar** menurut aturan data (lihat Assumptions), atau izinkan “semua yang benar” dengan skor penuh jika pemain pilih salah satu yang valid (putuskan di data rules).

**Mode 3 — Tebak Rute dari Jalur di Map**
- Prompt: peta menampilkan polyline jalur (tanpa label kode rute); basemap simplified Jakarta.
- Jawaban: pilih kode rute (4 opsi) atau ketik kode.
- UX map: zoom-to-fit jalur; jangan spam label halte di MVP (bisa toggle “tampilkan nama halte” di v1.1).

**Mode 4 — Tebak Halte Awal–Akhir dari Kode Rute**
- Prompt: kode rute (mis. `B11`).
- Jawaban: pilih pasangan “halte awal — halte akhir” dari 4 opsi.
- Perhatikan arah (A→B vs B→A): MVP pakai **satu arah kanonis** per kode (arah “utama” di dataset).

**End screen**
- Skor, % benar, waktu
- Breakdown per mode (jika mixed round — future)
- Tombol: Main lagi / Ganti mode / Share skor

### 7.2 Key Features

#### MVP (Must)
| ID | Feature | Detail |
|----|---------|--------|
| F1 | Empat mode kuis | Sesuai ringkasan di atas |
| F2 | Bank soal dari data rute nyata | Generate dari dataset halte/rute TJ |
| F3 | Multiple choice 4 opsi | Distractor cerdas (rute/halte mirip) |
| F4 | Skor & ringkasan round | Benar/salah, akurasi |
| F5 | Tingkat kesulitan | Mudah = BRT koridor utama; Sulit = feeder + rute jarang |
| F6 | Mobile-first UI | Touch-friendly, satu kolom |
| F7 | Penjelasan singkat setelah jawab | 1 fakta kontekstual |

#### Should (cepat setelah MVP)
| ID | Feature |
|----|---------|
| F8 | Daily challenge (soal harian sama untuk semua) |
| F9 | Streak harian |
| F10 | Share kartu skor (gambar) |
| F11 | Mode peta: toggle nama halte |

#### Could (nanti)
| ID | Feature |
|----|---------|
| F12 | Multiplayer / challenge link teman |
| F13 | Akun & sync progress |
| F14 | Free-text answer + fuzzy match |
| F15 | Leaderboard mingguan |
| F16 | Konten event (rute baru TJ, integrasi MRT/LRT) |

#### Won’t (MVP)
- Navigasi real-time / ETA bus
- Pembayaran / tiket
- Offline map penuh (boleh cache soal terbatas)

### 7.3 Technology (arah, bukan binding)

| Area | Usulan awal | Catatan |
|------|-------------|---------|
| Client | Web (React/Next atau Vite) | PWA optional belakangan |
| Map | MapLibre / Leaflet + GeoJSON polyline | Ringan untuk mobile |
| Data | GTFS Transjakarta, KRL, MRT, LRT Jabodebek / Jabodetabek | Di-build ke `public/data/game-data.json` via `npm run build:data` |
| Soal engine | Generator server-side atau precompute JSON | Precompute lebih mudah untuk MVP |
| Analytics | Plausible / PostHog / GA4 | Event: `mode_start`, `answer`, `round_complete` |

**Data rules penting**
- Setiap soal MVP harus punya **exactly one correct answer** (atau aturan multi-correct yang eksplisit).
- Filter rute inactive / temporary.
- Nama halte: pakai nama resmi + alias umum bila perlu (fuzzy di v2).

### 7.4 Assumptions

| # | Assumption | Risiko jika salah | Cara validasi |
|---|------------|-------------------|---------------|
| A1 | Pemain TJ peduli cukup untuk main kuis rute | Low retention | Soft launch ke 20–50 rider |
| A2 | Data rute/halte cukup bersih untuk generate soal | Banyak soal salah | Audit sample 100 soal / mode |
| A3 | Multiple choice cukup engaging untuk MVP | Bosan cepat | Bandingkan completion vs bounce |
| A4 | Mode peta adalah diferensiator utama | Dev cost tinggi, impact rendah | Launch mode 1,2,4 dulu jika perlu |
| A5 | Bahasa Indonesia cukup untuk audiens inti | — | Ya untuk MVP |

### 7.5 AI/ML Considerations

Tidak wajib untuk MVP. Opsional di fase berikutnya:

| Use case | Pendekatan | Catatan |
|----------|------------|---------|
| Generate distractor lebih “adil” | Heuristic dulu (rute overlapping); AI later | Jangan block MVP |
| Free-text grading nama halte | Fuzzy string (Levenshtein) dulu | AI hanya jika alias terlalu liar |
| Copy penjelasan soal | Template + data; LLM untuk variasi | Perlu review fakta |

Bila pakai LLM: **jangan** mengarang urutan halte — selalu grounded ke dataset.

## 8. Release

### Perkiraan effort (relatif)
| Fase | Isi | Durasi kasar |
|------|-----|--------------|
| Phase 0 | Normalisasi data rute/halte + aturan soal | 1–2 minggu |
| Phase 1 | Mode 1, 2, 4 (tanpa map) + scoring | 2–3 minggu |
| Phase 2 | Mode 3 (map) + difficulty | 2 minggu |
| Phase 3 | Daily challenge, share, polish | 1–2 minggu |

**MVP launch recommendation:** Mode 1 + 2 + 4 dulu jika map menghambat; Mode 3 menyusul segera (jangan diiklankan sebagai “lengkap” sebelum map siap).

### Versi

**v0.1 — Internal / friends & family**
- 3 mode non-map, 50–100 rute curated
- Multiple choice, skor dasar

**v0.2 — Public MVP**
- + Mode map
- Difficulty
- Analytics events
- Mobile polish

**v1.0**
- Daily challenge + streak + share card
- Bank soal lebih lebar (feeder)

**v1.x**
- Akun, leaderboard, challenge link

### Open questions
1. Sumber data resmi mana yang jadi “source of truth” (GTFS vs dump internal)?
2. Apakah arah rute (A→B vs B→A) ditampilkan sebagai soal terpisah?
3. Branding: tetap TransitGuessr atau perlu variasi/tagline lain?
4. Apakah boleh ada iklan / monetisasi nanti, atau tetap hobby project?

---

## Appendix A — Spec singkat 4 mode

| Mode | Input ke pemain | Output jawaban | Distractor idea |
|------|-----------------|----------------|-----------------|
| 1. Tebak nama halte di rute | Kode rute + konteks posisi/urutan | Nama halte | Halte tetangga / rute lain di koridor sama |
| 2. Tebak rute dari A–B | Halte awal + halte akhir | Kode rute | Rute yang lewat salah satu ujung |
| 3. Tebak rute dari map | Polyline di peta | Kode rute | Rute berbentuk mirip / koridor paralel |
| 4. Tebak A–B dari kode | Kode rute | Pasangan halte ujung | Ujung rute “saudara” / feeder dekat |

## Appendix B — Event analytics (MVP)

| Event | Properties |
|-------|------------|
| `round_start` | `mode`, `difficulty`, `question_count` |
| `answer_submit` | `mode`, `correct`, `latency_ms`, `question_id` |
| `round_complete` | `mode`, `score`, `accuracy`, `duration_ms` |
| `share_click` | `mode`, `score` |
