import React, { useState } from 'react';
import { MapPin, Clock, Bed, UtensilsCrossed, Plus, X, ExternalLink, Calendar, Trash2, Navigation, Car, ShoppingBag, Wallet } from 'lucide-react';

const TYPE_CONFIG = {
  spot: { label: '景點', icon: MapPin, color: '#2F4538', bg: '#EAF0EA' },
  stay: { label: '住宿', icon: Bed, color: '#C1633D', bg: '#FBEAE1' },
  food: { label: '飲食', icon: UtensilsCrossed, color: '#B8862F', bg: '#FBF0DC' },
  transport: { label: '交通', icon: Car, color: '#3D6E8C', bg: '#E4EEF4' },
  shopping: { label: '購物', icon: ShoppingBag, color: '#8A4F9E', bg: '#F1E7F5' },
};

const EXPENSE_CATEGORIES = {
  food: { label: '飲食', color: '#B8862F', bg: '#FBF0DC' },
  transport: { label: '交通', color: '#3D6E8C', bg: '#E4EEF4' },
  stay: { label: '住宿', color: '#C1633D', bg: '#FBEAE1' },
  shopping: { label: '購物', color: '#8A4F9E', bg: '#F1E7F5' },
  ticket: { label: '門票', color: '#2F4538', bg: '#EAF0EA' },
  other: { label: '其他', color: '#7A7360', bg: '#EFEAE0' },
};

const PAYMENT_METHODS = {
  card: { label: '刷卡' },
  cash: { label: '付現' },
  icoca: { label: 'ICOCA' },
  other: { label: '其他' },
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function mapsUrl(place) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;
}

