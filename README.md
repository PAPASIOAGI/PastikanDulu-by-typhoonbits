<div align="center">

# ✅ PastikanDulu

### *Smart Check, No Hoax.*

Layanan verifikasi fakta & deteksi hoaks Indonesia berbasis AI.  
Periksa kebenaran pesan WhatsApp, berita, dan informasi mencurigakan secara instan.

[![Built with Gemini AI](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-blue?style=flat-square&logo=google)](https://ai.google.dev/)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Express](https://img.shields.io/badge/Backend-Express.js-000?style=flat-square&logo=express)](https://expressjs.com/)

</div>

---

## 🚀 Fitur Utama

- 🔍 **Verifikasi Fakta Instan** — Tempel pesan mencurigakan dari WhatsApp atau media sosial
- 🖼️ **Analisis Gambar** — Unggah screenshot untuk dianalisis konteksnya
- 🎤 **Input Suara** — Dukung input suara dalam Bahasa Indonesia
- 📊 **Skor Keyakinan** — Confidence score 0-100 untuk setiap analisis
- 📚 **Referensi Resmi** — Link ke sumber klarifikasi pemerintah & media tepercaya
- 🌙 **Dark Mode** — Tampilan gelap yang nyaman untuk mata
- 📱 **Mobile-First** — Desain responsif yang ramah semua perangkat
- 🔒 **Keamanan Berlapis** — Rate limiting, CSP, CORS, input sanitization

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Gemini API Key](https://aistudio.google.com/apikey) dari Google AI Studio

## ⚡ Quick Start

1. **Clone repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/PastikanDulu-by-typhoonbits.git
   cd PastikanDulu-by-typhoonbits
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Konfigurasi environment**
   ```bash
   cp .env.example .env
   ```
   Edit file `.env` dan masukkan API key Anda:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Jalankan development server**
   ```bash
   npm run dev
   ```
   Buka `http://localhost:3000` di browser.

## 🏗️ Build & Production

```bash
# Build production bundle
npm run build

# Jalankan production server
NODE_ENV=production npm run start
```

## 🔒 Keamanan

- **API Key**: Disimpan hanya di server-side `.env`, tidak pernah terekspos ke frontend
- **Rate Limiting**: Maksimum 20 request/menit per IP
- **CORS**: Hanya menerima request dari origin yang diizinkan
- **CSP**: Content Security Policy ketat untuk mencegah XSS
- **Input Validation**: Whitelist MIME type, ukuran file, sanitasi input teks
- **Error Handling**: Error sensitif tidak diekspos ke client

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 19, TailwindCSS 4, Framer Motion |
| Backend | Express.js, Node.js |
| AI | Google Gemini 2.5 Flash |
| Build | Vite 6, esbuild, TypeScript |

## 👥 Tim Pengembang

- Adam Rais Ichsan Kamil
- Ahmad Thoriq
- Alvin Wibowo
- Haikal Sabilah
- Rifaiz Shafwan Pratama

## 📄 Lisensi

© 2026 PastikanDulu by TyphoonBits. All rights reserved.