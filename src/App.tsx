import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  HelpCircle, X, Check, MessageSquare, Clipboard, Mic, MicOff, Search, Send, ArrowLeft, BookOpen, Award, Users, CheckCircle, ChevronRight, AlertTriangle, Info, Copy, Clock, Trash2, ImagePlus, TrendingUp, Moon, Sun
} from "lucide-react";

const CustomLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
    <mask id="pastikandulu-logo-mask">
      <rect width="100" height="100" fill="white" />
      <path d="M 15 44.22 L 30 59.22 L 55 34.22" fill="none" stroke="black" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
    </mask>
    <path d="M 25 27.5 L 45 7.5 L 60 7.5 A 25 25 0 0 1 60 57.5 L 25 92.5 L 25 64.22 L 55.23 33.99 A 5 5 0 0 1 60 27.5 L 25 27.5 Z" mask="url(#pastikandulu-logo-mask)" />
    <path d="M 15 44.22 L 30 59.22 L 55 34.22" fill="none" stroke="currentColor" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface Reference {
  title: string;
  source: string;
  url: string;
}

interface VerificationResult {
  verdict: "HOAKS" | "FAKTA" | "CONVERSATION" | "UNVERIFIED";
  confidenceScore?: number;
  summary: string;
  references: Reference[];
}

interface HistoryItem {
  id: string;
  query: string;
  result: VerificationResult;
  timestamp: number;
}

interface Notification {
  message: string;
  type: "success" | "error" | "info" | "warning";
}

const DEMO_SAMPLES = [
  { label: "Bantuan Kemensos (Hoaks)", text: "Kemensos RI membagikan dana bantuan tunai sosial (BST) sebesar Rp 600.000 untuk masyarakat yang mendaftar melalui tautan Whatsapp resmi: http://bantuan-sosial-kemensos-2026.online segera klaim bantuan Anda!", tag: "Penipuan Bansos" },
  { label: "Kuota Gratis 100GB (Hoaks)", text: "Selamat! Nomor Anda terpilih untuk mendapatkan kuota internet gratis sebesar 100GB dari Kementerian Kominfo RI untuk periode Juli 2026. Aktifkan sekarang di: kuota-internet-gratis-2026.net", tag: "Phishing Kuota" },
  { label: "Sapaan Percakapan (Sapaan)", text: "Halo PastikanDulu! Selamat pagi. Saya ingin bertanya bagaimana cara sistem ini bekerja untuk menyaring hoaks?", tag: "Percakapan Santai" }
];

const TRENDING_HOAXES = [
  { topic: "Pencairan Saldo DANA Gratis dari Pemerintah", verdict: "HOAKS", source: "Komdigi" },
  { topic: "Surat Panggilan Tilang via Format APK", verdict: "HOAKS", source: "Polri" },
  { topic: "Penutupan Layanan BPJS Kesehatan Sepihak", verdict: "HOAKS", source: "BPJS Kesehatan" },
];

