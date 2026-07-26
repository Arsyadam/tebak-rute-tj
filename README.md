# TransitGuessr

GeoGuessr-style quiz game untuk transportasi umum Jakarta — **blue vibes**, sound, big-map play.

## Modes

1. **Halte di Rute** — ketik nama halte (text). Map geser di jalur. Race = siapa duluan dapat poin lebih besar.
2. **Tebak dari Jalur** — lihat polyline + titik halte, pilih kode rute (select).
3. **Dari A ke B** — tebak rute pertama, transit, dan rute lanjutan.

## Landing

- Guest account (nama panggilan)
- Email / Google login
- Solo / bareng temen (room code via PeerJS)
- Leaderboard global (tersimpan di database)

## Setup

```bash
npm install
npm run db:generate
npm run db:migrate
npm run build:data
npm run dev
```

Data: GTFS Transjakarta, KRL, MRT, LRT Jabodebek, LRT Jabodetabek.

## Backend

The backend is a Node/Express + Prisma + PostgreSQL API in `api/`.

### Local development

1. Start Postgres:
   ```bash
   docker-compose up -d db
   ```
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL`.
3. Generate Prisma client and run migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```
4. Run the frontend and API together:
   ```bash
   npm run dev      # Vite dev server (port 5173)
   npm run dev:api  # API server (port 3001)
   ```

### Production / Docker

```bash
docker-compose up --build
```

This builds a single container that serves the static frontend and the API on port 3000.

### Environment variables

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — secret for signing auth tokens
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth credentials
- `FRONTEND_URL` — public URL used for OAuth redirects and CORS
- `PORT` — API port (default 3001)
- `VITE_ADSENSE_CLIENT` — optional Google AdSense `ca-pub-` ID
