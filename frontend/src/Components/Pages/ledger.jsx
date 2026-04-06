import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import api from "../../services/api";

const AUTO_REFRESH_INTERVAL = 10; // seconds

// ── Pulse animation ───────────────────────────────────────────────────────────
const pulseStyle = `
@keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.4)}}
.pulse-dot{animation:pulse-dot 1.6s ease-in-out infinite}
`;

function shortHash(val) {
  if (!val) return "—";
  const s = String(val);
  return s.length <= 20 ? s : `${s.slice(0, 10)}…${s.slice(-8)}`;
}

function copyToClipboard(text) {
  navigator.clipboard?.writeText(text).catch(() => {});
}

// ── Live indicator ─────────────────────────────────────────────────────────────
function LiveBadge({ countdown }) {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="text-[11px] text-slate-500">
        Live · refreshes in <span className="font-semibold text-emerald-600 tabular-nums">{countdown}s</span>
      </span>
    </div>
  );
}

// ── Status pill ───────────────────────────────────────────────────────────────
function Pill({ children, tone = "slate" }) {
  const map = {
    slate:  "bg-slate-800/60 text-slate-400 border border-slate-700/50",
    cyan:   "bg-cyan-500/15 text-slate-100 border border-cyan-500/25",
    green:  "bg-green-500/15 text-green-400 border border-green-500/25",
    yellow: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/25",
    violet: "bg-violet-500/15 text-violet-400 border border-violet-500/25",
    blue:   "bg-gray-900 text-white border border-gray-500",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${map[tone] || map.slate}`}>
      {children}
    </span>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, color = "cyan" }) {
  const map = {
    cyan:   "border-cyan-500/20 bg-cyan-500/5",
    blue:   "border-blue-500/20 bg-blue-500/5",
    violet: "border-violet-500/20 bg-violet-500/5",
    green:  "border-green-500/20 bg-green-500/5",
    yellow: "border-yellow-500/20 bg-yellow-500/5",
  };
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-1 hover:shadow-md hover:shadow-gray-300 hover:border-blue-200 transition-all duration-200 ${map[color]}`}>
      <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">{label}</p>
      <p className="text-2xl font-bold font-mono leading-tight tracking-tight">{value}</p>
    </div>
  );
}

