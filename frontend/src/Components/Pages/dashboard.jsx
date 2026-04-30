import { useEffect, useRef, useState } from "react";
import api from "../../services/api";

// ── Sample fallbacks ──────────────────────────────────────────────────────────
const SAMPLE_PACKETS = [
  { id:1, device:"Village I Sensors",   deviceId:"DEV-001", timestamp:"04/19/26 10:32 AM", temperature:29.4, humidity:72, soilMoisture:45, rainfall:0.0,  certificate:"3A:9F:2C:BB:01:DE" },
  { id:2, device:"Village II Sensors",  deviceId:"DEV-002", timestamp:"04/19/26 10:31 AM", temperature:27.1, humidity:68, soilMoisture:38, rainfall:0.0,  certificate:"7B:11:4D:CC:02:EF" },
  { id:3, device:"Village III Sensors", deviceId:"DEV-003", timestamp:"04/19/26 10:30 AM", temperature:31.8, humidity:75, soilMoisture:52, rainfall:1.2,  certificate:null                 },
];

const SAMPLE_DEVICES = [
  { name:"Village I Node-A",   devEUI:"A840416...", event:"Data TX",      lastSeen:"10:32 AM" },
  { name:"Village II Node-B",  devEUI:"B920527...", event:"Sig Verified", lastSeen:"10:31 AM" },
  { name:"Village III Node-C", devEUI:"C730315...", event:"Data TX",      lastSeen:"10:30 AM" },
];

const SAMPLE_TXNS = [
  { txId:"tx_17a3f9c2_8a1b2c3d", device:"Village I Node-A",  time:"10:32:08 AM", status:"Committed" },
  { txId:"tx_16b2e8d1_9b2c3d4e", device:"Village II Node-B", time:"10:32:05 AM", status:"Committed" },
  { txId:"tx_15c1d7e0_7c3d4e5f", device:"Village I Node-D",  time:"10:31:58 AM", status:"Committed" },
];

const FIELD_LABELS = {
  temperature:   { label:"Temp",    unit:"°C",  color:"text-rose-400",    bg:"bg-rose-500/10 border-rose-500/20"       },
  humidity:      { label:"Humidity",unit:"%",   color:"text-sky-400",     bg:"bg-sky-500/10 border-sky-500/20"         },
  soilMoisture:  { label:"Soil",    unit:"%",   color:"text-emerald-400", bg:"bg-emerald-500/10 border-emerald-500/20" },
  rainfall:      { label:"Rain",    unit:"mm",  color:"text-indigo-400",  bg:"bg-indigo-500/10 border-indigo-500/20"   },
  soil_moisture: { label:"Soil",    unit:"%",   color:"text-emerald-400", bg:"bg-emerald-500/10 border-emerald-500/20" },
};

const txColor = {
  Committed: "bg-green-500/15 text-green-400 border border-green-500/25",
  Pending:   "bg-yellow-500/15 text-yellow-400 border border-yellow-500/25",
  Failed:    "bg-red-500/15 text-red-400 border border-red-500/25",
};

const kpiConfig = [
  { label:"Devices",              key:"totalDevices",  bg:"bg-slate-800",   accent:"text-cyan-400",   icon:"M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" },
  { label:"Packets Received",     key:"totalPackets",  bg:"bg-blue-700",    accent:"text-blue-200",   icon:"M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" },
  { label:"Transactions",         key:"transactions",  bg:"bg-violet-700",  accent:"text-violet-200", icon:"M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { label:"Certificate Validity", key:"certValidity",  bg:"bg-emerald-700", accent:"text-emerald-200",icon:"M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
];

const PANEL_PAGE_SIZE = 5;

// ── Helpers ───────────────────────────────────────────────────────────────────
function normalisePacket(row) {
  let decoded = {};
  if (row.decodedData) {
    try { decoded = typeof row.decodedData === "string" ? JSON.parse(row.decodedData) : row.decodedData; }
    catch { decoded = {}; }
  }
  return {
    ...row,
    temperature:  decoded.temperature  ?? row.temperature  ?? null,
    humidity:     decoded.humidity     ?? row.humidity     ?? null,
    soilMoisture: decoded.soilMoisture ?? decoded.soil_moisture ?? row.soilMoisture ?? null,
    rainfall:     decoded.rainfall     ?? row.rainfall     ?? null,
    certificate:  decoded.certificate  ?? row.certificate  ?? null,
  };
}

function extractTime(ts) {
  if (!ts) return "—";
  const m = ts.match(/(\d{1,2}:\d{2}\s?[AP]M)/i);
  return m ? m[1] : ts;
}

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"/>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"/>
    </span>
  );
}

