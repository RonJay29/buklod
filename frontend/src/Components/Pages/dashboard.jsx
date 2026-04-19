import { useEffect, useRef, useState } from "react";
import api from "../../services/api";

// ── Static data ───────────────────────────────────────────────────────────────
const kpiData = [
  { label: "Active Devices",       value: "3/5",      color: "cyan"   },
  { label: "Packets Received",     value: "21",       color: "blue"   },
  { label: "Transactions",         value: "21",       color: "violet" },
  { label: "Certificate Validity", value: "730 Days", color: "green"  },
];

const colorMap = {
  cyan:   { card: "border-cyan-500/20 bg-cyan-500/5",    dot: "bg-cyan-400",   val: "text-cyan-300"   },
  blue:   { card: "border-blue-500/20 bg-blue-500/5",    dot: "bg-blue-400",   val: "text-blue-300"   },
  violet: { card: "border-violet-500/20 bg-violet-500/5",dot: "bg-violet-400", val: "text-violet-300" },
  green:  { card: "border-green-500/20 bg-green-500/5",  dot: "bg-green-400",  val: "text-green-300"  },
};

const devices = [
  { name:"Village I Node-A",   status:"Online",  event:"Data TX",      rssi:-87, devEUI:"A840416..." },
  { name:"Village II Node-B",  status:"Online",  event:"Sig Verified", rssi:-91, devEUI:"B920527..." },
  { name:"Village III Node-C", status:"Offline", event:"Timeout",      rssi:null,devEUI:"C730315..." },
  { name:"Village I Node-D",   status:"Online",  event:"Data TX",      rssi:-85, devEUI:"D610428..." },
  { name:"Village II Node-E",  status:"Online",  event:"TX Committed", rssi:-89, devEUI:"E550219..." },
];

const txns = [
  { id:"0x3f8a…c21b", device:"Village I Node-A",  time:"10:32:08", status:"Committed" },
  { id:"0x7c1d…a94e", device:"Village II Node-B", time:"10:32:05", status:"Committed" },
  { id:"0x2b5f…d670", device:"Village I Node-D",  time:"10:31:58", status:"Pending"   },
  { id:"0x9e2a…b31c", device:"Village II Node-E", time:"10:31:44", status:"Failed"    },
];

const txColor = {
  Committed: "bg-green-500/15 text-green-400 border border-green-500/25",
  Pending:   "bg-yellow-500/15 text-yellow-400 border border-yellow-500/25",
  Failed:    "bg-red-500/15 text-red-400 border border-red-500/25",
};

const SAMPLE_PACKETS = [
  { id:1, device:"Village I Sensors",   deviceId:"DEV-001", timestamp:"04/06/26 10:32 AM", temperature:29.4, humidity:72, soilMoisture:45, rainfall:0.0, certificate:"3A:9F:2C:BB:01:DE:44:78:FA:CC:10:29:38:7E:90:12" },
  { id:2, device:"Village II Sensors",  deviceId:"DEV-002", timestamp:"04/06/26 10:31 AM", temperature:27.1, humidity:68, soilMoisture:38, rainfall:0.0, certificate:"7B:11:4D:CC:02:EF:55:89:AB:DD:21:30:49:8F:A1:23" },
  { id:3, device:"Village III Sensors", deviceId:"DEV-003", timestamp:"04/06/26 10:30 AM", temperature:31.8, humidity:75, soilMoisture:52, rainfall:1.2, certificate:null },
  { id:4, device:"Village I Sensors",   deviceId:"DEV-001", timestamp:"04/06/26 10:29 AM", temperature:28.9, humidity:70, soilMoisture:44, rainfall:0.0, certificate:"3A:9F:2C:BB:01:DE:44:78:FA:CC:10:29:38:7E:90:12" },
  { id:5, device:"Village II Sensors",  deviceId:"DEV-002", timestamp:"04/06/26 10:28 AM", temperature:30.3, humidity:66, soilMoisture:37, rainfall:0.5, certificate:"7B:11:4D:CC:02:EF:55:89:AB:DD:21:30:49:8F:A1:23" },
];

