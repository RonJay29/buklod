import { useState, useEffect } from "react";
import api from "../../services/api";

const SENSOR_FIELDS = [
  { key:"temperature",  label:"Temperature",   unit:"°C",  min:-10, max:50,  step:0.1, color:"text-white",     bg:"bg-red-700/80 border-red-800 "         },
  { key:"humidity",     label:"Humidity",      unit:"%",   min:0,   max:100, step:1,   color:"text-white",     bg:"bg-sky-700/80 border-sky-800 "         },
  { key:"soilMoisture", label:"Soil Moisture", unit:"%",   min:0,   max:100, step:1,   color:"text-white", bg:"bg-emerald-700/80 border-emerald-800 " },
  { key:"rainfall",     label:"Rainfall",      unit:"mm",  min:0,   max:200, step:0.1, color:"text-white",  bg:"bg-indigo-700/80 border-indigo-800 "   },
];

function encodePayload(values) {
  const buf = [];
  SENSOR_FIELDS.forEach(({ key }) => {
    const raw     = Math.round((parseFloat(values[key]) || 0) * 10);
    const clamped = Math.max(-32768, Math.min(32767, raw));
    buf.push(((clamped >> 8) & 0xff).toString(16).padStart(2, "0").toUpperCase());
    buf.push((clamped        & 0xff).toString(16).padStart(2, "0").toUpperCase());
  });
  return buf.join(" ");
}

function randomValues() {
  return {
    temperature:  (20 + Math.random() * 15).toFixed(1),
    humidity:     (40 + Math.random() * 50).toFixed(0),
    soilMoisture: (20 + Math.random() * 60).toFixed(0),
    rainfall:     (Math.random() * 5).toFixed(1),
  };
}

