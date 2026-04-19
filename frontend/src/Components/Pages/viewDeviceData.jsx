import { useState, useEffect } from "react";
import api from "../../services/api";

// ── Solid dark accent configs matching manageDevices/deviceData KPI style ─────
const ACCENTS = [
  { hex: "#3b82f6", bg: "bg-blue-700",    border: "border-blue-800"   },
  { hex: "#10b981", bg: "bg-emerald-700", border: "border-emerald-800" },
  { hex: "#8b5cf6", bg: "bg-violet-700",  border: "border-violet-800"  },
  { hex: "#f59e0b", bg: "bg-amber-700",   border: "border-amber-800"   },
  { hex: "#ef4444", bg: "bg-rose-700",    border: "border-rose-800"    },
];

function DeviceIllustration({ accent = "#3b82f6", size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      <rect x="14" y="22" width="68" height="52" rx="6" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1.8"/>
      <line x1="48" y1="10" x2="48" y2="22" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="48" cy="8" r="3.5" fill="white" fillOpacity="0.7"/>
      <rect x="34" y="34" width="28" height="20" rx="3" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1.3"/>
      {[32, 40, 48, 56, 64].map(y => (
        <g key={y}>
          <line x1="14" y1={y} x2="8"  y2={y} stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="82" y1={y} x2="88" y2={y} stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        </g>
      ))}
      <circle cx="70" cy="62" r="3" fill="white" fillOpacity="0.8"/>
      <circle cx="76" cy="62" r="3" fill="#22c55e" fillOpacity="0.9"/>
    </svg>
  );
}

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

