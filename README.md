# Personal Finance Assistant

Aplikasi pencatatan keuangan pribadi berbasis web dengan sistem akuntansi double-entry, multi-user dengan Role-Based Access Control (RBAC), dan dukungan export laporan ke PDF / XLSX / DOCX.

## Fitur

- **Autentikasi & Keamanan**
  - Login dengan email & password (bcrypt hashing)
  - CAPTCHA gambar server-side (noise, garis acak, dots)
  - Rate limiting anti brute force
  - JWT Session via NextAuth.js v4
  - RBAC: Admin dan User biasa

- **Manajemen Data**
  - Kategori bertingkat (parent/sub) — INCOME & EXPENSE
  - Dompet (Cash, Bank, E-Wallet)
  - Transaksi dengan double-entry bookkeeping
  - Pagination, filter, sorting

- **Dashboard**
  - Ringkasan saldo, pemasukan, pengeluaran bulan ini
  - Cash Flow chart (6 bulan) — Line Chart
  - Expense Breakdown — Donut Chart
  - Budget vs Actual — Bar Chart
  - Transaksi terbaru (5 terakhir)
  - Admin dapat memfilter data per user

- **Laporan**
  - Filter tanggal (date range picker)
  - Ringkasan statistik
  - Grafik per kategori
  - Tabel transaksi
  - Neraca keuangan (Aset, Liabilitas, Ekuitas)
  - Export: PDF (jspdf), XLSX, DOCX
  - Admin dapat memfilter per user

- **Manajemen User (Admin)**
  - CRUD user (tambah, edit, hapus)
  - Atur role (Admin / User)
  - Reset password

- **Profil**
  - Edit nama
  - Ganti password

- **PWA Ready**
  - Manifest (`/manifest.json`)
  - App icon SVG
  - Apple Web App support

## Tech Stack

| Layer | Teknologi |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Bahasa** | TypeScript 6 |
| **Database** | SQLite (via Prisma ORM) |
| **ORM** | Prisma 7 + LibSQL adapter |
| **Auth** | NextAuth.js v4 (Credentials + JWT) |
| **UI** | Tailwind CSS 4 + DaisyUI 5 |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Form/Validation** | React Hook Form + Zod 4 |
| **State Management** | TanStack React Query 5 |
| **Export** | jspdf + autotable, xlsx, docx + file-saver |
| **Password** | bcryptjs |

## Requirements

- **Node.js** 20+ (recommended: 22 LTS)
- **Bun** 1.2+ (alternatif)
- **npm** 10+ (atau **pnpm** / **yarn**)
- Sistem operasi: Windows, macOS, Linux

## Instalasi Runtime

### Node.js + npm