export default function PayloadSimulator({ onSaved }) {
  const [devices,        setDevices]        = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [dropdownOpen,   setDropdownOpen]   = useState(false);
  const [values,         setValues]         = useState(randomValues());
  const [saving,         setSaving]         = useState(false);
  const [saved,          setSaved]          = useState(false);
  const [saveError,      setSaveError]      = useState("");

  useEffect(() => {
    api.get("/devices")
      .then(({ data }) => setDevices(data.devices || []))
      .catch(() => setDevices([]))
      .finally(() => setLoadingDevices(false));
  }, []);

  useEffect(() => {
    const close = (e) => { if (!e.target.closest("#sim-dropdown")) setDropdownOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const signedOnly = devices.filter(d => d.certStatus === "signed");

  const handleSelect = (d) => {
    setSelectedDevice(d);
    setDropdownOpen(false);
    setSaved(false);
    setSaveError("");
  };

  const handleRegenerate = () => {
    setValues(randomValues());
    setSaved(false);
    setSaveError("");
  };

  const handleSave = async () => {
    if (!selectedDevice) return;
    setSaving(true);
    setSaveError("");
    try {
      const rawPayload  = encodePayload(values);
      const decodedData = { ...values };
      await api.post(`/devices/${selectedDevice.id}/data`, { rawPayload, decodedData });
      setSaved(true);
      if (onSaved) onSaved();
    } catch (err) {
      setSaveError(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAnother = () => {
    setValues(randomValues());
    setSaved(false);
    setSaveError("");
  };

  return (
    <div className="border border-slate-800/60 rounded-2xl overflow-hidden shadow-md">

      {/* Header */}
      <div className="bg-[#0a1628] flex items-center gap-3 px-6 py-4 border-b border-slate-800/60">
        <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center shrink-0">
          <svg fill="none" stroke="#22d3ee" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-slate-200">Payload Generator</p>
          <p className="text-[10px] text-slate-500">Generate and save sample sensor data for a device</p>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-5">

        {/* ── Step 1: Device selector ──────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-900">1 · Select Device</p>

          <div className="relative" id="sim-dropdown">
            <button onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition ${
                selectedDevice
                  ? "bg-slate-900 border-cyan-500/30"
                  : "bg-white border-4 border-gray-900 hover:border-blue-500/70"
              }`}>
              <div className="flex items-center gap-3 min-w-0">
                {selectedDevice ? (
                  <>
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center shrink-0">
                      <svg fill="none" stroke="#22d3ee" strokeWidth="1.8" viewBox="0 0 24 24" className="w-3.5 h-3.5">
                        <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                      </svg>
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-[13px] font-medium text-slate-200 truncate">{selectedDevice.name}</p>
                      <p className="text-[10px] font-mono text-slate-200">{selectedDevice.deviceId} · {selectedDevice.location}</p>
                    </div>
                  </>
                ) : (
                  <span className="text-slate-900 text-sm">
                    {loadingDevices ? "Loading devices…" : "Choose a certified device…"}
                  </span>
                )}
              </div>
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}>
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl z-20 overflow-hidden">
                {signedOnly.length === 0 ? (
                  <div className="px-4 py-4 text-center">
                    <p className="text-xs text-slate-500">No certified devices found.</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">Sign a device certificate first in Manage Devices.</p>
                  </div>
                ) : (
                  <div className="py-1 max-h-48 overflow-y-auto">
                    {signedOnly.map(d => (
                      <button key={d.id} onClick={() => handleSelect(d)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-800/60 transition ${
                          selectedDevice?.id === d.id ? "bg-cyan-500/10" : ""
                        }`}>
                        <div className="w-6 h-6 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                          <svg fill="none" stroke="#22d3ee" strokeWidth="2" viewBox="0 0 24 24" className="w-3 h-3">
                            <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-medium text-slate-200 truncate">{d.name}</p>
                          <p className="text-[9px] font-mono text-slate-500">{d.deviceId} · {d.location}</p>
                        </div>
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20 shrink-0">
                          Signed
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Step 2: Generated data ───────────────────────────────────────── */}
        <div className={`flex flex-col gap-3 transition-opacity duration-200 ${selectedDevice ? "opacity-100" : "opacity-30 pointer-events-none"}`}>
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-900">2 · Generated Data</p>
            <button onClick={handleRegenerate}
              className="flex items-center gap-1.5 text-[10px] text-white hover:text-cyan-300 border border-cyan-500/25 hover:border-cyan-500/40 px-3 py-1.5 rounded-lg transition bg-blue-500/70 ">
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3 h-3">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerate
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {SENSOR_FIELDS.map(f => (
              <div key={f.key} className={`rounded-xl border px-3 py-3 text-center ${f.bg}`}>
                <p className={`text-[12px] uppercase tracking-wider font-semibold mb-1.5 ${f.color}`}>{f.label}</p>
                <p className={`text-[22px] font-bold font-mono leading-tight ${f.color}`}>
                  {values[f.key]}
                  <span className="text-[10px] font-normal ml-0.5">{f.unit}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Raw payload preview */}
          <div className="flex items-center gap-3 bg-slate-200/30 border border-slate-700/40 rounded-xl px-4 py-2.5">
            <span className="text-[11px] uppercase tracking-widest text-slate-600 font-semibold shrink-0">Raw Hex:</span>
            <span className="font-mono text-[11px] text-black tracking-widest truncate">
              {encodePayload(values)}
            </span>
          </div>
        </div>

        {/* ── Step 3: Save ─────────────────────────────────────────────────── */}
        <div className={`transition-opacity duration-200 ${selectedDevice ? "opacity-100" : "opacity-30 pointer-events-none"}`}>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-900 mb-3">3 · Save to Database</p>

          {!saved ? (
            <div className="flex flex-col gap-2">
              <button onClick={handleSave} disabled={saving || !selectedDevice}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-500/70 border border-blue-600/30 text-white font-semibold text-md hover:bg-blue-600/70 disabled:opacity-40 disabled:cursor-not-allowed transition">
                {saving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Saving…
                  </>
                ) : (
                  <>
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save
                  </>
                )}
              </button>
              {saveError && (
                <p className="text-[11px] text-red-400 flex items-center gap-1.5">
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  </svg>
                  {saveError}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Success banner */}
              <div className="flex items-center justify-between gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <svg fill="none" stroke="#4ade80" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <div>
                    <p className="text-[12px] text-green-400 font-semibold">Saved to device_data</p>
                    <p className="text-[10px] text-slate-500">{selectedDevice?.name} · {new Date().toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
              {/* Save another */}
              <button onClick={handleSaveAnother}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-700/50 text-slate-400 text-sm hover:bg-slate-800/40 hover:text-slate-200 transition">
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3.5 h-3.5">
                  <path d="M12 4v16m8-8H4" />
                </svg>
                Generate another reading
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}