import React, { useState, useEffect } from "react";
import {
  MapPin,
  Clock,
  Bed,
  UtensilsCrossed,
  Plus,
  X,
  ExternalLink,
  Calendar,
  Trash2,
  Navigation,
  Car,
  ShoppingBag,
  Wallet,
  BookOpen,
  Edit3,
  CheckSquare,
  Square,
  Home,
  Sun,
  Cloud,
  CloudRain,
  Snowflake,
  CloudLightning,
  Camera,
  RefreshCw,
  Check,
  AlertCircle,
  Briefcase,
  Gift,
  User,
  Flag,
  Image as ImageIcon,
  Users,
} from "lucide-react";

// --- 1. Firebase 初始化 ---
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDgx9WhUA6HnhE8SVNoNuE4G98eEbseMHc",
  authDomain: "japan-425ce.firebaseapp.com",
  projectId: "japan-425ce",
  storageBucket: "japan-425ce.firebasestorage.app",
  messagingSenderId: "999925579421",
  appId: "1:999925579421:web:fd7ba46c4e405c1e4c1e74",
  measurementId: "G-C64P5BP950",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Helper Functions & Utilities ---
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function sortByTime(items) {
  if (!Array.isArray(items)) return [];
  return [...items].sort((a, b) => {
    const getWeight = (item) => {
      if (item.type === "stay") return "99:99:99";
      if (item.time && item.time.trim()) return item.time.trim();
      return "99:99:00";
    };
    return getWeight(a).localeCompare(getWeight(b));
  });
}

function mapsUrl(place) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    place
  )}`;
}

function routeUrl(from, to) {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    from
  )}&destination=${encodeURIComponent(to)}&travelmode=transit`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function fmtDateLabel(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  const weekdays = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
  return `${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`;
}

const CITY_COORDS = {
  taoyuan: { name: "桃園", lat: 24.993, lon: 121.301 },
  osaka: { name: "大阪", lat: 34.693, lon: 135.502 },
  nagoya: { name: "名古屋", lat: 35.181, lon: 136.906 },
  takayama: { name: "高山", lat: 36.14, lon: 137.251 },
  hida: { name: "飛騨", lat: 36.236, lon: 137.185 },
  kamikochi: { name: "上高地", lat: 36.248, lon: 137.637 },
};

function parseWmoCode(code) {
  if (code === 0) return { cond: "晴朗", icon: Sun };
  if (code >= 1 && code <= 3) return { cond: "多雲", icon: Cloud };
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82))
    return { cond: "陣雨", icon: CloudRain };
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86))
    return { cond: "降雪", icon: Snowflake };
  if (code >= 95) return { cond: "雷雨", icon: CloudLightning };
  return { cond: "陰天", icon: Cloud };
}

const TYPE_CONFIG = {
  spot: { label: "景點", icon: MapPin, color: "#2F4538", bg: "#EAF0EA" },
  stay: { label: "住宿", icon: Bed, color: "#C1633D", bg: "#FBEAE1" },
  food: {
    label: "飲食",
    icon: UtensilsCrossed,
    color: "#B8862F",
    bg: "#FBF0DC",
  },
  transport: { label: "交通", icon: Car, color: "#3D6E8C", bg: "#E4EEF4" },
  shopping: {
    label: "購物",
    icon: ShoppingBag,
    color: "#8A4F9E",
    bg: "#F1E7F5",
  },
};

const EXPENSE_CATEGORIES = {
  food: { label: "飲食", color: "#B8862F", bg: "#FBF0DC" },
  transport: { label: "交通", color: "#3D6E8C", bg: "#E4EEF4" },
  stay: { label: "住宿", color: "#C1633D", bg: "#FBEAE1" },
  shopping: { label: "購物", color: "#8A4F9E", bg: "#F1E7F5" },
  ticket: { label: "門票", color: "#2F4538", bg: "#EAF0EA" },
  other: { label: "其他", color: "#7A7360", bg: "#EFEAE0" },
};

const TODO_CATEGORIES = {
  important: {
    label: "重要",
    icon: AlertCircle,
    color: "#C1633D",
    bg: "#FBEAE1",
  },
  luggage: {
    label: "行李類",
    icon: Briefcase,
    color: "#3D6E8C",
    bg: "#E4EEF4",
  },
  toBuy: { label: "要買", icon: ShoppingBag, color: "#8A4F9E", bg: "#F1E7F5" },
  food: {
    label: "食物",
    icon: UtensilsCrossed,
    color: "#B8862F",
    bg: "#FBF0DC",
  },
  souvenir: { label: "伴手禮", icon: Gift, color: "#2F4538", bg: "#EAF0EA" },
};

const SAMPLE_TRIP = {
  tripName: "日本高山中部散策",
  coverImage:
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80",
  notes: "1. 護照複影本放隨身包包\n2. 關西機場記得領取 HARUKA 車票",
  todos: [
    {
      id: uid(),
      text: "護照及簽證確認",
      category: "important",
      note: "放在隨身小包",
      completed: true,
    },
    {
      id: uid(),
      text: "預訂日本 eSIM / 漫遊服務",
      category: "important",
      note: "出發前一天開通",
      completed: false,
    },
    {
      id: uid(),
      text: "保養品與保濕面膜",
      category: "luggage",
      owner: "moomin",
      note: "嚕嚕米專用分裝瓶",
      completed: false,
    },
    {
      id: uid(),
      text: "飛驒牛鰻魚飯",
      category: "food",
      note: "味藏天國/廣川鰻魚飯",
      completed: false,
    },
  ],
  days: [
    {
      id: uid(),
      date: "2026-08-15",
      startPoint: "桃園國際機場第一航廈",
      startPointNote: "預計 04:30 辦理報到手續",
      items: [
        {
          id: uid(),
          type: "transport",
          time: "06:52",
          arriveTime: "10:30",
          title: "星宇航空 桃園 ✈ 名古屋",
          origin: "桃園國際機場",
          destination: "中部國際機場",
          note: "預計 06:52 起飛",
        },
        {
          id: uid(),
          type: "spot",
          time: "14:00",
          title: "高山陣屋散策",
          place: "高山陣屋",
          note: "歷史古蹟參觀",
        },
        {
          id: uid(),
          type: "stay",
          time: "",
          title: "高山飛驒溫泉飯店",
          place: "高山飛驒溫泉飯店",
          note: "Check-in 15:00",
        },
      ],
    },
  ],
};

const inputStyle = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: 10,
  border: "1.5px solid #E4DCC8",
  background: "#fff",
  fontSize: 16,
  color: "#2B2822",
  outline: "none",
  boxSizing: "border-box",
};

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 12,
          color: "#8A8168",
          marginBottom: 6,
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