function routeUrl(from, to) {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=transit`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function fmtDateLabel(iso) {
  const d = new Date(iso + 'T00:00:00');
  const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
  return `${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`;
}

const SAMPLE = {
  tripName: '京都三日散策',
  days: [
    {
      id: uid(),
      date: todayISO(),
      items: [
        { id: uid(), type: 'stay', time: '15:00', title: '嵐山悠然町家', place: '嵐山悠然町家 京都', note: '提前寄放行李,check-in 15:00' },
        { id: uid(), type: 'spot', time: '16:30', title: '竹林小徑', place: '嵐山竹林の道', note: '傍晚人少,適合拍照' },
        { id: uid(), type: 'food', time: '19:00', title: '嵐山鰻魚飯', place: '広川 嵐山', note: '需預約,現金優先' },
      ],
    },
  ],
};

const STORAGE_KEY = 'travel-planner-trip';

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 9,
  border: '1.5px solid #E4DCC8',
  background: '#fff',
  fontSize: 14,
  color: '#2B2822',
  outline: 'none',
};

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: '#8A8168', marginBottom: 5, fontWeight: 600 }}>{label}</div>
      {children}
    </div>
  );
}

function ItemModal({ dayId, initial, onClose, onCreate, onFieldChange }) {
  // liveItem is null until the item exists in shared state (i.e. as soon as
  // editing begins for a brand new item). Once it exists, every field edit
  // writes straight into the parent's `days` state, so it's part of autosave.
  const [liveItem, setLiveItem] = useState(initial || null);

  function ensureCreatedThenSet(field, value) {
    if (liveItem) {
      const updated = { ...liveItem, [field]: value };
      setLiveItem(updated);
      onFieldChange(liveItem.id, field, value);
    } else {
      const newItem = {
        id: uid(),
        type: 'spot',
        time: '',
        arriveTime: '',
        title: '',
        place: '',
        origin: '',
        destination: '',
        note: '',
        stops: [],
        [field]: value,
      };
      setLiveItem(newItem);
      onCreate(newItem);
    }
  }

  const type = liveItem?.type || 'spot';
  const time = liveItem?.time || '';
  const arriveTime = liveItem?.arriveTime || '';
  const title = liveItem?.title || '';
  const place = liveItem?.place || '';
  const origin = liveItem?.origin || '';
  const destination = liveItem?.destination || '';
  const note = liveItem?.note || '';
  const stops = liveItem?.stops || [];

  function addStop() {
    ensureCreatedThenSet('stops', [...stops, { id: uid(), place: '', closeTime: '' }]);
  }

  function updateStop(stopId, field, value) {
    ensureCreatedThenSet('stops', stops.map((s) => (s.id === stopId ? { ...s, [field]: value } : s)));
  }

  function removeStop(stopId) {
    ensureCreatedThenSet('stops', stops.filter((s) => s.id !== stopId));
  }

  function handleDone() {
    // Only pass an id back for cleanup-check if this was a brand new item
    // (not one that already existed before the modal opened).
    onClose(!initial && liveItem ? liveItem.id : null);
  }

  return (
    <div
      onClick={handleDone}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(43,40,34,0.45)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FAF6EF',
          width: '100%',
          maxWidth: 640,
          borderRadius: '18px 18px 0 0',
          padding: '20px 20px 26px',
          maxHeight: '88vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="serif" style={{ fontSize: 18, fontWeight: 700, color: '#2B2822' }}>
            {initial ? '編輯項目' : '新增行程項目'}
          </div>
          <button onClick={handleDone} style={{ border: 'none', background: 'transparent', color: '#8A8168' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon;
            const active = type === key;
            return (
              <button
                key={key}
                onClick={() => ensureCreatedThenSet('type', key)}
                style={{
                  flex: '1 1 18%',
                  minWidth: 60,
                  padding: '9px 4px',
                  borderRadius: 10,
                  border: active ? `1.5px solid ${cfg.color}` : '1.5px solid #E4DCC8',
                  background: active ? cfg.bg : '#fff',
                  color: active ? cfg.color : '#8A8168',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                <Icon size={15} />
                {cfg.label}
              </button>
            );
          })}
        </div>

        <Field label="時間">
          <input type="time" value={time} onChange={(e) => ensureCreatedThenSet('time', e.target.value)} style={inputStyle} />
        </Field>
        {type === 'transport' && (
          <Field label="預計抵達時間">
            <input type="time" value={arriveTime} onChange={(e) => ensureCreatedThenSet('arriveTime', e.target.value)} style={inputStyle} />
          </Field>
        )}
        <Field label="名稱">
          <input placeholder="例如：清水寺" value={title} onChange={(e) => ensureCreatedThenSet('title', e.target.value)} style={inputStyle} />
        </Field>
        {type === 'transport' ? (
          <>
            <Field label="起點">
              <input placeholder="例如：京都駅" value={origin} onChange={(e) => ensureCreatedThenSet('origin', e.target.value)} style={inputStyle} />
            </Field>
            <Field label="終點">
              <input placeholder="例如：嵐山駅" value={destination} onChange={(e) => ensureCreatedThenSet('destination', e.target.value)} style={inputStyle} />
            </Field>
          </>
        ) : (
          <Field label="地點（用於 Google Maps 搜尋）">
            <input placeholder="例如：清水寺 京都" value={place} onChange={(e) => ensureCreatedThenSet('place', e.target.value)} style={inputStyle} />
          </Field>
        )}
        {type === 'shopping' && (
          <Field label="購物地點清單">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stops.map((s, i) => (
                <div
                  key={s.id}
                  style={{
                    border: '1px solid #ECE4D2',
                    borderRadius: 9,
                    padding: 10,
                    background: '#fff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#8A4F9E' }}>地點 {i + 1}</span>
                    <button
                      onClick={() => removeStop(s.id)}
                      style={{ border: 'none', background: 'transparent', color: '#C1633D', fontSize: 11 }}
                    >
                      刪除
                    </button>
                  </div>
                  <input
                    placeholder="例如：新京極商店街"
                    value={s.place}
                    onChange={(e) => updateStop(s.id, 'place', e.target.value)}
                    style={{ ...inputStyle, marginBottom: 6 }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#8A8168', flexShrink: 0 }}>關門時間</span>
                    <input
                      type="time"
                      value={s.closeTime}
                      onChange={(e) => updateStop(s.id, 'closeTime', e.target.value)}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={addStop}
                style={{
                  padding: '9px',
                  borderRadius: 9,
                  border: '1.5px dashed #C9BFA8',
                  background: 'transparent',
                  color: '#5C5745',
                  fontSize: 12.5,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                }}
              >
                <Plus size={13} /> 新增購物地點
              </button>
            </div>
          </Field>
        )}
        <Field label="備註（選填）">
          <textarea placeholder="營業時間、預約資訊、注意事項…" value={note} onChange={(e) => ensureCreatedThenSet('note', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
        </Field>

        <div style={{ fontSize: 11.5, color: '#A69C82', marginBottom: 10, textAlign: 'center' }}>
          內容會自動儲存，關閉視窗即可
        </div>

        <button
          onClick={handleDone}
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: 10,
            border: 'none',
            background: '#2F4538',
            color: '#F4EFE3',
            fontWeight: 700,
            fontSize: 14.5,
          }}
        >
          完成
        </button>
      </div>
    </div>
  );
}

function ExpensesView({ expenses, days, totalExpense, expenseByCategory, onAdd, onEdit, onDelete }) {
  const dayLabel = (dayId) => {
    const idx = days.findIndex((d) => d.id === dayId);
    return idx >= 0 ? `Day ${idx + 1}` : '';
  };

  const sorted = [...expenses].sort((a, b) => {
    const da = days.findIndex((d) => d.id === a.dayId);
    const db = days.findIndex((d) => d.id === b.dayId);
    if (da !== db) return da - db;
    return (a.time || '').localeCompare(b.time || '');
  });

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '4px 16px 100px' }}>
      <div
        style={{
          background: '#2F4538',
          borderRadius: 14,
          padding: '18px 18px',
          marginBottom: 18,
          color: '#F4EFE3',
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 4 }}>總花費</div>
        <div className="serif" style={{ fontSize: 30, fontWeight: 700 }}>
          ${totalExpense.toLocaleString()}
        </div>
        {Object.keys(expenseByCategory).length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
            {Object.entries(expenseByCategory).map(([cat, amt]) => {
              const cfg = EXPENSE_CATEGORIES[cat] || EXPENSE_CATEGORIES.other;
              return (
                <div
                  key={cat}
                  style={{
                    fontSize: 11.5,
                    background: 'rgba(244,239,227,0.12)',
                    borderRadius: 7,
                    padding: '4px 9px',
                    display: 'flex',
                    gap: 5,
                  }}
                >
                  <span style={{ opacity: 0.85 }}>{cfg.label}</span>
                  <span style={{ fontWeight: 700 }}>${amt.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {sorted.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#A69C82' }}>
          <Wallet size={28} style={{ opacity: 0.4, marginBottom: 10 }} />
          <div style={{ fontSize: 14 }}>還沒有任何花費紀錄</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>記下每一筆花費,旅程結束後一目了然</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map((e) => {
          const cfg = EXPENSE_CATEGORIES[e.category] || EXPENSE_CATEGORIES.other;
          return (
            <div
              key={e.id}
              className="card-enter"
              style={{
                background: '#fff',
                border: '1px solid #ECE4D2',
                borderRadius: 12,
                padding: '12px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '2px 8px', borderRadius: 6 }}>
                    {cfg.label}
                  </span>
                  {e.dayId && (
                    <span style={{ fontSize: 11, color: '#A69C82' }}>{dayLabel(e.dayId)}</span>
                  )}
                  {e.paymentMethod && PAYMENT_METHODS[e.paymentMethod] && (
                    <span style={{ fontSize: 11, color: '#8A8168', background: '#EFEAE0', padding: '2px 7px', borderRadius: 6 }}>
                      {PAYMENT_METHODS[e.paymentMethod].label}
                    </span>
                  )}
                </div>
                <div className="serif" style={{ fontSize: 15, fontWeight: 700, color: '#2B2822' }}>
                  {e.title || '（未命名項目）'}
                </div>
                {e.note && <div style={{ fontSize: 12, color: '#7A7360', marginTop: 3 }}>{e.note}</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                <div className="serif" style={{ fontSize: 16, fontWeight: 700, color: '#2F4538' }}>
                  ${(parseFloat(e.amount) || 0).toLocaleString()}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => onEdit(e)}
                    style={{ border: '1px solid #E4DCC8', background: '#fff', color: '#5C5745', borderRadius: 7, padding: '4px 8px', fontSize: 11 }}
                  >
                    編輯
                  </button>
                  <button
                    onClick={() => onDelete(e.id)}
                    style={{ border: 'none', background: 'transparent', color: '#C1633D', fontSize: 11 }}
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
          width: '100%',
          padding: '13px',
          borderRadius: 12,
          border: '1.5px dashed #C9BFA8',
          background: 'transparent',
          color: '#5C5745',
          fontSize: 13.5,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <Plus size={15} /> 新增花費紀錄
      </button>
    </main>
  );
}

function ExpenseModal({ initial, days, onClose, onSave }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [amount, setAmount] = useState(initial?.amount != null ? String(initial.amount) : '');
  const [category, setCategory] = useState(initial?.category || 'food');
  const [paymentMethod, setPaymentMethod] = useState(initial?.paymentMethod || 'cash');
  const [dayId, setDayId] = useState(initial?.dayId || (days[0] ? days[0].id : ''));
  const [note, setNote] = useState(initial?.note || '');

  const canSave = title.trim() && amount !== '' && !isNaN(parseFloat(amount));

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
        position: 'fixed',
        inset: 0,
        background: 'rgba(43,40,34,0.45)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FAF6EF',
          width: '100%',
          maxWidth: 640,
          borderRadius: '18px 18px 0 0',
          padding: '20px 20px 26px',
          maxHeight: '88vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="serif" style={{ fontSize: 18, fontWeight: 700, color: '#2B2822' }}>
            {initial ? '編輯花費' : '新增花費紀錄'}
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: '#8A8168' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {Object.entries(EXPENSE_CATEGORIES).map(([key, cfg]) => {
            const active = category === key;
            return (
              <button
                key={key}
                onClick={() => setCategory(key)}
                style={{
                  flex: '1 1 27%',
                  minWidth: 70,
                  padding: '9px 6px',
                  borderRadius: 10,
                  border: active ? `1.5px solid ${cfg.color}` : '1.5px solid #E4DCC8',
                  background: active ? cfg.bg : '#fff',
                  color: active ? cfg.color : '#8A8168',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>

        <Field label="項目名稱">
          <input placeholder="例如：晚餐、電車票、伴手禮" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="金額">
          <input type="number" inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="付款方式">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.entries(PAYMENT_METHODS).map(([key, cfg]) => {
              const active = paymentMethod === key;
              return (
                <button
                  key={key}
                  onClick={() => setPaymentMethod(key)}
                  style={{
                    flex: '1 1 22%',
                    minWidth: 64,
                    padding: '9px 6px',
                    borderRadius: 10,
                    border: active ? '1.5px solid #2F4538' : '1.5px solid #E4DCC8',
                    background: active ? '#EAF0EA' : '#fff',
                    color: active ? '#2F4538' : '#8A8168',
                    fontSize: 12,
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
            <select value={dayId} onChange={(e) => setDayId(e.target.value)} style={inputStyle}>
              {days.map((d, i) => (
                <option key={d.id} value={d.id}>
                  Day {i + 1} — {fmtDateLabel(d.date)}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="備註（選填）">
          <textarea placeholder="分帳資訊、店名等…" value={note} onChange={(e) => setNote(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
        </Field>

        <button
          onClick={handleSave}
          disabled={!canSave}
          style={{
            width: '100%',
            marginTop: 8,
            padding: '13px',
            borderRadius: 10,
            border: 'none',
            background: canSave ? '#2F4538' : '#D9D2BF',
            color: '#F4EFE3',
            fontWeight: 700,
            fontSize: 14.5,
          }}
        >
          儲存
        </button>
      </div>
    </div>
  );
}

export default function TravelPlanner() {
  const [tripName, setTripName] = useState('');
  const [editingTripName, setEditingTripName] = useState(false);
  const [days, setDays] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [activeDay, setActiveDay] = useState(null);
  const [view, setView] = useState('itinerary'); // 'itinerary' | 'expenses'
  const [modal, setModal] = useState(null); // { dayId, item? }
  const [expenseModal, setExpenseModal] = useState(null); // { expense? } | null when closed, {} when new
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loadErrorDetail, setLoadErrorDetail] = useState('');
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | error
  const [saveError, setSaveError] = useState('');

  async function loadTrip() {
    setLoadError(false);
    setLoadErrorDetail('');
    let sharedErr = null;
    let legacyErr = null;
    // Try the shared (collaborative) space first.
    try {
      const result = await window.storage.get(STORAGE_KEY, true);
      const data = JSON.parse(result.value);
      setTripName(data.tripName || SAMPLE.tripName);
      const d = Array.isArray(data.days) && data.days.length > 0 ? data.days : SAMPLE.days;
      setDays(d);
      setExpenses(Array.isArray(data.expenses) ? data.expenses : []);
      setActiveDay(d[0].id);
      setLoaded(true);
      return;
    } catch (e) {
      sharedErr = e;
      // Nothing in shared space yet — fall through and check the old personal
      // space, since this trip may have been created before sharing was added.
    }
    try {
      const legacy = await window.storage.get(STORAGE_KEY, false);
      const data = JSON.parse(legacy.value);
      const migratedTripName = data.tripName || SAMPLE.tripName;
      const migratedDays = Array.isArray(data.days) && data.days.length > 0 ? data.days : SAMPLE.days;
      const migratedExpenses = Array.isArray(data.expenses) ? data.expenses : [];
      // Copy it into the shared space so collaborators can see it too.
      try {
        await window.storage.set(
          STORAGE_KEY,
          JSON.stringify({ tripName: migratedTripName, days: migratedDays, expenses: migratedExpenses }),
          true
        );
      } catch (migrateErr) {
        // If the copy fails, still show the person their data — autosave will retry the write.
      }
      setTripName(migratedTripName);
      setDays(migratedDays);
      setExpenses(migratedExpenses);
      setActiveDay(migratedDays[0].id);
      setLoaded(true);
      return;
    } catch (e) {
      legacyErr = e;
      // Neither shared nor legacy personal data exists — this really is a
      // brand new user, or there's a transient error. Let the person choose.
      const sharedMsg = sharedErr && sharedErr.message ? sharedErr.message : String(sharedErr);
      const legacyMsg = legacyErr && legacyErr.message ? legacyErr.message : String(legacyErr);
      setLoadErrorDetail(`共享空間: ${sharedMsg} ｜ 個人空間: ${legacyMsg}`);
      setLoadError(true);
    }
  }

  // Load saved trip on mount
  React.useEffect(() => {
    loadTrip();
  }, []);

  function startFresh() {
    setTripName(SAMPLE.tripName);
    setDays(SAMPLE.days);
    setExpenses([]);
    setActiveDay(SAMPLE.days[0].id);
    setLoadError(false);
    setLoaded(true);
  }

  // Autosave whenever trip data changes (only after initial load has completed)
  React.useEffect(() => {
    if (!loaded) return;
    if (!days || days.length === 0) return;
    const timeout = setTimeout(async () => {
      setSaveState('saving');
      const payload = JSON.stringify({ tripName, days, expenses });
      const trySave = async () => {
        const result = await window.storage.set(STORAGE_KEY, payload, true);
        return result;
      };
      try {
        let result = await trySave();
        if (!result) {
          await new Promise((r) => setTimeout(r, 800));
          result = await trySave();
        }
        if (result) {
          setSaveState('saved');
          setSaveError('');
        } else {
          setSaveState('error');
          setSaveError(`資料大小約 ${(payload.length / 1024).toFixed(0)} KB`);
        }
      } catch (e) {
        setSaveState('error');
        setSaveError(e && e.message ? e.message : '未知錯誤');
      }
    }, 600);
    return () => clearTimeout(timeout);
  }, [tripName, days, expenses, loaded]);

  if (loadError) {
    return (
      <div style={{ fontFamily: "'Noto Sans TC', sans-serif", background: '#FAF6EF', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 320 }}>
          <div style={{ fontSize: 15, color: '#2B2822', fontWeight: 700, marginBottom: 6 }}>無法讀取已儲存的行程</div>
          <div style={{ fontSize: 13, color: '#8A8168', marginBottom: 20, lineHeight: 1.6 }}>
            這可能是暫時性的連線問題。請先重試,避免直接開始新行程蓋掉你原本的資料。
          </div>
          {loadErrorDetail && (
            <div style={{ fontSize: 11, color: '#B08A6F', marginBottom: 16, lineHeight: 1.5, background: '#F1E7DD', borderRadius: 8, padding: '8px 10px', textAlign: 'left', wordBreak: 'break-word' }}>
              {loadErrorDetail}
            </div>
          )}
          <button
            onClick={loadTrip}
            style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: '#2F4538', color: '#F4EFE3', fontWeight: 700, fontSize: 14, marginBottom: 10 }}
          >
            重試讀取
          </button>
          <button
            onClick={startFresh}
            style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid #E4DCC8', background: 'transparent', color: '#B08A6F', fontSize: 12.5 }}
          >
            我是第一次使用,直接開始新行程
          </button>
        </div>
      </div>
    );
  }

  if (!loaded || !activeDay) {
    return (
      <div style={{ fontFamily: "'Noto Sans TC', sans-serif", background: '#FAF6EF', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A8168' }}>
        載入中…
      </div>
    );
  }

  const currentDay = days.find((d) => d.id === activeDay) || days[0];

  function addDay() {
    const last = days[days.length - 1];
    const base = last ? new Date(last.date + 'T00:00:00') : new Date();
    base.setDate(base.getDate() + 1);
    const newDay = { id: uid(), date: base.toISOString().slice(0, 10), items: [] };
    setDays([...days, newDay]);
    setActiveDay(newDay.id);
  }

  function removeDay(id) {
    if (days.length <= 1) return;
    const next = days.filter((d) => d.id !== id);
    setDays(next);
    if (activeDay === id) setActiveDay(next[0].id);
  }

  function updateDayDate(id, date) {
    setDays(days.map((d) => (d.id === id ? { ...d, date } : d)));
  }

  // Live-update a single field on an item as the user types, without closing the modal.
  function updateItemField(dayId, itemId, field, value) {
    setDays(
      days.map((d) => {
        if (d.id !== dayId) return d;
        return {
          ...d,
          items: d.items.map((it) => (it.id === itemId ? { ...it, [field]: value } : it)),
        };
      })
    );
  }

  function addNewItem(dayId, item) {
    setDays(
      days.map((d) => {
        if (d.id !== dayId) return d;
        const items = [...d.items, item];
        items.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
        return { ...d, items };
      })
    );
  }

  function removeItem(dayId, itemId) {
    setDays(
      days.map((d) => (d.id === dayId ? { ...d, items: d.items.filter((it) => it.id !== itemId) } : d))
    );
  }

  // If the user opens "new item", types nothing meaningful, and closes — remove the empty stub
  // so blank entries don't clutter the day.
  function closeModal(createdItemId) {
    if (createdItemId) {
      setDays((prev) =>
        prev.map((d) => {
          if (!modal || d.id !== modal.dayId) return d;
          return {
            ...d,
            items: d.items.filter((it) => {
              if (it.id !== createdItemId) return true;
              return (it.title || '').trim() || (it.place || '').trim();
            }),
          };
        })
      );
    }
    setModal(null);
  }

  function saveExpense(expense) {
    setExpenses((prev) => {
      const exists = prev.some((e) => e.id === expense.id);
      return exists ? prev.map((e) => (e.id === expense.id ? expense : e)) : [...prev, expense];
    });
    setExpenseModal(null);
  }

  function removeExpense(id) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  const totalExpense = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const expenseByCategory = expenses.reduce((acc, e) => {
    const cat = e.category || 'other';
    acc[cat] = (acc[cat] || 0) + (parseFloat(e.amount) || 0);
    return acc;
  }, {});

  return (
    <div style={{ fontFamily: "'Noto Sans TC', 'Helvetica Neue', sans-serif", background: '#FAF6EF', minHeight: '100vh', color: '#2B2822' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@600;700&family=Noto+Sans+TC:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .serif { font-family: 'Noto Serif TC', serif; }
        .scrollbar-thin::-webkit-scrollbar { height: 6px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #D9CFBB; border-radius: 4px; }
        button { cursor: pointer; font-family: inherit; }
        input, textarea { font-family: inherit; }
        .card-enter { animation: rise 0.25s ease both; }
        @keyframes rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Header */}
      <header style={{ background: '#2F4538', color: '#F4EFE3', padding: '28px 20px 22px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(212,168,87,0.12)' }} />
        <div style={{ position: 'absolute', right: 40, bottom: -50, width: 90, height: 90, borderRadius: '50%', background: 'rgba(193,99,61,0.15)' }} />
        <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ fontSize: 12, letterSpacing: 3, opacity: 0.7 }}>TRAVEL NOTES · 共編</div>
            <div style={{ fontSize: 11, opacity: 0.65, display: 'flex', alignItems: 'center', gap: 6 }}>
              {saveState === 'saving' && '儲存中…'}
              {saveState === 'saved' && '已儲存 ✓'}
              {saveState === 'error' && (
                <span title={saveError} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  儲存失敗{saveError ? `（${saveError}）` : ''}
                </span>
              )}
            </div>
          </div>
          {editingTripName ? (
            <input
              autoFocus
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              onBlur={() => setEditingTripName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setEditingTripName(false)}
              className="serif"
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: '2px solid rgba(244,239,227,0.5)',
                color: '#F4EFE3',
                fontSize: 26,
                fontWeight: 700,
                outline: 'none',
                width: '100%',
                padding: '2px 0',
              }}
            />
          ) : (
            <h1
              className="serif"
              onClick={() => setEditingTripName(true)}
              style={{ fontSize: 26, fontWeight: 700, margin: 0, cursor: 'text' }}
              title="點擊編輯行程名稱"
            >
              {tripName}
            </h1>
          )}
        </div>
      </header>

      {/* Day tabs + expense tab */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 0' }}>
        <div className="scrollbar-thin" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10 }}>
          {days.map((d, i) => (
            <button
              key={d.id}
              onClick={() => { setView('itinerary'); setActiveDay(d.id); }}
              style={{
                flex: '0 0 auto',
                padding: '10px 16px',
                borderRadius: 10,
                border: view === 'itinerary' && activeDay === d.id ? '1.5px solid #2F4538' : '1.5px solid #E4DCC8',
                background: view === 'itinerary' && activeDay === d.id ? '#2F4538' : '#fff',
                color: view === 'itinerary' && activeDay === d.id ? '#F4EFE3' : '#5C5745',
                fontSize: 13,
                fontWeight: 600,
                textAlign: 'left',
                minWidth: 92,
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 2 }}>Day {i + 1}</div>
              <div>{fmtDateLabel(d.date)}</div>
            </button>
          ))}
          <button
            onClick={addDay}
            style={{
              flex: '0 0 auto',
              width: 44,
              borderRadius: 10,
              border: '1.5px dashed #C9BFA8',
              background: 'transparent',
              color: '#8A8168',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="新增一天"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={() => setView('expenses')}
            style={{
              flex: '0 0 auto',
              padding: '10px 16px',
              borderRadius: 10,
              border: view === 'expenses' ? '1.5px solid #B8862F' : '1.5px solid #E4DCC8',
              background: view === 'expenses' ? '#B8862F' : '#fff',
              color: view === 'expenses' ? '#FBF0DC' : '#5C5745',
              fontSize: 13,
              fontWeight: 600,
              textAlign: 'left',
              minWidth: 92,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 2,
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: 11, opacity: 0.85, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Wallet size={11} /> 記帳
            </div>
            <div>${totalExpense.toLocaleString()}</div>
          </button>
        </div>
      </div>

      {view === 'itinerary' ? (
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '4px 16px 100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '8px 2px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={15} color="#8A8168" />
            <input
              type="date"
              value={currentDay.date}
              onChange={(e) => updateDayDate(currentDay.id, e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: 13, color: '#5C5745', fontWeight: 600 }}
            />
          </div>
          {days.length > 1 && (
            <button
              onClick={() => removeDay(currentDay.id)}
              style={{ border: 'none', background: 'transparent', color: '#B08A6F', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Trash2 size={13} /> 刪除這天
            </button>
          )}
        </div>

        {currentDay.items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#A69C82' }}>
            <MapPin size={28} style={{ opacity: 0.4, marginBottom: 10 }} />
            <div style={{ fontSize: 14 }}>這天還是空白的一頁</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>加入景點、住宿或美食,開始安排路線</div>
          </div>
        )}

        <div style={{ position: 'relative' }}>
          {currentDay.items.length > 0 && (
            <div style={{ position: 'absolute', left: 21, top: 22, bottom: 22, width: 2, background: 'repeating-linear-gradient(to bottom, #D4A857 0, #D4A857 4px, transparent 4px, transparent 9px)' }} />
          )}
          {currentDay.items.map((item, idx) => {
            const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.spot;
            const Icon = cfg.icon;
            // For transport items, the "effective place" for routing purposes is
            // the destination (where the traveller ends up), so the next stop's
            // route link starts from there rather than from the origin.
            const effectivePlace = (arr, i) => {
              const it = arr[i];
              if (!it) return null;
              return it.type === 'transport' ? (it.destination || it.origin) : it.place;
            };
            const prevPlace = idx > 0 ? effectivePlace(currentDay.items, idx - 1) : null;
            return (
              <div key={item.id} className="card-enter" style={{ position: 'relative', paddingLeft: 52, marginBottom: 14 }}>
                <div
                  style={{
                    position: 'absolute',
                    left: 8,
                    top: 6,
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: cfg.bg,
                    border: `2px solid ${cfg.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                  }}
                >
                  <Icon size={13} color={cfg.color} />
                </div>

                {prevPlace && (
                  <a
                    href={routeUrl(prevPlace, item.type === 'transport' ? (item.origin || item.destination) : item.place)}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#B8862F', marginBottom: 6, textDecoration: 'none' }}
                  >
                    <Navigation size={11} /> 從上一站前往這裡的路線
                  </a>
                )}

                <div
                  style={{
                    background: '#fff',
                    border: '1px solid #ECE4D2',
                    borderRadius: 12,
                    padding: '13px 14px',
                    boxShadow: '0 1px 2px rgba(43,40,34,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '2px 8px', borderRadius: 6 }}>
                          {cfg.label}
                        </span>
                        {item.time && (
                          <span style={{ fontSize: 12, color: '#8A8168', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Clock size={11} /> {item.time}
                            {item.type === 'transport' && item.arriveTime ? ` → ${item.arriveTime}` : ''}
                          </span>
                        )}
                      </div>
                      <div className="serif" style={{ fontSize: 16, fontWeight: 700, color: '#2B2822' }}>{item.title}</div>
                      {item.note && <div style={{ fontSize: 12.5, color: '#7A7360', marginTop: 4, lineHeight: 1.5 }}>{item.note}</div>}
                      {item.type === 'shopping' && item.stops && item.stops.length > 0 && (
                        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {item.stops.map((s) => (
                            <a
                              key={s.id}
                              href={mapsUrl(s.place)}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                textDecoration: 'none',
                                background: '#F1E7F5',
                                borderRadius: 7,
                                padding: '5px 9px',
                                fontSize: 12,
                              }}
                            >
                              <span style={{ color: '#5C5745', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {s.place || '（未命名地點）'}
                              </span>
                              {s.closeTime && (
                                <span style={{ color: '#8A4F9E', fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>
                                  {s.closeTime} 關門
                                </span>
                              )}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => setModal({ dayId: currentDay.id, item })}
                        style={{ border: '1px solid #E4DCC8', background: '#fff', color: '#5C5745', borderRadius: 7, padding: '5px 8px', fontSize: 11 }}
                      >
                        編輯
                      </button>
                      <button
                        onClick={() => removeItem(currentDay.id, item.id)}
                        style={{ border: 'none', background: 'transparent', color: '#C1633D', fontSize: 11 }}
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                  {item.type === 'transport' ? (
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {item.origin && (
                        <a
                          href={mapsUrl(item.origin)}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            textDecoration: 'none',
                            background: '#FAF6EF',
                            border: '1px dashed #D9CFBB',
                            borderRadius: 8,
                            padding: '7px 10px',
                          }}
                        >
                          <span style={{ fontSize: 12, color: '#5C5745', display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <MapPin size={12} color="#3D6E8C" /> 起點：{item.origin}
                          </span>
                          <ExternalLink size={11} color="#2F4538" style={{ flexShrink: 0, marginLeft: 8 }} />
                        </a>
                      )}
                      {item.destination && (
                        <a
                          href={mapsUrl(item.destination)}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            textDecoration: 'none',
                            background: '#FAF6EF',
                            border: '1px dashed #D9CFBB',
                            borderRadius: 8,
                            padding: '7px 10px',
                          }}
                        >
                          <span style={{ fontSize: 12, color: '#5C5745', display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <MapPin size={12} color="#C1633D" /> 終點：{item.destination}
                          </span>
                          <ExternalLink size={11} color="#2F4538" style={{ flexShrink: 0, marginLeft: 8 }} />
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
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        textDecoration: 'none',
                        background: '#FAF6EF',
                        border: '1px dashed #D9CFBB',
                        borderRadius: 8,
                        padding: '7px 10px',
                      }}
                    >
                      <span style={{ fontSize: 12, color: '#5C5745', display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <MapPin size={12} color="#8A8168" /> {item.place}
                      </span>
                      <span style={{ fontSize: 11, color: '#2F4538', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, marginLeft: 8 }}>
                        開啟地圖 <ExternalLink size={11} />
                      </span>
                    </a>
                  )}                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setModal({ dayId: currentDay.id })}
          style={{
            marginTop: 6,
            width: '100%',
            padding: '13px',
            borderRadius: 12,
            border: '1.5px dashed #C9BFA8',
            background: 'transparent',
            color: '#5C5745',
            fontSize: 13.5,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Plus size={15} /> 新增行程項目
        </button>
      </main>
      ) : (
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

      {modal && (
        <ItemModal
          key={modal.item ? modal.item.id : 'new'}
          dayId={modal.dayId}
          initial={modal.item}
          onClose={closeModal}
          onCreate={(item) => addNewItem(modal.dayId, item)}
          onFieldChange={(itemId, field, value) => updateItemField(modal.dayId, itemId, field, value)}
        />
      )}
      {expenseModal && (
        <ExpenseModal
          key={expenseModal.expense ? expenseModal.expense.id : 'new-expense'}
          initial={expenseModal.expense}
          days={days}
          onClose={() => setExpenseModal(null)}
          onSave={saveExpense}
        />
      )}
    </div>
  );
}