const FIELD_LABELS = {
  temperature:   { label:"Temperature",   unit:"°C",  color:"text-rose-400",    bg:"bg-rose-500/10 border-rose-500/20"       },
  humidity:      { label:"Humidity",      unit:"%",   color:"text-sky-400",     bg:"bg-sky-500/10 border-sky-500/20"         },
  soilMoisture:  { label:"Soil Moisture", unit:"%",   color:"text-emerald-400", bg:"bg-emerald-500/10 border-emerald-500/20" },
  rainfall:      { label:"Rainfall",      unit:"mm",  color:"text-indigo-400",  bg:"bg-indigo-500/10 border-indigo-500/20"   },
  soil_moisture: { label:"Soil Moisture", unit:"%",   color:"text-emerald-400", bg:"bg-emerald-500/10 border-emerald-500/20" },
};

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
  const match = ts.match(/(\d{1,2}:\d{2}\s?[AP]M)/i);
  return match ? match[1] : ts;
}

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
    </span>
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
  const sensorFields = packet ? Object.entries(packet).filter(([k]) => FIELD_LABELS[k] && packet[k] != null) : [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="bg-gray-900 px-4 sm:px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <LiveDot />
          <div>
            <h2 className="text-[14px] font-semibold text-slate-100">Latest LoRaWAN Packet</h2>
            <p className="text-[11px] text-slate-500 mt-0.5 hidden sm:block">Auto-refreshes every 10 s</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastPoll && <span className="text-[11px] text-slate-500 hidden md:block">Polled {lastPoll.toLocaleTimeString()}</span>}
          <button onClick={() => { setLoading(true); fetchLatest(); }}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:border-cyan-500/50 hover:text-cyan-400 transition">
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-10 justify-center">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          Fetching latest packet…
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* LEFT */}
          <div className="px-4 sm:px-6 py-5 flex flex-col gap-4">
            {packet && (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
                  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-5 h-5">
                    <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800 truncate">{packet.device}</p>
                  <p className="font-mono text-[10px] text-slate-400 truncate">{packet.deviceId}</p>
                </div>
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">Received</span>
                  <span className="text-[11px] font-mono text-slate-600 font-medium">{packet.timestamp}</span>
                </div>
              </div>
            )}
            {sensorFields.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {sensorFields.map(([key, val]) => {
                  const meta = FIELD_LABELS[key];
                  return (
                    <div key={key} className={`rounded-xl border px-4 py-3 flex flex-col gap-1 ${meta.bg}`}>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{meta.label}</span>
                      <span className={`text-xl font-bold font-mono leading-tight ${meta.color}`}>
                        {val}<span className="text-[12px] font-normal ml-0.5">{meta.unit}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {/* RIGHT */}
          <div className="px-4 sm:px-6 py-5 flex flex-col gap-3">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Last {packets.length} Packets</p>
            <div className="flex flex-col gap-2">
              {packets.map((pkt, idx) => {
                const isActive = idx === selected;
                return (
                  <button key={pkt.id ?? idx} onClick={() => setSelected(idx)}
                    className={`w-full text-left rounded-xl border px-4 py-3 flex flex-col gap-1.5 transition-all ${
                      isActive ? "bg-blue-50 border-blue-300 shadow-sm" : "bg-slate-50 border-slate-200 hover:border-blue-200 hover:bg-blue-50/40"
                    }`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-[12px] font-semibold truncate ${isActive ? "text-blue-700" : "text-slate-800"}`}>{pkt.device}</p>
                      {idx === 0 && <span className="shrink-0 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">Latest</span>}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] text-slate-400 truncate">{pkt.deviceId}</span>
                      <span className="font-mono text-[10px] text-slate-500 shrink-0">{extractTime(pkt.timestamp)}</span>
                    </div>
                  
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  return (
    <div className="flex flex-col gap-5">

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpiData.map((kpi) => {
          const c = colorMap[kpi.color];
          return (
           
            <div key={kpi.label}
              className={`rounded-xl border p-5 flex flex-col gap-1 hover:brightness-110 transition-all duration-200 ${c.card}`}>
              <span className="text-[11px] uppercase tracking-wider text-black font-medium">{kpi.label}</span>
              <span className={`text-2xl font-bold font-mono leading-tight tracking-tight text-gray-700`}>{kpi.value}</span>
            </div>
          );
        })}
      </div>

      {/* Latest Packet */}
      <LatestPacketPanel />

      {/* Device Activity + Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Device Activity */}
        <div className="lg:col-span-3 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4 text-slate-500">
              <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
            </svg>
            <p className="text-[14px] font-semibold text-slate-800">Device Activity</p>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block rounded-xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-5 bg-slate-700 px-5 py-2.5 text-[10px] uppercase tracking-wider text-slate-200 font-semibold border-b border-slate-200 min-w-[700px]">
              <span className="col-span-2">Device</span>
              <span>Status</span>
              <span>Event</span>
              <span>Signal</span>
            </div>
            {devices.map((d) => (
              <div key={d.name} className="grid grid-cols-5 items-center px-4 py-3 border-t border-slate-100 hover:bg-slate-50 transition">
                <div className="col-span-2">
                  <p className="text-[12px] text-slate-800 font-medium">{d.name}</p>
                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">{d.devEUI}</p>
                </div>
                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full w-fit border ${
                  d.status === "Online" ? "bg-green-500/15 text-green-600 border-green-500/25" : "bg-red-500/15 text-red-500 border-red-500/25"
                }`}>{d.status}</span>
                <span className="text-[11px] text-slate-500">{d.event}</span>
                <span className="text-[11px] text-slate-400 font-mono">{d.rssi ? `${d.rssi} dBm` : "—"}</span>
              </div>
            ))}
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-2 sm:hidden">
            {devices.map((d) => (
              <div key={d.name} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-slate-800 truncate">{d.name}</p>
                  <p className="text-[9px] font-mono text-slate-400 mt-0.5">{d.event} {d.rssi ? `· ${d.rssi} dBm` : ""}</p>
                </div>
                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                  d.status === "Online" ? "bg-green-500/15 text-green-600 border-green-500/25" : "bg-red-500/15 text-red-500 border-red-500/25"
                }`}>{d.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hyperledger Fabric Ledger */}
        <div className="lg:col-span-2 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <svg fill="none" stroke="#a78bfa" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-[14px] font-semibold text-slate-800">Hyperledger Fabric</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { l:"Block #",  v:"4822",  border:"border-violet-500/20 bg-gray-900", text:"text-violet-300" },
              { l:"Txns",     v:"1,248", border:"border-cyan-500/20 bg-gray-900",   text:"text-cyan-300"   },
              { l:"Latency",  v:"142ms", border:"border-green-500/20 bg-gray-900",  text:"text-green-400"  },
            ].map(({ l, v, border, text }) => (
              <div key={l} className={`rounded-xl p-2.5 border text-center ${border}`}>
                <p className={`text-[15px] font-bold font-mono ${text}`}>{v}</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">{l}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5 overflow-y-auto" style={{ maxHeight:"300px" }}>
            {txns.map((tx) => (
              <div key={tx.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 transition">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-mono text-cyan-400 truncate">{tx.id}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5 truncate">{tx.device} · {tx.time}</p>
                </div>
                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ml-2 shrink-0 ${txColor[tx.status]}`}>
                  {tx.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}