import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";

const ROWS_PER_PAGE = 10;

const STATUS_CONFIG = {
  open:      { label:"Open",      dot:"bg-cyan-400",   pill:"bg-cyan-500/10 text-cyan-600 border border-cyan-500/20"    },
  sealed:    { label:"Sealed",    dot:"bg-amber-400",  pill:"bg-amber-500/10 text-amber-700 border border-amber-500/20" },
  committed: { label:"Committed", dot:"bg-green-500",  pill:"bg-green-500/10 text-green-700 border border-green-500/20" },
  failed:    { label:"Failed",    dot:"bg-red-500",    pill:"bg-red-500/10 text-red-600 border border-red-500/20"       },
};

// ── KPI config — solid dark, matching manageDevices ───────────────────────────
const kpiConfig = [
  {
    label: "Total Datasets",
    key:   "all",
    bg:    "bg-slate-800",
    accent:"text-cyan-400",
    icon:  "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  },
  {
    label: "Open",
    key:   "open",
    bg:    "bg-blue-700",
    accent:"text-blue-200",
    icon:  "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4",
  },
  {
    label: "Sealed",
    key:   "sealed",
    bg:    "bg-amber-700",
    accent:"text-amber-200",
    icon:  "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  },
  {
    label: "Committed",
    key:   "committed",
    bg:    "bg-emerald-700",
    accent:"text-emerald-200",
    icon:  "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
];

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${cfg.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function ReadingsDrawer({ batchId, onClose }) {
  const [readings, setReadings] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get(`/batches/${batchId}/readings`)
      .then(({ data }) => setReadings(data.readings || []))
      .catch(() => setReadings([]))
      .finally(() => setLoading(false));
  }, [batchId]);

  const parseDecoded = (raw) => {
    if (!raw) return null;
    try { return typeof raw === "string" ? JSON.parse(raw) : raw; } catch { return null; }
  };

  const fields = [
    { key:"temperature",  label:"Temp",  unit:"°C",  color:"text-red-500"     },
    { key:"humidity",     label:"Hum",   unit:"%",   color:"text-sky-500"     },
    { key:"soilMoisture", label:"Soil",  unit:"%",   color:"text-emerald-600" },
    { key:"rainfall",     label:"Rain",  unit:"mm",  color:"text-indigo-500"  },
  ];

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {readings.length} Reading{readings.length !== 1 ? "s" : ""} in this dataset
        </p>
        <button onClick={onClose} className="text-[10px] text-slate-400 hover:text-slate-700 transition">Hide ↑</button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-6 gap-2 text-slate-400 text-xs">
          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          Loading…
        </div>
      ) : readings.length === 0 ? (
        <p className="text-center py-6 text-slate-300 text-xs">No readings in this dataset</p>
      ) : (
        readings.map((r, i) => {
          const data = parseDecoded(r.decodedData);
          return (
            <div key={r.id ?? i}
              className="flex flex-wrap items-center gap-3 px-4 py-2.5 border-t border-slate-100 hover:bg-blue-50/30 transition">
              <span className="text-[11px] font-mono text-slate-400 tabular-nums shrink-0">{r.timestamp}</span>
              <div className="flex items-center gap-3 flex-wrap">
                {data
                  ? fields.filter(f => data[f.key] != null).map(f => (
                      <span key={f.key} className={`text-[11px] font-mono font-semibold ${f.color}`}>
                        {f.label}: {data[f.key]}{f.unit}
                      </span>
                    ))
                  : <span className="font-mono text-[11px] text-slate-400">{r.rawPayload || "—"}</span>
                }
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function DatasetRow({ batch, onSeal, onInvoke, sealing, invoking }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex flex-wrap items-start sm:items-center gap-3 px-4 sm:px-5 py-4 bg-white hover:bg-slate-50/40 transition">

        {/* Device info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[13px] font-semibold text-slate-800">{batch.deviceName}</p>
            <span className="font-mono text-[10px] text-slate-400">{batch.devEUI}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <span className="text-[11px] text-slate-400">
              Created: <span className="text-slate-600 font-medium">{batch.createdAt}</span>
            </span>
            {batch.sealedAt && (
              <span className="text-[11px] text-slate-400">
                Sealed: <span className="text-slate-600 font-medium">{batch.sealedAt}</span>
              </span>
            )}
            {batch.committedAt && (
              <span className="text-[11px] text-slate-400">
                Committed: <span className="text-green-600 font-medium">{batch.committedAt}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-[10px] text-slate-400 font-medium">
              Batch <span className="font-mono text-slate-600">#{batch.id}</span>
            </span>
            {batch.txId && (
              <span className="font-mono text-[10px] text-violet-500 truncate">
                TX: {batch.txId}
              </span>
            )}
          </div>
        </div>

        {/* Record count */}
        <div className="text-center shrink-0">
          <p className="text-[20px] font-bold font-mono text-slate-700 leading-none">{batch.recordCount}</p>
          <p className="text-[9px] uppercase tracking-wider text-slate-400 mt-0.5">readings</p>
        </div>

        {/* Status */}
        <div className="shrink-0">
          <StatusPill status={batch.status} />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
          <button onClick={() => setExpanded(v => !v)}
            className="text-[11px] px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 transition">
            {expanded ? "Hide" : "View"}
          </button>

          {batch.status === "open" && (
            <button onClick={() => onSeal(batch.id)}
              disabled={sealing === batch.id || batch.recordCount === 0}
              title={batch.recordCount === 0 ? "Add readings before sealing" : "Seal this dataset"}
              className="text-[11px] px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium">
              {sealing === batch.id ? "Sealing…" : "Seal Dataset"}
            </button>
          )}

          {batch.status === "sealed" && (
            <button onClick={() => onInvoke(batch.id)}
              disabled={invoking === batch.id}
              className="text-[11px] px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium flex items-center gap-1.5">
              {invoking === batch.id ? (
                <>
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Invoking…
                </>
              ) : (
                <>
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                  Invoke
                </>
              )}
            </button>
          )}

          {batch.status === "failed" && (
            <span className="text-[10px] font-semibold text-red-500 flex items-center gap-1">
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
              Failed
            </span>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 sm:px-5 pb-4 bg-white border-t border-slate-100">
          <ReadingsDrawer batchId={batch.id} onClose={() => setExpanded(false)} />
        </div>
      )}
    </div>
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function InvokedDatasets() {
  const [batches,  setBatches]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [sealing,  setSealing]  = useState(null);
  const [invoking, setInvoking] = useState(null);
  const [filter,   setFilter]   = useState("all");
  const [page,     setPage]     = useState(1);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/batches");
      // Sort newest first by createdAt
      const sorted = (data.batches || []).sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setBatches(sorted);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load datasets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  const handleSeal = async (id) => {
    setSealing(id);
    try {
      const { data } = await api.post(`/batches/${id}/seal`);
      setBatches(prev => prev.map(b => b.id === id ? data.batch : b));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to seal dataset");
    } finally { setSealing(null); }
  };

  const handleInvoke = async (id) => {
    setInvoking(id);
    try {
      const { data } = await api.post(`/batches/${id}/invoke`);
      setBatches(prev => prev.map(b => b.id === id ? data.batch : b));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to invoke dataset");
    } finally { setInvoking(null); }
  };

  const counts = {
    all:       batches.length,
    open:      batches.filter(b => b.status === "open").length,
    sealed:    batches.filter(b => b.status === "sealed").length,
    committed: batches.filter(b => b.status === "committed").length,
    failed:    batches.filter(b => b.status === "failed").length,
  };

  const FILTERS = [
    { key:"all",       label:"All",       count: counts.all,       pill:"bg-slate-200 text-slate-600"   },
    { key:"open",      label:"Open",      count: counts.open,      pill:"bg-cyan-100 text-cyan-700"     },
    { key:"sealed",    label:"Sealed",    count: counts.sealed,    pill:"bg-amber-100 text-amber-700"   },
    { key:"committed", label:"Committed", count: counts.committed, pill:"bg-green-100 text-green-700"   },
    { key:"failed",    label:"Failed",    count: counts.failed,    pill:"bg-red-100 text-red-600"       },
  ];

  const filtered   = filter === "all" ? batches : batches.filter(b => b.status === filter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const handleFilterChange = (key) => { setFilter(key); setPage(1); };

  return (
    <div className="flex flex-col gap-5">

      {/* ── KPI Cards — solid dark, matching manageDevices ─────────────── */}
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
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white leading-none tracking-tight">
              {counts[k.key]}
            </span>
          </div>
        ))}
      </div>

      {/* ── Datasets panel ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 flex flex-col gap-4">

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-medium text-slate-800">Device Datasets</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Seal a dataset then invoke it as a single Fabric transaction
              {filtered.length > ROWS_PER_PAGE && ` — showing ${(page-1)*ROWS_PER_PAGE+1}–${Math.min(page*ROWS_PER_PAGE, filtered.length)} of ${filtered.length}`}
            </p>
          </div>
          <button onClick={fetchBatches} disabled={loading}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 transition">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3.5 h-3.5">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl w-max min-w-full sm:w-auto sm:min-w-0">
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => handleFilterChange(f.key)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                  filter === f.key ? "bg-slate-700 text-slate-200 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"
                }`}>
                {f.label}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600`}>{f.count}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs px-4 py-2.5 rounded-xl flex items-center justify-between">
            {error}
            <button onClick={fetchBatches} className="underline ml-2">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400 text-sm gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Loading datasets…
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-300 gap-2">
            <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="w-10 h-10">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
            <p className="text-sm">No datasets found</p>
            <p className="text-xs text-slate-400 text-center">Use the Payload Simulator to generate readings first.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {paginated.map(batch => (
              <DatasetRow key={batch.id} batch={batch}
                onSeal={handleSeal} onInvoke={handleInvoke}
                sealing={sealing} invoking={invoking} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <Pagination
            page={page} totalPages={totalPages}
            onPrev={() => setPage(p => Math.max(1, p-1))}
            onNext={() => setPage(p => Math.min(totalPages, p+1))}
            onPage={p => setPage(p)}
          />
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Status:</p>
          {[
            { dot:"bg-cyan-400",  label:"Open"      },
            { dot:"bg-amber-400", label:"Sealed"     },
            { dot:"bg-green-500", label:"Committed"  },
            { dot:"bg-red-500",   label:"Failed"     },
          ].map(({ dot, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}