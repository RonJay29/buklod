import { useState, useEffect } from "react";
import ViewDataModal   from "../modal/viewData";
import DeviceDataModal from "../modal/deviceDataModal";
import api             from "../../services/api";

const ROWS_PER_PAGE = 10;

const ACCENTS = [
  { hex: "#3b82f6", ring: "hover:border-blue-300",    bg: "bg-blue-50",    border: "border-blue-100",    text: "text-blue-500"    },
  { hex: "#10b981", ring: "hover:border-emerald-300", bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-500" },
  { hex: "#8b5cf6", ring: "hover:border-violet-300",  bg: "bg-violet-50",  border: "border-violet-100",  text: "text-violet-500"  },
  { hex: "#f59e0b", ring: "hover:border-amber-300",   bg: "bg-amber-50",   border: "border-amber-100",   text: "text-amber-500"   },
  { hex: "#ef4444", ring: "hover:border-rose-300",    bg: "bg-rose-50",    border: "border-rose-100",    text: "text-rose-500"    },
];

// ── Small SVG device illustration ─────────────────────────────────────────
function DeviceIllustration({ accent = "#3b82f6", size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="22" width="68" height="52" rx="6" fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="1.8" />
      <line x1="48" y1="10" x2="48" y2="22" stroke={accent} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="48" cy="8" r="3.5" fill={accent} fillOpacity="0.65" />
      <rect x="34" y="34" width="28" height="20" rx="3" fill={accent} fillOpacity="0.28" stroke={accent} strokeWidth="1.3" />
      <line x1="42" y1="34" x2="42" y2="54" stroke={accent} strokeWidth="0.7" strokeOpacity="0.5" />
      <line x1="50" y1="34" x2="50" y2="54" stroke={accent} strokeWidth="0.7" strokeOpacity="0.5" />
      <line x1="34" y1="42" x2="62" y2="42" stroke={accent} strokeWidth="0.7" strokeOpacity="0.5" />
      {[32, 40, 48, 56, 64].map((y) => (
        <g key={y}>
          <line x1="14" y1={y} x2="8"  y2={y} stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="82" y1={y} x2="88" y2={y} stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
        </g>
      ))}
      <circle cx="70" cy="62" r="3" fill={accent} fillOpacity="0.85" />
      <circle cx="76" cy="62" r="3" fill="#22c55e" fillOpacity="0.85" />
      <rect x="38" y="72" width="20" height="6" rx="2" fill={accent} fillOpacity="0.32" stroke={accent} strokeWidth="1" />
    </svg>
  );
}

// ── Compact horizontal device card ────────────────────────────────────────
function DeviceCard({ device, accentIndex, onClick }) {
  const accent  = ACCENTS[accentIndex % ACCENTS.length];
  const status  = device.certStatus ?? "unsigned";
  const certMap = {
    signed:   { label: "Signed",   cls: "bg-blue-100 text-blue-700"   },
    unsigned: { label: "Unsigned", cls: "bg-amber-100 text-amber-700" },
    revoked:  { label: "Revoked",  cls: "bg-rose-100 text-rose-600"   },
  };
  const cert = certMap[status] || certMap.unsigned;

  return (
    <button
      onClick={onClick}
      className={`group w-full text-left bg-white rounded-xl border border-slate-200 ${accent.ring}
        hover:shadow-md hover:shadow-slate-100/80 transition-all duration-150
        flex items-center gap-3 px-3 py-2.5`}
    >
      {/* Mini illustration */}
      <div className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center ${accent.bg} border ${accent.border}`}>
        <DeviceIllustration accent={accent.hex} size={28} />
      </div>

      {/* Name + DevEUI */}
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-slate-800 truncate leading-tight">{device.name}</p>
        <p className="font-mono text-[10px] text-slate-400 truncate mt-0.5">{device.deviceId}</p>
      </div>
    </button>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onPrev, onNext, onPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-xs text-slate-400">Page {page} of {totalPages}</p>
      <div className="flex items-center gap-1">
        <button onClick={onPrev} disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition">
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3.5 h-3.5"><path d="M15 19l-7-7 7-7" /></svg>
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button key={p} onClick={() => onPage(p)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-medium transition ${
              p === page ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600"
            }`}>{p}</button>
        ))}
        <button onClick={onNext} disabled={page === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition">
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3.5 h-3.5"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
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
  const [viewData,       setViewData]       = useState(null);
  const [activeDevice,   setActiveDevice]   = useState(null);

  // Devices — source of truth for "Total Devices" KPI
  useEffect(() => {
    (async () => {
      setLoadingDevices(true);
      try {
        const { data } = await api.get("/devices");
        setDevices(data.devices || []);
      } catch {
        setDevices([]);
      } finally {
        setLoadingDevices(false);
      }
    })();
  }, []);

  // All sensor readings
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

  // Dropdown
  const deviceOptions = [
    { value: "all", label: "All Devices" },
    ...devices.map((d) => ({ value: d.deviceId, label: d.name })),
  ];
  const selectedLabel = deviceOptions.find((o) => o.value === deviceFilter)?.label || "All Devices";

  const handleDeviceFilter = (val) => { setDeviceFilter(val); setDropdownOpen(false); setPage(1); };
  const handleSearch       = (e)   => { setSearch(e.target.value); setPage(1); };

  const filtered = allData.filter((row) => {
    const matchDevice = deviceFilter === "all" || row.deviceId === deviceFilter;
    const q = search.toLowerCase();
    const matchSearch =
      (row.device    || "").toLowerCase().includes(q) ||
      (row.deviceId  || "").toLowerCase().includes(q) ||
      (row.timestamp || "").toLowerCase().includes(q);
    return matchDevice && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  // KPIs — "Total Devices" uses devices.length (not allData) so it's always correct
  const today      = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const todayCount = allData.filter((r) => (r.timestamp || "").startsWith(today)).length;
  const latestTs   = allData.length ? allData[0].timestamp : "—";

  const kpis = [
    { label: "Total Data Received", value: allData.length,  suffix: "records", color: "text-blue-600",    small: false },
    { label: "Total Devices",       value: devices.length,  suffix: "devices", color: "text-slate-800",   small: false },
    { label: "Received Today",      value: todayCount,       suffix: "records", color: "text-emerald-600", small: false },
    { label: "Latest Transmission", value: latestTs,         suffix: "",        color: "text-indigo-600",  small: true  },
  ];

  return (
    <>
      <div className="flex flex-col gap-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          {kpis.map((k) => (
            <div key={k.label}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-1 hover:shadow-md hover:shadow-blue-100 hover:border-blue-200 transition-all duration-200">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">{k.label}</span>
              <span className={`font-semibold font-mono tracking-tight ${k.color} ${k.small ? "text-base mt-1" : "text-2xl"}`}>
                {(loadingDevices && k.label === "Total Devices") ? (
                  <span className="inline-block w-8 h-7 bg-slate-100 rounded-md animate-pulse" />
                ) : k.value}
              </span>
              {k.suffix && <span className="text-[11px] text-slate-400">{k.suffix}</span>}
            </div>
          ))}
        </div>

        {/* Connected Devices — compact grid */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-3">
          <div>
            <h2 className="text-[15px] font-medium text-slate-800">Connected Devices</h2>
            <p className="text-sm text-slate-400 mt-0.5">Click a device to view its profile and sensor data</p>
          </div>

          {loadingDevices ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : devices.length === 0 ? (
            <p className="text-sm text-slate-300 text-center py-4">No devices found</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {devices.map((device, i) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  accentIndex={i}
                  onClick={() => setActiveDevice({ profile: device, accentIndex: i })}
                />
              ))}
            </div>
          )}
        </div>

        {/* All Received Data */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col gap-4">

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-[15px] font-medium text-slate-800">All Received Data</h2>
              <p className="text-sm text-slate-400 mt-0.5">
                {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                {filtered.length > ROWS_PER_PAGE &&
                  ` — showing ${(page - 1) * ROWS_PER_PAGE + 1}–${Math.min(page * ROWS_PER_PAGE, filtered.length)}`}
              </p>
            </div>

            {/* Device dropdown */}
            <div className="relative">
              <button onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-600 transition min-w-[160px] justify-between">
                <span>{selectedLabel}</span>
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}>
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 min-w-[200px] py-1">
                  {deviceOptions.map((opt) => (
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
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input type="text" placeholder="Search by device or timestamp…"
              value={search} onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            />
          </div>

          {/* Error */}
          {dataError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs px-4 py-2.5 rounded-xl flex items-center justify-between">
              {dataError}
              <button onClick={fetchAllData} className="underline ml-2 shrink-0">Retry</button>
            </div>
          )}

          {/* Table */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-4 bg-slate-50 px-5 py-2.5 text-[11px] uppercase tracking-wider text-slate-400 font-medium border-b border-slate-200">
              <span>Device</span>
              <span>Device ID</span>
              <span>Timestamp</span>
              <span className="text-right">Details</span>
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
              <div className="flex items-center justify-center py-12 text-slate-300 text-sm">No data found</div>
            ) : (
              paginated.map((row, i) => (
                <div key={row.id ?? i}
                  className="grid grid-cols-4 items-center px-5 py-3.5 border-t border-slate-100 text-sm text-slate-700 hover:bg-blue-50/40 transition">
                  <p className="font-medium text-slate-800 text-[13px] truncate">{row.device}</p>
                  <span className="font-mono text-xs text-slate-500">{row.deviceId}</span>
                  <span className="text-xs text-slate-500">{row.timestamp}</span>
                  <div className="flex justify-end">
                    <button onClick={() => setViewData(row)}
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-200 transition">
                      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-3.5 h-3.5">
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View All
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <Pagination
            page={page} totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            onPage={(p) => setPage(p)}
          />
        </div>
      </div>

      {activeDevice && (
        <DeviceDataModal
          device={activeDevice.profile}
          accentIndex={activeDevice.accentIndex}
          onClose={() => setActiveDevice(null)}
        />
      )}
      {viewData && <ViewDataModal data={viewData} onClose={() => setViewData(null)} />}
    </>
  );
}