// --- Countdown Component ---
function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isFinished: false,
  });

  useEffect(() => {
    const targetDate = new Date("2026-08-15T06:52:00").getTime();
    const calculateTime = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;
      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isFinished: true,
        });
        return;
      }
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isFinished: false,
      });
    };
    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        background: "#2F4538",
        borderRadius: 14,
        padding: "16px 18px",
        color: "#F4EFE3",
        marginBottom: 16,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          fontSize: 12,
          letterSpacing: 1.5,
          opacity: 0.8,
          marginBottom: 10,
          fontWeight: 600,
        }}
      >
        ✈ 出發倒數 (2026/08/15 06:52)
      </div>
      {timeLeft.isFinished ? (
        <div
          className="serif"
          style={{ fontSize: 20, fontWeight: 700, color: "#90deb0" }}
        >
          🎉 旅程已經展開，祝您旅途愉快！
        </div>
      ) : (
        <div
          style={{ display: "flex", gap: 8, justifyContent: "space-between" }}
        >
          {[
            { label: "天", val: timeLeft.days },
            { label: "時", val: timeLeft.hours },
            { label: "分", val: timeLeft.minutes },
            { label: "秒", val: timeLeft.seconds },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                background: "rgba(244, 239, 227, 0.12)",
                borderRadius: 10,
                padding: "8px 4px",
                textAlign: "center",
              }}
            >
              <div
                className="serif"
                style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.1 }}
              >
                {String(item.val).padStart(2, "0")}
              </div>
              <div style={{ fontSize: 11, opacity: 0.75, marginTop: 4 }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Home Component ---
function HomeView({
  tripName,
  days,
  coverImage,
  onUpdateCoverImage,
  onNavigate,
}) {
  const [editingPhoto, setEditingPhoto] = useState(false);
  const [photoInput, setPhotoInput] = useState(coverImage || "");
  const [selectedCity, setSelectedCity] = useState("nagoya");
  const [weatherData, setWeatherData] = useState({
    temp: "--",
    cond: "載入中…",
    humidity: "--",
    iconComponent: Sun,
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;
    const city = CITY_COORDS[selectedCity] || CITY_COORDS.nagoya;
    setWeatherData((prev) => ({ ...prev, loading: true }));
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,weather_code`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data && data.current) {
          const parsed = parseWmoCode(data.current.weather_code);
          setWeatherData({
            temp: `${Math.round(data.current.temperature_2m)}°C`,
            humidity: `${data.current.relative_humidity_2m}%`,
            cond: parsed.cond,
            iconComponent: parsed.icon,
            loading: false,
          });
        }
      })
      .catch(
        () =>
          isMounted &&
          setWeatherData({
            temp: "--",
            cond: "取得失敗",
            humidity: "--",
            iconComponent: Sun,
            loading: false,
          })
      );
    return () => {
      isMounted = false;
    };
  }, [selectedCity]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1000;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        onUpdateCoverImage(compressedBase64);
        setEditingPhoto(false);
      };
    };
    reader.readAsDataURL(file);
  };

  const startDate = days[0]?.date ? fmtDateLabel(days[0].date) : "";
  const endDate = days[days.length - 1]?.date
    ? fmtDateLabel(days[days.length - 1].date)
    : "";
  const WeatherIcon = weatherData.iconComponent || Sun;

  return (
    <main
      style={{
        padding: "16px 16px 100px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <CountdownTimer />

      <div
        style={{
          position: "relative",
          width: "100%",
          height: 210,
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          marginBottom: 16,
        }}
      >
        <img
          src={coverImage || SAMPLE_TRIP.coverImage}
          alt="Trip Cover"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            right: 16,
            color: "#fff",
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: 2,
              opacity: 0.85,
              marginBottom: 2,
            }}
          >
            JAPAN TRAVEL
          </div>
          <h2
            className="serif"
            style={{ margin: 0, fontSize: 24, fontWeight: 700 }}
          >
            {tripName}
          </h2>
          {startDate && (
            <div
              style={{
                fontSize: 12.5,
                opacity: 0.9,
                marginTop: 4,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Calendar size={12} /> {startDate}{" "}
              {endDate && startDate !== endDate ? ` → ${endDate}` : ""} (
              {days.length} 天)
            </div>
          )}
        </div>
        <button
          onClick={() => setEditingPhoto(true)}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "rgba(255,255,255,0.9)",
            border: "none",
            borderRadius: 8,
            padding: "7px 11px",
            fontSize: 12,
            fontWeight: 600,
            color: "#2B2822",
            display: "flex",
            alignItems: "center",
            gap: 5,
            backdropFilter: "blur(4px)",
          }}
        >
          <Camera size={14} /> 更換相片
        </button>
      </div>

      {editingPhoto && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #ECE4D2",
            borderRadius: 14,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#2B2822",
              marginBottom: 12,
            }}
          >
            選擇更換相片方式：
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <label
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: 10,
                background: "#EAF0EA",
                border: "1.5px solid #2F4538",
                color: "#2F4538",
                fontSize: 13,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <ImageIcon size={16} /> 從手機相簿選擇
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
            </label>
          </div>
          <div style={{ fontSize: 12, color: "#8A8168", marginBottom: 6 }}>
            或輸入圖片網址 (Image URL)：
          </div>
          <input
            value={photoInput}
            onChange={(e) => setPhotoInput(e.target.value)}
            placeholder="https://..."
            style={{ ...inputStyle, marginBottom: 12 }}
          />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              onClick={() => setEditingPhoto(false)}
              style={{
                border: "none",
                background: "transparent",
                color: "#8A8168",
                fontSize: 13,
                padding: "8px 12px",
              }}
            >
              取消
            </button>
            <button
              onClick={() => {
                onUpdateCoverImage(photoInput);
                setEditingPhoto(false);
              }}
              style={{
                border: "none",
                background: "#2F4538",
                color: "#fff",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              儲存網址相片
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid #ECE4D2",
            borderRadius: 14,
            padding: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#8A8168",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              即時氣溫與天氣{" "}
              {weatherData.loading && <RefreshCw size={12} className="spin" />}
            </div>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              style={{
                border: "1px solid #E4DCC8",
                borderRadius: 6,
                padding: "4px 8px",
                fontSize: 12,
                color: "#5C5745",
                background: "#FAF6EF",
                outline: "none",
              }}
            >
              {Object.entries(CITY_COORDS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <WeatherIcon size={36} color="#B8862F" />
              <div>
                <div
                  className="serif"
                  style={{ fontSize: 28, fontWeight: 700, color: "#2B2822" }}
                >
                  {weatherData.loading ? "…" : weatherData.temp}
                </div>
                <div style={{ fontSize: 12, color: "#7A7360" }}>
                  {weatherData.cond} · 濕度 {weatherData.humidity}
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: 12, color: "#8A8168" }}>
              <div>{CITY_COORDS[selectedCity]?.name}</div>
              <div style={{ color: "#2F4538", fontWeight: 600 }}>
                即時連線 🌐
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #ECE4D2",
            borderRadius: 14,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#8A8168",
              marginBottom: 8,
            }}
          >
            行程概覽
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <div
              style={{
                flex: 1,
                background: "#EAF0EA",
                padding: "10px 12px",
                borderRadius: 10,
              }}
            >
              <div style={{ fontSize: 11, color: "#2F4538" }}>總天數</div>
              <div
                className="serif"
                style={{ fontSize: 20, fontWeight: 700, color: "#2F4538" }}
              >
                {days.length} 天
              </div>
            </div>
            <div
              style={{
                flex: 1,
                background: "#FBF0DC",
                padding: "10px 12px",
                borderRadius: 10,
              }}
            >
              <div style={{ fontSize: 11, color: "#B8862F" }}>景點項目</div>
              <div
                className="serif"
                style={{ fontSize: 20, fontWeight: 700, color: "#B8862F" }}
              >
                {days.reduce((acc, d) => acc + (d.items?.length || 0), 0)} 個
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate("itinerary")}
            style={{
              width: "100%",
              padding: "11px",
              borderRadius: 10,
              border: "none",
              background: "#2F4538",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            前往詳細行程 ➔
          </button>
        </div>
      </div>
    </main>
  );
}

// --- Item Modal ---
function ItemModal({ dayId, initial, onClose, onCreate, onFieldChange }) {
  const [liveItem, setLiveItem] = useState(initial || null);

  function ensureCreatedThenSet(field, value) {
    if (liveItem) {
      const updated = { ...liveItem, [field]: value };
      setLiveItem(updated);
      onFieldChange(liveItem.id, field, value);
    } else {
      const newItem = {
        id: uid(),
        type: "spot",
        time: "",
        arriveTime: "",
        title: "",
        place: "",
        origin: "",
        destination: "",
        note: "",
        stops: [],
        [field]: value,
      };
      setLiveItem(newItem);
      onCreate(newItem);
    }
  }

  const type = liveItem?.type || "spot";

  return (
    <div
      onClick={() => onClose(liveItem?.id)}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(43,40,34,0.45)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 120,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FAF6EF",
          width: "100%",
          maxWidth: 640,
          borderRadius: "20px 20px 0 0",
          padding: "12px 20px calc(24px + env(safe-area-inset-bottom))",
          maxHeight: "88vh",
          overflowY: "auto",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: 36,
            height: 5,
            background: "#D9CFBB",
            borderRadius: 3,
            margin: "0 auto 12px",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div
            className="serif"
            style={{ fontSize: 18, fontWeight: 700, color: "#2B2822" }}
          >
            {initial ? "編輯項目" : "新增行程項目"}
          </div>
          <button
            onClick={() => onClose(liveItem?.id)}
            style={{
              border: "none",
              background: "transparent",
              color: "#8A8168",
              padding: 4,
            }}
          >
            <X size={22} />
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
            const IconCmp = cfg.icon;
            const active = type === key;
            return (
              <button
                key={key}
                onClick={() => ensureCreatedThenSet("type", key)}
                style={{
                  flex: "1 1 18%",
                  minWidth: 60,
                  padding: "10px 4px",
                  borderRadius: 10,
                  border: active
                    ? `1.5px solid ${cfg.color}`
                    : "1.5px solid #E4DCC8",
                  background: active ? cfg.bg : "#fff",
                  color: active ? cfg.color : "#8A8168",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <IconCmp size={16} />
                {cfg.label}
              </button>
            );
          })}
        </div>

        {type !== "stay" && (
          <Field label={type === "transport" ? "出發時間" : "時間"}>
            <input
              type="time"
              value={liveItem?.time || ""}
              onChange={(e) => ensureCreatedThenSet("time", e.target.value)}
              style={inputStyle}
            />
          </Field>
        )}
        {type === "transport" && (
          <Field label="預計抵達時間">
            <input
              type="time"
              value={liveItem?.arriveTime || ""}
              onChange={(e) =>
                ensureCreatedThenSet("arriveTime", e.target.value)
              }
              style={inputStyle}
            />
          </Field>
        )}

        <Field label="名稱">
          <input
            placeholder={
              type === "stay"
                ? "例如：嵐山悠然町家"
                : "例如：清水寺 或 搭乘 HARUKA 特急"
            }
            value={liveItem?.title || ""}
            onChange={(e) => ensureCreatedThenSet("title", e.target.value)}
            style={inputStyle}
          />
        </Field>

        {type === "transport" ? (
          <>
            <Field label="起點">
              <input
                placeholder="例如：關西機場"
                value={liveItem?.origin || ""}
                onChange={(e) => ensureCreatedThenSet("origin", e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="終點">
              <input
                placeholder="例如：京都車站"
                value={liveItem?.destination || ""}
                onChange={(e) =>
                  ensureCreatedThenSet("destination", e.target.value)
                }
                style={inputStyle}
              />
            </Field>
          </>
        ) : (
          <Field label="地點（用於 Google Maps 搜尋）">
            <input
              placeholder="例如：清水寺 京都"
              value={liveItem?.place || ""}
              onChange={(e) => ensureCreatedThenSet("place", e.target.value)}
              style={inputStyle}
            />
          </Field>
        )}

        <Field label="備註（選填）">
          <textarea
            placeholder="Check-in 時間、預約資訊…"
            value={liveItem?.note || ""}
            onChange={(e) => ensureCreatedThenSet("note", e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </Field>

        <button
          onClick={() => onClose(liveItem?.id)}
          style={{
            width: "100%",
            marginTop: 8,
            padding: "14px",
            borderRadius: 12,
            border: "none",
            background: "#2F4538",
            color: "#F4EFE3",
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          完成並儲存
        </button>
      </div>
    </div>
  );
}

// --- Expenses View ---
function ExpensesView({
  expenses,
  days,
  totalExpense,
  expenseByCategory,
  onAdd,
  onEdit,
  onDelete,
}) {
  const dayLabel = (dayId) => {
    const idx = days.findIndex((d) => d.id === dayId);
    return idx >= 0 ? `Day ${idx + 1}` : "";
  };

  return (
    <main
      style={{
        padding: "16px 16px 100px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          background: "#2F4538",
          borderRadius: 14,
          padding: "18px 18px",
          marginBottom: 18,
          color: "#F4EFE3",
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 4 }}>
          總花費
        </div>
        <div className="serif" style={{ fontSize: 32, fontWeight: 700 }}>
          ${totalExpense.toLocaleString()}
        </div>
        {Object.keys(expenseByCategory).length > 0 && (
          <div
            style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}
          >
            {Object.entries(expenseByCategory).map(([cat, amt]) => (
              <div
                key={cat}
                style={{
                  fontSize: 11.5,
                  background: "rgba(244,239,227,0.12)",
                  borderRadius: 7,
                  padding: "4px 9px",
                  display: "flex",
                  gap: 5,
                }}
              >
                <span>{EXPENSE_CATEGORIES[cat]?.label || "其他"}</span>
                <span style={{ fontWeight: 700 }}>${amt.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {expenses.map((e) => {
          const cfg =
            EXPENSE_CATEGORIES[e.category] || EXPENSE_CATEGORIES.other;
          return (
            <div
              key={e.id}
              className="card-enter"
              style={{
                background: "#fff",
                border: "1px solid #ECE4D2",
                borderRadius: 12,
                padding: "14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 4,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: cfg.color,
                      background: cfg.bg,
                      padding: "2px 8px",
                      borderRadius: 6,
                    }}
                  >
                    {cfg.label}
                  </span>
                  {e.dayId && (
                    <span style={{ fontSize: 11.5, color: "#A69C82" }}>
                      {dayLabel(e.dayId)}
                    </span>
                  )}
                </div>
                <div
                  className="serif"
                  style={{ fontSize: 16, fontWeight: 700, color: "#2B2822" }}
                >
                  {e.title || "（未命名項目）"}
                </div>
                {e.note && (
                  <div style={{ fontSize: 13, color: "#7A7360", marginTop: 3 }}>
                    {e.note}
                  </div>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                <div
                  className="serif"
                  style={{ fontSize: 17, fontWeight: 700, color: "#2F4538" }}
                >
                  ${(parseFloat(e.amount) || 0).toLocaleString()}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => onEdit(e)}
                    style={{
                      border: "1px solid #E4DCC8",
                      background: "#fff",
                      color: "#5C5745",
                      borderRadius: 8,
                      padding: "6px 10px",
                      fontSize: 12,
                    }}
                  >
                    編輯
                  </button>
                  <button
                    onClick={() => onDelete(e.id)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#C1633D",
                      fontSize: 12,
                      padding: "6px 4px",
                    }}
                  >
                    刪除
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onAdd}
        style={{
          marginTop: 14,
          width: "100%",
          padding: "14px",
          borderRadius: 12,
          border: "1.5px dashed #C9BFA8",
          background: "transparent",
          color: "#5C5745",
          fontSize: 14,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <Plus size={16} /> 新增花費紀錄
      </button>
    </main>
  );
}

function ExpenseModal({ initial, days, onClose, onSave }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [amount, setAmount] = useState(
    initial?.amount != null ? String(initial.amount) : ""
  );
  const [category, setCategory] = useState(initial?.category || "food");
  const [dayId, setDayId] = useState(
    initial?.dayId || (days[0] ? days[0].id : "")
  );
  const [note, setNote] = useState(initial?.note || "");

  function handleSave() {
    if (!title.trim() || amount === "" || isNaN(parseFloat(amount))) return;
    onSave({
      id: initial?.id || uid(),
      title: title.trim(),
      amount: parseFloat(amount),
      category,
      dayId,
      note: note.trim(),
    });
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(43,40,34,0.45)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 120,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FAF6EF",
          width: "100%",
          maxWidth: 640,
          borderRadius: "20px 20px 0 0",
          padding: "12px 20px calc(24px + env(safe-area-inset-bottom))",
          maxHeight: "88vh",
          overflowY: "auto",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div
            className="serif"
            style={{ fontSize: 18, fontWeight: 700, color: "#2B2822" }}
          >
            {initial ? "編輯花費" : "新增花費紀錄"}
          </div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: "#8A8168",
              padding: 4,
            }}
          >
            <X size={22} />
          </button>
        </div>
        <Field label="項目名稱">
          <input
            placeholder="例如：晚餐"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="金額">
          <input
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <button
          onClick={handleSave}
          style={{
            width: "100%",
            marginTop: 8,
            padding: "14px",
            borderRadius: 12,
            border: "none",
            background: "#2F4538",
            color: "#F4EFE3",
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          儲存
        </button>
      </div>
    </div>
  );
}

// --- Notebook View ---
function NotebookView({ notes, onChangeNote, onSaveNow }) {
  return (
    <main
      style={{
        padding: "16px 16px 100px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #ECE4D2",
          borderRadius: 14,
          padding: "18px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
            borderBottom: "1px solid #FAF6EF",
            paddingBottom: 10,
          }}
        >
          <Edit3 size={18} color="#2F4538" />
          <h3
            className="serif"
            style={{ margin: 0, fontSize: 16, color: "#2B2822" }}
          >
            旅行隨手記 / 重要資訊
          </h3>
        </div>
        <textarea
          value={notes || ""}
          onChange={(e) => onChangeNote(e.target.value)}
          onBlur={() => onSaveNow(notes)}
          placeholder="護照號碼、飯店電話…"
          rows={14}
          style={{
            width: "100%",
            border: "none",
            outline: "none",
            fontSize: 16,
            lineHeight: 1.6,
            color: "#3B362D",
            background: "transparent",
            resize: "vertical",
            fontFamily: "inherit",
          }}
        />
      </div>
    </main>
  );
}

// --- Checklist View (內建防衝突合併與智慧 Patch) ---
function ChecklistView({ todos = [], setTodos, onSaveNow }) {
  const [inputText, setInputText] = useState("");
  const [inputNote, setInputNote] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("important");
  const [selectedOwner, setSelectedOwner] = useState("moomin");
  const [filterCategory, setFilterCategory] = useState("all");

  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [editingNote, setEditingNote] = useState("");
  const [editingCategory, setEditingCategory] = useState("important");
  const [editingOwner, setEditingOwner] = useState("moomin");

  const addTodo = () => {
    if (!inputText.trim()) return;
    const newTodo = {
      id: uid(),
      text: inputText.trim(),
      note: inputNote.trim(),
      category: selectedCategory,
      owner: selectedCategory === "luggage" ? selectedOwner : undefined,
      completed: false,
    };
    const updated = [...todos, newTodo];
    setTodos(updated);
    setInputText("");
    setInputNote("");
    onSaveNow(updated);
  };

  const toggleTodo = (id) => {
    const updated = todos.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    setTodos(updated);
    onSaveNow(updated);
  };

  const deleteTodo = (id) => {
    const updated = todos.filter((t) => t.id !== id);
    setTodos(updated);
    onSaveNow(updated);
  };

  const startEdit = (e, todo) => {
    e.stopPropagation();
    setEditingId(todo.id);
    setEditingText(todo.text || "");
    setEditingNote(todo.note || "");
    setEditingCategory(todo.category || "important");
    setEditingOwner(todo.owner || "moomin");
  };

  const saveEdit = (id) => {
    if (!editingText.trim()) return;
    const updated = todos.map((t) =>
      t.id === id
        ? {
            ...t,
            text: editingText.trim(),
            note: editingNote.trim(),
            category: editingCategory,
            owner: editingCategory === "luggage" ? editingOwner : undefined,
          }
        : t
    );
    setTodos(updated);
    setEditingId(null);
    setEditingText("");
    setEditingNote("");
    onSaveNow(updated);
  };

  const categoriesToDisplay =
    filterCategory === "all" ? Object.keys(TODO_CATEGORIES) : [filterCategory];

  const sortLuggageTodos = (items) => {
    const moominItems = items.filter((t) => t.owner === "moomin");
    const handsomeItems = items.filter((t) => t.owner === "handsome");
    const bothItems = items.filter((t) => t.owner === "both" || !t.owner);
    return [...moominItems, ...handsomeItems, ...bothItems];
  };

  return (
    <main
      style={{
        padding: "16px 16px 100px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #ECE4D2",
          borderRadius: 14,
          padding: "18px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
            borderBottom: "1px solid #FAF6EF",
            paddingBottom: 10,
          }}
        >
          <CheckSquare size={18} color="#2F4538" />
          <h3
            className="serif"
            style={{ margin: 0, fontSize: 16, color: "#2B2822" }}
          >
            待辦 / 準備物品清單
          </h3>
        </div>

        {/* 分類過濾頁籤 */}
        <div
          className="scrollbar-thin"
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            marginBottom: 16,
            paddingBottom: 4,
          }}
        >
          <button
            onClick={() => setFilterCategory("all")}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border:
                filterCategory === "all"
                  ? "1.5px solid #2F4538"
                  : "1px solid #E4DCC8",
              background: filterCategory === "all" ? "#2F4538" : "#FAF6EF",
              color: filterCategory === "all" ? "#fff" : "#5C5745",
              fontSize: 12.5,
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            全部
          </button>
          {Object.entries(TODO_CATEGORIES).map(([key, cfg]) => {
            const active = filterCategory === key;
            const Icon = cfg.icon;
            return (
              <button
                key={key}
                onClick={() => setFilterCategory(key)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: active
                    ? `1.5px solid ${cfg.color}`
                    : "1px solid #E4DCC8",
                  background: active ? cfg.bg : "#FAF6EF",
                  color: active ? cfg.color : "#5C5745",
                  fontSize: 12.5,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Icon size={13} /> {cfg.label}
              </button>
            );
          })}
        </div>

        {/* 新增區塊 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTodo()}
              placeholder="新增待辦項目（如：飛驒牛拉麵...）"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              onClick={addTodo}
              style={{
                flexShrink: 0,
                padding: "0 18px",
                borderRadius: 10,
                border: "none",
                background: "#2F4538",
                color: "#fff",
                fontWeight: 600,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Plus size={16} /> 新增
            </button>
          </div>
          <input
            value={inputNote}
            onChange={(e) => setInputNote(e.target.value)}
            placeholder="新增備註（選填）"
            style={{ ...inputStyle, fontSize: 13.5, padding: "8px 12px" }}
          />

          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 12, color: "#8A8168", marginRight: 2 }}>
              類別:
            </span>
            {Object.entries(TODO_CATEGORIES).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                style={{
                  padding: "4px 9px",
                  borderRadius: 6,
                  border:
                    selectedCategory === key
                      ? `1.5px solid ${cfg.color}`
                      : "1px solid #E4DCC8",
                  background: selectedCategory === key ? cfg.bg : "#fff",
                  color: selectedCategory === key ? cfg.color : "#8A8168",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {cfg.label}
              </button>
            ))}
          </div>

          {selectedCategory === "luggage" && (
            <div
              style={{
                display: "flex",
                gap: 6,
                alignItems: "center",
                background: "#E4EEF4",
                padding: "6px 10px",
                borderRadius: 8,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: "#3D6E8C",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <User size={13} /> 行李歸屬:
              </span>
              <button
                onClick={() => setSelectedOwner("moomin")}
                style={{
                  padding: "3px 9px",
                  borderRadius: 6,
                  border:
                    selectedOwner === "moomin"
                      ? "1.5px solid #8A4F9E"
                      : "1px solid #C9BFA8",
                  background: selectedOwner === "moomin" ? "#F1E7F5" : "#fff",
                  color: selectedOwner === "moomin" ? "#8A4F9E" : "#5C5745",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                嚕嚕米
              </button>
              <button
                onClick={() => setSelectedOwner("handsome")}
                style={{
                  padding: "3px 9px",
                  borderRadius: 6,
                  border:
                    selectedOwner === "handsome"
                      ? "1.5px solid #3D6E8C"
                      : "1px solid #C9BFA8",
                  background: selectedOwner === "handsome" ? "#E4EEF4" : "#fff",
                  color: selectedOwner === "handsome" ? "#3D6E8C" : "#5C5745",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                帥哥
              </button>
              <button
                onClick={() => setSelectedOwner("both")}
                style={{
                  padding: "3px 9px",
                  borderRadius: 6,
                  border:
                    selectedOwner === "both"
                      ? "1.5px solid #2F4538"
                      : "1px solid #C9BFA8",
                  background: selectedOwner === "both" ? "#EAF0EA" : "#fff",
                  color: selectedOwner === "both" ? "#2F4538" : "#5C5745",
                  fontSize: 12,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <Users size={12} /> 嚕嚕米 ＆ 帥哥
              </button>
            </div>
          )}
        </div>

        {/* 列表展示 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {categoriesToDisplay.map((catKey) => {
            const catConfig =
              TODO_CATEGORIES[catKey] || TODO_CATEGORIES.important;
            const CatIcon = catConfig.icon;

            let categoryTodos = todos.filter((t) => {
              const itemCat =
                t.category === "toEat" || t.category === "food"
                  ? "food"
                  : t.category || "important";
              return itemCat === catKey;
            });

            if (catKey === "luggage") {
              categoryTodos = sortLuggageTodos(categoryTodos);
            }

            if (filterCategory === "all" && categoryTodos.length === 0)
              return null;

            return (
              <div key={catKey}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    color: catConfig.color,
                  }}
                >
                  <CatIcon size={15} />
                  <span>{catConfig.label}</span>
                  <span
                    style={{
                      fontSize: 11,
                      background: catConfig.bg,
                      padding: "1px 6px",
                      borderRadius: 10,
                      fontWeight: 600,
                    }}
                  >
                    {categoryTodos.length}
                  </span>
                </div>

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {categoryTodos.map((todo) => {
                    const isEditing = editingId === todo.id;
                    return (
                      <div
                        key={todo.id}
                        onClick={() => !isEditing && toggleTodo(todo.id)}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          padding: "10px 12px",
                          borderRadius: 10,
                          background: todo.completed ? "#F7F5F0" : "#FAF6EF",
                          border: "1px solid #ECE4D2",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 10,
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <div style={{ marginTop: 2 }}>
                            {todo.completed ? (
                              <CheckSquare size={20} color="#2F4538" />
                            ) : (
                              <Square size={20} color="#8A8168" />
                            )}
                          </div>
                          {isEditing ? (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                                flex: 1,
                              }}
                            >
                              <input
                                autoFocus
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                style={{
                                  ...inputStyle,
                                  padding: "4px 8px",
                                  fontSize: 14,
                                }}
                              />
                              <input
                                value={editingNote}
                                onChange={(e) => setEditingNote(e.target.value)}
                                placeholder="備註"
                                style={{
                                  ...inputStyle,
                                  padding: "4px 8px",
                                  fontSize: 12.5,
                                }}
                              />
                              {editingCategory === "luggage" && (
                                <div style={{ display: "flex", gap: 4 }}>
                                  <button
                                    onClick={() => setEditingOwner("moomin")}
                                    style={{
                                      padding: "2px 8px",
                                      fontSize: 11,
                                      borderRadius: 4,
                                      border:
                                        editingOwner === "moomin"
                                          ? "1px solid #8A4F9E"
                                          : "1px solid #E4DCC8",
                                      background:
                                        editingOwner === "moomin"
                                          ? "#F1E7F5"
                                          : "#fff",
                                      color:
                                        editingOwner === "moomin"
                                          ? "#8A4F9E"
                                          : "#8A8168",
                                    }}
                                  >
                                    嚕嚕米
                                  </button>
                                  <button
                                    onClick={() => setEditingOwner("handsome")}
                                    style={{
                                      padding: "2px 8px",
                                      fontSize: 11,
                                      borderRadius: 4,
                                      border:
                                        editingOwner === "handsome"
                                          ? "1px solid #3D6E8C"
                                          : "1px solid #E4DCC8",
                                      background:
                                        editingOwner === "handsome"
                                          ? "#E4EEF4"
                                          : "#fff",
                                      color:
                                        editingOwner === "handsome"
                                          ? "#3D6E8C"
                                          : "#8A8168",
                                    }}
                                  >
                                    帥哥
                                  </button>
                                  <button
                                    onClick={() => setEditingOwner("both")}
                                    style={{
                                      padding: "2px 8px",
                                      fontSize: 11,
                                      borderRadius: 4,
                                      border:
                                        editingOwner === "both"
                                          ? "1px solid #2F4538"
                                          : "1px solid #E4DCC8",
                                      background:
                                        editingOwner === "both"
                                          ? "#EAF0EA"
                                          : "#fff",
                                      color:
                                        editingOwner === "both"
                                          ? "#2F4538"
                                          : "#8A8168",
                                    }}
                                  >
                                    嚕嚕米 ＆ 帥哥
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  flexWrap: "wrap",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 15,
                                    color: todo.completed
                                      ? "#A69C82"
                                      : "#2B2822",
                                    textDecoration: todo.completed
                                      ? "line-through"
                                      : "none",
                                  }}
                                >
                                  {todo.text}
                                </span>
                                {todo.category === "luggage" && todo.owner && (
                                  <span
                                    style={{
                                      fontSize: 10.5,
                                      padding: "1px 6px",
                                      borderRadius: 4,
                                      fontWeight: 600,
                                      background:
                                        todo.owner === "moomin"
                                          ? "#F1E7F5"
                                          : todo.owner === "handsome"
                                          ? "#E4EEF4"
                                          : "#EAF0EA",
                                      color:
                                        todo.owner === "moomin"
                                          ? "#8A4F9E"
                                          : todo.owner === "handsome"
                                          ? "#3D6E8C"
                                          : "#2F4538",
                                    }}
                                  >
                                    {todo.owner === "moomin"
                                      ? "嚕嚕米"
                                      : todo.owner === "handsome"
                                      ? "帥哥"
                                      : "嚕嚕米 ＆ 帥哥"}
                                  </span>
                                )}
                              </div>
                              {todo.note && (
                                <div
                                  style={{
                                    fontSize: 12.5,
                                    color: todo.completed
                                      ? "#B5AC98"
                                      : "#7A7360",
                                  }}
                                >
                                  📝 {todo.note}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            marginLeft: 8,
                          }}
                        >
                          {isEditing ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                saveEdit(todo.id);
                              }}
                              style={{
                                border: "none",
                                background: "#2F4538",
                                color: "#fff",
                                borderRadius: 6,
                                padding: "4px 8px",
                              }}
                            >
                              <Check size={16} />
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={(e) => startEdit(e, todo)}
                                style={{
                                  border: "none",
                                  background: "transparent",
                                  color: "#5C5745",
                                  padding: 6,
                                }}
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteTodo(todo.id);
                                }}
                                style={{
                                  border: "none",
                                  background: "transparent",
                                  color: "#C1633D",
                                  padding: 6,
                                }}
                              >
                                <X size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

// --- Main App Component ---
export default function App() {
  const [tripName, setTripName] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [notes, setNotes] = useState("");
  const [todos, setTodos] = useState([]);
  const [editingTripName, setEditingTripName] = useState(false);
  const [days, setDays] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [activeDay, setActiveDay] = useState(null);
  const [view, setView] = useState("home");
  const [modal, setModal] = useState(null);
  const [expenseModal, setExpenseModal] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [confirmDeleteDayId, setConfirmDeleteDayId] = useState(null);

  useEffect(() => {
    const tripRef = doc(db, "trips", "kyoto-trip");
    const unsubscribe = onSnapshot(tripRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTripName(data.tripName || "日本高山中部散策");
        setCoverImage(data.coverImage || SAMPLE_TRIP.coverImage);
        setNotes(data.notes || "");

        const loadedTodos = (data.todos || []).map((t) => ({
          ...t,
          category:
            t.category === "toEat" || t.category === "food"
              ? "food"
              : t.category || "important",
        }));
        setTodos(loadedTodos);

        const sortedDays = (data.days || []).map((d) => ({
          ...d,
          startPoint: d.startPoint || "",
          startPointNote: d.startPointNote || "",
          items: d.items || [],
        }));
        setDays(sortedDays);
        setExpenses(data.expenses || []);

        if (sortedDays && sortedDays.length > 0) {
          setActiveDay((prev) => {
            if (prev) return prev;
            const today = todayISO();
            const matchedDay = sortedDays.find((d) => d.date === today);
            if (matchedDay) return matchedDay.id;
            return sortedDays[0].id;
          });
        }
      } else {
        setDoc(tripRef, SAMPLE_TRIP);
      }
      setLoaded(true);
    });
    return () => unsubscribe();
  }, []);

  // 智慧合併同步：以「最新生成的項目陣列」與雲端現有項目做智慧聯集 (Smart Merge)
  const syncToFirebaseWithMerge = async (newTodos) => {
    try {
      const tripRef = doc(db, "trips", "kyoto-trip");

      // 取得最新本地 todos 並更新 State
      setTodos(newTodos);

      // 傳送合併更新到 Firebase
      await setDoc(tripRef, { todos: newTodos }, { merge: true });
      console.log("⚡️ 清單智能同步成功！");
    } catch (err) {
      console.error("清單同步失敗:", err);
    }
  };

  const syncGeneralToFirebase = async (patch = {}) => {
    try {
      const tripRef = doc(db, "trips", "kyoto-trip");
      await setDoc(tripRef, patch, { merge: true });
    } catch (err) {
      console.error("同步失敗:", err);
    }
  };

  if (!loaded || (!activeDay && days.length > 0)) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#FAF6EF",
          color: "#2F4538",
          gap: 20,
        }}
      >
        <style>{`
          @keyframes spin-sakura {
            0% { transform: translate(-50%, -50%) rotate(0deg) scale(0.95); }
            50% { transform: translate(-50%, -50%) rotate(180deg) scale(1.05); }
            100% { transform: translate(-50%, -50%) rotate(360deg) scale(0.95); }
          }
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.6; transform: scale(0.9); }
            50% { opacity: 1; transform: scale(1.1); }
          }
          .sakura-container {
            position: relative;
            width: 80px;
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .japan-sun {
            width: 36px;
            height: 36px;
            background-color: #C1633D;
            border-radius: 50%;
            box-shadow: 0 0 15px rgba(193, 99, 61, 0.3);
            animation: pulse-glow 2s infinite ease-in-out;
            z-index: 1;
          }
          .sakura-petals {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 80px;
            height: 80px;
            transform: translate(-50%, -50%);
            animation: spin-sakura 6s infinite linear;
          }
          .petal {
            position: absolute;
            width: 14px;
            height: 14px;
            background: #FBEAE1;
            border: 1px solid #E8B4B8;
            border-radius: 12px 0 12px 0;
            top: 50%;
            left: 50%;
          }
          .petal-1 { transform: translate(-50%, -50%) rotate(0deg) translate(30px); }
          .petal-2 { transform: translate(-50%, -50%) rotate(72deg) translate(30px); }
          .petal-3 { transform: translate(-50%, -50%) rotate(144deg) translate(30px); }
          .petal-4 { transform: translate(-50%, -50%) rotate(216deg) translate(30px); }
          .petal-5 { transform: translate(-50%, -50%) rotate(288deg) translate(30px); }
        `}</style>
        <div className="sakura-container">
          <div className="japan-sun" />
          <div className="sakura-petals">
            <div className="petal petal-1" />
            <div className="petal petal-2" />
            <div className="petal petal-3" />
            <div className="petal petal-4" />
            <div className="petal petal-5" />
          </div>
        </div>
        <div
          className="serif"
          style={{ fontSize: 16, fontWeight: 700, color: "#2F4538" }}
        >
          雲端同步載入中…
        </div>
      </div>
    );
  }

  const currentDay = days.find((d) => d.id === activeDay) || days[0];

  function addDay() {
    const last = days[days.length - 1];
    const base = last ? new Date(last.date + "T00:00:00") : new Date();
    base.setDate(base.getDate() + 1);
    const newDay = {
      id: uid(),
      date: base.toISOString().slice(0, 10),
      startPoint: "",
      startPointNote: "",
      items: [],
    };
    const nextDays = [...days, newDay];
    setDays(nextDays);
    setActiveDay(newDay.id);
    syncGeneralToFirebase({ days: nextDays });
  }

  function removeDay(id) {
    if (days.length <= 1) return;
    const next = days.filter((d) => d.id !== id);
    setDays(next);
    setConfirmDeleteDayId(null);
    if (activeDay === id) setActiveDay(next[0].id);
    syncGeneralToFirebase({ days: next });
  }

  function updateDayDate(id, date) {
    const nextDays = days.map((d) => (d.id === id ? { ...d, date } : d));
    setDays(nextDays);
    syncGeneralToFirebase({ days: nextDays });
  }

  function updateDayStartPoint(id, startPoint) {
    const nextDays = days.map((d) => (d.id === id ? { ...d, startPoint } : d));
    setDays(nextDays);
    syncGeneralToFirebase({ days: nextDays });
  }

  function updateDayStartPointNote(id, startPointNote) {
    const nextDays = days.map((d) =>
      d.id === id ? { ...d, startPointNote } : d
    );
    setDays(nextDays);
    syncGeneralToFirebase({ days: nextDays });
  }

  function updateItemField(dayId, itemId, field, value) {
    const nextDays = days.map((d) => {
      if (d.id !== dayId) return d;
      const updatedItems = d.items.map((it) =>
        it.id === itemId ? { ...it, [field]: value } : it
      );
      return { ...d, items: sortByTime(updatedItems) };
    });
    setDays(nextDays);
    syncGeneralToFirebase({ days: nextDays });
  }

  function removeItem(dayId, itemId) {
    const nextDays = days.map((d) =>
      d.id === dayId
        ? { ...d, items: d.items.filter((it) => it.id !== itemId) }
        : d
    );
    setDays(nextDays);
    syncGeneralToFirebase({ days: nextDays });
  }

  return (
    <div
      style={{
        fontFamily: "'Noto Sans TC', sans-serif",
        background: "#FAF6EF",
        minHeight: "100vh",
        color: "#2B2822",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@600;700&family=Noto+Sans+TC:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .serif { font-family: 'Noto Serif TC', serif; }
        .scrollbar-thin::-webkit-scrollbar { height: 6px; width: 6px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #D9CFBB; border-radius: 4px; }
        button { cursor: pointer; font-family: inherit; }
        input, textarea, select { font-family: inherit; }
        .card-enter { animation: rise 0.25s ease both; }
        @keyframes rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .app-container { display: flex; flex-direction: column; width: 100%; max-width: 1024px; margin: 0 auto; }
        .top-nav { display: flex; gap: 8px; overflow-x: auto; padding: 12px 16px 8px; border-bottom: 1px solid #ECE4D2; background: #FAF6EF; }
      `}</style>

      {/* Header */}
      <header
        style={{
          background: "#2F4538",
          color: "#F4EFE3",
          padding: "18px 20px 14px",
        }}
      >
        <div
          style={{
            maxWidth: 1024,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: 2,
                opacity: 0.7,
                marginBottom: 3,
              }}
            >
              TRAVEL NOTES · 雲端實時共編
            </div>
            {editingTripName ? (
              <input
                autoFocus
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                onBlur={() => {
                  setEditingTripName(false);
                  syncGeneralToFirebase({ tripName });
                }}
                className="serif"
                style={{
                  background: "transparent",
                  border: "none",
                  borderBottom: "2px solid rgba(244,239,227,0.5)",
                  color: "#F4EFE3",
                  fontSize: 22,
                  fontWeight: 700,
                  outline: "none",
                  width: "100%",
                }}
              />
            ) : (
              <h1
                className="serif"
                onClick={() => setEditingTripName(true)}
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  margin: 0,
                  cursor: "pointer",
                }}
              >
                {tripName} ✎
              </h1>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="app-container">
        <nav className="top-nav scrollbar-thin">
          {[
            { id: "home", label: "首頁", icon: Home },
            { id: "itinerary", label: "行程", icon: Calendar },
            { id: "checklist", label: "清單", icon: CheckSquare },
            { id: "expenses", label: "記帳", icon: Wallet },
            { id: "notebook", label: "記事本", icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = view === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: active ? "#2F4538" : "#fff",
                  color: active ? "#F4EFE3" : "#5C5745",
                  fontWeight: 700,
                  fontSize: 13.5,
                  whiteSpace: "nowrap",
                }}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </nav>

        <div style={{ flex: 1 }}>
          {view === "home" && (
            <HomeView
              tripName={tripName}
              days={days}
              coverImage={coverImage}
              onUpdateCoverImage={(url) => {
                setCoverImage(url);
                syncGeneralToFirebase({ coverImage: url });
              }}
              onNavigate={setView}
            />
          )}

          {view === "itinerary" && (
            <main
              style={{
                padding: "16px 16px 100px",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <div
                className="scrollbar-thin"
                style={{
                  display: "flex",
                  gap: 8,
                  overflowX: "auto",
                  paddingBottom: 12,
                  marginBottom: 8,
                }}
              >
                {days.map((d, i) => (
                  <button
                    key={d.id}
                    onClick={() => setActiveDay(d.id)}
                    style={{
                      flex: "0 0 auto",
                      padding: "8px 14px",
                      borderRadius: 9,
                      border:
                        activeDay === d.id
                          ? "1.5px solid #2F4538"
                          : "1.5px solid #E4DCC8",
                      background: activeDay === d.id ? "#2F4538" : "#fff",
                      color: activeDay === d.id ? "#F4EFE3" : "#5C5745",
                      fontSize: 13,
                      fontWeight: 600,
                      textAlign: "left",
                      minWidth: 85,
                    }}
                  >
                    <div
                      style={{ fontSize: 10.5, opacity: 0.75, marginBottom: 1 }}
                    >
                      Day {i + 1}
                    </div>
                    <div>{fmtDateLabel(d.date)}</div>
                  </button>
                ))}
                <button
                  onClick={addDay}
                  style={{
                    width: 42,
                    borderRadius: 9,
                    border: "1.5px dashed #C9BFA8",
                    background: "transparent",
                    color: "#8A8168",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Plus size={18} />
                </button>
              </div>

              {currentDay && (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      margin: "4px 2px 12px",
                    }}
                  >
                    <Calendar size={16} color="#8A8168" />
                    <input
                      type="date"
                      value={currentDay.date}
                      onChange={(e) =>
                        updateDayDate(currentDay.id, e.target.value)
                      }
                      style={{
                        border: "none",
                        background: "transparent",
                        fontSize: 15,
                        color: "#5C5745",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    />
                  </div>

                  {/* 當日起點（含備註欄） */}
                  <div
                    style={{
                      background: "#FAF6EF",
                      border: "1.5px solid #D9CFBB",
                      borderRadius: 12,
                      padding: "12px 14px",
                      marginBottom: 16,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <Flag
                          size={16}
                          color="#C1633D"
                          style={{ flexShrink: 0 }}
                        />
                        <span
                          style={{
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: "#C1633D",
                            flexShrink: 0,
                          }}
                        >
                          當日起點:
                        </span>
                        <input
                          value={currentDay.startPoint || ""}
                          onChange={(e) =>
                            updateDayStartPoint(currentDay.id, e.target.value)
                          }
                          placeholder="填寫當日起點（如：名古屋車站）"
                          style={{
                            border: "none",
                            background: "transparent",
                            fontSize: 13.5,
                            fontWeight: 600,
                            color: "#2B2822",
                            outline: "none",
                            width: "100%",
                          }}
                        />
                      </div>
                      {currentDay.startPoint && (
                        <a
                          href={mapsUrl(currentDay.startPoint)}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                            fontSize: 12,
                            color: "#2F4538",
                            fontWeight: 600,
                            textDecoration: "none",
                            background: "#EAF0EA",
                            padding: "4px 8px",
                            borderRadius: 6,
                            flexShrink: 0,
                          }}
                        >
                          開啟地圖 <ExternalLink size={12} />
                        </a>
                      )}
                    </div>

                    <input
                      value={currentDay.startPointNote || ""}
                      onChange={(e) =>
                        updateDayStartPointNote(currentDay.id, e.target.value)
                      }
                      placeholder="起點備註（選填，如：11:00前需退房、寄放行李卡...）"
                      style={{
                        border: "none",
                        borderTop: "1px dashed #E4DCC8",
                        background: "transparent",
                        fontSize: 12.5,
                        color: "#7A7360",
                        outline: "none",
                        paddingTop: 6,
                        width: "100%",
                      }}
                    />
                  </div>

                  {/* 時間軸列表 */}
                  <div style={{ position: "relative" }}>
                    {currentDay.items.length > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          left: 21,
                          top: 14,
                          bottom: 22,
                          width: 2,
                          background:
                            "repeating-linear-gradient(to bottom, #D4A857 0, #D4A857 4px, transparent 4px, transparent 9px)",
                          zIndex: 0,
                        }}
                      />
                    )}

                    {currentDay.items.map((item, idx) => {
                      const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.spot;
                      const IconCmp = cfg.icon;
                      const prevPlace =
                        idx > 0
                          ? currentDay.items[idx - 1].type === "transport"
                            ? currentDay.items[idx - 1].destination
                            : currentDay.items[idx - 1].place
                          : currentDay.startPoint || null;

                      return (
                        <div
                          key={item.id}
                          className="card-enter"
                          style={{
                            position: "relative",
                            paddingLeft: 52,
                            marginBottom: 16,
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              left: 0,
                              top: 6,
                              width: 44,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              zIndex: 1,
                            }}
                          >
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                background: cfg.bg,
                                border: `2px solid ${cfg.color}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <IconCmp size={13} color={cfg.color} />
                            </div>
                            {item.time && (
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 800,
                                  color: "#2F4538",
                                  marginTop: 4,
                                  background: "#fff",
                                  border: "1.5px solid #2F4538",
                                  padding: "2px 5px",
                                  borderRadius: 6,
                                  textAlign: "center",
                                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                                }}
                              >
                                {item.time}
                                {item.type === "transport" &&
                                  item.arriveTime && (
                                    <div
                                      style={{
                                        fontSize: 9.5,
                                        color: "#B8862F",
                                        fontWeight: 700,
                                        marginTop: 1,
                                        borderTop: "1px dashed #D9CFBB",
                                      }}
                                    >
                                      ↓ {item.arriveTime}
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>

                          {prevPlace && (
                            <a
                              href={routeUrl(
                                prevPlace,
                                item.type === "transport"
                                  ? item.origin || item.destination
                                  : item.place
                              )}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 11.5,
                                color: "#B8862F",
                                marginBottom: 6,
                                textDecoration: "none",
                              }}
                            >
                              <Navigation size={12} /> 從上一站前往這裡的路線
                            </a>
                          )}

                          <div
                            style={{
                              background: "#fff",
                              border: "1px solid #ECE4D2",
                              borderRadius: 12,
                              padding: "14px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    marginBottom: 4,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 11.5,
                                      fontWeight: 700,
                                      color: cfg.color,
                                      background: cfg.bg,
                                      padding: "2px 8px",
                                      borderRadius: 6,
                                    }}
                                  >
                                    {cfg.label}
                                  </span>
                                  {item.type !== "stay" && item.time && (
                                    <span
                                      style={{
                                        fontSize: 12.5,
                                        fontWeight: 700,
                                        color: "#fff",
                                        background: "#2F4538",
                                        padding: "3px 9px",
                                        borderRadius: 12,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 4,
                                        boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
                                      }}
                                    >
                                      <Clock size={13} color="#90deb0" />
                                      {item.type === "transport"
                                        ? `${item.time} 出發${
                                            item.arriveTime
                                              ? ` ➔ ${item.arriveTime} 抵達`
                                              : ""
                                          }`
                                        : item.time}
                                    </span>
                                  )}
                                </div>
                                <div
                                  className="serif"
                                  style={{
                                    fontSize: 16.5,
                                    fontWeight: 700,
                                    color: "#2B2822",
                                  }}
                                >
                                  {item.title}
                                </div>
                                {item.note && (
                                  <div
                                    style={{
                                      fontSize: 13,
                                      color: "#7A7360",
                                      marginTop: 4,
                                    }}
                                  >
                                    {item.note}
                                  </div>
                                )}
                              </div>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button
                                  onClick={() =>
                                    setModal({ dayId: currentDay.id, item })
                                  }
                                  style={{
                                    border: "1px solid #E4DCC8",
                                    background: "#fff",
                                    color: "#5C5745",
                                    borderRadius: 8,
                                    padding: "5px 9px",
                                    fontSize: 12,
                                  }}
                                >
                                  編輯
                                </button>
                                <button
                                  onClick={() =>
                                    removeItem(currentDay.id, item.id)
                                  }
                                  style={{
                                    border: "none",
                                    background: "transparent",
                                    color: "#C1633D",
                                    fontSize: 12,
                                    padding: "5px 2px",
                                  }}
                                >
                                  刪除
                                </button>
                              </div>
                            </div>

                            {item.type === "transport" ? (
                              <div
                                style={{
                                  marginTop: 10,
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 6,
                                  width: "100%",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 6,
                                    flexWrap: "wrap",
                                    width: "100%",
                                  }}
                                >
                                  {item.origin && (
                                    <a
                                      href={mapsUrl(item.origin)}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{
                                        flex: "1 1 calc(50% - 4px)",
                                        minWidth: "130px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        textDecoration: "none",
                                        background: "#FAF6EF",
                                        border: "1px dashed #D9CFBB",
                                        borderRadius: 8,
                                        padding: "8px 10px",
                                        boxSizing: "border-box",
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize: 12.5,
                                          color: "#5C5745",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 5,
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                          fontWeight: 500,
                                        }}
                                      >
                                        <MapPin
                                          size={14}
                                          color="#3D6E8C"
                                          style={{ flexShrink: 0 }}
                                        />{" "}
                                        起點：{item.origin}
                                      </span>
                                      <ExternalLink
                                        size={12}
                                        color="#2F4538"
                                        style={{ flexShrink: 0, marginLeft: 4 }}
                                      />
                                    </a>
                                  )}
                                  {item.destination && (
                                    <a
                                      href={mapsUrl(item.destination)}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{
                                        flex: "1 1 calc(50% - 4px)",
                                        minWidth: "130px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        textDecoration: "none",
                                        background: "#FAF6EF",
                                        border: "1px dashed #D9CFBB",
                                        borderRadius: 8,
                                        padding: "8px 10px",
                                        boxSizing: "border-box",
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize: 12.5,
                                          color: "#5C5745",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 5,
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                          fontWeight: 500,
                                        }}
                                      >
                                        <MapPin
                                          size={14}
                                          color="#C1633D"
                                          style={{ flexShrink: 0 }}
                                        />{" "}
                                        終點：{item.destination}
                                      </span>
                                      <ExternalLink
                                        size={12}
                                        color="#2F4538"
                                        style={{ flexShrink: 0, marginLeft: 4 }}
                                      />
                                    </a>
                                  )}
                                </div>

                                {item.origin && item.destination && (
                                  <a
                                    href={routeUrl(
                                      item.origin,
                                      item.destination
                                    )}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      gap: 6,
                                      textDecoration: "none",
                                      background: "#90deb0",
                                      color: "#1B382B",
                                      borderRadius: 8,
                                      padding: "9px 12px",
                                      fontSize: 12.5,
                                      fontWeight: 700,
                                      width: "100%",
                                      boxSizing: "border-box",
                                    }}
                                  >
                                    <Navigation
                                      size={14}
                                      color="#1B382B"
                                      style={{ flexShrink: 0 }}
                                    />{" "}
                                    開啟 Google Maps 路線導航（{item.origin} ➔{" "}
                                    {item.destination}）
                                  </a>
                                )}
                              </div>
                            ) : (
                              <a
                                href={mapsUrl(item.place)}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  marginTop: 10,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  textDecoration: "none",
                                  background: "#FAF6EF",
                                  border: "1px dashed #D9CFBB",
                                  borderRadius: 8,
                                  padding: "8px 10px",
                                }}
                              >
                                <span
                                  style={{ fontSize: 12.5, color: "#5C5745" }}
                                >
                                  <MapPin size={13} color="#8A8168" />{" "}
                                  {item.place}
                                </span>
                                <span
                                  style={{
                                    fontSize: 11.5,
                                    color: "#2F4538",
                                    fontWeight: 600,
                                  }}
                                >
                                  開啟地圖 <ExternalLink size={12} />
                                </span>
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setModal({ dayId: currentDay.id })}
                    style={{
                      marginTop: 6,
                      width: "100%",
                      padding: "14px",
                      borderRadius: 12,
                      border: "1.5px dashed #C9BFA8",
                      background: "transparent",
                      color: "#5C5745",
                      fontSize: 14,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <Plus size={16} /> 新增行程項目
                  </button>

                  {days.length > 1 && (
                    <div
                      style={{
                        marginTop: 32,
                        textAlign: "center",
                        borderTop: "1px dashed #E4DCC8",
                        paddingTop: 16,
                      }}
                    >
                      {confirmDeleteDayId === currentDay.id ? (
                        <div
                          style={{
                            display: "flex",
                            gap: 10,
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12.5,
                              color: "#C1633D",
                              fontWeight: 700,
                            }}
                          >
                            確定要刪除 Day{" "}
                            {days.findIndex((d) => d.id === currentDay.id) + 1}{" "}
                            嗎？
                          </span>
                          <button
                            onClick={() => removeDay(currentDay.id)}
                            style={{
                              border: "none",
                              background: "#C1633D",
                              color: "#fff",
                              borderRadius: 6,
                              padding: "4px 10px",
                              fontSize: 12,
                            }}
                          >
                            確定刪除
                          </button>
                          <button
                            onClick={() => setConfirmDeleteDayId(null)}
                            style={{
                              border: "none",
                              background: "transparent",
                              color: "#8A8168",
                              fontSize: 12,
                            }}
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteDayId(currentDay.id)}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "#B5AC98",
                            fontSize: 12,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Trash2 size={13} /> 刪除這天行程
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </main>
          )}

          {view === "expenses" && (
            <ExpensesView
              expenses={expenses}
              days={days}
              totalExpense={expenses.reduce(
                (sum, e) => sum + (parseFloat(e.amount) || 0),
                0
              )}
              expenseByCategory={expenses.reduce((acc, e) => {
                acc[e.category || "other"] =
                  (acc[e.category || "other"] || 0) +
                  (parseFloat(e.amount) || 0);
                return acc;
              }, {})}
              onAdd={() => setExpenseModal({})}
              onEdit={(expense) => setExpenseModal({ expense })}
              onDelete={(id) => {
                const next = expenses.filter((x) => x.id !== id);
                setExpenses(next);
                syncGeneralToFirebase({ expenses: next });
              }}
            />
          )}
          {view === "notebook" && (
            <NotebookView
              notes={notes}
              onChangeNote={setNotes}
              onSaveNow={(n) => syncGeneralToFirebase({ notes: n })}
            />
          )}
          {view === "checklist" && (
            <ChecklistView
              todos={todos}
              setTodos={setTodos}
              onSaveNow={(updatedTodos) =>
                syncToFirebaseWithMerge(updatedTodos)
              }
            />
          )}
        </div>
      </div>

      {modal && (
        <ItemModal
          key={modal.item ? modal.item.id : "new"}
          dayId={modal.dayId}
          initial={modal.item}
          onClose={() => setModal(null)}
          onCreate={(item) => {
            const nextDays = days.map((d) =>
              d.id === modal.dayId
                ? { ...d, items: sortByTime([...d.items, item]) }
                : d
            );
            setDays(nextDays);
            syncGeneralToFirebase({ days: nextDays });
          }}
          onFieldChange={(itemId, field, value) =>
            updateItemField(modal.dayId, itemId, field, value)
          }
        />
      )}
      {expenseModal && (
        <ExpenseModal
          key={expenseModal.expense ? expenseModal.expense.id : "new-expense"}
          initial={expenseModal.expense}
          days={days}
          onClose={() => setExpenseModal(null)}
          onSave={(exp) => {
            const next = expenses.some((e) => e.id === exp.id)
              ? expenses.map((e) => (e.id === exp.id ? exp : e))
              : [...expenses, exp];
            setExpenses(next);
            setExpenseModal(null);
            syncGeneralToFirebase({ expenses: next });
          }}
        />
      )}
    </div>
  );
}
