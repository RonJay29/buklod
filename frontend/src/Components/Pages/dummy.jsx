import { useEffect, useRef, useState } from "react";
import {
  Chart, LineElement, PointElement, LineController,
  CategoryScale, LinearScale, Filler, Tooltip, Legend,
} from "chart.js";

Chart.register(LineElement, PointElement, LineController, CategoryScale, LinearScale, Filler, Tooltip, Legend);

// ── Static data ───────────────────────────────────────────────────────────────
const kpiData = [
  { label: "Total Devices",        value: "3",        icon: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18", color: "cyan"   },
  { label: "Total Data",           value: "21",       icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10", color: "blue"   },
  { label: "Transactions",         value: "21",       icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",                                       color: "violet" },
  { label: "Certificate Validity", value: "730 Days", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622", color: "green" },
];

const colorMap = {
  cyan:   { card: "border-cyan-500/20 bg-cyan-500/5",    icon: "text-cyan-400",   val: "text-cyan-300",   dot: "bg-cyan-400"   },
  blue:   { card: "border-blue-500/20 bg-blue-500/5",    icon: "text-blue-400",   val: "text-blue-300",   dot: "bg-blue-400"   },
  violet: { card: "border-violet-500/20 bg-violet-500/5", icon: "text-violet-400", val: "text-violet-300", dot: "bg-violet-400" },
  green:  { card: "border-green-500/20 bg-green-500/5",  icon: "text-green-400",  val: "text-green-300",  dot: "bg-green-400"  },
};

const weekLabels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const chartDatasets = [
  { label:"Village I",   data:[12,9,14,11,15,8,13],  borderColor:"rgb(34,211,238)",  backgroundColor:"rgba(34,211,238,0.07)",  fill:true, tension:0.4, pointRadius:3, pointHoverRadius:5, borderWidth:2 },
  { label:"Village II",  data:[8,13,10,16,12,14,9],  borderColor:"rgb(52,211,153)",  backgroundColor:"rgba(52,211,153,0.07)",  fill:true, tension:0.4, pointRadius:3, pointHoverRadius:5, borderWidth:2 },
  { label:"Village III", data:[5,7,9,8,11,6,10],     borderColor:"rgb(167,139,250)", backgroundColor:"rgba(167,139,250,0.07)", fill:true, tension:0.4, pointRadius:3, pointHoverRadius:5, borderWidth:2 },
];

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

// ── Latest LoRaWAN packets ────────────────────────────────────────────────────
const latestPackets = [
  {
    devEUI:    "A840416F18374308",
    device:    "Village I Node-A",
    fcnt:      217,
    rssi:      -87,
    snr:       4.2,
    freq:      "923.2 MHz",
    dr:        "SF7BW125",
    time:      "10:32:01",
    payloadHex:"54 3A 9F 01 2C 00 45 00 1C",
    decoded: { temperature: 28.4, humidity: 72, soilMoisture: 45, rainfall: 0.0 },
    certSerial:"3A:9F:2C:BB:01:DE:44:78:FA:CC:10:29:38:7E:90:12",
    verified:  true,
  },
  {
    devEUI:    "B920527C34581204",
    device:    "Village II Node-B",
    fcnt:      184,
    rssi:      -91,
    snr:       3.8,
    freq:      "923.4 MHz",
    dr:        "SF8BW125",
    time:      "10:32:05",
    payloadHex:"53 7B 11 00 44 00 25 00 00",
    decoded: { temperature: 27.1, humidity: 68, soilMoisture: 38, rainfall: 0.0 },
    certSerial:"7B:11:4D:CC:02:EF:55:89:AB:DD:21:30:49:8F:A1:23",
    verified:  true,
  },
  {
    devEUI:    "D610428A19263507",
    device:    "Village I Node-D",
    fcnt:      96,
    rssi:      -85,
    snr:       5.1,
    freq:      "922.8 MHz",
    dr:        "SF7BW125",
    time:      "10:32:09",
    payloadHex:"55 2F 61 01 3A 00 2A 00 00",
    decoded: { temperature: 29.2, humidity: 70, soilMoisture: 44, rainfall: 0.0 },
    certSerial:"2F:61:AA:DD:03:BC:66:90:CD:EE:32:41:5A:90:B2:34",
    verified:  true,
  },
];

// ── Packet detail modal ───────────────────────────────────────────────────────
function PacketModal({ packet, onClose }) {
  if (!packet) return null;
  const { decoded } = packet;
  const sensors = [
    { label:"Temperature", value:`${decoded.temperature} °C`, color:"text-red-400",     bg:"bg-red-500/10 border-red-500/20"     },
    { label:"Humidity",    value:`${decoded.humidity} %`,     color:"text-sky-400",     bg:"bg-sky-500/10 border-sky-500/20"     },
    { label:"Soil Moisture",value:`${decoded.soilMoisture} %`,color:"text-green-400",  bg:"bg-green-500/10 border-green-500/20" },
    { label:"Rainfall",    value:`${decoded.rainfall} mm`,    color:"text-indigo-400",  bg:"bg-indigo-500/10 border-indigo-500/20"},
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-[#0a1628] border border-slate-700/60 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
              <svg fill="none" stroke="#22d3ee" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-slate-200">{packet.device}</p>
              <p className="text-[10px] text-slate-500 font-mono">{packet.devEUI}</p>
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

          {/* LoRaWAN metadata */}
          <div>
            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold mb-2">LoRaWAN Packet Metadata</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["FCnt",      packet.fcnt],
                ["RSSI",      `${packet.rssi} dBm`],
                ["SNR",       `${packet.snr} dB`],
                ["Frequency", packet.freq],
                ["Data Rate", packet.dr],
                ["Time",      packet.time],
              ].map(([l, v]) => (
                <div key={l} className="rounded-lg border border-slate-700/40 bg-slate-900/40 px-3 py-2">
                  <p className="text-[9px] text-slate-600 uppercase tracking-widest">{l}</p>
                  <p className="text-[11px] text-slate-300 font-mono mt-0.5">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Raw payload */}
          <div>
            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Raw Payload (Hex)</p>
            <div className="rounded-xl border border-slate-700/40 bg-slate-900/60 px-4 py-3">
              <p className="font-mono text-[12px] text-cyan-400/90 tracking-widest">{packet.payloadHex}</p>
            </div>
          </div>

          {/* Decoded sensor readings */}
          <div>
            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Decoded Sensor Readings</p>
            <div className="grid grid-cols-2 gap-2">
              {sensors.map(s => (
                <div key={s.label} className={`rounded-xl border px-4 py-3 ${s.bg}`}>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest">{s.label}</p>
                  <p className={`text-[18px] font-bold font-mono mt-0.5 ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Certificate */}
          <div>
            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold mb-2">PNPKI Certificate</p>
            <div className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-3 ${
              packet.verified
                ? "bg-green-500/10 border-green-500/20"
                : "bg-red-500/10 border-red-500/20"
            }`}>
              <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Certificate Serial</p>
                <p className="font-mono text-[11px] text-cyan-400/80">{packet.certSerial}</p>
              </div>
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${
                packet.verified
                  ? "bg-green-500/15 text-green-400 border-green-500/25"
                  : "bg-red-500/15 text-red-400 border-red-500/25"
              }`}>
                {packet.verified ? "✓ Verified" : "✗ Invalid"}
              </span>
            </div>
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

// ── Weekly Chart ──────────────────────────────────────────────────────────────
function WeeklyChart() {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: { labels: weekLabels, datasets: chartDatasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: true, position: "top", align: "end", labels: { font:{size:11}, boxWidth:10, boxHeight:10, color:"#94a3b8", useBorderRadius:true, borderRadius:2, padding:16 } },
          tooltip: { backgroundColor:"#0f172a", titleColor:"#94a3b8", bodyColor:"#e2e8f0", padding:10, cornerRadius:8, callbacks:{ label:(ctx)=>` ${ctx.dataset.label}: ${ctx.parsed.y} packets` } },
        },
        scales: {
          x: { grid:{ display:false }, ticks:{ font:{size:11}, color:"#475569" }, border:{ display:false } },
          y: { beginAtZero:true, grid:{ color:"rgba(148,163,184,0.06)" }, ticks:{ font:{size:11}, color:"#475569", stepSize:4 }, border:{ display:false } },
        },
      },
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, []);

  return <div style={{ position:"relative", width:"100%", height:"220px" }}><canvas ref={canvasRef} /></div>;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard({ activePage }) {
  const [activePacket, setActivePacket] = useState(null);

  return (
    <>
      <div className="flex flex-col gap-5">

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          {kpiData.map((kpi) => {
            const c = colorMap[kpi.color];
            return (
              <div key={kpi.label}
                className={`rounded-xl border p-4 flex flex-col gap-3 hover:brightness-110 transition-all duration-200 ${c.card}`}>
                <div className="flex items-center justify-between">
                  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className={`w-5 h-5 ${c.icon}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={kpi.icon} />
                  </svg>
                  <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold font-mono leading-tight tracking-tight ${c.val}`}>{kpi.value}</p>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">{kpi.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chart panel */}
        <div className="bg-[#0a1628] border border-slate-700/50 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[13px] font-semibold text-slate-200 tracking-wide">Data Received This Week</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Packets transmitted per device — weekly view</p>
            </div>
            <div className="flex gap-1 bg-slate-800/80 p-1 rounded-lg">
              {["Week","Month","Quarter","Year"].map((p, i) => (
                <button key={p}
                  className={`text-[11px] px-3 py-1.5 rounded-md font-medium transition ${
                    i === 0 ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-slate-500 hover:text-slate-300"
                  }`}>{p}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-700/30 bg-slate-900/30 p-4">
            <WeeklyChart />
          </div>
        </div>

        {/* Latest LoRaWAN Packets */}
        <div className="bg-[#0a1628] border border-slate-800/60 rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg fill="none" stroke="#22d3ee" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
              <p className="text-[11px] font-semibold text-slate-300 tracking-wide">Latest LoRaWAN Packets</p>
            </div>
            <span className="text-[10px] text-slate-600 font-mono">Live uplink feed</span>
          </div>

          <div className="rounded-xl border border-slate-800/60 overflow-hidden">
            {/* Table header */}
            <div className="grid bg-slate-900/60 px-4 py-2.5 text-[9px] uppercase tracking-widest text-slate-600 font-semibold border-b border-slate-800/60"
              style={{ gridTemplateColumns:"1.8fr 1fr 1fr 1fr 1fr 1fr 1fr" }}>
              <span>Device / DevEUI</span>
              <span>FCnt</span>
              <span>RSSI</span>
              <span>Freq</span>
              <span>Payload (Hex)</span>
              <span>Cert</span>
              <span className="text-right">Details</span>
            </div>

            {latestPackets.map((pkt) => (
              <div key={pkt.devEUI}
                className="grid items-center px-4 py-3 border-t border-slate-800/30 hover:bg-slate-800/30 transition"
                style={{ gridTemplateColumns:"1.8fr 1fr 1fr 1fr 1fr 1fr 1fr" }}>
                <div>
                  <p className="text-[11px] text-slate-300 font-medium">{pkt.device}</p>
                  <p className="text-[9px] text-slate-600 font-mono">{pkt.devEUI}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{pkt.fcnt}</span>
                <span className="text-[10px] text-slate-400 font-mono">{pkt.rssi} dBm</span>
                <span className="text-[10px] text-slate-500">{pkt.freq}</span>
                <span className="font-mono text-[9px] text-cyan-400/70 truncate max-w-[90px]">{pkt.payloadHex.slice(0, 14)}…</span>
                <span>
                  {pkt.verified
                    ? <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25">✓ Valid</span>
                    : <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/25">✗ Invalid</span>
                  }
                </span>
                <div className="flex justify-end">
                  <button onClick={() => setActivePacket(pkt)}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/25 text-cyan-400 hover:bg-cyan-500/25 transition font-medium">
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Activity + Ledger */}
        <div className="grid grid-cols-5 gap-5">

          {/* Device Activity Table */}
          <div className="col-span-3 bg-[#0a1628] border border-slate-800/60 rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <svg fill="none" stroke="#22d3ee" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
              </svg>
              <p className="text-[11px] font-semibold text-slate-300 tracking-wide">Device Activity</p>
            </div>
            <div className="rounded-xl border border-slate-800/60 overflow-hidden">
              <div className="grid grid-cols-5 bg-slate-900/60 px-4 py-2.5 text-[9px] uppercase tracking-widest text-slate-600 font-semibold border-b border-slate-800/60">
                <span className="col-span-2">Device</span>
                <span>Status</span>
                <span>Event</span>
                <span>Signal</span>
              </div>
              {devices.map((d) => (
                <div key={d.name}
                  className="grid grid-cols-5 items-center px-4 py-2.5 border-t border-slate-800/30 hover:bg-slate-800/30 transition">
                  <div className="col-span-2">
                    <p className="text-[11px] text-slate-300 font-medium">{d.name}</p>
                    <p className="text-[9px] text-slate-600 font-mono">{d.devEUI}</p>
                  </div>
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full w-fit border ${
                    d.status === "Online" ? "bg-green-500/15 text-green-400 border-green-500/25" : "bg-red-500/15 text-red-400 border-red-500/25"
                  }`}>{d.status}</span>
                  <span className="text-[10px] text-slate-500">{d.event}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{d.rssi ? `${d.rssi} dBm` : "—"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hyperledger Fabric Ledger */}
          <div className="col-span-2 bg-[#0a1628] border border-slate-800/60 rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <svg fill="none" stroke="#a78bfa" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-[11px] font-semibold text-slate-300 tracking-wide">Hyperledger Fabric Ledger</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { l:"Block #", v:"4822",  border:"border-violet-500/20 bg-violet-500/10", text:"text-violet-400" },
                { l:"Txns",    v:"1,248", border:"border-cyan-500/20 bg-cyan-500/10",     text:"text-cyan-400"   },
                { l:"Latency", v:"142ms", border:"border-green-500/20 bg-green-500/10",   text:"text-green-400"  },
              ].map(({ l, v, border, text }) => (
                <div key={l} className={`rounded-lg p-2.5 border text-center ${border}`}>
                  <p className={`text-[14px] font-bold font-mono ${text}`}>{v}</p>
                  <p className="text-[9px] text-slate-600 uppercase tracking-wider mt-0.5">{l}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1.5 overflow-y-auto" style={{ maxHeight:"140px" }}>
              {txns.map((tx) => (
                <div key={tx.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/30 border border-slate-700/20 hover:bg-slate-800/50 transition">
                  <div>
                    <p className="text-[10px] font-mono text-cyan-400">{tx.id}</p>
                    <p className="text-[9px] text-slate-600">{tx.device} · {tx.time}</p>
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

      {/* Packet detail modal */}
      {activePacket && <PacketModal packet={activePacket} onClose={() => setActivePacket(null)} />}
    </>
  );
}