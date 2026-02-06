# Telegram Shop Bot (Betabotz Paygate)

Source code bot Telegram untuk jualan produk digital/fisik dengan manajemen stok dan pembayaran otomatis via Betabotz Paygate.

## Ringkasan Fitur

- Manajemen produk, varian, dan stok dari Telegram.
- Pembayaran otomatis (QRIS/ewallet sesuai metode Betabotz).
- Proses transaksi otomatis (cek pembayaran, kirim stok, update status).
- Owner menu + broadcast ke user.
- Proteksi order expired dan refund stok otomatis saat batal.

## Tech Stack

- Node.js + Telegraf
- MongoDB + Mongoose
- Betabotz Paygate SDK

## Struktur Folder Utama

```text
.
|- index.js                  # Entrypoint bot
|- settings.js               # Konfigurasi global (token, DB, paygate)
|- handler.js                # Handler hears/action
|- plugins/                  # Command handlers
|- function/                 # Proses transaksi dan utilitas
|- database/
|  |- index.js               # Koneksi MongoDB
|  `- models/                # Model data
`- media/                    # Asset media
```

## Persiapan

Pastikan sudah terpasang:

- Node.js 18+ (disarankan 20+)
- MongoDB URI aktif
- Token bot Telegram dari `@BotFather`
- API key Betabotz Paygate

## Instalasi Cepat

1) Install dependency

```bash
npm install
```

2) Edit `settings.js` lalu isi nilai berikut:

- `BOT_TOKEN` -> token bot Telegram
- `OWNER_ID` -> ID Telegram owner
- `DATABASE_MONGODB_URI` -> URI MongoDB
- `btzKey` -> API key Betabotz
- `btzTimeout` -> timeout pembayaran (ms), default `900000`
- `btzFee` -> biaya tambahan (Rp), default `0`
- `btzMethod` -> metode pembayaran (contoh `qrisgopay`)

3) Jalankan bot

```bash
npm start
```

Untuk mode development:

```bash
npm run dev
```

## Command Bot

### Public

- `/start` -> mulai bot
- `/help` -> panduan order
- `/infobot` -> info bot

### Owner

- `/ownermenu` -> panel owner
- `/addproduct` -> tambah produk
- `/addvariant` -> tambah varian
- `/addstock` -> tambah stok
- `/delproduct` -> hapus produk
- `/delvariant` -> hapus varian
- `/delstock` -> hapus stok
- `/setharga` -> ubah harga
- `/broadcast` -> kirim broadcast

## Alur Transaksi Singkat

1. User pilih produk/varian.
2. Bot membuat invoice pembayaran.
3. User bayar via metode yang dipilih.
4. Bot polling status pembayaran.
5. Jika sukses, stok dikirim otomatis ke user.
6. Jika expired/batal, transaksi ditutup dan stok direfund.

## Catatan Penting Keamanan

- Jangan pernah share `settings.js` ke publik.
- Jika token/API key sempat bocor, segera rotate:
  - regenerate bot token via `@BotFather`
  - ganti API key Betabotz
  - ganti password/URI MongoDB

## Troubleshooting Singkat

- `Handler is undefined`:
  - cek export/import command di `plugins/exportPlugins.js`.
- `409 Conflict: terminated by other getUpdates request`:
  - ada instance bot lain yang masih jalan dengan token sama, matikan dulu proses lama.
- Gagal konek DB:
  - pastikan `DATABASE_MONGODB_URI` valid dan IP whitelist MongoDB sesuai.

## License

ISC
