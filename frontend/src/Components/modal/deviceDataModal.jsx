import { useState, useEffect, useRef } from "react";
import api from "../../services/api";

// ── SVG device illustration ────────────────────────────────────────────────
function DeviceIllustration({ accent = "#3b82f6", size = 68 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="22" width="68" height="52" rx="6" fill={accent} fillOpacity="0.10" stroke={accent} strokeWidth="1.5" />
      <line x1="48" y1="10" x2="48" y2="22" stroke={accent} strokeWidth="2" strokeLinecap="round" />
      <circle cx="48" cy="8" r="3" fill={accent} fillOpacity="0.6" />
      <rect x="34" y="34" width="28" height="20" rx="3" fill={accent} fillOpacity="0.25" stroke={accent} strokeWidth="1.2" />
      <line x1="42" y1="34" x2="42" y2="54" stroke={accent} strokeWidth="0.6" strokeOpacity="0.5" />
      <line x1="50" y1="34" x2="50" y2="54" stroke={accent} strokeWidth="0.6" strokeOpacity="0.5" />
      <line x1="34" y1="42" x2="62" y2="42" stroke={accent} strokeWidth="0.6" strokeOpacity="0.5" />
      <line x1="14" y1="32" x2="8"  y2="32" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="40" x2="8"  y2="40" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="48" x2="8"  y2="48" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="56" x2="8"  y2="56" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="64" x2="8"  y2="64" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="82" y1="32" x2="88" y2="32" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="82" y1="40" x2="88" y2="40" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="82" y1="48" x2="88" y2="48" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="82" y1="56" x2="88" y2="56" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="82" y1="64" x2="88" y2="64" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="70" cy="62" r="3" fill={accent} fillOpacity="0.8" />
      <circle cx="76" cy="62" r="3" fill="#22c55e" fillOpacity="0.8" />
      <rect x="38" y="72" width="20" height="6" rx="2" fill={accent} fillOpacity="0.3" stroke={accent} strokeWidth="1" />
    </svg>
  );
}

// ── Accent palette ─────────────────────────────────────────────────────────
const ACCENTS = [
  { hex: "#3b82f6", from: "from-blue-50",    to: "to-blue-100/50",    border: "border-blue-200"    },
  { hex: "#10b981", from: "from-emerald-50", to: "to-emerald-100/50", border: "border-emerald-200" },
  { hex: "#8b5cf6", from: "from-violet-50",  to: "to-violet-100/50",  border: "border-violet-200"  },
  { hex: "#f59e0b", from: "from-amber-50",   to: "to-amber-100/50",   border: "border-amber-200"   },
];

// ── Status badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    signed:   { pill: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",   dot: "bg-blue-500"  },
    unsigned: { pill: "bg-amber-100 text-amber-700 ring-1 ring-amber-200", dot: "bg-amber-400" },
    revoked:  { pill: "bg-rose-100 text-rose-600 ring-1 ring-rose-200",    dot: "bg-rose-400"  },
  };
  const s = map[status] || map.unsigned;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full ${s.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ── Small label+value block ────────────────────────────────────────────────
function InfoCell({ label, value, mono = false }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-400">{label}</span>
      <span className={`text-[12px] leading-snug text-slate-800 break-all ${mono ? "font-mono" : "font-medium"}`}>
        {value || <span className="text-slate-300 italic text-[11px]">—</span>}
      </span>
    </div>
  );
}

