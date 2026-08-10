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

const PAYMENT_METHODS = {
  card: { label: "刷卡" },
  cash: { label: "付現" },
  icoca: { label: "ICOCA" },
  other: { label: "其他" },
};

const SAMPLE_TRIP = {
  tripName: "京都三日散策",
  coverImage:
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80",
  notes:
    "1. 護照複影本放隨身包包\n2. 關西機場記得領取 HARUKA 車票\n3. 網卡開通設定說明：設定 -> 行動網路 -> 啟動數據漫遊",
  todos: [
    { id: uid(), text: "護照及簽證確認", completed: true },
    { id: uid(), text: "預訂日本 eSIM / 漫遊服務", completed: false },
    { id: uid(), text: "準備換日幣現金", completed: false },
  ],
  days: [
    {
      id: uid(),
      date: todayISO(),
      items: [
        {
          id: uid(),
          type: "spot",
          time: "16:30",
          title: "竹林小徑",
          place: "嵐山竹林の道",
          note: "傍晚人少,適合拍照",
        },
        {
          id: uid(),
          type: "food",
          time: "19:00",
          title: "嵐山鰻魚飯",
          place: "広川 嵐山",
          note: "需預約,現金優先",
        },
        {
          id: uid(),
          type: "stay",
          time: "",
          title: "嵐山悠然町家",
          place: "嵐山悠然町家 京都",
          note: "提前寄放行李,check-in 15:00",
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

// --- Home Component (包含真實氣象 API 連線) ---
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
    icon: Sun,
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;
    const city = CITY_COORDS[selectedCity] || CITY_COORDS.nagoya;
    setWeatherData((prev) => ({ ...prev, loading: true }));

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,weather_code`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data && data.current) {
          const temp = `${Math.round(data.current.temperature_2m)}°C`;
          const humidity = `${data.current.relative_humidity_2m}%`;
          const parsed = parseWmoCode(data.current.weather_code);

          setWeatherData({
            temp,
            humidity,
            cond: parsed.cond,
            icon: parsed.icon,
            loading: false,
          });
        }
      })
      .catch((err) => {
        console.error("氣象 API 連線失敗:", err);
        if (isMounted) {
          setWeatherData({
            temp: "--",
            cond: "取得失敗",
            humidity: "--",
            icon: Sun,
            loading: false,
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCity]);

  const startDate = days[0]?.date ? fmtDateLabel(days[0].date) : "";
  const endDate = days[days.length - 1]?.date
    ? fmtDateLabel(days[days.length - 1].date)
    : "";
  const WeatherIcon = weatherData.icon;
  const currentCityName = CITY_COORDS[selectedCity]?.name || "名古屋";

  const handleSavePhoto = () => {
    onUpdateCoverImage(photoInput);
    setEditingPhoto(false);
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
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              textShadow: "0 2px 4px rgba(0,0,0,0.3)",
            }}
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
              marginBottom: 8,
            }}
          >
            輸入新相片網址 (Image URL)：
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
              onClick={handleSavePhoto}
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
              儲存相片
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
              <option value="taoyuan">桃園</option>
              <option value="osaka">大阪</option>
              <option value="nagoya">名古屋</option>
              <option value="takayama">高山</option>
              <option value="hida">飛騨</option>
              <option value="kamikochi">上高地</option>
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
              <div>{currentCityName}</div>
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
  const time = liveItem?.time || "";
  const arriveTime = liveItem?.arriveTime || "";
  const title = liveItem?.title || "";
  const place = liveItem?.place || "";
  const origin = liveItem?.origin || "";
  const destination = liveItem?.destination || "";
  const note = liveItem?.note || "";
  const stops = liveItem?.stops || [];

  function addStop() {
    ensureCreatedThenSet("stops", [
      ...stops,
      { id: uid(), place: "", closeTime: "" },
    ]);
  }

  function updateStop(stopId, field, value) {
    ensureCreatedThenSet(
      "stops",
      stops.map((s) => (s.id === stopId ? { ...s, [field]: value } : s))
    );
  }

  function removeStop(stopId) {
    ensureCreatedThenSet(
      "stops",
      stops.filter((s) => s.id !== stopId)
    );
  }

  function handleDone() {
    onClose(!initial && liveItem ? liveItem.id : null);
  }

  return (
    <div
      onClick={handleDone}
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
            onClick={handleDone}
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
          <Field label="時間">
            <input
              type="time"
              value={time}
              onChange={(e) => ensureCreatedThenSet("time", e.target.value)}
              style={inputStyle}
            />
          </Field>
        )}

        {type === "transport" && (
          <Field label="預計抵達時間">
            <input
              type="time"
              value={arriveTime}
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
            value={title}
            onChange={(e) => ensureCreatedThenSet("title", e.target.value)}
            style={inputStyle}
          />
        </Field>

        {type === "transport" ? (
          <>
            <Field label="起點">
              <input
                placeholder="例如：關西機場"
                value={origin}
                onChange={(e) => ensureCreatedThenSet("origin", e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="終點">
              <input
                placeholder="例如：京都車站"
                value={destination}
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
              value={place}
              onChange={(e) => ensureCreatedThenSet("place", e.target.value)}
              style={inputStyle}
            />
          </Field>
        )}

        {type === "shopping" && (
          <Field label="購物地點清單">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {stops.map((s, i) => (
                <div
                  key={s.id}
                  style={{
                    border: "1px solid #ECE4D2",
                    borderRadius: 10,
                    padding: 10,
                    background: "#fff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#8A8168",
                      }}
                    >
                      地點 {i + 1}
                    </span>
                    <button
                      onClick={() => removeStop(s.id)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#C1633D",
                        fontSize: 12,
                        padding: "2px 6px",
                      }}
                    >
                      刪除
                    </button>
                  </div>
                  <input
                    placeholder="例如：新京極商店街"
                    value={s.place}
                    onChange={(e) => updateStop(s.id, "place", e.target.value)}
                    style={{ ...inputStyle, marginBottom: 6 }}
                  />
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{ fontSize: 12, color: "#8A8168", flexShrink: 0 }}
                    >
                      關門時間
                    </span>
                    <input
                      type="time"
                      value={s.closeTime}
                      onChange={(e) =>
                        updateStop(s.id, "closeTime", e.target.value)
                      }
                      style={{ ...inputStyle, flex: 1 }}
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={addStop}
                style={{
                  padding: "11px",
                  borderRadius: 10,
                  border: "1.5px dashed #C9BFA8",
                  background: "transparent",
                  color: "#5C5745",
                  fontSize: 13,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Plus size={15} /> 新增購物地點
              </button>
            </div>
          </Field>
        )}

        <Field label="備註（選填）">
          <textarea
            placeholder="Check-in 時間、預約資訊、注意事項…"
            value={note}
            onChange={(e) => ensureCreatedThenSet("note", e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </Field>

        <button
          onClick={handleDone}
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

  const sorted = [...expenses].sort((a, b) => {
    const da = days.findIndex((d) => d.id === a.dayId);
    const db = days.findIndex((d) => d.id === b.dayId);
    if (da !== db) return da - db;
    return (a.time || "").localeCompare(b.time || "");
  });

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
            {Object.entries(expenseByCategory).map(([cat, amt]) => {
              const cfg = EXPENSE_CATEGORIES[cat] || EXPENSE_CATEGORIES.other;
              return (
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
                  <span style={{ opacity: 0.85 }}>{cfg.label}</span>
                  <span style={{ fontWeight: 700 }}>
                    ${amt.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {sorted.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "#A69C82",
          }}
        >
          <Wallet size={28} style={{ opacity: 0.4, marginBottom: 10 }} />
          <div style={{ fontSize: 14 }}>還沒有任何花費紀錄</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sorted.map((e) => {
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
                  {e.paymentMethod && PAYMENT_METHODS[e.paymentMethod] && (
                    <span
                      style={{
                        fontSize: 11.5,
                        color: "#8A8168",
                        background: "#EFEAE0",
                        padding: "2px 7px",
                        borderRadius: 6,
                      }}
                    >
                      {PAYMENT_METHODS[e.paymentMethod].label}
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
  const [paymentMethod, setPaymentMethod] = useState(
    initial?.paymentMethod || "cash"
  );
  const [dayId, setDayId] = useState(
    initial?.dayId || (days[0] ? days[0].id : "")
  );
  const [note, setNote] = useState(initial?.note || "");

  const canSave = title.trim() && amount !== "" && !isNaN(parseFloat(amount));

  function handleSave() {
    if (!canSave) return;
    onSave({
      id: initial?.id || uid(),
      title: title.trim(),
      amount: parseFloat(amount),
      category,
      paymentMethod,
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

        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          {Object.entries(EXPENSE_CATEGORIES).map(([key, cfg]) => {
            const active = category === key;
            return (
              <button
                key={key}
                onClick={() => setCategory(key)}
                style={{
                  flex: "1 1 27%",
                  minWidth: 70,
                  padding: "10px 6px",
                  borderRadius: 10,
                  border: active
                    ? `1.5px solid ${cfg.color}`
                    : "1.5px solid #E4DCC8",
                  background: active ? cfg.bg : "#fff",
                  color: active ? cfg.color : "#8A8168",
                  fontSize: 12.5,
                  fontWeight: 600,
                }}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>

        <Field label="項目名稱">
          <input
            placeholder="例如：晚餐、電車票"
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

        <Field label="付款方式">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Object.entries(PAYMENT_METHODS).map(([key, cfg]) => {
              const active = paymentMethod === key;
              return (
                <button
                  key={key}
                  onClick={() => setPaymentMethod(key)}
                  style={{
                    flex: "1 1 22%",
                    minWidth: 64,
                    padding: "10px 6px",
                    borderRadius: 10,
                    border: active
                      ? "1.5px solid #2F4538"
                      : "1.5px solid #E4DCC8",
                    background: active ? "#EAF0EA" : "#fff",
                    color: active ? "#2F4538" : "#8A8168",
                    fontSize: 12.5,
                    fontWeight: 600,
                  }}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </Field>

        {days.length > 0 && (
          <Field label="屬於哪一天">
            <select
              value={dayId}
              onChange={(e) => setDayId(e.target.value)}
              style={inputStyle}
            >
              {days.map((d, i) => (
                <option key={d.id} value={d.id}>
                  Day {i + 1} — {fmtDateLabel(d.date)}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="備註（選填）">
          <textarea
            placeholder="分帳資訊、店名等…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </Field>

        <button
          onClick={handleSave}
          disabled={!canSave}
          style={{
            width: "100%",
            marginTop: 8,
            padding: "14px",
            borderRadius: 12,
            border: "none",
            background: canSave ? "#2F4538" : "#D9D2BF",
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
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
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
          onBlur={() => onSaveNow()}
          placeholder="在這裡記下重要的旅遊資訊，例如：護照號碼、飯店電話、門票 QR Code 序號..."
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
        <div
          style={{
            fontSize: 11.5,
            color: "#8A8168",
            marginTop: 10,
            textAlign: "right",
          }}
        >
          * 內容會在離開輸入框或自動每 15 秒同步至雲端
        </div>
      </div>
    </main>
  );
}

// --- Checklist / Todo View（修復支援即時編輯文字與雲端同步） ---
function ChecklistView({ todos, setTodos, onSaveNow }) {
  const [inputText, setInputText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");

  const addTodo = () => {
    if (!inputText.trim()) return;
    const newTodos = [
      ...todos,
      { id: uid(), text: inputText.trim(), completed: false },
    ];
    setTodos(newTodos);
    setInputText("");
    onSaveNow(newTodos);
  };

  const toggleTodo = (id) => {
    const newTodos = todos.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    setTodos(newTodos);
    onSaveNow(newTodos);
  };

  const deleteTodo = (id) => {
    const newTodos = todos.filter((t) => t.id !== id);
    setTodos(newTodos);
    onSaveNow(newTodos);
  };

  const startEdit = (e, todo) => {
    e.stopPropagation();
    setEditingId(todo.id);
    setEditingText(todo.text);
  };

  const saveEdit = (id) => {
    if (!editingText.trim()) return;
    const newTodos = todos.map((t) =>
      t.id === id ? { ...t, text: editingText.trim() } : t
    );
    setTodos(newTodos);
    setEditingId(null);
    setEditingText("");
    onSaveNow(newTodos);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
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
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
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

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
            placeholder="新增待辦項目（如：換日幣...）"
            style={inputStyle}
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

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {todos.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "30px 0",
                color: "#A69C82",
                fontSize: 13,
              }}
            >
              清單目前是空的，快新增一些事項吧！
            </div>
          )}

          {todos.map((todo) => {
            const isEditing = editingId === todo.id;

            return (
              <div
                key={todo.id}
                onClick={() => !isEditing && toggleTodo(todo.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: todo.completed ? "#F7F5F0" : "#FAF6EF",
                  border: "1px solid #ECE4D2",
                  cursor: isEditing ? "default" : "pointer",
                  transition: "all 0.15s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {todo.completed ? (
                    <CheckSquare
                      size={20}
                      color="#2F4538"
                      style={{ flexShrink: 0 }}
                    />
                  ) : (
                    <Square
                      size={20}
                      color="#8A8168"
                      style={{ flexShrink: 0 }}
                    />
                  )}

                  {isEditing ? (
                    <input
                      autoFocus
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(todo.id);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      style={{
                        ...inputStyle,
                        padding: "4px 8px",
                        fontSize: 14,
                        flex: 1,
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: 15,
                        color: todo.completed ? "#A69C82" : "#2B2822",
                        textDecoration: todo.completed
                          ? "line-through"
                          : "none",
                        wordBreak: "break-all",
                      }}
                    >
                      {todo.text}
                    </span>
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
                    <>
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
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelEdit();
                        }}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "#8A8168",
                          padding: 4,
                        }}
                      >
                        <X size={16} />
                      </button>
                    </>
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
                        title="編輯項目"
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
                        title="刪除項目"
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

  useEffect(() => {
    const tripRef = doc(db, "trips", "kyoto-trip");

    const unsubscribe = onSnapshot(
      tripRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTripName(data.tripName || "京都三日散策");
          setCoverImage(data.coverImage || SAMPLE_TRIP.coverImage);
          setNotes(data.notes || "");
          setTodos(data.todos || []);

          const sortedDays = (data.days || []).map((d) => ({
            ...d,
            items: sortByTime(d.items || []),
          }));

          setDays(sortedDays);
          setExpenses(data.expenses || []);
          if (sortedDays && sortedDays.length > 0) {
            setActiveDay((prev) => prev || sortedDays[0].id);
          }
        } else {
          setDoc(tripRef, SAMPLE_TRIP);
        }
        setLoaded(true);
      },
      (error) => {
        console.error("Firebase 讀取失敗:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const saveNow = async (
    latestTripName = tripName,
    latestDays = days,
    latestExpenses = expenses,
    latestNotes = notes,
    latestTodos = todos,
    latestCoverImage = coverImage
  ) => {
    try {
      const tripRef = doc(db, "trips", "kyoto-trip");
      await setDoc(
        tripRef,
        {
          tripName: latestTripName,
          days: latestDays,
          expenses: latestExpenses,
          notes: latestNotes,
          todos: latestTodos,
          coverImage: latestCoverImage,
        },
        { merge: true }
      );
      console.log("⚡️ 已同步至 Firebase！");
    } catch (err) {
      console.error("即時寫入失敗:", err);
    }
  };

  useEffect(() => {
    if (!loaded) return;

    const timer = setTimeout(() => {
      saveNow();
    }, 15000);

    return () => clearTimeout(timer);
  }, [tripName, days, expenses, notes, todos, coverImage, loaded]);

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
            0% { transform: rotate(0deg) scale(0.95); }
            50% { transform: rotate(180deg) scale(1.05); }
            100% { transform: rotate(360deg) scale(0.95); }
          }
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.6; transform: scale(0.9); }
            50% { opacity: 1; transform: scale(1.1); }
          }
          @keyframes fade-text {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
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
            inset: 0;
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
            margin-top: -7px;
            margin-left: -7px;
          }
          .petal-1 { transform: rotate(0deg) translate(30px); }
          .petal-2 { transform: rotate(72deg) translate(30px); }
          .petal-3 { transform: rotate(144deg) translate(30px); }
          .petal-4 { transform: rotate(216deg) translate(30px); }
          .petal-5 { transform: rotate(288deg) translate(30px); }
          .loading-text {
            animation: fade-text 2s infinite ease-in-out;
          }
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

        <div className="loading-text" style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 3,
              color: "#C1633D",
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            JAPAN TRAVEL
          </div>
          <div
            className="serif"
            style={{
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: 2,
              color: "#2F4538",
            }}
          >
            雲端同步載入中…
          </div>
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
      items: [],
    };
    const nextDays = [...days, newDay];
    setDays(nextDays);
    setActiveDay(newDay.id);
    saveNow(tripName, nextDays, expenses, notes, todos, coverImage);
  }

  function removeDay(id) {
    if (days.length <= 1) return;
    const next = days.filter((d) => d.id !== id);
    setDays(next);
    if (activeDay === id) setActiveDay(next[0].id);
    saveNow(tripName, next, expenses, notes, todos, coverImage);
  }

  function updateDayDate(id, date) {
    const nextDays = days.map((d) => (d.id === id ? { ...d, date } : d));
    setDays(nextDays);
    saveNow(tripName, nextDays, expenses, notes, todos, coverImage);
  }

  function updateItemField(dayId, itemId, field, value) {
    setDays((prevDays) =>
      prevDays.map((d) => {
        if (d.id !== dayId) return d;
        const updatedItems = d.items.map((it) =>
          it.id === itemId ? { ...it, [field]: value } : it
        );
        return { ...d, items: sortByTime(updatedItems) };
      })
    );
  }

  function addNewItem(dayId, item) {
    setDays((prevDays) =>
      prevDays.map((d) => {
        if (d.id !== dayId) return d;
        return { ...d, items: sortByTime([...d.items, item]) };
      })
    );
  }

  function removeItem(dayId, itemId) {
    const nextDays = days.map((d) =>
      d.id === dayId
        ? { ...d, items: d.items.filter((it) => it.id !== itemId) }
        : d
    );
    setDays(nextDays);
    saveNow(tripName, nextDays, expenses, notes, todos, coverImage);
  }

  function closeModal(createdItemId) {
    let nextDays = days;
    setDays((prev) => {
      nextDays = prev.map((d) => {
        if (!modal || d.id !== modal.dayId) return d;
        let items = d.items;
        if (createdItemId) {
          items = items.filter((it) => {
            if (it.id !== createdItemId) return true;
            return (
              (it.title || "").trim() ||
              (it.place || "").trim() ||
              (it.origin || "").trim() ||
              (it.destination || "").trim()
            );
          });
        }
        return { ...d, items: sortByTime(items) };
      });
      return nextDays;
    });
    setModal(null);
    saveNow(tripName, nextDays, expenses, notes, todos, coverImage);
  }

  function saveExpense(expense) {
    let nextExpenses = [];
    setExpenses((prev) => {
      const exists = prev.some((e) => e.id === expense.id);
      nextExpenses = exists
        ? prev.map((e) => (e.id === expense.id ? expense : e))
        : [...prev, expense];
      return nextExpenses;
    });
    setExpenseModal(null);
    saveNow(tripName, days, nextExpenses, notes, todos, coverImage);
  }

  function removeExpense(id) {
    const nextExpenses = expenses.filter((e) => e.id !== id);
    setExpenses(nextExpenses);
    saveNow(tripName, days, nextExpenses, notes, todos, coverImage);
  }

  const updateCoverImage = (url) => {
    setCoverImage(url);
    saveNow(tripName, days, expenses, notes, todos, url);
  };

  const totalExpense = expenses.reduce(
    (sum, e) => sum + (parseFloat(e.amount) || 0),
    0
  );
  const expenseByCategory = expenses.reduce((acc, e) => {
    const cat = e.category || "other";
    acc[cat] = (acc[cat] || 0) + (parseFloat(e.amount) || 0);
    return acc;
  }, {});

  return (
    <div
      style={{
        fontFamily: "'Noto Sans TC', 'Helvetica Neue', sans-serif",
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

        /* 上方選單欄版面 Layout */
        .app-container { display: flex; flex-direction: column; width: 100%; max-width: 1024px; margin: 0 auto; position: relative; }
        .top-nav { display: flex; gap: 8px; overflow-x: auto; padding: 12px 16px 8px; border-bottom: 1px solid #ECE4D2; background: #FAF6EF; }
        .main-content { flex: 1; min-width: 0; }

        /* 隱藏 CodeSandbox 右下角 Open Sandbox 水印浮標與選單 */
        #csb-devtools, 
        iframe[src*="codesandbox"],
        div[class*="csb-"], 
        div[id*="csb-"], 
        a[href*="codesandbox.io"],
        button[title*="Open Sandbox"],
        [class*="Navigation__container"],
        [class*="Watermark"] {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
          visibility: hidden !important;
        }
      `}</style>

      {/* Header */}
      <header
        style={{
          background: "#2F4538",
          color: "#F4EFE3",
          padding: "18px 20px 14px",
          position: "relative",
          overflow: "hidden",
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
                  saveNow(tripName, days, expenses, notes, todos, coverImage);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setEditingTripName(false);
                    saveNow(tripName, days, expenses, notes, todos, coverImage);
                  }
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
                  padding: "2px 0",
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
                title="點擊編輯名稱"
              >
                {tripName} ✎
              </h1>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="app-container">
        {/* Top Navigation Bar 頂部選單欄 */}
        <nav className="top-nav scrollbar-thin">
          <button
            onClick={() => setView("home")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 10,
              border: "none",
              background: view === "home" ? "#2F4538" : "#fff",
              color: view === "home" ? "#F4EFE3" : "#5C5745",
              fontWeight: 700,
              fontSize: 13.5,
              whiteSpace: "nowrap",
              transition: "all 0.15s",
              boxShadow:
                view === "home" ? "none" : "0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            <Home size={16} /> 首頁
          </button>

          <button
            onClick={() => setView("itinerary")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 10,
              border: "none",
              background: view === "itinerary" ? "#2F4538" : "#fff",
              color: view === "itinerary" ? "#F4EFE3" : "#5C5745",
              fontWeight: 700,
              fontSize: 13.5,
              whiteSpace: "nowrap",
              transition: "all 0.15s",
              boxShadow:
                view === "itinerary" ? "none" : "0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            <Calendar size={16} /> 行程
          </button>

          <button
            onClick={() => setView("checklist")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 10,
              border: "none",
              background: view === "checklist" ? "#2F4538" : "#fff",
              color: view === "checklist" ? "#F4EFE3" : "#5C5745",
              fontWeight: 700,
              fontSize: 13.5,
              whiteSpace: "nowrap",
              transition: "all 0.15s",
              boxShadow:
                view === "checklist" ? "none" : "0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            <CheckSquare size={16} /> 清單
          </button>

          <button
            onClick={() => setView("expenses")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 10,
              border: "none",
              background: view === "expenses" ? "#2F4538" : "#fff",
              color: view === "expenses" ? "#F4EFE3" : "#5C5745",
              fontWeight: 700,
              fontSize: 13.5,
              whiteSpace: "nowrap",
              transition: "all 0.15s",
              boxShadow:
                view === "expenses" ? "none" : "0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            <Wallet size={16} /> 記帳
          </button>

          <button
            onClick={() => setView("notebook")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 10,
              border: "none",
              background: view === "notebook" ? "#2F4538" : "#fff",
              color: view === "notebook" ? "#F4EFE3" : "#5C5745",
              fontWeight: 700,
              fontSize: 13.5,
              whiteSpace: "nowrap",
              transition: "all 0.15s",
              boxShadow:
                view === "notebook" ? "none" : "0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            <BookOpen size={16} /> 記事本
          </button>
        </nav>

        {/* Right Main Content */}
        <div className="main-content">
          {view === "home" && (
            <HomeView
              tripName={tripName}
              days={days}
              coverImage={coverImage}
              onUpdateCoverImage={updateCoverImage}
              onNavigate={(v) => setView(v)}
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
                      transition: "all 0.15s",
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
                    flex: "0 0 auto",
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
                      justifyContent: "space-between",
                      margin: "4px 2px 16px",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
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
                    {days.length > 1 && (
                      <button
                        onClick={() => removeDay(currentDay.id)}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "#B08A6F",
                          fontSize: 12.5,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Trash2 size={14} /> 刪除這天
                      </button>
                    )}
                  </div>

                  {currentDay.items.length === 0 && (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "48px 20px",
                        color: "#A69C82",
                      }}
                    >
                      <MapPin
                        size={28}
                        style={{ opacity: 0.4, marginBottom: 10 }}
                      />
                      <div style={{ fontSize: 14 }}>這天還是空白的一頁</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>
                        加入景點、住宿或美食,開始安排路線
                      </div>
                    </div>
                  )}

                  <div style={{ position: "relative" }}>
                    {currentDay.items.length > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          left: 21,
                          top: 22,
                          bottom: 22,
                          width: 2,
                          background:
                            "repeating-linear-gradient(to bottom, #D4A857 0, #D4A857 4px, transparent 4px, transparent 9px)",
                        }}
                      />
                    )}
                    {currentDay.items.map((item, idx) => {
                      const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.spot;
                      const IconCmp = cfg.icon;

                      const effectivePlace = (arr, i) => {
                        const it = arr[i];
                        if (!it) return null;
                        return it.type === "transport"
                          ? it.destination || it.origin
                          : it.place;
                      };
                      const prevPlace =
                        idx > 0
                          ? effectivePlace(currentDay.items, idx - 1)
                          : null;

                      return (
                        <div
                          key={item.id}
                          className="card-enter"
                          style={{
                            position: "relative",
                            paddingLeft: 52,
                            marginBottom: 14,
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              left: 8,
                              top: 6,
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              background: cfg.bg,
                              border: `2px solid ${cfg.color}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              zIndex: 1,
                            }}
                          >
                            <IconCmp size={13} color={cfg.color} />
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
                              boxShadow: "0 1px 2px rgba(43,40,34,0.04)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                gap: 8,
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    marginBottom: 3,
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
                                        color: "#8A8168",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 3,
                                      }}
                                    >
                                      <Clock size={12} /> {item.time}
                                      {item.type === "transport" &&
                                      item.arriveTime
                                        ? ` → ${item.arriveTime}`
                                        : ""}
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
                                      lineHeight: 1.5,
                                    }}
                                  >
                                    {item.note}
                                  </div>
                                )}

                                {item.type === "shopping" &&
                                  item.stops &&
                                  item.stops.length > 0 && (
                                    <div
                                      style={{
                                        marginTop: 8,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 5,
                                      }}
                                    >
                                      {item.stops.map((s) => (
                                        <a
                                          key={s.id}
                                          href={mapsUrl(s.place)}
                                          target="_blank"
                                          rel="noreferrer"
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            textDecoration: "none",
                                            background: "#F1E7F5",
                                            borderRadius: 7,
                                            padding: "6px 10px",
                                            fontSize: 12.5,
                                          }}
                                        >
                                          <span
                                            style={{
                                              color: "#5C5745",
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            {s.place || "（未命名地點）"}
                                          </span>
                                          {s.closeTime && (
                                            <span
                                              style={{
                                                color: "#8A8168",
                                                fontWeight: 600,
                                                flexShrink: 0,
                                                marginLeft: 8,
                                              }}
                                            >
                                              {s.closeTime} 關門
                                            </span>
                                          )}
                                        </a>
                                      ))}
                                    </div>
                                  )}
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 6,
                                  flexShrink: 0,
                                }}
                              >
                                <button
                                  onClick={() =>
                                    setModal({ dayId: currentDay.id, item })
                                  }
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
                                  onClick={() =>
                                    removeItem(currentDay.id, item.id)
                                  }
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
                                        flex: "1 1 140px",
                                        minWidth: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        textDecoration: "none",
                                        background: "#FAF6EF",
                                        border: "1px dashed #D9CFBB",
                                        borderRadius: 8,
                                        padding: "7px 10px",
                                        boxSizing: "border-box",
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize: 12.5,
                                          color: "#5C5745",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 4,
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        <MapPin size={13} color="#3D6E8C" />{" "}
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
                                        flex: "1 1 140px",
                                        minWidth: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        textDecoration: "none",
                                        background: "#FAF6EF",
                                        border: "1px dashed #D9CFBB",
                                        borderRadius: 8,
                                        padding: "7px 10px",
                                        boxSizing: "border-box",
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize: 12.5,
                                          color: "#5C5745",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 4,
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        <MapPin size={13} color="#C1633D" />{" "}
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
                                      display: "flex",
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
                                    <Navigation size={14} color="#1B382B" />{" "}
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
                                  style={{
                                    fontSize: 12.5,
                                    color: "#5C5745",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  <MapPin size={13} color="#8A8168" />{" "}
                                  {item.place}
                                </span>
                                <span
                                  style={{
                                    fontSize: 11.5,
                                    color: "#2F4538",
                                    fontWeight: 600,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3,
                                    flexShrink: 0,
                                    marginLeft: 8,
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
                </>
              )}
            </main>
          )}

          {view === "expenses" && (
            <ExpensesView
              expenses={expenses}
              days={days}
              totalExpense={totalExpense}
              expenseByCategory={expenseByCategory}
              onAdd={() => setExpenseModal({})}
              onEdit={(expense) => setExpenseModal({ expense })}
              onDelete={removeExpense}
            />
          )}

          {view === "notebook" && (
            <NotebookView
              notes={notes}
              onChangeNote={setNotes}
              onSaveNow={() =>
                saveNow(tripName, days, expenses, notes, todos, coverImage)
              }
            />
          )}

          {view === "checklist" && (
            <ChecklistView
              todos={todos}
              setTodos={setTodos}
              onSaveNow={(updatedTodos) =>
                saveNow(
                  tripName,
                  days,
                  expenses,
                  notes,
                  updatedTodos !== undefined ? updatedTodos : todos,
                  coverImage
                )
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
          onClose={closeModal}
          onCreate={(item) => addNewItem(modal.dayId, item)}
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
          onSave={saveExpense}
        />
      )}
    </div>
  );
}
