# Website Kimono (EN/JP) — Panduan Singkat

## Isi folder
| Folder/file | Fungsi |
|---|---|
| `*.html` | Halaman: index, brand, philosophy, gallery, shop, kaitori, blog, contact, checkout, legal |
| `js/config.js` | **Satu-satunya file pengaturan** (nama brand, URL API, LINE, ongkir) |
| `js/i18n.js` | Teks bawaan EN/JP (bisa ditimpa dari tab *Pages* di Sheet) |
| `css/style.css` | Warna & gaya (ubah di bagian `:root` paling atas) |
| `images/` | Foto statis: hero.jpg, story.jpg, kaitori.jpg, brand-old.jpg, founder.jpg, craft-1..3.jpg, material-1..3.jpg |
| `apps-script/Code.gs` | Backend (tempel ke Google Apps Script) |
| `sheets-csv/` | Data contoh untuk di-import ke tiap tab Sheet |

Tanpa foto, situs menampilkan pola ombak (seigaiha) sebagai placeholder. Tanpa API_URL, situs berjalan **mode demo** (data dari `data/*.json`, order tidak terkirim).

## A. Online di GitHub Pages (± 10 menit)
1. Buat repository baru di GitHub (Public), upload semua isi folder ini.
2. Settings → Pages → Branch: `main` / root → Save.
3. Alamat situs muncul: `https://USERNAME.github.io/NAMA-REPO/`.

## B. Pasang backend Google Sheets (± 20 menit)
1. Buat Google Sheet baru. Extensions → Apps Script.
2. Hapus isi bawaan, tempel seluruh `apps-script/Code.gs`.
3. Ubah `CONFIG` di atas (email owner, info bank, ongkir). Simpan.
4. Pilih fungsi `setupSheets` → Run → izinkan akses. Semua tab dibuat otomatis.
5. Pilih fungsi `installTriggers` → Run (email resi otomatis saat status = Shipped).
6. Import data contoh: tiap tab → File → Import → Upload `sheets-csv/NamaTab.csv` → *Replace current sheet*? **Pilih "Replace data at selected cell"**.
7. Deploy → New deployment → Type: Web app → Execute as: **Me** → Who has access: **Anyone** → Deploy. Salin URL `.../exec`.
8. Tempel URL itu ke `API_URL` di `js/config.js`, commit ke GitHub. Selesai.

## C. Notifikasi LINE (opsional)
LINE Notify sudah ditutup (31 Maret 2025). Gunakan LINE Official Account:
1. Buat akun di LINE Official Account Manager → aktifkan Messaging API.
2. Di LINE Developers: ambil *Channel access token (long-lived)*.
3. Apps Script → Project Settings → Script properties: `LINE_TOKEN` = token, `LINE_TO` = User ID owner.
4. Owner harus menambahkan akun resmi sebagai teman.

## D. Cara owner mengubah isi (tanpa coding)
| Mau ubah | Buka tab | Cara |
|---|---|---|
| Produk, harga, stok | Products | Edit/tambah baris. `status`=FALSE untuk menyembunyikan |
| Foto produk | Products | Upload foto ke Google Drive → Share "Anyone with link" → tempel link di `image_url` |
| Galeri | Gallery | Satu baris per foto |
| Sejarah (timeline) | Timeline | Satu baris per tahun |
| Teks filosofi/halaman | Pages | Kolom `key` + `text_en` + `text_jp` |
| Berita/blog | Posts | Satu baris per artikel |
| Order | Orders | Ubah `pay_status` → Paid, `ship_status` → Shipped (isi `tracking`) |
| Kaitori | Kaitori | Ubah `status`, isi `estimate_yen`; foto ada di kolom `photo_urls` |
| Laporan | Report | Otomatis (grafik + ringkasan) |

Perubahan tampil di website dalam ±1 menit.

## E. Sebelum dibuka untuk umum (wajib di Jepang)
- Ganti isi `legal.html` (特定商取引法に基づく表記) dengan data asli.
- **古物商許可**: urus izin dealer barang bekas sebelum menerima kaitori; tulis nomornya di tab *Pages* (key `kai_license`).
- Minta penutur asli memeriksa teks bahasa Jepang.
- Taruh file logo Anda sebagai `images/logo.png` (otomatis tampil di header).
