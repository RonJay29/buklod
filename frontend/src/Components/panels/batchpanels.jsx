import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";

const STATUS_CONFIG = {
  open:      { label:"Open",      dot:"bg-cyan-400",   pill:"bg-cyan-500/10 text-cyan-600 border border-cyan-500/20"      },
  sealed:    { label:"Sealed",    dot:"bg-amber-400",  pill:"bg-amber-500/10 text-amber-700 border border-amber-500/20"  },
  committed: { label:"Committed", dot:"bg-green-500",  pill:"bg-green-500/10 text-green-700 border border-green-500/20"  },
  failed:    { label:"Failed",    dot:"bg-red-500",    pill:"bg-red-500/10 text-red-600 border border-red-500/20"        },
};

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${cfg.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── Readings drawer ────────────────────────────────────────────────────────────
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
    <div className="mt-3 rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {readings.length} Reading{readings.length !== 1 ? "s" : ""} in this batch
        </p>
        <button onClick={onClose} className="text-[10px] text-slate-400 hover:text-slate-700 transition">
          Hide ↑
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6 gap-2 text-slate-400 text-xs">
          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          Loading readings…
        </div>
      ) : readings.length === 0 ? (
        <p className="text-center py-6 text-slate-300 text-xs">No readings yet</p>
      ) : (
        readings.map((r, i) => {
          const data = parseDecoded(r.decodedData);
          return (
            <div key={r.id ?? i}
              className="flex items-center gap-4 px-4 py-2.5 border-t border-slate-100 hover:bg-blue-50/30 transition">
              <span className="text-[11px] font-mono text-slate-400 shrink-0 tabular-nums w-32">{r.timestamp}</span>
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

// ── Single batch row ───────────────────────────────────────────────────────────
function BatchRow({ batch, onSeal, onInvoke, sealing, invoking }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Main row */}
      <div className="flex items-center gap-4 px-5 py-4 bg-white hover:bg-slate-50/60 transition">

        {/* Device info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[13px] font-semibold text-slate-800 truncate">{batch.deviceName}</p>
            <span className="font-mono text-[10px] text-slate-400">{batch.devEUI}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
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
          {batch.txId && (
            <p className="font-mono text-[10px] text-violet-500 mt-1 truncate">TX: {batch.txId}</p>
          )}
        </div>

        {/* Record count */}
        <div className="text-center shrink-0">
          <p className="text-[18px] font-bold font-mono text-slate-700">{batch.recordCount}</p>
          <p className="text-[9px] uppercase tracking-wider text-slate-400">readings</p>
        </div>

        {/* Status */}
        <div className="shrink-0">
          <StatusPill status={batch.status} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* View readings toggle */}
          <button onClick={() => setExpanded(v => !v)}
            className="text-[11px] px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 transition">
            {expanded ? "Hide" : "View"}
          </button>

          {/* Seal */}
          {batch.status === "open" && (
            <button
              onClick={() => onSeal(batch.id)}
              disabled={sealing === batch.id || batch.recordCount === 0}
              title={batch.recordCount === 0 ? "Add readings before sealing" : "Seal this batch"}
              className="text-[11px] px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium">
              {sealing === batch.id ? "Sealing…" : "Seal"}
            </button>
          )}

          {/* Invoke */}
          {batch.status === "sealed" && (
            <button
              onClick={() => onInvoke(batch.id)}
              disabled={invoking === batch.id}
              className="text-[11px] px-3 py-1.5 rounded-lg border border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium flex items-center gap-1.5">
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
                  Invoke to Fabric
                </>
              )}
            </button>
          )}

          {/* Committed — show tx chip */}
          {batch.status === "committed" && (
            <span className="text-[10px] font-semibold text-green-600 flex items-center gap-1">
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Committed
            </span>
          )}
        </div>
      </div>

      {/* Expandable readings */}
      {expanded && (
        <ReadingsDrawer batchId={batch.id} onClose={() => setExpanded(false)} />
      )}
    </div>
  );
}

// ── Main Batches Panel ─────────────────────────────────────────────────────────
export default function BatchesPanel() {
  const [batches,  setBatches]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [sealing,  setSealing]  = useState(null);   // batch id being sealed
  const [invoking, setInvoking] = useState(null);   // batch id being invoked
  const [filter,   setFilter]   = useState("all");  // all | open | sealed | committed | failed

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/batches");
      setBatches(data.batches || []);
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
      alert(err.response?.data?.message || "Failed to seal batch");
    } finally {
      setSealing(null);
    }
  };

  const handleInvoke = async (id) => {
    setInvoking(id);
    try {
      const { data } = await api.post(`/batches/${id}/invoke`);
      setBatches(prev => prev.map(b => b.id === id ? data.batch : b));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to invoke batch");
    } finally {
      setInvoking(null);
    }
  };

  const counts = {
    all:       batches.length,
    open:      batches.filter(b => b.status === "open").length,
    sealed:    batches.filter(b => b.status === "sealed").length,
    committed: batches.filter(b => b.status === "committed").length,
    failed:    batches.filter(b => b.status === "failed").length,
  };

  const filtered = filter === "all" ? batches : batches.filter(b => b.status === filter);

  const FILTERS = [
    { key:"all",       label:"All",       count: counts.all,       pill:"bg-slate-200 text-slate-600"        },
    { key:"open",      label:"Open",      count: counts.open,      pill:"bg-cyan-100 text-cyan-700"          },
    { key:"sealed",    label:"Sealed",    count: counts.sealed,    pill:"bg-amber-100 text-amber-700"        },
    { key:"committed", label:"Committed", count: counts.committed, pill:"bg-green-100 text-green-700"        },
    { key:"failed",    label:"Failed",    count: counts.failed,    pill:"bg-red-100 text-red-600"            },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[15px] font-medium text-slate-800">Datasets</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Seal a device's dataset then invoke it to Hyperledger Fabric
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
      <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl flex-wrap">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === f.key
                ? "bg-white text-slate-800 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-700"
            }`}>
            {f.label}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${f.pill}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs px-4 py-2.5 rounded-xl flex items-center justify-between">
          {error}
          <button onClick={fetchBatches} className="underline ml-2">Retry</button>
        </div>
      )}

      {/* Batch list */}
      {loading ? (
        <div className="flex items-center justify-center py-10 text-slate-400 text-sm gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          Loading datasets…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-300 gap-2">
          <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="w-8 h-8">
            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          </svg>
          <p className="text-sm">No datasets found</p>
          <p className="text-xs text-slate-400">Save data from the Payload Simulator to create a dataset</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(batch => (
            <BatchRow
              key={batch.id}
              batch={batch}
              onSeal={handleSeal}
              onInvoke={handleInvoke}
              sealing={sealing}
              invoking={invoking}
            />
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 pt-1 flex-wrap border-t border-slate-100">
        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Status:</p>
        {[
          { dot:"bg-cyan-400",   label:"Open — accepting readings"        },
          { dot:"bg-amber-400",  label:"Sealed — ready to invoke"         },
          { dot:"bg-green-500",  label:"Committed — on Fabric ledger"     },
          { dot:"bg-red-500",    label:"Failed — invocation error"        },
        ].map(({ dot, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}