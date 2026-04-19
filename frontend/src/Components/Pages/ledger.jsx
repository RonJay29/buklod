import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import api from "../../services/api";

const AUTO_REFRESH_INTERVAL = 10;
const PAGE_SIZE = 10;

// ── Helpers ───────────────────────────────────────────────────────────────────
function shortHash(val) {
  if (!val) return "—";
  const s = String(val);
  return s.length <= 20 ? s : `${s.slice(0, 10)}…${s.slice(-8)}`;
}

function copyToClipboard(text) {
  navigator.clipboard?.writeText(text).catch(() => {});
}

function hasAccessToken() {
  return !!localStorage.getItem("accessToken"); // ADDED
}

// ── KPI config ────────────────────────────────────────────────────────────────
const kpiConfig = [
  { label: "Ledger Height",   key: "height",    bg: "bg-slate-800",   accent: "text-cyan-400",    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { label: "Blocks Loaded",   key: "blocks",    bg: "bg-blue-700",    accent: "text-blue-200",    icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { label: "Transactions",    key: "txRows",    bg: "bg-violet-700",  accent: "text-violet-200",  icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { label: "Matching Rows",   key: "matching",  bg: "bg-emerald-700", accent: "text-emerald-200", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Block-only Rows", key: "blockOnly", bg: "bg-amber-700",   accent: "text-amber-200",   icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" },
];

// ── Live badge ────────────────────────────────────────────────────────────────
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
    slate: "bg-slate-100 text-slate-600 border border-slate-200",
    cyan: "bg-cyan-50 text-cyan-700 border border-cyan-200",
    violet: "bg-violet-50 text-violet-700 border border-violet-200",
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${map[tone] || map.slate}`}>
      {children}
    </span>
  );
}

// ── Hash cell with copy ───────────────────────────────────────────────────────
function HashCell({ value }) {
  const [copied, setCopied] = useState(false);

  if (!value || value === "-") return <span className="text-slate-300 text-[11px]">—</span>;

  return (
    <div className="flex items-center gap-1.5 group">
      <span className="font-mono text-[10px] text-slate-500">{shortHash(value)}</span>
      <button
        onClick={() => {
          copyToClipboard(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-blue-500"
      >
        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3 h-3">
          {copied ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          )}
        </svg>
      </button>
    </div>
  );
}

// ── Block detail modal ────────────────────────────────────────────────────────
function BlockModal({ block, onClose }) {
  if (!block) return null;
  const txs = Array.isArray(block.txs) ? block.txs : [];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-800/50 backdrop-blur-[2px] overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="min-h-full flex items-center justify-center px-4 py-6 sm:py-10">
        <div
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl shadow-slate-900/20 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                <svg fill="none" stroke="#7c3aed" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <p className="text-[14px] font-semibold text-slate-800">Block #{block.number}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Hyperledger Fabric</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition"
            >
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
            {[
              { label: "Block Hash", value: block.block_hash || "—" },
              { label: "Previous Hash", value: block.previous_hash || "—" },
              { label: "Data Hash", value: block.data_hash || "—" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-1.5">{label}</p>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-mono text-[11px] text-slate-700 break-all leading-relaxed">{value}</p>
                  {value !== "—" && (
                    <button
                      onClick={() => copyToClipboard(value)}
                      className="shrink-0 mt-0.5 text-slate-400 hover:text-blue-500 transition"
                    >
                      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div className="border-t border-slate-100 pt-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-3 font-semibold">
                Transactions ({txs.length})
              </p>
              {txs.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-center text-[12px] text-slate-400">
                  No transactions in this block
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {txs.map((tx, i) => (
                    <div
                      key={tx.txId || i}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-[11px] text-violet-600 truncate">{tx.txId || "—"}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {tx.timestamp ? String(tx.timestamp).slice(0, 19).replace("T", " ") : "—"}
                        </p>
                      </div>
                      <Pill tone="violet">TX</Pill>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-medium hover:bg-slate-50 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 bg-slate-50/50">
      <p className="text-[11px] text-slate-400">
        Page <span className="text-slate-700 font-medium">{page}</span> of{" "}
        <span className="text-slate-700 font-medium">{totalPages}</span>
      </p>
      <div className="flex gap-1">
        {[["‹‹", 1], ["‹", page - 1], ["›", page + 1], ["››", totalPages]].map(([label, target]) => {
          const disabled = label === "‹‹" || label === "‹" ? page === 1 : page === totalPages;
          return (
            <button
              key={label}
              onClick={() => onPage(Math.max(1, Math.min(totalPages, Number(target))))}
              disabled={disabled}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-xs text-slate-400 hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Ledger page ──────────────────────────────────────────────────────────
export default function ViewLedger() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selectedBlock, setSelectedBlock] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [blocks, setBlocks] = useState([]);
  const [tip, setTip] = useState({
    height: 0,
    currentBlockHash: "",
    previousBlockHash: "",
    rawHex: "",
  });
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [countdown, setCountdown] = useState(AUTO_REFRESH_INTERVAL);
  const [isLoggedIn, setIsLoggedIn] = useState(hasAccessToken()); // ADDED

  const intervalRef = useRef(null);
  const countdownRef = useRef(null);

  // ADDED: helper to stop timers safely
  const stopAutoRefresh = useCallback(() => {
    clearInterval(intervalRef.current);
    clearInterval(countdownRef.current);
    intervalRef.current = null;
    countdownRef.current = null;
  }, []);

  // CHANGED: stop fetch if logged out
  const loadLedger = useCallback(async ({ silent = false } = {}) => {
    const token = localStorage.getItem("accessToken"); // ADDED

    if (!token) { // ADDED
      setIsLoggedIn(false);
      stopAutoRefresh();
      setBlocks([]);
      setTip({
        height: 0,
        currentBlockHash: "",
        previousBlockHash: "",
        rawHex: "",
      });
      setLoading(false);
      return;
    }

    setIsLoggedIn(true);

    if (!silent) setLoading(true);
    setError("");

    try {
      const channelInfoRes = await api.get("/fabric/channel-info");
      const channelInfo = channelInfoRes.data?.data || {};

      setBlocks([]);
      setTip({
        height: channelInfo.height || 0,
        currentBlockHash: channelInfo.currentBlockHash || "",
        previousBlockHash: channelInfo.previousBlockHash || "",
        rawHex: channelInfo.rawHex || "",
      });

      setPage(1);
      setLastRefreshed(new Date());
    } catch (e) {
      if (!localStorage.getItem("accessToken")) { // ADDED
        setIsLoggedIn(false);
        stopAutoRefresh();
        setBlocks([]);
        setTip({
          height: 0,
          currentBlockHash: "",
          previousBlockHash: "",
          rawHex: "",
        });
        setLoading(false);
        return;
      }

      setError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Failed to load channel info"
      );
    } finally {
      setLoading(false);
    }
  }, [stopAutoRefresh]);

  // CHANGED: only start intervals when logged in
  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setIsLoggedIn(false);
      stopAutoRefresh();
      setLoading(false);
      return;
    }

    setIsLoggedIn(true);
    loadLedger();

    countdownRef.current = setInterval(() => {
      const tokenStillExists = localStorage.getItem("accessToken"); // ADDED

      if (!tokenStillExists) { // ADDED
        setIsLoggedIn(false);
        stopAutoRefresh();
        return;
      }

      setCountdown((prev) => {
        if (prev <= 1) return AUTO_REFRESH_INTERVAL;
        return prev - 1;
      });
    }, 1000);

    intervalRef.current = setInterval(() => {
      const tokenStillExists = localStorage.getItem("accessToken"); // ADDED

      if (!tokenStillExists) { // ADDED
        setIsLoggedIn(false);
        stopAutoRefresh();
        return;
      }

      setCountdown(AUTO_REFRESH_INTERVAL);
      loadLedger({ silent: true });
    }, AUTO_REFRESH_INTERVAL * 1000);

    return () => {
      stopAutoRefresh();
    };
  }, [loadLedger, stopAutoRefresh]);

  // ADDED: listen when logout happens in another tab or same app flow updates token
  useEffect(() => {
    const syncAuthState = () => {
      const token = localStorage.getItem("accessToken");
      const loggedIn = !!token;
      setIsLoggedIn(loggedIn);

      if (!loggedIn) {
        stopAutoRefresh();
        setBlocks([]);
        setTip({
          height: 0,
          currentBlockHash: "",
          previousBlockHash: "",
          rawHex: "",
        });
        setLoading(false);
      }
    };

    window.addEventListener("storage", syncAuthState);

    const visibilityHandler = () => {
      syncAuthState();
    };

    document.addEventListener("visibilitychange", visibilityHandler);

    return () => {
      window.removeEventListener("storage", syncAuthState);
      document.removeEventListener("visibilitychange", visibilityHandler);
    };
  }, [stopAutoRefresh]);

  const ledgerRows = useMemo(() => {
    const rows = [];
    for (const b of blocks) {
      const txs = Array.isArray(b.txs) ? b.txs : [];
      const common = {
        blockNumber: b.number,
        blockHash: b.block_hash || "",
        prevHash: b.previous_hash || "",
        dataHash: b.data_hash || "",
      };

      if (!txs.length) {
        rows.push({
          key: `b-${b.number}-empty`,
          rowType: "BLOCK",
          txId: "-",
          date: "-",
          ...common,
        });
      } else {
        for (const t of txs) {
          rows.push({
            key: `b-${b.number}-tx-${t.txId || Math.random()}`,
            rowType: "TRANSACTION",
            txId: t.txId || "-",
            date: t.timestamp ? String(t.timestamp).slice(0, 10) : "-",
            ...common,
          });
        }
      }
    }
    return rows;
  }, [blocks]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ledgerRows.filter((r) => {
      const mq =
        !q ||
        [r.txId, r.blockHash, r.prevHash, r.dataHash, r.blockNumber].some((v) =>
          String(v || "").toLowerCase().includes(q)
        );
      const mt = typeFilter === "ALL" ? true : r.rowType === typeFilter;
      return mq && mt;
    });
  }, [ledgerRows, query, typeFilter]);

  const txRows = ledgerRows.filter((r) => r.rowType === "TRANSACTION").length;
  const blockOnlyRows = ledgerRows.filter((r) => r.rowType === "BLOCK").length;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  const kpiValues = {
    height: tip.height,
    blocks: blocks.length,
    txRows,
    matching: filtered.length,
    blockOnly: blockOnlyRows,
  };

  const handleFilterChange = (val) => {
    setTypeFilter(val);
    setPage(1);
  };

  const handleSearch = (e) => {
    setQuery(e.target.value);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {kpiConfig.map((k) => (
          <div
            key={k.label}
            className={`${k.bg} rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-sm hover:brightness-110 transition-all duration-200`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-white/60 font-semibold">{k.label}</span>
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className={`w-4 h-4 ${k.accent}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={k.icon} />
                </svg>
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white leading-none tracking-tight">
              {kpiValues[k.key]}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4 text-violet-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <p className="text-[13px] font-semibold text-slate-700">Chain Tip Hashes</p>
            <Pill tone="blue">Height: {tip.height}</Pill>
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <LiveBadge countdown={countdown} />
                {lastRefreshed && (
                  <span className="text-[10px] text-slate-400">
                    Last synced {lastRefreshed.toLocaleTimeString()}
                  </span>
                )}
                <button
                  onClick={() => {
                    if (!hasAccessToken()) return; // ADDED
                    setCountdown(AUTO_REFRESH_INTERVAL);
                    loadLedger();
                  }}
                  disabled={loading || !isLoggedIn}
                  className="text-[11px] px-3 py-1.5 rounded-xl border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 transition"
                >
                  {loading ? "Syncing…" : "Sync now"}
                </button>
              </>
            ) : (
              <span className="text-[11px] text-slate-400">Logged out</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Current Block Hash", value: tip.currentBlockHash },
            { label: "Previous Block Hash", value: tip.previousBlockHash },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-1.5">{label}</p>
              <div className="flex items-start justify-between gap-2">
                <p className="font-mono text-[11px] text-slate-700 break-all leading-relaxed">{value || "—"}</p>
                {value && (
                  <button
                    onClick={() => copyToClipboard(value)}
                    className="shrink-0 mt-0.5 text-slate-400 hover:text-blue-500 transition"
                  >
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-1.5">Raw Channel Info (hex)</p>
          <pre className="font-mono text-[11px] text-slate-700 break-all whitespace-pre-wrap">
            {tip.rawHex || "No raw output available"}
          </pre>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Search</label>
            <div className="relative">
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                value={query}
                onChange={handleSearch}
                placeholder="Search by Tx ID, block hash, block number…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-200 text-slate-800 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                disabled={!isLoggedIn} // ADDED
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 min-w-[180px]">
            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Row Type</label>
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="w-full appearance-none py-2.5 pl-4 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                disabled={!isLoggedIn} // ADDED
              >
                <option value="ALL">All Rows</option>
                <option value="TRANSACTION">Transactions Only</option>
                <option value="BLOCK">Block-only Rows</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { label: `Height: ${tip.height}`, tone: "blue" },
            { label: `Blocks: ${blocks.length}`, tone: "blue" },
            { label: `Tx rows: ${txRows}`, tone: "violet" },
            { label: `Block-only: ${blockOnlyRows}`, tone: "slate" },
            { label: `Showing: ${filtered.length}`, tone: "cyan" },
          ].map(({ label, tone }) => (
            <Pill key={label} tone={tone}>{label}</Pill>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {!isLoggedIn && ( // ADDED
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-10 text-center text-slate-500 text-sm">
          You are logged out. Ledger fetching has stopped.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["#", "Block #", "Tx ID", "Type", "Date", "Block Hash", "Prev Hash", "Data Hash", ""].map((h, i) => (
                  <th
                    key={i}  //bg-slate-700 px-5 py-2.5 text-[11px] uppercase tracking-wider text-slate-200 font-medium border-b border-slate-200 min-w-[700px]
                    className={`px-4 py-3 text-[11px] bg-slate-700  uppercase tracking-wider text-slate-200 font-semibold ${i === 8 ? "text-right" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-14 text-center text-slate-400 text-sm">
                    Loading channel info…
                  </td>
                </tr>
              ) : !isLoggedIn ? (
                <tr>
                  <td colSpan={9} className="px-6 py-14 text-center text-slate-300 text-sm">
                    Logged out — fetching stopped.
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-14 text-center text-slate-300 text-sm">
                    No ledger rows yet — this page is currently showing channel info only.
                  </td>
                </tr>
              ) : (
                pageItems.map((row, idx) => (
                  <tr key={row.key} className="hover:bg-blue-50/30 transition">
                    <td className="px-4 py-3 text-[11px] text-slate-400 tabular-nums">{start + idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="text-[13px] font-bold font-mono text-slate-800">{row.blockNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] text-slate-500 truncate max-w-[120px] inline-block">{row.txId}</span>
                    </td>
                    <td className="px-4 py-3">
                      {row.rowType === "TRANSACTION" ? <Pill tone="violet">Transaction</Pill> : <Pill tone="slate">Block</Pill>}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-500">{row.date}</td>
                    <td className="px-4 py-3"><HashCell value={row.blockHash} /></td>
                    <td className="px-4 py-3"><HashCell value={row.prevHash} /></td>
                    <td className="px-4 py-3"><HashCell value={row.dataHash} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                            const b = blocks.find((x) => x.number === row.blockNumber);
                            setSelectedBlock(b || null);
                          }}
                          className="text-[11px] px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 hover:bg-violet-100 transition font-medium"
                          disabled={!isLoggedIn} // ADDED
                        >
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

        <Pagination page={safePage} totalPages={totalPages} onPage={(p) => setPage(p)} />
      </div>

      {selectedBlock && <BlockModal block={selectedBlock} onClose={() => setSelectedBlock(null)} />}
    </div>
  );
}