// ── Hash display with copy ────────────────────────────────────────────────────
function HashCell({ value }) {
  const [copied, setCopied] = useState(false);
  const short = shortHash(value);
  if (!value || value === "-") return <span className="text-slate-600 text-[11px]">—</span>;
  return (
    <div className="flex items-center gap-1.5 group">
      <span className="font-mono text-[10px] text-cyan-400/80">{short}</span>
      <button onClick={() => { copyToClipboard(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        className="opacity-0 group-hover:opacity-100 transition text-slate-600 hover:text-cyan-400">
        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3 h-3">
          {copied
            ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            : <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>}
        </svg>
      </button>
    </div>
  );
}

// ── Block detail modal ────────────────────────────────────────────────────────
function BlockModal({ block, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!block) return null;
  const txs = Array.isArray(block.txs) ? block.txs : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl bg-[#0a1628] border border-slate-700/60 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
              <svg fill="none" stroke="#a78bfa" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-slate-200">Block #{block.number}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Hyperledger Fabric</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-slate-200 transition">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3">
            {[
              { label:"Block Hash (hex)",    value: block.block_hash    || "—" },
              { label:"Previous Hash (hex)", value: block.previous_hash || "—" },
              { label:"Data Hash (hex)",     value: block.data_hash     || "—" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-slate-700/40 bg-slate-900/40 px-4 py-3">
                <p className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">{label}</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-[11px] text-cyan-400/80 break-all leading-relaxed">{value}</p>
                  {value !== "—" && (
                    <button onClick={() => copyToClipboard(value)}
                      className="shrink-0 text-slate-600 hover:text-cyan-400 transition">
                      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 font-semibold">
              Transactions ({txs.length})
            </p>
            {txs.length === 0 ? (
              <div className="rounded-xl border border-slate-700/40 bg-slate-900/30 px-4 py-6 text-center text-[12px] text-slate-600">
                No transactions in this block
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {txs.map((tx, i) => (
                  <div key={tx.txId || i} className="rounded-xl border border-slate-700/30 bg-slate-900/30 px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] text-cyan-400 truncate">{tx.txId || "—"}</p>
                      <p className="text-[10px] text-slate-600 mt-0.5">{tx.timestamp ? String(tx.timestamp).slice(0,19).replace("T"," ") : "—"}</p>
                    </div>
                    <Pill tone="cyan">TX</Pill>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-700/50 flex justify-end">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-700/50 text-slate-400 text-sm font-medium hover:bg-slate-800 hover:text-slate-200 transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Ledger page ──────────────────────────────────────────────────────────
export default function ViewLedger() {
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [blocks,        setBlocks]        = useState([]);
  const [meta,          setMeta]          = useState({ height: 0 });
  const [tip,           setTip]           = useState({ height: 0, currentBlockHash: "", previousBlockHash: "" });
  const [query,         setQuery]         = useState("");
  const [typeFilter,    setTypeFilter]    = useState("ALL");
  const [page,          setPage]          = useState(1);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [countdown,     setCountdown]     = useState(AUTO_REFRESH_INTERVAL);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const intervalRef  = useRef(null);
  const countdownRef = useRef(null);
  const PAGE_SIZE    = 10;

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const loadLedger = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const res     = await api.get("/audit/ledger?from=0&limit=200&order=desc");
      const payload = res.data;
      setBlocks(payload.blocks || []);
      setMeta({ height: payload.height || 0 });
      setTip({
        height:            payload.tip?.height            || payload.height || 0,
        currentBlockHash:  payload.tip?.currentBlockHash  || "",
        previousBlockHash: payload.tip?.previousBlockHash || "",
      });
      setPage(1);
      setLastRefreshed(new Date());
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load ledger");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Auto-refresh every AUTO_REFRESH_INTERVAL seconds ─────────────────────
  useEffect(() => {
    loadLedger();

    // Countdown ticker — fires every second
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return AUTO_REFRESH_INTERVAL;   // reset; the interval below triggers the fetch
        }
        return prev - 1;
      });
    }, 1_000);

    // Data fetch interval
    intervalRef.current = setInterval(() => {
      setCountdown(AUTO_REFRESH_INTERVAL);
      loadLedger({ silent: true });
    }, AUTO_REFRESH_INTERVAL * 1_000);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(countdownRef.current);
    };
  }, [loadLedger]);

  // ── Derive table rows from blocks ─────────────────────────────────────────
  const ledgerRows = useMemo(() => {
    const rows = [];
    for (const b of blocks) {
      const txs    = Array.isArray(b.txs) ? b.txs : [];
      const common = { blockNumber: b.number, blockHash: b.block_hash || "", prevHash: b.previous_hash || "", dataHash: b.data_hash || "" };
      if (!txs.length) {
        rows.push({ key: `b-${b.number}-empty`, rowType: "BLOCK", txId: "-", date: "-", ...common });
      } else {
        for (const t of txs) {
          rows.push({ key: `b-${b.number}-tx-${t.txId||Math.random()}`, rowType: "TRANSACTION", txId: t.txId || "-", date: t.timestamp ? String(t.timestamp).slice(0,10) : "-", ...common });
        }
      }
    }
    return rows;
  }, [blocks]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ledgerRows.filter((r) => {
      const mq = !q || [r.txId, r.blockHash, r.prevHash, r.dataHash, r.blockNumber].some((v) => String(v||"").toLowerCase().includes(q));
      const mt = typeFilter === "ALL" ? true : r.rowType === typeFilter;
      return mq && mt;
    });
  }, [ledgerRows, query, typeFilter]);

  const txRows        = ledgerRows.filter((r) => r.rowType === "TRANSACTION").length;
  const blockOnlyRows = ledgerRows.filter((r) => r.rowType === "BLOCK").length;
  const totalPages    = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage      = Math.min(page, totalPages);
  const start         = (safePage - 1) * PAGE_SIZE;
  const pageItems     = filtered.slice(start, start + PAGE_SIZE);

  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const kpis = [
    { label: "Ledger Height",   value: meta.height,   color: "violet" },
    { label: "Blocks Loaded",   value: blocks.length, color: "cyan"   },
    { label: "Transactions",    value: txRows,         color: "blue"   },
    { label: "Block-only Rows", value: blockOnlyRows,  color: "green"  },
    { label: "Matching Rows",   value: filtered.length,color: "yellow" },
  ];

  return (
    <>
      <style>{pulseStyle}</style>
      <div className="flex flex-col gap-5">

        {/* KPI Cards */}
        <div className="grid grid-cols-5 gap-4">
          {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
        </div>

        {/* Chain Tip Hashes */}
        <div className="border border-slate-200 shadow-sm rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <svg fill="none" stroke="#22d3ee" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <p className="text-[11px] font-semibold tracking-wide">Chain Tip Hashes</p>
              <Pill tone="blue">Height: {tip.height}</Pill>
            </div>
            <div className="flex items-center gap-3">
              <LiveBadge countdown={countdown} />
              {lastRefreshed && (
                <span className="text-[10px] text-slate-400">
                  Last synced {lastRefreshed.toLocaleTimeString()}
                </span>
              )}
              {/* Manual override still available */}
              <button
                onClick={() => { setCountdown(AUTO_REFRESH_INTERVAL); loadLedger(); }}
                disabled={loading}
                className="text-[11px] px-3 py-1.5 rounded-xl border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 transition"
              >
                {loading ? "Syncing…" : "Sync now"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Current Block Hash (base64)",  value: tip.currentBlockHash  },
              { label: "Previous Block Hash (base64)", value: tip.previousBlockHash },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-slate-700/40 px-4 py-3">
                <p className="text-[9px] uppercase tracking-widest font-semibold mb-2">{label}</p>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-mono text-[11px] text-cyan-400/80 break-all leading-relaxed">{value || "—"}</p>
                  {value && (
                    <button onClick={() => copyToClipboard(value)}
                      className="shrink-0 mt-0.5 text-slate-600 hover:text-cyan-400 transition">
                      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter + Search */}
        <div className="border border-slate-200 rounded-2xl p-5 flex flex-col gap-4">
          <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-8 flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-widest font-semibold">Search</label>
              <div className="relative">
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600">
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
                <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                  placeholder="Search by Tx ID, block hash, block number…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700/50 text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/40 transition"
                />
              </div>
            </div>
            <div className="col-span-4 flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-widest font-semibold">Row Type</label>
              <div className="relative">
                <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                  className="w-full appearance-none py-2.5 pl-4 pr-10 rounded-xl border border-slate-700/50 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/40 transition">
                  <option value="ALL">All Rows</option>
                  <option value="TRANSACTION">Transactions Only</option>
                  <option value="BLOCK">Block-only Rows</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex flex-wrap gap-2">
              <Pill tone="blue">Height: {meta.height}</Pill>
              <Pill tone="blue">Blocks: {blocks.length}</Pill>
              <Pill tone="blue">Tx rows: {txRows}</Pill>
              <Pill tone="blue">Block-only: {blockOnlyRows}</Pill>
              <Pill tone="blue">Showing: {filtered.length}</Pill>
            </div>
            {/* Live badge inline with pills */}
            <LiveBadge countdown={countdown} />
          </div>
        </div>

        {/* Ledger Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-800/60 bg-slate-900">
                  {["#","Block #","Tx ID","Type","Date","Block Hash","Prev Hash","Data Hash",""].map((h, i) => (
                    <th key={i} className={`px-4 py-3 text-[9px] uppercase tracking-widest text-white font-semibold ${i === 8 ? "text-right" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <div className="flex items-center justify-center gap-3 text-slate-500 text-sm">
                        <span className="w-5 h-5 border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin" />
                        Loading ledger…
                      </div>
                    </td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <p className="text-sm text-slate-600">No results — try clearing filters</p>
                    </td>
                  </tr>
                ) : (
                  pageItems.map((row, idx) => (
                    <tr key={row.key} className="hover:bg-slate-800/30 transition">
                      <td className="px-4 py-3 text-[11px] text-slate-600 tabular-nums">{start + idx + 1}</td>
                      <td className="px-4 py-3">
                        <span className="text-[12px] font-bold font-mono text-slate-200">{row.blockNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[10px] text-slate-400">{row.txId}</span>
                      </td>
                      <td className="px-4 py-3">
                        {row.rowType === "TRANSACTION"
                          ? <Pill tone="cyan">Transaction</Pill>
                          : <Pill tone="slate">Block</Pill>}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-500">{row.date}</td>
                      <td className="px-4 py-3"><HashCell value={row.blockHash} /></td>
                      <td className="px-4 py-3"><HashCell value={row.prevHash} /></td>
                      <td className="px-4 py-3"><HashCell value={row.dataHash} /></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <button
                            onClick={() => { const b = blocks.find((x) => x.number === row.blockNumber); setSelectedBlock(b || null); }}
                            className="text-[11px] px-3 py-1.5 rounded-lg bg-violet-500/15 border border-violet-500/25 text-violet-400 hover:bg-violet-500/25 transition font-medium">
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-800/60 bg-slate-900/40">
              <p className="text-[11px] text-slate-500">
                Page <span className="text-slate-300 font-medium">{safePage}</span> of{" "}
                <span className="text-slate-300 font-medium">{totalPages}</span>
              </p>
              <div className="flex gap-1.5">
                {[["First", 1], ["Prev", safePage - 1], ["Next", safePage + 1], ["Last", totalPages]].map(([label, target]) => {
                  const disabled = label === "First" || label === "Prev" ? safePage === 1 : safePage === totalPages;
                  return (
                    <button key={label}
                      onClick={() => setPage(Math.max(1, Math.min(totalPages, Number(target))))}
                      disabled={disabled}
                      className="text-[11px] px-3 py-1.5 rounded-lg border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 disabled:opacity-30 disabled:cursor-not-allowed transition">
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedBlock && <BlockModal block={selectedBlock} onClose={() => setSelectedBlock(null)} />}
    </>
  );
}