**Windows:**
1. Download installer dari [nodejs.org](https://nodejs.org) (pilih LTS)
2. Jalankan installer — centang "Add to PATH"
3. Verifikasi: `node --version && npm --version`

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node --version && npm --version
```

**Linux (Arch):**
```bash
sudo pacman -S nodejs npm
```

**macOS:**
```bash
# Via Homebrew
brew install node

# Atau download dari https://nodejs.org
node --version && npm --version
```

### Bun

**Windows:**
```powershell
# Via npm
npm install -g bun

# Via PowerShell (official installer)
powershell -c "irm bun.sh/install.ps1 | iex"
```

**Linux / macOS:**
```bash
# Via curl (official installer)
curl -fsSL https://bun.sh/install | bash
# Aktifkan di session saat ini:
source ~/.bashrc
# (atau ~/.zshrc jika menggunakan Zsh)

# Via npm
npm install -g bun

# Via Homebrew (macOS)
brew install oven-sh/bun/bun
```

Verifikasi: `bun --version`

## Cara Install Aplikasi

### 1. Clone repositori

```bash
git clone <repository-url>
cd personal-finance-assistant
```

### 2. Setup environment

```bash
cp .env.example .env
```

Edit `.env` sesuai kebutuhan (default sudah bisa jalan di `localhost:3000`).

### 3. Install dependencies

**Menggunakan npm:**
```bash
npm install
```

**Atau menggunakan Bun:**
```bash
bun install
```

### 4. Setup database

```bash
# Push schema ke SQLite + generate Prisma client
npm run db:push

# (atau dengan bun)
bun run db:push
```

### 5. Seed data dummy

```bash
# Generate user dummy + kategori + dompet + ~2.300 transaksi
npm run seed

# (atau dengan bun)
bun run seed
```

### 6. Jalankan development server

```bash
npm run dev

# (atau dengan bun)
bun run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Build Production

```bash
npm run build
npm start

# (atau dengan bun)
bun run build
bun start
```

## Akun Default (Seed)

| Nama | Email | Password | Role |
|---|---|---|---|
| Admin | admin@finance.com | Admin123! | ADMIN |
| Rina | rina@finance.com | User123! | USER |
| Budi | budi@finance.com | User123! | USER |
| Sari | sari@finance.com | User123! | USER |
| Doni | doni@finance.com | User123! | USER |

## RBAC (Role-Based Access Control)

| Fitur | Admin | User |
|---|---|---|
| Dashboard | Lihat semua user (+ filter) | Data sendiri |
| Transaksi | CRUD semua user (+ filter) | CRUD sendiri |
| Laporan | Semua user (+ filter) | Data sendiri |
| Kategori | CRUD sendiri | CRUD sendiri |
| Dompet | CRUD sendiri | CRUD sendiri |
| Manajemen User | CRUD semua user | — |
| Profil | Edit nama & password | Edit nama & password |

## Environment Variables

| Variabel | Wajib | Default | Keterangan |
|---|---|---|---|
| `DATABASE_URL` | Ya | `file:./dev.db` | Koneksi database (SQLite) |
| `NEXTAUTH_SECRET` | Ya | — | Secret key untuk JWT. Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Production | `http://localhost:3000` | URL aplikasi (wajib di production) |

## NPM Scripts

| Script | Keterangan |
|---|---|
| `npm run dev` | Jalankan dev server (Turbopack) |
| `npm run build` | Build production |
| `npm start` | Jalankan production server |
| `npm run lint` | Lint dengan ESLint |
| `npm run db:push` | Push schema ke database |
| `npm run db:gen` | Generate Prisma client |
| `npm run db:studio` | Buka Prisma Studio |
| `npm run seed` | Seed data dummy |

## Struktur Direktori

```
personal-finance-assistant/
├── prisma/
│   ├── schema.prisma       # Model database
│   └── seed.ts             # Data seeding
├── public/
│   ├── favicon.svg          # Favicon
│   ├── app-icon.svg         # PWA icon
│   ├── logo.svg             # Logo
│   └── manifest.json        # PWA manifest
├── src/
│   ├── actions/             # Server Actions
│   ├── app/
│   │   ├── (auth)/login/    # Halaman login
│   │   ├── (dashboard)/     # Dashboard pages
│   │   │   ├── dashboard/   # Dashboard utama
│   │   │   ├── transactions/# CRUD transaksi
│   │   │   ├── categories/  # CRUD kategori
│   │   │   ├── wallets/     # CRUD dompet
│   │   │   ├── reports/     # Laporan + export
│   │   │   ├── profile/     # Edit profil
│   │   │   └── users/       # Manajemen user (admin)
│   │   ├── api/             # API routes
│   │   ├── layout.tsx       # Root layout
│   │   └── globals.css      # Global styles
│   ├── components/          # Shared components
│   ├── generated/prisma/    # Generated Prisma client
│   ├── lib/
│   │   ├── auth.ts          # NextAuth config
│   │   ├── prisma.ts        # Prisma client instance
│   │   ├── session.ts       # Session helpers
│   │   ├── security/        # CAPTCHA, rate limiting
│   │   ├── exports/         # PDF/XLSX/DOCX export
│   │   └── utils.ts         # Utility functions
│   ├── proxy.ts             # Auth middleware
│   └── types/               # TypeScript declarations
├── .env.example
├── next.config.ts
├── package.json
├── prisma.config.ts
└── tsconfig.json
```

## Deploy ke Production

### Build

```bash
npm run build
```

### Production server

```bash
npm start
```

### Environment variables untuk production

```bash
DATABASE_URL="file:./prod.db"
NEXTAUTH_SECRET="<generate-dengan-openssl-rand-base64-32>"
NEXTAUTH_URL="https://domain-anda.com"
```

### Catatan untuk production

- Ganti `NEXTAUTH_SECRET` dengan string random yang kuat
- Set `NEXTAUTH_URL` ke domain production
- Untuk SQLite di production, pastikan direktori database writable
- Untuk skala lebih besar, migrasi ke PostgreSQL dengan mengganti `DATABASE_URL`

## Teknologi Alternatif (Bun)

Proyek ini sepenuhnya kompatibel dengan Bun:

```bash
# Install dependencies
bun install

# Development
bun run dev

# Build production
bun run build

# Seed database
bun run seed
```

## Lisensi

MIT