const LOADING_MESSAGES = [
  "Menghubungkan ke pusat verifikasi PastikanDulu...",
  "Menganalisis pola kalimat dan indikasi penipuan...",
  "Memindai database literasi fakta Kementerian Komdigi...",
  "Mencocokkan rilis resmi dan klarifikasi TurnBackHoax...",
  "Menyusun ringkasan penjelasan yang mudah dibaca..."
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"home" | "about" | "result" | "history">("home");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [lastCheckedText, setLastCheckedText] = useState("");
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [showUnverifiedPopup, setShowUnverifiedPopup] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  
  const [showSplash, setShowSplash] = useState(true);
  const [searchHistory, setSearchHistory] = useState<HistoryItem[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // --- EASTER EGG / WATERMARK ANTI-MALING ---
    console.log(
      "%c🛡️ PastikanDulu - Smart Check, No Hoax\n%cOriginal Source Code by rifaizPAPASIOAGI\n%cDilarang keras menduplikasi atau menyalin tanpa izin!",
      "color: #2563eb; font-size: 24px; font-weight: bold; text-shadow: 1px 1px 0px #000;",
      "color: #ef4444; font-size: 16px; font-weight: bold; margin-top: 5px;",
      "color: #f59e0b; font-size: 14px; font-style: italic; margin-top: 5px;"
    );
    // ------------------------------------------

    const savedTheme = localStorage.getItem('pastikandulu_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const nextMode = !prev;
      if (nextMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('pastikandulu_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('pastikandulu_theme', 'light');
      }
      return nextMode;
    });
  };

  // SECURITY: Schema validation for localStorage data (VULN-09)
  const validateHistoryItem = (item: unknown): item is HistoryItem => {
    if (!item || typeof item !== 'object') return false;
    const obj = item as Record<string, unknown>;
    return (
      typeof obj.id === 'string' &&
      typeof obj.query === 'string' &&
      typeof obj.timestamp === 'number' &&
      obj.result !== null &&
      typeof obj.result === 'object' &&
      typeof (obj.result as Record<string, unknown>).verdict === 'string' &&
      typeof (obj.result as Record<string, unknown>).summary === 'string'
    );
  };

  // SECURITY: Sanitize API response before rendering (VULN-08)
  const sanitizeResult = (data: Record<string, unknown>): VerificationResult => {
    const validVerdicts = ['HOAKS', 'FAKTA', 'UNVERIFIED', 'CONVERSATION'] as const;
    const rawVerdict = String(data.verdict || 'UNVERIFIED').toUpperCase();
    const verdict = validVerdicts.includes(rawVerdict as any) ? rawVerdict as VerificationResult['verdict'] : 'UNVERIFIED';
    return {
      verdict,
      confidenceScore: Math.max(0, Math.min(100, Number(data.confidenceScore) || 0)),
      summary: String(data.summary || '').substring(0, 5000),
      references: Array.isArray(data.references)
        ? data.references.slice(0, 10).filter(
            (ref: any) => ref && typeof ref.title === 'string' && typeof ref.source === 'string' && typeof ref.url === 'string'
          ).map((ref: any) => ({
            title: String(ref.title).substring(0, 500),
            source: String(ref.source).substring(0, 200),
            url: String(ref.url).substring(0, 500),
          }))
        : [],
    };
  };

  useEffect(() => {
    const splashTimer = setTimeout(() => setShowSplash(false), 2500);
    const savedHistory = localStorage.getItem('pastikandulu_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) {
          // SECURITY: Validate each history item against schema before use
          const validHistory = parsed.filter(validateHistoryItem).slice(0, 50);
          setSearchHistory(validHistory);
        }
      } catch (e) {
        // SECURITY: Corrupted localStorage — clear it silently
        localStorage.removeItem('pastikandulu_history');
      }
    }
    return () => clearTimeout(splashTimer);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const showNotification = (message: string, type: "success" | "error" | "info" | "warning") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  const handlePaste = async () => {
    try {
      if (!navigator.clipboard) {
        showNotification("Fitur tempel tidak didukung peramban. Silakan tempel manual.", "warning");
        return;
      }
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        setText(clipboardText);
        showNotification("Teks berhasil ditempel dari papan klip!", "success");
      } else {
        showNotification("Papan klip kosong. Silakan salin teks terlebih dahulu.", "info");
      }
    } catch (err) {
      showNotification("Gagal membaca papan klip. Berikan izin akses papan klip peramban Anda.", "warning");
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showNotification("Perekaman suara tidak didukung di peramban ini. Silakan ketik langsung.", "warning");
      return;
    }
    if (isListening) {
      setIsListening(false);
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "id-ID";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        showNotification("Sistem mendengarkan... Silakan berbicara sekarang.", "info");
      };
      recognition.onerror = () => {
        setIsListening(false);
        showNotification("Gagal merekam suara. Berikan izin mikrofon peramban.", "error");
      };
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const speechToText = event.results[0][0].transcript;
        setText((prev) => (prev ? prev + " " + speechToText : speechToText));
        showNotification("Suara Anda berhasil diubah menjadi teks!", "success");
      };
      recognition.start();
    } catch (err) {
      setIsListening(false);
    }
  };

  const saveToHistory = (query: string, resData: VerificationResult) => {
    const newItem: HistoryItem = { id: Date.now().toString(), query, result: resData, timestamp: Date.now() };
    const newHistory = [newItem, ...searchHistory].slice(0, 50);
    setSearchHistory(newHistory);
    localStorage.setItem('pastikandulu_history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('pastikandulu_history');
    showNotification("Riwayat pencarian berhasil dihapus.", "success");
  };

  // SECURITY: Strict client-side image validation with MIME whitelist
  const ALLOWED_CLIENT_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // SECURITY: Validate MIME type on client side
    if (!ALLOWED_CLIENT_MIME_TYPES.has(file.type)) {
      showNotification("Tipe file tidak didukung. Gunakan JPEG, PNG, GIF, atau WebP.", "error");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      showNotification("Ukuran gambar terlalu besar. Maksimal 3MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      if (!base64Data) {
        showNotification("Gagal memproses gambar. Format tidak valid.", "error");
        return;
      }
      setUploadedImage(base64Data);
      setImageMimeType(file.type);
      showNotification("Gambar berhasil ditambahkan! Silakan klik Periksa Fakta.", "success");
    };
    reader.onerror = () => {
      showNotification("Gagal membaca file gambar.", "error");
    };
    reader.readAsDataURL(file);
  };

  const handleVerify = async (textToVerify: string) => {
    const query = textToVerify.trim();
    if (!query && !uploadedImage) {
      showNotification("Silakan ketik pesan atau unggah gambar yang ingin diperiksa.", "warning");
      return;
    }
    setLoading(true);
    setLastCheckedText(query || "Gambar Terlampir");

    if (!uploadedImage && query.length > 10) {
      const lowerQuery = query.toLowerCase();
      const cached = searchHistory.find(item => 
        item.query.toLowerCase() === lowerQuery || 
        (item.query.length > 20 && lowerQuery.includes(item.query.toLowerCase())) ||
        (lowerQuery.length > 20 && item.query.toLowerCase().includes(lowerQuery))
      );

      if (cached) {
        setTimeout(() => {
          setResult(cached.result);
          setActiveTab("result");
          if (cached.result.verdict === "UNVERIFIED") {
            setShowUnverifiedPopup(true);
          }
          showNotification("Hasil ditemukan dari riwayat pencarian sebelumnya.", "success");
          setLoading(false);
        }, 600);
        return;
      }
    }

    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: query,
          imageBase64: uploadedImage,
          mimeType: imageMimeType
        }),
      });
      if (!response.ok) {
        if (response.status === 429) {
          showNotification("Terlalu banyak permintaan. Silakan tunggu 1 menit.", "warning");
          return;
        }
        throw new Error("Gagal melakukan verifikasi ke server.");
      }
      const data = await response.json();
      // SECURITY: Sanitize API response before using (VULN-08)
      const sanitizedData = sanitizeResult(data);
      setResult(sanitizedData);
      setActiveTab("result");
      saveToHistory(query || "Pencarian Gambar", sanitizedData);
      
      if (sanitizedData.verdict === "UNVERIFIED") {
        setShowUnverifiedPopup(true);
      }
      showNotification("Verifikasi selesai! Hasil analisis siap dibaca.", "success");
    } catch (err: any) {
      showNotification("Terjadi kesalahan sistem. Silakan coba kembali.", "error");
    } finally {
      setLoading(false);
    }
  };

  const shareToWhatsApp = () => {
    if (!result) return;
    const emoji = result.verdict === "HOAKS" ? "❌" : result.verdict === "FAKTA" ? "✅" : result.verdict === "UNVERIFIED" ? "⚠️" : "ℹ️";
    const titleText = `*Hasil Verifikasi PastikanDulu*:

*Pesan Asli*: "${lastCheckedText.substring(0, 80)}..."

*Status*: ${emoji} *${result.verdict}!*

*Klarifikasi*: ${result.summary}

Periksa kebenaran pesan mencurigakan lainnya secara aman di PastikanDulu!`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(titleText)}`, "_blank");
  };

  const copyResultToClipboard = async () => {
    if (!result) return;
    const emoji = result.verdict === "HOAKS" ? "❌" : result.verdict === "FAKTA" ? "✅" : result.verdict === "UNVERIFIED" ? "⚠️" : "ℹ️";
    const textToCopy = `*Hasil Verifikasi PastikanDulu*