// ── Main modal ─────────────────────────────────────────────────────────────
export default function DeviceDataModal({ device, accentIndex = 0, onClose }) {
  const overlayRef              = useRef(null);
  const accent                  = ACCENTS[accentIndex % ACCENTS.length];
  const [readings,  setReadings]  = useState([]);
  const [loadingR,  setLoadingR]  = useState(true);
  const [errorR,    setErrorR]    = useState("");
  const [search,    setSearch]    = useState("");

  // Escape key close
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Fetch transmitted readings for this device
  useEffect(() => {
    if (!device?.id) return;
    (async () => {
      setLoadingR(true);
      setErrorR("");
      try {
        const { data } = await api.get(`/devices/${device.id}/data`);
        setReadings(data.readings || []);
      } catch (err) {
        setErrorR(err.response?.data?.message || "Failed to load sensor data");
      } finally {
        setLoadingR(false);
      }
    })();
  }, [device?.id]);

  if (!device) return null;

  const status    = device.certStatus ?? "unsigned";
  const isSigned  = status === "signed";
  const isRevoked = status === "revoked";

  const filteredReadings = readings.filter((r) => {
    const q = search.toLowerCase();
    return (
      (r.timestamp    || "").toLowerCase().includes(q) ||
      String(r.temperature  ?? "").includes(q)         ||
      String(r.humidity     ?? "").includes(q)         ||
      String(r.soilMoisture ?? "").includes(q)
    );
  });

  return (
    /* Backdrop — p-4 gives top+bottom margin on all screen sizes */
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-none p-4 md:p-6"
    >
      {/*
        Modal card:
        - max-w-4xl  → wide on desktop
        - w-full     → full-width on small screens
        - max-h-[calc(100vh-2rem)]  → always leaves gap top + bottom
        - flex flex-col + overflow-hidden → header/footer fixed, body scrolls
      */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl  shadow-slate-900/20 flex flex-col overflow-hidden max-h-[calc(100vh-2rem)]">

        {/* ══ HEADER ═══════════════════════════════════════════════════════ */}
        <div className={`flex-shrink-0 flex flex-col sm:flex-row bg-blue-100 border-b border-blue-300 `}>

          {/* Identity strip */}
          <div className="flex items-center gap-4 px-6 py-5 sm:w-64 sm:shrink-0 border-r border-blue-300  "
           >
            <div className={`w-[72px] h-[72px] rounded-2xl bg-white border border-gray-600 shadow-sm flex items-center justify-center shrink-0`}>
              <DeviceIllustration accent={accent.hex} size={58} />
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <p className="text-[14px] font-bold text-slate-800 leading-tight break-words">{device.name}</p>
              <p className="font-mono text-[10px] text-slate-500 truncate">{device.deviceId}</p>
              <StatusBadge status={status} />
            </div>
          </div>

          {/* Quick-stats grid — 2×2 on mobile, 4 cols on sm+ */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-blue-300">
  {[
    { label: "Date Added",  value: device.dateAdded    || "—" },
    { label: "Signed On",   value: isSigned || isRevoked ? (device.certifiedDate || "—") : "Not signed" },
    { label: "Revoked On",  value: isRevoked ? (device.revokedDate || "—") : "—" },
    { label: "HMAC Length", value: device.hmacLength ? `${device.hmacLength} B` : "—" },
  ].map((s) => (
    <div key={s.label} className="flex flex-col justify-center px-4 py-4 gap-0.5">
      <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-400">{s.label}</span>
      <span className="text-[13px] font-semibold text-slate-700">{s.value}</span>
    </div>
  ))}
</div>

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/80 hover:bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition shadow-sm"
          >
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ══ SCROLLABLE BODY ══════════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Certificate + Device Info side-by-side ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border-b border-slate-100">

            {/* Certificate panel */}
            <div className="px-6 py-5 flex flex-col gap-3 border-b sm:border-b-0 sm:border-r border-slate-100">
              <div className="flex items-center gap-2 mb-0.5">
                <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4 text-slate-400 shrink-0">
                  <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-500">Digital Certificate</span>
              </div>

              {isSigned && (
                <div className="rounded-xl bg-blue-50/60 border border-blue-200 p-3.5 flex flex-col gap-2.5">
                  <div className="bg-white border border-blue-100 rounded-lg px-3 py-2.5">
                    <p className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Certificate Serial</p>
                    <p className="font-mono text-[11px] text-slate-700 break-all leading-relaxed">{device.certificate}</p>
                  </div>
                  <p className="text-[11px] text-blue-600 flex items-center gap-1.5">
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Active — signed {device.certifiedDate}
                  </p>
                </div>
              )}

              {isRevoked && (
                <div className="rounded-xl bg-rose-50/50 border border-rose-200 p-3.5 flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-3 bg-white border border-rose-100 rounded-lg px-3 py-2.5">
                    <InfoCell label="Signed On"  value={device.certifiedDate} />
                    <InfoCell label="Revoked On" value={device.revokedDate} />
                  </div>
                  <p className="text-[11px] text-rose-500">Certificate permanently revoked.</p>
                </div>
              )}

              {status === "unsigned" && (
                <div className="rounded-xl bg-amber-50/50 border border-amber-200 p-3.5">
                  <p className="text-[12px] text-amber-700">No certificate has been issued for this device yet.</p>
                </div>
              )}
            </div>

            {/* Device meta panel */}
            <div className="px-6 py-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 mb-0.5">
                <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4 text-slate-400 shrink-0">
                  <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                </svg>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-500">Device Info</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <InfoCell label="DevEUI"   value={device.deviceId} mono />
                <InfoCell label="Location" value={device.location} />
              </div>
            </div>
          </div>

          {/* ── Transmitted Data Table ── */}
          <div className="px-6 py-5 flex flex-col gap-3">

            {/* Section header + search */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4 text-slate-400 shrink-0">
                  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-500">
                  Transmitted Data
                </span>
                {!loadingR && (
                  <span className="text-[10px] text-slate-400">
                    — {filteredReadings.length} record{filteredReadings.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <div className="relative">
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400">
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text" placeholder="Search readings…"
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition w-44"
                />
              </div>
            </div>

            {/* Responsive table wrapper */}
            <div className="rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["Timestamp", "Temp (°C)", "Humidity (%)", "Soil Moist. (%)", "Rainfall (mm)", "Certificate"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold text-left whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingR ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center">
                        <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                          </svg>
                          Loading sensor data…
                        </div>
                      </td>
                    </tr>
                  ) : errorR ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-rose-400 text-xs">{errorR}</td>
                    </tr>
                  ) : filteredReadings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-300 text-sm">No data found</td>
                    </tr>
                  ) : (
                    filteredReadings.map((row, i) => (
                      <tr key={row.id ?? i} className="border-t border-slate-100 hover:bg-blue-50/30 transition">
                        <td className="px-4 py-2.5 font-mono text-[12px] text-slate-600 whitespace-nowrap">{row.timestamp}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 font-mono text-[12px] font-semibold">
                            {row.temperature ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-sky-50 text-sky-600 font-mono text-[12px] font-semibold">
                            {row.humidity ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 font-mono text-[12px] font-semibold">
                            {row.soilMoisture ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 font-mono text-[12px] font-semibold">
                            {row.rainfall ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          {row.certificate ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                              <span className="w-1 h-1 rounded-full bg-blue-500" /> Signed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                              <span className="w-1 h-1 rounded-full bg-slate-300" /> None
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ══ FOOTER ═══════════════════════════════════════════════════════ */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-white hover:border-slate-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}