// ── Main exported component ───────────────────────────────────────────────────
export default function ViewDeviceData({ device, accentIndex = 0, onBack }) {
  const accent    = ACCENTS[accentIndex % ACCENTS.length];
  const status    = device?.certStatus ?? "unsigned";
  const isSigned  = status === "signed";
  const isRevoked = status === "revoked";

  const [readings,  setReadings]  = useState([]);
  const [loadingR,  setLoadingR]  = useState(true);
  const [errorR,    setErrorR]    = useState("");
  const [dataPage,  setDataPage]  = useState(1);
  const DATA_PER_PAGE = 10;

  useEffect(() => {
    if (!device?.id) return;
    setLoadingR(true);
    api.get(`/devices/${device.id}/data`)
      .then(({ data }) => setReadings(data.readings || []))
      .catch(err => setErrorR(err.response?.data?.message || "Failed to load sensor data"))
      .finally(() => setLoadingR(false));
  }, [device?.id]);

  const totalDataPages    = Math.max(1, Math.ceil(readings.length / DATA_PER_PAGE));
  const paginatedReadings = readings.slice((dataPage - 1) * DATA_PER_PAGE, dataPage * DATA_PER_PAGE);

  const certBadge = {
    signed:   <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white/20 text-white"><span className="w-1.5 h-1.5 rounded-full bg-green-400"/> Signed</span>,
    unsigned: <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white/20 text-white/80"><span className="w-1.5 h-1.5 rounded-full bg-amber-300"/> Unsigned</span>,
    revoked:  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white/20 text-white/80"><span className="w-1.5 h-1.5 rounded-full bg-rose-300"/> Revoked</span>,
  };

  if (!device) return null;

  return (
    <div className="flex flex-col gap-5">

      {/* Back + breadcrumb */}
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-xl border border-slate-200 hover:border-blue-200 transition">
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Go Back
        </button>
        <div className="flex items-center gap-2 text-[12px] text-slate-400">
          <span>Device's Data</span>
          <span>›</span>
          <span className="text-slate-700 font-medium">{device.name}</span>
        </div>
      </div>

      {/* ── Device hero card — solid dark background ── */}
      <div className={`bg-slate-800 border-slate-900 rounded-2xl overflow-hidden shadow-sm`}>
        <div className="px-6 sm:px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">

          {/* Device icon */}
          <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            <DeviceIllustration accent={accent.hex} size={44}/>
          </div>

          {/* Device info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white leading-tight break-words">{device.name}</h2>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {certBadge[status]}
              <span className="font-mono text-[11px] text-white/50">{device.deviceId}</span>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-white/10">
          {[
            { label:"Location",   value: device.location          },
            { label:"Date Added", value: device.dateAdded         },
            { label:"Signed On",  value: device.certifiedDate || "—" },
            { label:"Revoked On", value: device.revokedDate    || "—" },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5 px-5 sm:px-6 py-4 border-r border-white/10 last:border-r-0">
              <span className="text-[9px] uppercase tracking-widest text-white/50 font-semibold">{label}</span>
              <span className="text-[13px] font-semibold text-white">{value || "—"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Certificate card ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"
            className={`w-5 h-5 ${isSigned ? "text-blue-500" : isRevoked ? "text-rose-400" : "text-slate-400"}`}>
            <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
          </svg>
          <h3 className="text-[14px] font-medium text-slate-800">Digital Certificate</h3>
          <span className={`ml-auto text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
            isSigned  ? "bg-blue-100 text-blue-700"  :
            isRevoked ? "bg-rose-100 text-rose-600"  :
                        "bg-slate-100 text-slate-500"
          }`}>
            {isSigned ? "Active" : isRevoked ? "Revoked" : "Not Issued"}
          </span>
        </div>

        {isSigned && (
          <div className="bg-blue-50/50 border border-blue-200 rounded-xl px-4 py-3">
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-1.5">Certificate Serial</p>
            <p className="font-mono text-[12px] text-slate-800 break-all leading-relaxed">{device.certificate}</p>
          </div>
        )}
        {isRevoked && (
          <div className="bg-rose-50/50 border border-rose-200 rounded-xl px-4 py-3 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 uppercase tracking-wider text-[10px] font-medium">Signed on</span>
              <span className="font-medium text-slate-700">{device.certifiedDate || "—"}</span>
            </div>
            <div className="h-px bg-rose-100"/>
            <div className="flex items-center justify-between text-xs">
              <span className="text-rose-400 uppercase tracking-wider text-[10px] font-medium">Revoked on</span>
              <span className="font-medium text-rose-600">{device.revokedDate || "—"}</span>
            </div>
          </div>
        )}
        {status === "unsigned" && (
          <p className="text-sm text-slate-400">No digital certificate has been issued for this device yet.</p>
        )}
      </div>

      {/* ── Sensor readings table — 10 rows ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4">
        <div>
          <h3 className="text-[15px] font-medium text-slate-800">Sensor Readings</h3>
          <p className="text-sm text-slate-400 mt-0.5">
            {readings.length} record{readings.length !== 1 ? "s" : ""} for this device
            {readings.length > DATA_PER_PAGE &&
              ` — showing ${(dataPage-1)*DATA_PER_PAGE+1}–${Math.min(dataPage*DATA_PER_PAGE, readings.length)}`}
          </p>
        </div>

        {errorR && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs px-4 py-2.5 rounded-xl">{errorR}</div>
        )}

        <div className="rounded-xl border border-slate-200 overflow-x-auto">
          <div className="grid bg-slate-700 px-5 py-2.5 text-[11px] uppercase tracking-wider text-slate-200 font-medium border-b border-slate-200 min-w-[400px]"
            style={{ gridTemplateColumns:"1fr 2fr" }}>
            <span>Timestamp</span>
            <span>Payload Data</span>
          </div>

          {loadingR ? (
            <div className="flex items-center justify-center py-10 text-slate-400 text-sm gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Loading readings…
            </div>
          ) : paginatedReadings.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-slate-300 text-sm">No readings yet</div>
          ) : (
            paginatedReadings.map((row, i) => (
              <div key={row.id ?? i}
                className="grid items-start px-5 py-3.5 border-t border-slate-100 hover:bg-blue-50/40 transition min-w-[400px]"
                style={{ gridTemplateColumns:"1fr 2fr" }}>
                <span className="text-[12px] text-slate-500 font-medium tabular-nums pt-0.5">{row.timestamp}</span>
                <PayloadCell row={row}/>
              </div>
            ))
          )}
        </div>

        <Pagination
          page={dataPage} totalPages={totalDataPages}
          onPrev={() => setDataPage(p => Math.max(1, p-1))}
          onNext={() => setDataPage(p => Math.min(totalDataPages, p+1))}
          onPage={p => setDataPage(p)}
        />
      </div>
    </div>
  );
}