Pesan Asli: "${lastCheckedText}"

Status: ${emoji} ${result.verdict}
Klarifikasi: ${result.summary}

Smart Check, No Hoax!`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      showNotification("Hasil verifikasi berhasil disalin!", "success");
    } catch (err) {
      showNotification("Gagal menyalin hasil. Silakan coba lagi.", "error");
    }
  };

  const resetToHome = () => {
    setText("");
    setResult(null);
    setActiveTab("home");
  };

  if (showSplash) {
    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] bg-primary flex flex-col items-center justify-center text-white"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
            className="flex flex-col items-center gap-4"
          >
            <CustomLogo className="w-24 h-24 md:w-32 md:h-32 text-white" />
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">PastikanDulu</h1>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg md:text-xl font-medium text-white/80"
            >
              Smart Check, No Hoax.
            </motion.p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="bg-background text-on-background font-sans antialiased min-h-screen flex flex-col justify-between selection:bg-primary/20">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[70] w-[90%] md:w-full max-w-[500px]"
          >
            <div className={`flex items-center gap-3 px-5 py-3 rounded-lg border-2 shadow-md ${
                notification.type === "success" ? "bg-green-50 border-green-500 text-green-800"
                  : notification.type === "error" ? "bg-red-50 border-red-500 text-red-800"
                  : notification.type === "warning" ? "bg-amber-50 border-amber-500 text-amber-800"
                  : "bg-blue-50 border-primary text-primary"
              }`}
            >
              {notification.type === "success" && <CheckCircle className="w-6 h-6 flex-shrink-0" />}
              {notification.type === "error" && <X className="w-6 h-6 flex-shrink-0" />}
              {notification.type === "warning" && <AlertTriangle className="w-6 h-6 flex-shrink-0" />}
              {notification.type === "info" && <Info className="w-6 h-6 flex-shrink-0" />}
              <span className="text-sm md:text-base font-semibold leading-relaxed">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUnverifiedPopup && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowUnverifiedPopup(false)}
              className="absolute inset-0 bg-on-background/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-surface rounded-2xl shadow-xl overflow-hidden flex flex-col border-2 border-amber-400"
            >
              <div className="bg-amber-50 p-6 flex flex-col items-center text-center gap-4 border-b border-amber-100">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 stroke-[2.5]" />
                </div>
                <h3 className="text-xl md:text-2xl font-extrabold text-amber-800">Informasi Belum Terverifikasi</h3>
              </div>
              <div className="p-6 flex flex-col gap-6">
                <p className="text-base text-on-secondary-container leading-relaxed">
                  Pesan yang Anda periksa mengandung informasi atau isu yang sangat baru, dan <strong>belum ada rilis resmi dari pemerintah atau media kredibel</strong> yang bisa memastikan apakah ini FAKTA atau HOAKS.
                </p>
                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant text-sm text-on-secondary-container">
                  <strong>Saran Kami:</strong> Tahan diri untuk tidak menyebarkan pesan ini ke grup keluarga atau rekan Anda sampai ada kepastian beritanya.
                </div>
                <button
                  onClick={() => setShowUnverifiedPopup(false)}
                  className="w-full h-12 md:h-14 bg-amber-500 hover:bg-amber-600 text-white font-bold text-base rounded-xl transition-colors active:scale-[0.98]"
                >
                  Saya Mengerti
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="bg-surface border-b-2 border-primary w-full shadow-sm sticky top-0 z-40">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-4 md:px-6 py-3 md:py-0 md:h-16 max-w-[900px] mx-auto gap-3 md:gap-0">
          {/* Logo & Slogan */}
          <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto justify-between md:justify-start">
            <button onClick={resetToHome} className="flex items-center gap-2 hover:opacity-85 transition-opacity text-left cursor-pointer">
              <CustomLogo className="text-primary w-8 h-8 md:w-9 md:h-9 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-xl md:text-2xl font-extrabold text-primary tracking-tight leading-none">PastikanDulu</span>
                <span className="text-[10px] md:text-xs font-bold text-primary/70 uppercase tracking-widest mt-0.5">Smart Check, No Hoax</span>
              </div>
            </button>
            <button
              onClick={() => showNotification("Butuh bantuan? Salin pesan mencurigakan, tempel di kotak, klik Cek Kebenaran.", "info")}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-secondary-container text-primary"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <button
              onClick={toggleDarkMode}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-secondary-container text-primary"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          <nav className="flex gap-2 md:gap-4 items-center w-full md:w-auto overflow-x-auto pt-2 pb-2 md:pt-0 md:pb-0 justify-center md:justify-end no-scrollbar border-t md:border-t-0 border-outline-variant/30 mt-1 md:mt-0">
            <button
              onClick={() => { setResult(null); setActiveTab("home"); }}
              className={`px-4 py-2 md:px-4 md:py-2 flex-1 md:flex-none text-center rounded-lg text-sm md:text-base font-bold transition-colors whitespace-nowrap ${activeTab === "home" ? "text-primary border-b-2 border-primary bg-secondary-container/50" : "text-on-secondary-container hover:bg-secondary-container"}`}
            >
              Beranda
            </button>
            <button
              onClick={() => { setResult(null); setActiveTab("history"); }}
              className={`px-4 py-2 md:px-4 md:py-2 flex-1 md:flex-none text-center rounded-lg text-sm md:text-base font-bold transition-colors whitespace-nowrap ${activeTab === "history" ? "text-primary border-b-2 border-primary bg-secondary-container/50" : "text-on-secondary-container hover:bg-secondary-container"}`}
            >
              Riwayat
            </button>
            <button
              onClick={() => { setResult(null); setActiveTab("about"); }}
              className={`px-4 py-2 md:px-4 md:py-2 flex-1 md:flex-none text-center rounded-lg text-sm md:text-base font-bold transition-colors whitespace-nowrap ${activeTab === "about" ? "text-primary border-b-2 border-primary bg-secondary-container/50" : "text-on-secondary-container hover:bg-secondary-container"}`}
            >
              Tentang
            </button>
            <button
              onClick={toggleDarkMode}
              className="hidden md:flex w-10 h-10 items-center justify-center rounded-full hover:bg-secondary-container text-primary flex-shrink-0"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>
            <button
              onClick={() => showNotification("Butuh bantuan? Salin pesan mencurigakan, tempel di kotak, klik Cek Kebenaran.", "info")}
              className="hidden md:flex w-10 h-10 items-center justify-center rounded-full hover:bg-secondary-container text-primary flex-shrink-0"
            >
              <HelpCircle className="w-6 h-6" />
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[800px] mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col justify-start">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center text-center py-12 gap-6">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-24 h-24 border-4 border-secondary-container rounded-full animate-ping"></div>
                <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin flex items-center justify-center">
                  <CustomLogo className="w-10 h-10 text-primary" />
                </div>
              </div>
              <div className="max-w-[500px]">
                <h3 className="text-xl md:text-2xl font-extrabold text-primary mb-2">Memeriksa Fakta...</h3>
                <p className="text-sm md:text-lg text-on-secondary-container italic transition-all duration-300">"{LOADING_MESSAGES[loadingStep]}"</p>
              </div>
            </motion.div>
          ) : activeTab === "home" ? (
            <motion.div key="home" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="flex flex-col gap-6 md:gap-8">
              <section className="bg-surface p-5 md:p-8 rounded-2xl border-2 border-outline-variant shadow-sm flex flex-col gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-primary mb-2">Cek Kebenaran Pesan Anda!</h1>
                  <p className="text-sm md:text-base text-on-secondary-container">Tempel pesan mencurigakan dari WhatsApp atau media sosial untuk memeriksa faktanya secara instan dengan kecerdasan verifikator terpercaya kami.</p>
                </div>
                <div className="flex flex-col gap-4 mt-2">
                  <div className="relative">
                    <textarea
                      value={text} onChange={(e) => setText(e.target.value)}
                      className="w-full h-40 md:h-52 p-4 md:p-5 border-2 border-outline-variant rounded-xl text-base md:text-lg focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none resize-none bg-surface-container-low placeholder:text-on-secondary-container/50 transition-all font-medium leading-relaxed"
                      placeholder="Tempel (paste) pesan dari grup komunitas atau WhatsApp yang mencurigakan di sini..."
                    />
                    {text && (
                      <button onClick={() => setText("")} className="absolute top-3 right-3 p-1.5 rounded-full bg-secondary-container text-primary hover:bg-primary/20 transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 sm:flex sm:flex-row gap-2 md:gap-3 w-full">
                    <button onClick={handlePaste} className="flex-1 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 bg-secondary-container hover:bg-secondary-container/80 text-primary rounded-xl h-16 md:h-14 transition-colors text-xs md:text-base font-bold active:scale-[0.98]">
                      <Clipboard className="w-5 h-5 flex-shrink-0" /> <span className="hidden sm:inline">Tempel Teks</span><span className="sm:hidden text-[10px] leading-tight text-center">Tempel<br/>Teks</span>
                    </button>
                    <label className="flex-1 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 bg-secondary-container hover:bg-secondary-container/80 text-primary rounded-xl h-16 md:h-14 transition-colors text-xs md:text-base font-bold active:scale-[0.98] cursor-pointer">
                      <ImagePlus className="w-5 h-5 flex-shrink-0" /> <span className="hidden sm:inline">Unggah Gambar</span><span className="sm:hidden text-[10px] leading-tight text-center">Unggah<br/>Gambar</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                    <button onClick={handleVoiceInput} className={`flex-1 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 rounded-xl h-16 md:h-14 transition-colors text-xs md:text-base font-bold active:scale-[0.98] ${isListening ? "bg-red-100 text-red-700 animate-pulse" : "bg-secondary-container text-primary hover:bg-secondary-container/80"}`}>
                      {isListening ? <MicOff className="w-5 h-5 flex-shrink-0" /> : <Mic className="w-5 h-5 flex-shrink-0" />} <span className="hidden sm:inline">{isListening ? "Mendengarkan..." : "Input Suara"}</span><span className="sm:hidden text-[10px] leading-tight text-center">{isListening ? "Mendengar..." : "Input Suara"}</span>
                    </button>
                  </div>
                  {uploadedImage && (
                    <div className="relative mt-2 p-2 border-2 border-outline-variant rounded-xl bg-surface-container-low max-w-xs self-start">
                      <img src={`data:${imageMimeType};base64,${uploadedImage}`} alt="Gambar diunggah" className="w-full h-auto rounded-lg" />
                      <button onClick={() => { setUploadedImage(null); setImageMimeType(null); }} className="absolute -top-3 -right-3 p-1.5 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <button onClick={() => handleVerify(text)} disabled={!text.trim() && !uploadedImage} className={`w-full h-14 md:h-16 mt-2 flex items-center justify-center gap-2 rounded-xl text-base md:text-lg font-bold shadow-sm transition-all border-2 border-primary ${text.trim() || uploadedImage ? "bg-primary text-white hover:bg-primary-container active:scale-[0.98]" : "bg-gray-200 text-gray-400 border-gray-300"}`}>
                    <Search className="w-6 h-6" /> CEK KEBENARAN
                  </button>
                </div>
              </section>

              <section className="flex flex-col gap-4">
                <h2 className="text-xl md:text-2xl font-extrabold text-primary flex items-center gap-2 px-1"><TrendingUp className="w-6 h-6 text-red-500" /> Hoaks Terkini & Trending</h2>
                <div className="flex flex-col gap-3">
                  {TRENDING_HOAXES.map((hoax, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-surface border-2 border-red-100 rounded-xl gap-2 hover:border-red-300 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        <p className="font-bold text-on-secondary-container">{hoax.topic}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">Klarifikasi: {hoax.source}</span>
                        <span className="text-[10px] md:text-xs font-black text-red-700 bg-red-100 px-3 py-1 rounded-full uppercase tracking-widest">{hoax.verdict}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="flex flex-col gap-4">
                <h2 className="text-xl md:text-2xl font-extrabold text-primary flex items-center gap-2 px-1"><CheckCircle className="w-6 h-6 text-primary" /> Coba Contoh Pesan Populer</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  {DEMO_SAMPLES.map((sample, idx) => (
                    <button key={idx} onClick={() => { setText(sample.text); showNotification("Pesan contoh dimuat!", "info"); }} className="text-left p-4 bg-surface hover:bg-secondary-container/30 border-2 border-outline-variant hover:border-primary rounded-xl transition-all flex flex-col justify-between group active:scale-[0.98]">
                      <div className="mb-2">
                        <span className="inline-block text-[10px] md:text-xs font-bold text-primary bg-secondary-container px-2 py-0.5 rounded-full mb-2">{sample.tag}</span>
                        <p className="text-sm md:text-base font-bold text-primary group-hover:underline line-clamp-1">{sample.label}</p>
                      </div>
                      <p className="text-xs md:text-sm text-on-secondary-container line-clamp-2 italic leading-relaxed">"{sample.text}"</p>
                    </button>
                  ))}
                </div>
              </section>
            </motion.div>
          ) : activeTab === "history" ? (
            <motion.div key="history" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="flex flex-col gap-6 py-2">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl md:text-3xl font-extrabold text-primary flex items-center gap-2">
                  <Clock className="w-7 h-7" /> Riwayat Pencarian
                </h1>
                {searchHistory.length > 0 && (
                  <button onClick={clearHistory} className="flex items-center gap-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg text-sm font-bold transition-colors">
                    <Trash2 className="w-4 h-4" /> Hapus Semua
                  </button>
                )}
              </div>
              
              {searchHistory.length === 0 ? (
                <div className="bg-surface-container-low border-2 border-outline-variant border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-4">
                  <Clock className="w-12 h-12 text-on-secondary-container/40" />
                  <p className="text-on-secondary-container font-medium text-lg">Belum ada riwayat pencarian.</p>
                  <button onClick={() => setActiveTab("home")} className="mt-2 text-primary font-bold hover:underline">Mulai Cek Kebenaran Pesan</button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {searchHistory.map((item) => (
                    <div key={item.id} className="bg-surface p-5 rounded-xl border-2 border-outline-variant shadow-sm flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider border ${
                            item.result.verdict === "HOAKS" ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-transparent dark:border-red-800" :
                            item.result.verdict === "FAKTA" ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-transparent dark:border-green-800" :
                            item.result.verdict === "UNVERIFIED" ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-transparent dark:border-amber-800" :
                            "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-transparent dark:border-blue-800"
                          }`}>
                            {item.result.verdict}
                          </span>
                          <span className="text-xs font-semibold text-on-secondary-container/70">
                            {new Date(item.timestamp).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <button 
                          onClick={() => {
                            setLastCheckedText(item.query);
                            setResult(item.result);
                            setActiveTab("result");
                          }}
                          className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          Lihat Detail <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-on-secondary-container text-sm md:text-base italic line-clamp-2 bg-surface-container-low p-3 rounded-lg border border-outline-variant/50">
                        "{item.query}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : activeTab === "about" ? (
            <motion.div key="about" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="flex flex-col gap-8 py-2">
              <section className="flex flex-col gap-4 text-center md:text-left bg-surface p-6 md:p-8 rounded-2xl border-2 border-outline-variant shadow-sm">
                <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                  <CustomLogo className="w-12 h-12 text-primary" />
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-primary">Tentang PastikanDulu</h1>
                </div>
                <p className="text-sm md:text-base text-on-secondary-container leading-relaxed">
                  <strong>PastikanDulu (Smart Check, No Hoax)</strong> adalah layanan sipil digital independen yang berdedikasi penuh untuk melawan misinformasi dan menyaring kebenaran berita di tengah masyarakat. Kami menyediakan platform verifikasi yang aman, mudah dipahami, dan ramah aksesibilitas bagi seluruh kalangan usia, guna menghindari kejahatan digital, penipuan, dan penyebaran hoaks di Indonesia.
                </p>
              </section>

              <section className="bg-secondary-container p-6 md:p-8 rounded-2xl border-2 border-outline-variant flex flex-col gap-6">
                <h2 className="text-xl md:text-2xl font-extrabold text-primary text-center">Misi Kami</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  <div className="flex flex-col items-center text-center gap-3 bg-surface p-6 rounded-xl border border-outline-variant shadow-sm">
                    <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white"><Award className="w-7 h-7" /></div>
                    <h3 className="text-lg md:text-xl font-bold text-primary">Akurasi Mutlak</h3>
                    <p className="text-sm md:text-base text-on-secondary-container">Memastikan analisis didukung data valid resmi pemerintah dan institusi terpercaya.</p>
                  </div>
                  <div className="flex flex-col items-center text-center gap-3 bg-surface p-6 rounded-xl border border-outline-variant shadow-sm">
                    <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white"><Users className="w-7 h-7" /></div>
                    <h3 className="text-lg md:text-xl font-bold text-primary">Aksesibilitas Tinggi</h3>
                    <p className="text-sm md:text-base text-on-secondary-container">Antarmuka ramah lanjut usia, bahasa sederhana, dan dukungan input suara.</p>
                  </div>
                  <div className="flex flex-col items-center text-center gap-3 bg-surface p-6 rounded-xl border border-outline-variant shadow-sm">
                    <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white"><BookOpen className="w-7 h-7" /></div>
                    <h3 className="text-lg md:text-xl font-bold text-primary">Edukasi Warga</h3>
                    <p className="text-sm md:text-base text-on-secondary-container">Meningkatkan literasi digital melalui penyampaian fakta yang ringkas dan bebas jargon teknis.</p>
                  </div>
                </div>
              </section>

              <section className="flex flex-col gap-4">
                <h2 className="text-xl md:text-2xl font-extrabold text-primary text-center">Anggota Tim Pengembang</h2>
                <div className="bg-surface p-6 rounded-2xl border-2 border-outline-variant shadow-sm">
                  <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-center">
                    <li className="bg-surface-container-low p-4 rounded-xl border border-outline-variant font-bold text-primary shadow-sm flex items-center justify-center">Adam Rais Ichsan Kamil</li>
                    <li className="bg-surface-container-low p-4 rounded-xl border border-outline-variant font-bold text-primary shadow-sm flex items-center justify-center">Ahmad Thoriq</li>
                    <li className="bg-surface-container-low p-4 rounded-xl border border-outline-variant font-bold text-primary shadow-sm flex items-center justify-center">Alvin Wibowo</li>
                    <li className="bg-surface-container-low p-4 rounded-xl border border-outline-variant font-bold text-primary shadow-sm flex items-center justify-center">Haikal Sabilah</li>
                    <li className="bg-surface-container-low p-4 rounded-xl border border-outline-variant font-bold text-primary shadow-sm flex items-center justify-center">Rifaiz Shafwan Pratama</li>
                  </ul>
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="flex flex-col gap-6">
              {result && (
                <section className={`w-full rounded-2xl overflow-hidden border-2 shadow-sm flex flex-col ${
                    result.verdict === "HOAKS" ? "border-error dark:border-red-600" : result.verdict === "FAKTA" ? "border-green-600 dark:border-green-600" : result.verdict === "UNVERIFIED" ? "border-amber-500 dark:border-amber-500" : "border-primary"
                  }`}>
                  <div className={`flex items-center justify-center py-6 md:py-8 ${
                      result.verdict === "HOAKS" ? "bg-[#e53935] dark:bg-red-700" : result.verdict === "FAKTA" ? "bg-[#2e7d32] dark:bg-green-700" : result.verdict === "UNVERIFIED" ? "bg-amber-500 dark:bg-amber-600" : "bg-primary dark:bg-primary-container"
                    }`}>
                    {result.verdict === "HOAKS" && <X className="text-white w-16 h-16 md:w-20 md:h-20 stroke-[3]" />}
                    {result.verdict === "FAKTA" && <Check className="text-white w-16 h-16 md:w-20 md:h-20 stroke-[3]" />}
                    {result.verdict === "UNVERIFIED" && <AlertTriangle className="text-white w-16 h-16 md:w-20 md:h-20 stroke-[2.5]" />}
                    {result.verdict === "CONVERSATION" && <MessageSquare className="text-white w-16 h-16 md:w-20 md:h-20 stroke-[2]" />}
                  </div>
                  <div className={`flex flex-col items-center justify-center py-4 md:py-5 gap-2 border-t-2 text-center px-2 ${
                      result.verdict === "HOAKS" ? "bg-[#ffebee] dark:bg-[#3b1212] border-[#e53935] dark:border-red-700 text-[#e53935] dark:text-[#ffb4ab]" : result.verdict === "FAKTA" ? "bg-[#e8f5e9] dark:bg-[#0f2e13] border-[#2e7d32] dark:border-green-700 text-[#2e7d32] dark:text-[#81c995]" : result.verdict === "UNVERIFIED" ? "bg-amber-50 dark:bg-[#33230a] border-amber-500 dark:border-amber-600 text-amber-700 dark:text-[#fde293]" : "bg-secondary-container border-primary text-primary dark:text-on-secondary-container"
                    }`}>
                    <h1 className="text-3xl md:text-5xl font-black uppercase m-0 leading-none">
                      {result.verdict === "UNVERIFIED" ? "BELUM PASTI" : result.verdict}
                    </h1>
                    {result.verdict !== "CONVERSATION" && result.confidenceScore !== undefined && (
                      <span className={`text-sm md:text-base font-bold px-3 py-1 rounded-full ${
                        result.verdict === "HOAKS" ? "bg-red-100 dark:bg-[#692020] text-red-700 dark:text-[#ffb4ab]" : 
                        result.verdict === "FAKTA" ? "bg-green-100 dark:bg-[#1b4d21] text-green-700 dark:text-[#81c995]" : 
                        result.verdict === "UNVERIFIED" ? "bg-amber-100 dark:bg-[#523810] text-amber-700 dark:text-[#fde293]" : ""
                      }`}>
                        Skor Keyakinan: {result.confidenceScore}%
                      </span>
                    )}
                  </div>
                </section>
              )}

              <section className="bg-surface p-5 md:p-6 rounded-2xl border-2 border-outline-variant shadow-sm">
                <span className="text-xs font-bold text-on-secondary-container uppercase tracking-wider block mb-2">Pesan yang Anda periksa:</span>
                <p className="text-sm md:text-base text-on-secondary-container italic font-medium leading-relaxed bg-surface-container-low p-4 rounded-xl border border-outline-variant/50 break-words">
                  "{lastCheckedText}"
                </p>
              </section>

              {result && (
                <section className="bg-surface p-5 md:p-6 rounded-2xl border-2 border-outline-variant shadow-sm">
                  <h3 className="text-xl md:text-2xl font-extrabold text-primary mb-3">Hasil Analisis:</h3>
                  <p className="text-base md:text-lg text-on-background font-medium leading-relaxed">
                    {result.summary}
                  </p>
                </section>
              )}

              {result && result.references && result.references.length > 0 ? (
                <section className="bg-surface-container-low rounded-2xl p-5 md:p-6 border-2 border-outline-variant shadow-sm flex flex-col gap-4 overflow-hidden">
                  <h2 className="text-lg md:text-xl font-bold text-on-background m-0 flex items-center gap-2">
                    <BookOpen className="text-primary w-5 h-5 md:w-6 md:h-6 flex-shrink-0" /> Sumber Referensi Resmi
                  </h2>
                  <ul className="list-none p-0 m-0 space-y-4">
                    {result.references.map((ref, idx) => (
                      <li key={idx} className="flex items-start gap-3 group bg-surface p-4 rounded-xl border border-outline-variant">
                        <span className="w-3 h-3 rounded-full bg-primary mt-1.5 flex-shrink-0"></span>
                        <div className="flex flex-col gap-1 w-full overflow-hidden">
                          <a href={ref.url} target="_blank" rel="noreferrer" className="text-primary hover:text-primary-container hover:underline font-bold transition-colors inline-flex items-start gap-1 leading-relaxed text-sm md:text-base">
                            <span className="break-words line-clamp-2">{ref.title}</span> 
                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                          </a>
                          <span className="text-[10px] md:text-xs font-bold text-on-secondary-container uppercase bg-secondary-container w-fit px-2 py-0.5 rounded-md truncate max-w-full">
                            Sumber: {ref.source}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : result && result.verdict !== "CONVERSATION" ? (
                <div className="p-4 bg-gray-50 rounded-xl text-center text-sm font-semibold text-gray-500 border border-gray-200">
                  Tidak ada rincian referensi tautan khusus yang tersedia untuk saat ini.
                </div>
              ) : null}

              <section className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-2">
                <button
                  onClick={copyResultToClipboard}
                  className="flex-1 bg-surface hover:bg-secondary-container text-primary h-12 md:h-14 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-sm border-2 border-primary active:scale-[0.98] text-sm md:text-base font-bold"
                >
                  <Copy className="w-5 h-5" /> Salin Teks Hasil
                </button>
                {result && result.verdict !== "CONVERSATION" && (
                  <button
                    onClick={shareToWhatsApp}
                    className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white h-12 md:h-14 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-sm border-2 border-[#25D366] active:scale-[0.98] text-sm md:text-base font-bold"
                  >
                    <Send className="w-5 h-5" /> Bagikan ke WA
                  </button>
                )}
              </section>
              <button
                onClick={resetToHome}
                className="bg-transparent hover:bg-secondary-container text-primary h-12 md:h-14 rounded-xl flex items-center justify-center gap-3 w-full border-2 border-primary transition-all duration-200 active:scale-[0.98] text-sm md:text-base font-bold mt-2 mb-4"
              >
                <ArrowLeft className="w-5 h-5" /> Kembali ke Awal
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-surface-container-highest border-t-2 border-outline-variant w-full mt-auto">
        <div className="flex flex-col items-center gap-4 p-6 md:p-8 w-full max-w-[800px] mx-auto">
          <button onClick={resetToHome} className="flex items-center gap-2 text-primary hover:opacity-85 transition-opacity font-extrabold text-xl tracking-tight">
            <CustomLogo className="w-6 h-6" /> PastikanDulu
          </button>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
            <button onClick={() => showNotification("Hubungi kami di: typhoonbits67@gmail.com", "info")} className="text-sm md:text-base font-bold text-on-secondary-container hover:text-primary hover:underline">Kontak</button>
            <button onClick={() => showNotification("Kebijakan Privasi: Kami tidak menyimpan data pribadi Anda.", "info")} className="text-sm md:text-base font-bold text-on-secondary-container hover:text-primary hover:underline">Kebijakan Privasi</button>
            <button onClick={() => showNotification("Bantuan: Salin pesan WhatsApp ke form untuk validasi.", "info")} className="text-sm md:text-base font-bold text-on-secondary-container hover:text-primary hover:underline">Bantuan</button>
          </div>
          <p className="text-xs md:text-sm font-medium text-on-secondary-container/80 text-center mt-2 flex items-center justify-center gap-2 flex-wrap">
            <span>© 2026 PastikanDulu</span>
            <span className="hidden sm:inline">•</span>
            <span className="italic w-full sm:w-auto">Smart Check, No Hoax.</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