// ── Mini pagination (prev / page numbers / next) ──────────────────────────────
function MiniPagination({ page, totalPages, onPrev, onNext, onPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-1">
      <p className="text-[10px] text-slate-400">Page {page} of {totalPages}</p>
      <div className="flex items-center gap-1">
        <button onClick={onPrev} disabled={page === 1}
          className="w-6 h-6 flex items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition">
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3 h-3"><path d="M15 19l-7-7 7-7"/></svg>
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
          <button key={p} onClick={() => onPage(p)}
            className={`w-6 h-6 flex items-center justify-center rounded-md border text-[10px] font-medium transition ${
              p === page ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600"
            }`}>{p}</button>
        ))}
        <button onClick={onNext} disabled={page === totalPages}
          className="w-6 h-6 flex items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition">
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3 h-3"><path d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  );
}

// ── Latest Packet Panel ───────────────────────────────────────────────────────
function LatestPacketPanel() {
  const [packets,  setPackets]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [lastPoll, setLastPoll] = useState(null);
  const [selected, setSelected] = useState(0);
  const timerRef = useRef(null);

  const fetchLatest = async () => {
    try {
      const { data } = await api.get("/devices/data/all?limit=5&offset=0");
      const readings = (data.readings || []).map(normalisePacket);
      setPackets(readings.length > 0 ? readings : SAMPLE_PACKETS);
      setSelected(0);
      setLastPoll(new Date());
    } catch {
      setPackets(SAMPLE_PACKETS);
      setSelected(0);
      setLastPoll(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatest();
    timerRef.current = setInterval(fetchLatest, 10_000);
    return () => clearInterval(timerRef.current);
  }, []);

  const packet       = packets[selected] ?? null;
  const sensorFields = packet
    ? Object.entries(packet).filter(([k]) => FIELD_LABELS[k] && packet[k] != null)
    : [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-900 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <LiveDot/>
          <h2 className="text-[13px] font-semibold text-slate-100">Latest LoRaWAN Packet</h2>
          <span className="text-[10px] text-slate-500 hidden sm:block">· auto-refreshes every 10 s</span>
        </div>
        <div className="flex items-center gap-2">
          {lastPoll && <span className="text-[10px] text-slate-500 hidden md:block">{lastPoll.toLocaleTimeString()}</span>}
          <button onClick={() => { setLoading(true); fetchLatest(); }}
            className="text-[11px] px-2.5 py-1 rounded-lg border border-slate-700 text-slate-400 hover:border-cyan-500/50 hover:text-cyan-400 transition">
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-6 justify-center">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          Fetching…
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* LEFT */}
          <div className="px-4 py-3 flex flex-col gap-3">
            {packet && (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
                  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4">
                    <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-slate-800 truncate">{packet.device}</p>
                  <p className="font-mono text-[10px] text-slate-400 truncate">{packet.deviceId}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-500 shrink-0">{packet.timestamp}</span>
              </div>
            )}
            {sensorFields.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {sensorFields.map(([key, val]) => {
                  const meta = FIELD_LABELS[key];
                  return (
                    <div key={key} className={`rounded-lg border px-3 py-1.5 flex items-center gap-1.5 ${meta.bg}`}>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{meta.label}</span>
                      <span className={`text-[13px] font-bold font-mono ${meta.color}`}>
                        {val}<span className="text-[10px] font-normal ml-0.5">{meta.unit}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {packet && (
              <div className="flex items-center gap-1.5 text-[10px]">
                {packet.certificate
                  ? <><span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"/><span className="text-blue-600 font-medium">Cert bound</span><span className="font-mono text-slate-400 truncate ml-1">{packet.certificate}</span></>
                  : <><span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"/><span className="text-amber-600">No certificate attached</span></>
                }
              </div>
            )}
          </div>
          {/* RIGHT */}
          <div className="px-4 py-3 flex flex-col gap-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Last {packets.length} Packets</p>
            {packets.map((pkt, idx) => {
              const isActive = idx === selected;
              return (
                <button key={pkt.id ?? idx} onClick={() => setSelected(idx)}
                  className={`w-full text-left rounded-xl border px-3 py-2 flex items-center gap-3 transition-all ${
                    isActive ? "bg-blue-50 border-blue-300" : "bg-slate-50 border-slate-200 hover:border-blue-200"
                  }`}>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] font-semibold truncate ${isActive ? "text-blue-700" : "text-slate-800"}`}>{pkt.device}</p>
                    <p className="font-mono text-[9px] text-slate-400 truncate">{pkt.deviceId}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="hidden sm:flex items-center gap-1">
                      {pkt.temperature != null && <span className="text-[9px] font-mono font-semibold text-rose-500 bg-rose-50 px-1 py-0.5 rounded">{pkt.temperature}°C</span>}
                      {pkt.humidity    != null && <span className="text-[9px] font-mono font-semibold text-sky-500 bg-sky-50 px-1 py-0.5 rounded">{pkt.humidity}%</span>}
                    </div>
                    <span className="font-mono text-[9px] text-slate-500">{extractTime(pkt.timestamp)}</span>
                    {idx === 0 && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">NEW</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [kpiValues,    setKpiValues]    = useState({ totalDevices:"—", totalPackets:"—", transactions:"—", certValidity:"--" });
  const [actDevices,   setActDevices]   = useState([]);
  const [txns,         setTxns]         = useState([]);
  const [fabricMeta,   setFabricMeta]   = useState({ blockCount:"—", totalTx:"—" });
  const [loadingAct,   setLoadingAct]   = useState(true);
  const [loadingFab,   setLoadingFab]   = useState(true);

  // Separate pagination state for each panel
  const [actPage,  setActPage]  = useState(1);
  const [fabPage,  setFabPage]  = useState(1);

  useEffect(() => {
    // Device activity
    api.get("/devices/activity")
      .then(({ data }) => {
        const devs = data.devices || [];
        setActDevices(devs);
        // Count ALL devices regardless of status
        setKpiValues(prev => ({ ...prev, totalDevices: devs.length }));
      })
      .catch(() => setActDevices(SAMPLE_DEVICES))
      .finally(() => setLoadingAct(false));

    // Total packets
    api.get("/devices/data/all?limit=1")
      .then(({ data }) => setKpiValues(prev => ({ ...prev, totalPackets: data.total ?? "—" })))
      .catch(() => {});

    // Ledger summary
    api.get("/batches/ledger-summary")
      .then(({ data }) => {
        setTxns(data.transactions || []);
        setKpiValues(prev => ({ ...prev, transactions: data.totalTransactions ?? "—" }));
        setFabricMeta({
          blockCount: data.blockCount        ?? "—",
          totalTx:    data.totalTransactions ?? "—",
        });
      })
      .catch(() => setTxns(SAMPLE_TXNS))
      .finally(() => setLoadingFab(false));
  }, []);

  // ── Paginated slices ────────────────────────────────────────────────────────
  const actTotalPages = Math.max(1, Math.ceil(actDevices.length / PANEL_PAGE_SIZE));
  const actPage_safe  = Math.min(actPage, actTotalPages);
  const actSlice      = actDevices.slice((actPage_safe - 1) * PANEL_PAGE_SIZE, actPage_safe * PANEL_PAGE_SIZE);

  const fabTotalPages = Math.max(1, Math.ceil(txns.length / PANEL_PAGE_SIZE));
  const fabPage_safe  = Math.min(fabPage, fabTotalPages);
  const fabSlice      = txns.slice((fabPage_safe - 1) * PANEL_PAGE_SIZE, fabPage_safe * PANEL_PAGE_SIZE);

  return (
    <div className="flex flex-col gap-5">

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpiConfig.map(k => (
          <div key={k.label}
            className={`${k.bg} rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-sm hover:brightness-110 transition-all duration-200`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-white/60 font-semibold">{k.label}</span>
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className={`w-4 h-4 ${k.accent}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={k.icon}/>
                </svg>
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white leading-none tracking-tight">
              {kpiValues[k.key]}
            </span>
          </div>
        ))}
      </div>

      {/* ── Latest Packet ───────────────────────────────────────────────── */}
      <LatestPacketPanel/>

      {/* ── Device Activity + Fabric ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ── Device Activity ─────────────────────────────────────────── */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4 text-slate-400">
                <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
              </svg>
              <p className="text-[14px] font-semibold text-slate-800">Recent Activity</p>
            </div>
            {actDevices.length > 0 && (
              <span className="text-[10px] text-slate-400">
                {actDevices.length} device{actDevices.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block rounded-xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-5 bg-slate-700 px-4 py-2.5 text-[10px] uppercase tracking-wider text-slate-200 font-semibold border-b border-slate-200">
              <span className="col-span-2">Device</span>
              <span>Status</span>
              <span>Event</span>
              <span>Last Seen</span>
            </div>
            {loadingAct ? (
              <div className="flex items-center justify-center py-8 text-slate-400 text-xs gap-2">
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Loading…
              </div>
            ) : actSlice.length === 0 ? (
              <p className="text-center py-8 text-slate-300 text-xs">No devices found</p>
            ) : (
              actSlice.map((d) => (
                <div key={d.devEUI} className="grid grid-cols-5 items-center px-4 py-3 border-t border-slate-100 hover:bg-slate-50 transition">
                  <div className="col-span-2">
                    <p className="text-[12px] text-slate-800 font-medium">{d.name}</p>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">{d.devEUI}</p>
                  </div>
                  {/* All devices shown as Active */}
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full w-fit border bg-green-500/15 text-green-600 border-green-500/25">
                    Active
                  </span>
                  <span className="text-[11px] text-slate-500">{d.event}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{d.lastSeen ?? "—"}</span>
                </div>
              ))
            )}
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-2 sm:hidden">
            {actSlice.map((d) => (
              <div key={d.devEUI} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-slate-800 truncate">{d.name}</p>
                  <p className="text-[9px] font-mono text-slate-400 mt-0.5">{d.event} · {d.lastSeen ?? "—"}</p>
                </div>
                <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full border shrink-0 bg-green-500/15 text-green-600 border-green-500/25">
                  Active
                </span>
              </div>
            ))}
          </div>

          {/* Activity pagination */}
          {!loadingAct && (
            <MiniPagination
              page={actPage_safe}
              totalPages={actTotalPages}
              onPrev={() => setActPage(p => Math.max(1, p - 1))}
              onNext={() => setActPage(p => Math.min(actTotalPages, p + 1))}
              onPage={p => setActPage(p)}
            />
          )}
        </div>

        {/* ── Hyperledger Fabric ───────────────────────────────────────── */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg fill="none" stroke="#a78bfa" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              <p className="text-[14px] font-semibold text-slate-800">Hyperledger Fabric</p>
            </div>
            {txns.length > 0 && (
              <span className="text-[10px] text-slate-400">{txns.length} txn{txns.length !== 1 ? "s" : ""}</span>
            )}
          </div>

          {/* Mini stat cards */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { l:"Committed Batches", v: fabricMeta.blockCount, border:"border-violet-500/20 bg-slate-900", text:"text-violet-300" },
              { l:"Total Txns",        v: fabricMeta.totalTx,    border:"border-cyan-500/20 bg-slate-900",   text:"text-cyan-300"   },
            ].map(({ l, v, border, text }) => (
              <div key={l} className={`rounded-xl p-2.5 border text-center ${border}`}>
                <p className={`text-[15px] font-bold font-mono ${text}`}>{v}</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">{l}</p>
              </div>
            ))}
          </div>

          {/* Transaction list — paginated */}
          <div className="flex flex-col gap-1.5">
            {loadingFab ? (
              <div className="flex items-center justify-center py-6 text-slate-500 text-xs gap-2">
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Loading transactions…
              </div>
            ) : fabSlice.length === 0 ? (
              <p className="text-center py-6 text-slate-500 text-xs">No committed transactions yet</p>
            ) : (
              fabSlice.map((tx, i) => (
                <div key={tx.txId ?? i}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 transition">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-mono text-cyan-400 truncate">{tx.txId}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5 truncate">{tx.device} · {tx.time}</p>
                  </div>
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ml-2 shrink-0 ${txColor[tx.status] || txColor.Committed}`}>
                    {tx.status}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Fabric pagination */}
          {!loadingFab && (
            <MiniPagination
              page={fabPage_safe}
              totalPages={fabTotalPages}
              onPrev={() => setFabPage(p => Math.max(1, p - 1))}
              onNext={() => setFabPage(p => Math.min(fabTotalPages, p + 1))}
              onPage={p => setFabPage(p)}
            />
          )}
        </div>

      </div>
    </div>
  );
}