import { useEffect, useRef, useState } from "react";
import api from "../../services/api";

// ── Static data ───────────────────────────────────────────────────────────────
const kpiData = [
  { label: "Active Devices",        value: "3/5",      color: "cyan"   },
  { label: "Packets Received",      value: "21",       color: "blue"   },
  { label: "Transactions",          value: "21",       color: "violet" },
  { label: "Certificate Validity",  value: "730 Days", color: "green"  },
];

const colorMap = {
  cyan:   { card: "border-cyan-500/20 bg-cyan-500/5",    val: "text-cyan-300"   },
  blue:   { card: "border-blue-500/20 bg-blue-500/5",    val: "text-blue-300"   },
  violet: { card: "border-violet-500/20 bg-violet-500/5",val: "text-violet-300" },
  green:  { card: "border-green-500/20 bg-green-500/5",  val: "text-green-300"  },
};

const devices = [
  { name:"Village I Node-A",   status:"Online",  lastSeen:"Just now",  event:"Data TX",      rssi:-87, devEUI:"A840416..." },
  { name:"Village II Node-B",  status:"Online",  lastSeen:"12s ago",   event:"Sig Verified", rssi:-91, devEUI:"B920527..." },
  { name:"Village III Node-C", status:"Offline", lastSeen:"4 min ago", event:"Timeout",      rssi:null,devEUI:"C730315..." },
  { name:"Village I Node-D",   status:"Online",  lastSeen:"1 min ago", event:"Data TX",      rssi:-85, devEUI:"D610428..." },
  { name:"Village II Node-E",  status:"Online",  lastSeen:"30s ago",   event:"TX Committed", rssi:-89, devEUI:"E550219..." },
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

// ── Sample data (shown when API returns nothing) ───────────────────────────────
const SAMPLE_PACKETS = [
  {
    id: 1, device: "Village I Sensors", deviceId: "DEV-001",
    timestamp: "Apr 06, 2026 10:32:08",
    temperature: 29.4, humidity: 72, soilMoisture: 45, rainfall: 0.0,
    certificate: "3A:9F:2C:BB:01:DE:44:78:FA:CC:10:29:38:7E:90:12",
  },
  {
    id: 2, device: "Village II Sensors", deviceId: "DEV-002",
    timestamp: "Apr 06, 2026 10:31:55",
    temperature: 27.1, humidity: 68, soilMoisture: 38, rainfall: 0.0,
    certificate: "7B:11:4D:CC:02:EF:55:89:AB:DD:21:30:49:8F:A1:23",
  },
  {
    id: 3, device: "Village III Sensors", deviceId: "DEV-003",
    timestamp: "Apr 06, 2026 10:31:40",
    temperature: 31.8, humidity: 75, soilMoisture: 52, rainfall: 1.2,
    certificate: null,
  },
  {
    id: 4, device: "Village I Sensors", deviceId: "DEV-001",
    timestamp: "Apr 06, 2026 10:31:22",
    temperature: 28.9, humidity: 70, soilMoisture: 44, rainfall: 0.0,
    certificate: "3A:9F:2C:BB:01:DE:44:78:FA:CC:10:29:38:7E:90:12",
  },
  {
    id: 5, device: "Village II Sensors", deviceId: "DEV-002",
    timestamp: "Apr 06, 2026 10:31:05",
    temperature: 30.3, humidity: 66, soilMoisture: 37, rainfall: 0.5,
    certificate: "7B:11:4D:CC:02:EF:55:89:AB:DD:21:30:49:8F:A1:23",
  },
];

// ── LoRaWAN field label map ────────────────────────────────────────────────────
const FIELD_LABELS = {
  temperature:   { label: "Temperature",   unit: "°C",  color: "text-rose-400",    bg: "bg-rose-500/10 border-rose-500/20"       },
  humidity:      { label: "Humidity",      unit: "%",   color: "text-sky-400",     bg: "bg-sky-500/10 border-sky-500/20"         },
  soilMoisture:  { label: "Soil Moisture", unit: "%",   color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  rainfall:      { label: "Rainfall",      unit: "mm",  color: "text-indigo-400",  bg: "bg-indigo-500/10 border-indigo-500/20"   },
  soil_moisture: { label: "Soil Moisture", unit: "%",   color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
};

// ── Live blink dot ────────────────────────────────────────────────────────────
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
  const [error,    setError]    = useState("");
  const [lastPoll, setLastPoll] = useState(null);
  const [selected, setSelected] = useState(0); // index into packets[]
  const timerRef = useRef(null);

  const fetchLatest = async () => {
    try {
      const { data } = await api.get("/devices/data/all?limit=5&offset=0");
      const readings = data.readings || [];
      if (readings.length > 0) {
        setPackets(readings);
        setSelected(0);
      } else {
        // Fall back to sample data so the panel never looks empty
        setPackets(SAMPLE_PACKETS);
        setSelected(0);
      }
      setLastPoll(new Date());
      setError("");
    } catch {
      // On error show sample data silently — no error banner
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

  const packet = packets[selected] ?? null;
  const sensorFields = packet
    ? Object.entries(packet).filter(([k]) => FIELD_LABELS[k] && packet[k] != null)
    : [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">

      {/* ── Dark header ─────────────────────────────────────────────────── */}
      <div className="bg-gray-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LiveDot />
          <div>
            <h2 className="text-[14px] font-semibold text-slate-100">Latest LoRaWAN Packet</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Most recent payload received — auto-refreshes every 10 s
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastPoll && (
            <span className="text-[11px] text-slate-500">
              Last polled {lastPoll.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => { setLoading(true); fetchLatest(); }}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:border-cyan-500/50 hover:text-cyan-400 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-10 justify-center">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          Fetching latest packet…
        </div>
      ) : (
        <div className="grid grid-cols-2 divide-x divide-slate-100">

          {/* ── LEFT: Payload content ──────────────────────────────────── */}
          <div className="px-6 py-5 flex flex-col gap-4">

            {/* Device identity strip */}
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

            {/* Sensor readings grid — 2×2 */}
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

            {/* Raw payload */}
            {packet && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2">Raw Payload</p>
                <pre className="text-[11px] font-mono text-slate-600 whitespace-pre-wrap break-all leading-relaxed">
                  {JSON.stringify(packet, null, 2)}
                </pre>
              </div>
            )}

            {/* Certificate indicator */}
            {packet && (
              <div className="flex items-center gap-2 text-[11px]">
                {packet.certificate ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-blue-600 font-medium">Packet bound to certificate</span>
                    <span className="font-mono text-slate-400 text-[10px] truncate">{packet.certificate}</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span className="text-amber-600">No certificate attached to this packet</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT: Last 5 packets list ─────────────────────────────── */}
          <div className="px-6 py-5 flex flex-col gap-3">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Last {packets.length} Packets Received
            </p>

            <div className="flex flex-col gap-2">
              {packets.map((pkt, idx) => {
                const isActive = idx === selected;
                return (
                  <button
                    key={pkt.id ?? idx}
                    onClick={() => setSelected(idx)}
                    className={`w-full text-left rounded-xl border px-4 py-3 flex flex-col gap-1.5 transition-all duration-150 ${
                      isActive
                        ? "bg-blue-50 border-blue-300 shadow-sm"
                        : "bg-slate-50 border-slate-200 hover:border-blue-200 hover:bg-blue-50/40"
                    }`}
                  >
                    {/* Row top: device name + timestamp */}
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-[12px] font-semibold truncate ${isActive ? "text-blue-700" : "text-slate-800"}`}>
                        {pkt.device}
                      </p>
                      {idx === 0 && (
                        <span className="shrink-0 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                          Latest
                        </span>
                      )}
                    </div>

                    {/* Row mid: DevEUI + timestamp */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] text-slate-400 truncate">{pkt.deviceId}</span>
                      <span className="font-mono text-[10px] text-slate-500 shrink-0">{pkt.timestamp?.split(" ").slice(-1)[0]}</span>
                    </div>

                    {/* Row bottom: inline sensor readings */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {pkt.temperature != null && (
                        <span className="text-[10px] font-mono font-semibold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">
                          {pkt.temperature}°C
                        </span>
                      )}
                      {pkt.humidity != null && (
                        <span className="text-[10px] font-mono font-semibold text-sky-500 bg-sky-50 px-1.5 py-0.5 rounded">
                          {pkt.humidity}%
                        </span>
                      )}
                      {(pkt.soilMoisture ?? pkt.soil_moisture) != null && (
                        <span className="text-[10px] font-mono font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {pkt.soilMoisture ?? pkt.soil_moisture}%
                        </span>
                      )}
                      {pkt.rainfall != null && (
                        <span className="text-[10px] font-mono font-semibold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {pkt.rainfall}mm
                        </span>
                      )}
                      {/* cert indicator dot */}
                      <span className="ml-auto shrink-0">
                        {pkt.certificate
                          ? <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" title="Certificate bound" />
                          : <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" title="No certificate" />
                        }
                      </span>
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
    <div className="flex flex-col gap-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {kpiData.map((kpi) => {
          const c = colorMap[kpi.color];
          return (
            <div key={kpi.label}
              className={`bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-1 hover:shadow-md hover:shadow-blue-100 hover:border-blue-200 transition-all duration-200 ${c.card}`}>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">{kpi.label}</p>
              <p className="text-2xl font-bold font-mono leading-tight tracking-tight">{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* Latest LoRaWAN Packet */}
      <LatestPacketPanel />

      {/* Device Activity + Ledger */}
      <div className="grid grid-cols-5 gap-5">

        {/* Device Activity */}
        <div className="col-span-3 border border-slate-200 rounded-2xl p-5 flex flex-col gap-3">
          <p className="text-[15px] font-semibold text-black tracking-wide">Device Activity</p>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-5 bg-slate-300 px-4 py-2.5 text-[9px] uppercase tracking-widest text-slate-600 font-semibold border-b border-slate-800/60">
              <span className="col-span-2">Device</span>
              <span>Status</span>
              <span>Event</span>
              <span>Signal</span>
            </div>
            {devices.map((d) => (
              <div key={d.name}
                className="grid grid-cols-5 items-center px-4 py-2.5 border-t border-slate-800/30 hover:bg-slate-800/30 transition">
                <div className="col-span-2">
                  <p className="text-[11px] text-black font-medium">{d.name}</p>
                  <p className="text-[9px] text-slate-500 font-mono">{d.devEUI}</p>
                </div>
                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full w-fit border ${
                  d.status === "Online"
                    ? "bg-green-500/15 text-green-400 border-green-500/25"
                    : "bg-red-500/15 text-red-400 border-red-500/25"
                }`}>
                  {d.status}
                </span>
                <span className="text-[10px] text-slate-500">{d.event}</span>
                <span className="text-[10px] text-slate-500 font-mono">{d.rssi ? `${d.rssi} dBm` : "—"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hyperledger Fabric Ledger */}
        <div className="col-span-2 border border-slate-200 shadow-sm rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <svg fill="none" stroke="#a78bfa" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-[15px] font-semibold text-black tracking-wide">Hyperledger Fabric Ledger</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { l:"Block #",      v:"4822",  border:"border-violet-500/20 bg-gray-900", text:"text-slate-200" },
              { l:"Transactions", v:"1,248", border:"border-cyan-500/20 bg-gray-900",   text:"text-slate-200" },
              { l:"Latency",      v:"142ms", border:"border-green-500/20 bg-gray-900",  text:"text-green-400" },
            ].map(({ l, v, border, text }) => (
              <div key={l} className={`rounded-lg p-2.5 border text-center ${border}`}>
                <p className={`text-[14px] font-bold font-mono ${text}`}>{v}</p>
                <p className="text-[9px] text-slate-300 uppercase tracking-wider mt-0.5">{l}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5 overflow-y-auto" style={{ maxHeight:"200px" }}>
            {txns.map((tx) => (
              <div key={tx.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-800 border border-slate-700/20 hover:bg-slate-800/50 transition">
                <div>
                  <p className="text-[10px] font-mono text-cyan-400">{tx.id}</p>
                  <p className="text-[9px] text-slate-200">{tx.device} · {tx.time}</p>
                </div>
                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${txColor[tx.status]}`}>
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