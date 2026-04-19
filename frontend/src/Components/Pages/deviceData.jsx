import { useState, useEffect } from "react";
import PayloadSimulator from "../temporaryPages/PayloadSimulator";
import ViewDeviceData   from "./viewDeviceData";
import api              from "../../services/api";

const ROWS_PER_PAGE = 10;

// ── Accent palette ────────────────────────────────────────────────────────────
const ACCENTS = [
  { hex: "#3b82f6", ring: "hover:border-blue-300",    bg: "bg-blue-50",    border: "border-blue-100",    text: "text-blue-500"    },
  { hex: "#10b981", ring: "hover:border-emerald-300", bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-500" },
  { hex: "#8b5cf6", ring: "hover:border-violet-300",  bg: "bg-violet-50",  border: "border-violet-100",  text: "text-violet-500"  },
  { hex: "#f59e0b", ring: "hover:border-amber-300",   bg: "bg-amber-50",   border: "border-amber-100",   text: "text-amber-500"   },
  { hex: "#ef4444", ring: "hover:border-rose-300",    bg: "bg-rose-50",    border: "border-rose-100",    text: "text-rose-500"    },
];

// ── KPI config — solid dark cards matching manageDevices ─────────────────────
const kpiConfig = [
  {
    label: "Total Packets",
    key:   "total",
    bg:    "bg-slate-800",
    accent:"text-cyan-400",
    icon:  "M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4",
  },
  {
    label: "Total Devices",
    key:   "devices",
    bg:    "bg-blue-700",
    accent:"text-blue-200",
    icon:  "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18",
  },
  {
    label: "Received Today",
    key:   "today",
    bg:    "bg-violet-700",
    accent:"text-violet-200",
    icon:  "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  {
    label: "Latest Transmission",
    key:   "latest",
    bg:    "bg-emerald-700",
    accent:"text-emerald-200",
    icon:  "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    small: true,
  },
];

// ── SVG device illustration ───────────────────────────────────────────────────
function DeviceIllustration({ accent = "#3b82f6", size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      <rect x="14" y="22" width="68" height="52" rx="6" fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="1.8"/>
      <line x1="48" y1="10" x2="48" y2="22" stroke={accent} strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="48" cy="8" r="3.5" fill={accent} fillOpacity="0.65"/>
      <rect x="34" y="34" width="28" height="20" rx="3" fill={accent} fillOpacity="0.28" stroke={accent} strokeWidth="1.3"/>
      {[32, 40, 48, 56, 64].map(y => (
        <g key={y}>
          <line x1="14" y1={y} x2="8"  y2={y} stroke={accent} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="82" y1={y} x2="88" y2={y} stroke={accent} strokeWidth="1.5" strokeLinecap="round"/>
        </g>
      ))}
      <circle cx="70" cy="62" r="3" fill={accent} fillOpacity="0.85"/>
      <circle cx="76" cy="62" r="3" fill="#22c55e" fillOpacity="0.85"/>
    </svg>
  );
}

// ── Device card ───────────────────────────────────────────────────────────────
function DeviceCard({ device, accentIndex, onClick }) {
  const accent = ACCENTS[accentIndex % ACCENTS.length];
  return (
    <button onClick={onClick}
      className={`group w-full text-left bg-white shadow-sm rounded-xl border border-slate-200 ${accent.ring}
        hover:shadow-md transition-all duration-150 flex items-center gap-3 px-3 py-2.5`}>
      <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center bg-blue-50 border border-blue-200">
        <DeviceIllustration accent={accent.hex} size={28}/>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-slate-800 truncate leading-tight">{device.name}</p>
        <p className="font-mono text-[10px] text-slate-400 truncate mt-0.5">{device.deviceId}</p>
      </div>
      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
        className={`w-4 h-4 shrink-0 ${accent.text} opacity-0 group-hover:opacity-100 transition-opacity`}>
        <path d="M9 5l7 7-7 7"/>
      </svg>
    </button>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onPrev, onNext, onPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-xs text-slate-400">Page {page} of {totalPages}</p>
      <div className="flex items-center gap-1">
        <button onClick={onPrev} disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition">
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3.5 h-3.5"><path d="M15 19l-7-7 7-7"/></svg>
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
          <button key={p} onClick={() => onPage(p)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-medium transition ${
              p === page ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600"
            }`}>{p}</button>
        ))}
        <button onClick={onNext} disabled={page === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition">
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3.5 h-3.5"><path d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  );
}

// ── Payload cell ──────────────────────────────────────────────────────────────
function PayloadCell({ row }) {
  const decoded = row.decodedData;
  if (!decoded) return <span className="font-mono text-[12px] text-slate-400">{row.rawPayload || "—"}</span>;
  let data = decoded;
  if (typeof decoded === "string") { try { data = JSON.parse(decoded); } catch { data = null; } }
  if (!data) return <span className="font-mono text-[12px] text-slate-400">{row.rawPayload || "—"}</span>;
  const fields = [
    { key:"temperature",  label:"Temp",  unit:"°C",  color:"text-rose-500",    bg:"bg-rose-50"    },
    { key:"humidity",     label:"Hum",   unit:"%",   color:"text-sky-500",     bg:"bg-sky-50"     },
    { key:"soilMoisture", label:"Soil",  unit:"%",   color:"text-emerald-600", bg:"bg-emerald-50" },
    { key:"rainfall",     label:"Rain",  unit:"mm",  color:"text-indigo-500",  bg:"bg-indigo-50"  },
  ].filter(f => data[f.key] != null);
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {fields.map(f => (
        <span key={f.key} className={`text-[11px] font-semibold font-mono ${f.color} ${f.bg} px-1.5 py-0.5 rounded`}>
          {f.label}: {data[f.key]}{f.unit}
        </span>
      ))}
      {fields.length === 0 && <span className="font-mono text-[12px] text-slate-400">{row.rawPayload || "—"}</span>}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DeviceData() {
  const [devices,        setDevices]        = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [allData,        setAllData]        = useState([]);
  const [loadingData,    setLoadingData]    = useState(true);
  const [dataError,      setDataError]      = useState("");
  const [deviceFilter,   setDeviceFilter]   = useState("all");
  const [dropdownOpen,   setDropdownOpen]   = useState(false);
  const [search,         setSearch]         = useState("");
  const [page,           setPage]           = useState(1);
  const [showAllDevices, setShowAllDevices] = useState(false);
  const [activeDevice,   setActiveDevice]   = useState(null);

  useEffect(() => {
    api.get("/devices")
      .then(({ data }) => setDevices(data.devices || []))
      .catch(() => setDevices([]))
      .finally(() => setLoadingDevices(false));
  }, []);

  const fetchAllData = async () => {
    setLoadingData(true);
    setDataError("");
    try {
      const { data } = await api.get("/devices/data/all");
      setAllData(data.readings || []);
    } catch (err) {
      setDataError(err.response?.data?.message || "Failed to load sensor data");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => { fetchAllData(); }, []);

  const deviceOptions = [
    { value: "all", label: "All Devices" },
    ...devices.map(d => ({ value: d.deviceId, label: d.name })),
  ];
  const selectedLabel = deviceOptions.find(o => o.value === deviceFilter)?.label || "All Devices";

  const handleDeviceFilter = (val) => { setDeviceFilter(val); setDropdownOpen(false); setPage(1); };
  const handleSearch       = (e)   => { setSearch(e.target.value); setPage(1); };

  const filtered = allData.filter(row => {
    const matchDevice = deviceFilter === "all" || row.deviceId === deviceFilter;
    const q = search.toLowerCase();
    return matchDevice && (
      (row.device    || "").toLowerCase().includes(q) ||
      (row.deviceId  || "").toLowerCase().includes(q) ||
      (row.timestamp || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const today      = new Date().toLocaleDateString("en-US", { month:"2-digit", day:"2-digit", year:"2-digit" });
  const todayCount = allData.filter(r => (r.timestamp || "").startsWith(today)).length;
  const latestTs   = allData.length ? allData[0].timestamp : "—";

  // Connected devices — signed only, limit to 2 rows unless expanded
  const signedDevices  = devices.filter(d => d.certStatus === "signed");
  const CARDS_PER_ROW  = 5;
  const INITIAL_ROWS   = 2;
  const visibleDevices = showAllDevices
    ? signedDevices
    : signedDevices.slice(0, CARDS_PER_ROW * INITIAL_ROWS);

  const kpiValues = {
    total:   allData.length,
    devices: devices.length,
    today:   todayCount,
    latest:  latestTs,
  };

  return (
    <div className="flex flex-col gap-6">

      {/* ── KPI Cards — solid dark matching manageDevices ──────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpiConfig.map(k => (
          <div key={k.label}
            className={`${k.bg} rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-sm hover:brightness-110 transition-all duration-200`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-white/60 font-semibold">{k.label}</span>
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"
                  className={`w-4 h-4 ${k.accent}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={k.icon}/>
                </svg>
              </div>
            </div>
            <span className={`font-bold font-mono text-white leading-none tracking-tight ${k.small ? "text-sm mt-1" : "text-2xl sm:text-3xl"}`}>
              {(loadingDevices && k.key === "devices")
                ? <span className="inline-block w-8 h-7 bg-white/20 rounded-md animate-pulse"/>
                : kpiValues[k.key]
              }
            </span>
          </div>
        ))}
      </div>

      {/* Device detail inline */}
      {activeDevice && (
        <ViewDeviceData
          device={activeDevice.profile}
          accentIndex={activeDevice.accentIndex}
          onBack={() => setActiveDevice(null)}
        />
      )}

      {!activeDevice && (<>

      {/* ── Connected Devices ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-medium text-slate-800">Connected Devices</h2>
            <p className="text-sm text-slate-400 mt-0.5">Click a device to view its details and sensor readings</p>
          </div>
          {/* Show All / Collapse toggle — only when there are more than 2 rows */}
          {signedDevices.length > CARDS_PER_ROW * INITIAL_ROWS && (
            <button
              onClick={() => setShowAllDevices(v => !v)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 transition">
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                className={`w-3.5 h-3.5 transition-transform ${showAllDevices ? "rotate-180" : ""}`}>
                <path d="M19 9l-7 7-7-7"/>
              </svg>
              {showAllDevices ? "Collapse" : `Show All (${signedDevices.length})`}
            </button>
          )}
        </div>

        {loadingDevices ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {[...Array(10)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse"/>)}
          </div>
        ) : signedDevices.length === 0 ? (
          <p className="text-sm text-slate-300 text-center py-4">No signed devices found</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {visibleDevices.map((device, i) => (
              <DeviceCard key={device.id} device={device} accentIndex={i}
                onClick={() => setActiveDevice({ profile: device, accentIndex: i })}/>
            ))}
          </div>
        )}

        {/* Inline show/collapse at the bottom when many devices */}
        {!loadingDevices && signedDevices.length > CARDS_PER_ROW * INITIAL_ROWS && (
          <button
            onClick={() => setShowAllDevices(v => !v)}
            className="self-center flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-600 transition mt-1">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
              className={`w-3.5 h-3.5 transition-transform ${showAllDevices ? "rotate-180" : ""}`}>
              <path d="M19 9l-7 7-7-7"/>
            </svg>
            {showAllDevices ? "Show less" : `${signedDevices.length - CARDS_PER_ROW * INITIAL_ROWS} more devices…`}
          </button>
        )}
      </div>

      {/* Payload Simulator */}
      <PayloadSimulator onSaved={fetchAllData}/>

      {/* ── All Received Data ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-8 flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-[15px] font-medium text-slate-800">All Received Data</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {filtered.length} record{filtered.length !== 1 ? "s" : ""}
              {filtered.length > ROWS_PER_PAGE &&
                ` — showing ${(page-1)*ROWS_PER_PAGE+1}–${Math.min(page*ROWS_PER_PAGE, filtered.length)}`}
            </p>
          </div>
          {/* Device filter dropdown */}
          <div className="relative">
            <button onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-600 transition min-w-[160px] justify-between">
              <span>{selectedLabel}</span>
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}>
                <path d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 min-w-[200px] py-1">
                {deviceOptions.map(opt => (
                  <button key={opt.value} onClick={() => handleDeviceFilter(opt.value)}
                    className={`w-full text-left px-4 py-2 text-xs transition ${
                      deviceFilter === opt.value ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-600 hover:bg-slate-50"
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Search by device or timestamp…"
            value={search} onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-200 text-slate-800 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
          />
        </div>

        {dataError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs px-4 py-2.5 rounded-xl flex items-center justify-between">
            {dataError}
            <button onClick={fetchAllData} className="underline ml-2 shrink-0">Retry</button>
          </div>
        )}

        {/* ── Table matching manageDevices style ── */}
        <div className="rounded-xl border border-slate-200 overflow-x-auto">
          {/* Header */}
          <div className="grid bg-slate-700 px-5 py-2.5 text-[11px] uppercase tracking-wider text-slate-200 font-medium border-b border-slate-200 min-w-[700px]"
            style={{ gridTemplateColumns:"1.5fr 1fr 1fr 2fr" }}>
            <span>Device</span>
            <span>Device ID</span>
            <span>Timestamp</span>
            <span>Payload Data</span>
          </div>

          {loadingData ? (
            <div className="flex items-center justify-center py-12 text-slate-400 text-sm gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Loading data…
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-300 gap-2">
              <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="w-10 h-10">
                <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
              </svg>
              <span className="text-sm">No data found</span>
            </div>
          ) : (
            paginated.map((row, i) => (
              <div key={row.id ?? i}
                className="grid items-start px-5 py-3.5 border-t border-slate-100 text-sm text-slate-700 hover:bg-blue-50/40 transition min-w-[640px]"
                style={{ gridTemplateColumns:"1.5fr 1fr 1fr 2fr" }}>

                {/* Device name */}
                <div className="flex items-start gap-2 min-w-0 pr-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                    <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4">
                      <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
                    </svg>
                  </div>
                  <p className="font-medium text-slate-800 text-[13px] break-words whitespace-normal leading-snug">
                    {row.device}
                  </p>
                </div>

                {/* Device ID */}
                <span className="font-mono text-[12px] text-slate-500 break-all whitespace-normal pr-2">
                  {row.deviceId}
                </span>

                {/* Timestamp */}
                <span className="text-[12px] text-slate-500 tabular-nums font-medium pr-2">
                  {row.timestamp}
                </span>

                {/* Payload */}
                <PayloadCell row={row}/>
              </div>
            ))
          )}
        </div>

        <Pagination
          page={page} totalPages={totalPages}
          onPrev={() => setPage(p => Math.max(1, p-1))}
          onNext={() => setPage(p => Math.min(totalPages, p+1))}
          onPage={p => setPage(p)}
        />

        {!loadingData && filtered.length > ROWS_PER_PAGE && (
          <p className="text-xs text-slate-400 text-right">
            Showing {(page-1)*ROWS_PER_PAGE+1}–{Math.min(page*ROWS_PER_PAGE, filtered.length)} of {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
      </>)}
    </div>
  );
}