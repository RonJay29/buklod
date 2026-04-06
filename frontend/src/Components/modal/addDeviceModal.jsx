import { useState, useEffect } from "react";
import { Modal } from "./ModalBase";
import api from "../../services/api";

const IconLock = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4">
    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);
const IconCert = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4">
    <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

// HMAC length options with context-specific descriptions
const HMAC_OPTIONS = [
  { value: 8,  label: "8 bytes",  desc: "Compact — saves airtime on slow SF12 uplinks, lower collision resistance" },
  { value: 12, label: "12 bytes", desc: "Balanced — good for SF9–SF11, moderate tag size" },
  { value: 16, label: "16 bytes", desc: "Recommended — 128-bit tag, strong integrity for most deployments" },
  { value: 20, label: "20 bytes", desc: "Strong — matches HMAC-SHA1 output, suitable for regulated data" },
  { value: 24, label: "24 bytes", desc: "High assurance — 192-bit tag for critical sensor chains" },
  { value: 32, label: "32 bytes", desc: "Full HMAC-SHA256 — maximum integrity, high-security use only" },
];

export default function AddDeviceModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name:       "",
    location:   "",
    devEUI:     "",
    hmacLength: 16,
  });
  const [errors,      setErrors]      = useState({});
  const [certificate, setCertificate] = useState("");
  const [certLoading, setCertLoading] = useState(true);
  const [certError,   setCertError]   = useState("");
  const [certMode,    setCertMode]    = useState("signed");
  const [submitting,  setSubmitting]  = useState(false);
  const [showHmacInfo,setShowHmacInfo]= useState(false);

  useEffect(() => {
    const fetchCert = async () => {
      setCertLoading(true);
      setCertError("");
      try {
        const { data } = await api.get("/devices/generate-certificate");
        setCertificate(data.certificate);
      } catch {
        setCertError("Failed to fetch certificate from CA. You can still add the device as unsigned.");
      } finally {
        setCertLoading(false);
      }
    };
    fetchCert();
  }, []);

  const set = (key) => (e) => {
    const val = key === "hmacLength" ? Number(e.target.value) : e.target.value;
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: false }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())     e.name     = "Device name is required";
    if (!form.location.trim()) e.location = "Location is required";
    if (!form.devEUI.trim())   e.devEUI   = "DevEUI is required";
    else if (!/^[0-9A-Fa-f]{16}$/.test(form.devEUI.trim()))
      e.devEUI = "DevEUI must be exactly 16 hex characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onAdd({
        name:        form.name.trim(),
        location:    form.location.trim(),
        devEUI:      form.devEUI.trim().toUpperCase(),
        hmacLength:  form.hmacLength,
        certificate: certMode === "signed" && certificate ? certificate : "UNSIGNED",
        certStatus:  certMode,
      });
      onClose();
    } catch {
      // errors surfaced via onAdd's alert
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase = "w-full px-4 py-2.5 rounded-xl border text-sm bg-slate-50 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition";
  const selectedHmac = HMAC_OPTIONS.find(o => o.value === form.hmacLength);

  return (
    <Modal title="Add New Device" onClose={onClose}>
      <div className="flex flex-col gap-5">

        {/* ── Device identity ──────────────────────────────────────────── */}
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Device Identity</p>
        </div>

        <div className="flex flex-col gap-3">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">
              Device Name <span className="text-rose-500">*</span>
            </label>
            <input value={form.name} onChange={set("name")} placeholder="e.g. Village I Sensors"
              className={`${inputBase} ${errors.name ? "border-rose-400 bg-rose-50" : "border-slate-200"}`} />
            {errors.name && <p className="text-[11px] text-rose-500">{errors.name}</p>}
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">
              Location <span className="text-rose-500">*</span>
            </label>
            <input value={form.location} onChange={set("location")} placeholder="e.g. Village I"
              className={`${inputBase} ${errors.location ? "border-rose-400 bg-rose-50" : "border-slate-200"}`} />
            {errors.location && <p className="text-[11px] text-rose-500">{errors.location}</p>}
          </div>

          {/* DevEUI */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-2">
              DevEUI <span className="text-rose-500">*</span>
              <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                16 hex characters · LoRaWAN node identifier
              </span>
            </label>
            <input value={form.devEUI} onChange={set("devEUI")} placeholder="e.g. A8B3C4D5E6F70102"
              maxLength={16}
              className={`${inputBase} font-mono uppercase tracking-widest ${errors.devEUI ? "border-rose-400 bg-rose-50" : "border-slate-200"}`} />
            {errors.devEUI
              ? <p className="text-[11px] text-rose-500">{errors.devEUI}</p>
              : <p className="text-[11px] text-slate-400">The 64-bit EUI is burned into the LoRaWAN module and acts as the certificate pointer on every uplink.</p>
            }
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* ── HMAC Length ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Security Configuration</p>
            </div>
            {/* <button type="button" onClick={() => setShowHmacInfo(v => !v)}
              className="text-[10px] text-blue-600 hover:underline font-medium">
              {showHmacInfo ? "Hide info" : "What is HMAC length?"}
            </button> */}
          </div>

         
          {showHmacInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3.5 flex flex-col gap-2">
              <p className="text-[12px] font-semibold text-blue-800">What is HMAC Length?</p>
              <p className="text-[11px] text-blue-700 leading-relaxed">
                Every sensor payload transmitted over LoRaWAN is signed with an
                <strong> HMAC-SHA256</strong> tag derived from the device's PNPKI certificate.
                This tag is appended to each uplink to prove the data came from a
                <strong> legitimate, certificate-bound node</strong> and was not tampered with
                in transit.
              </p>
              <p className="text-[11px] text-blue-700 leading-relaxed">
                Because LoRaWAN payloads are strictly limited in size (typically 11–242 bytes
                depending on Spreading Factor), sending the full 32-byte SHA-256 output may
                consume too much of the airtime budget. <strong>HMAC length controls how many bytes
                of the tag are transmitted</strong> — a truncated tag still provides strong
                integrity while preserving payload space for sensor readings.
              </p>
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                {HMAC_OPTIONS.map(o => (
                  <div key={o.value} className="text-[10px] text-blue-600 flex gap-1.5">
                    <span className="font-mono font-bold shrink-0">{o.label}:</span>
                    <span>{o.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">HMAC Tag Length</label>
            <select value={form.hmacLength} onChange={set("hmacLength")}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition">
              {HMAC_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label} — {o.desc.split(" — ")[0] || o.desc.slice(0,30)}</option>
              ))}
            </select>
            {/* {selectedHmac && (
              <p className="text-[11px] text-slate-400">{selectedHmac.desc}</p>
            )} */}
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* ── Certificate ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">DICT PNPKI Certificate</p>

          {certLoading ? (
            <div className="flex items-center gap-2 text-slate-400 text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Fetching certificate from CA…
            </div>
          ) : certError ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-4 py-2.5 rounded-xl">
              {certError}
            </div>
          ) : (
            <div className="bg-blue-50/50 border border-blue-200 rounded-xl px-4 py-3">
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Certificate Serial</p>
              <p className="font-mono text-[12px] text-slate-800 break-all leading-relaxed">{certificate}</p>
            </div>
          )}

          {/* Sign now / Unsigned toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setCertMode("signed")}
              disabled={!certificate || certLoading}
              className={`flex items-center justify-center gap-1.5 text-xs py-2.5 rounded-xl border font-medium transition ${
                certMode === "signed" && certificate && !certLoading
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
              }`}>
              <IconCert /> Sign Now
            </button>
            <button type="button" onClick={() => setCertMode("unsigned")}
              className={`flex items-center justify-center gap-1.5 text-xs py-2.5 rounded-xl border font-medium transition ${
                certMode === "unsigned"
                  ? "bg-amber-500 text-white border-amber-500"
                  : "border-slate-200 text-slate-400 hover:border-amber-300 hover:text-amber-600"
              }`}>
              <IconLock /> Unsigned
            </button>
          </div>

          {/* {certMode === "signed" && certificate && (
            <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
              <svg fill="none" stroke="#16a34a" strokeWidth="2" viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0 mt-0.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p className="text-[11px] text-green-700 leading-relaxed">
                Device will be enrolled with a PNPKI-issued certificate. The certificate serial will be embedded in every uplink payload and verified against Hyperledger Fabric on receipt.
              </p>
            </div>
          )} */}

          {/* {certMode === "unsigned" && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <svg fill="none" stroke="#d97706" strokeWidth="2" viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0 mt-0.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Device will be enrolled <strong>without a certificate</strong>. Uplink payloads from this device will not be verified until a certificate is signed. You can sign it later from the devices table.
              </p>
            </div>
          )} */}
        </div>

        <p className="text-[11px] text-slate-400">
          <span className="text-rose-500">*</span> Required fields
        </p>

        {/* Actions */}
        <div className="flex gap-3 pb-1">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition">
            Cancel
          </button>
          <button onClick={handleAdd} disabled={submitting || certLoading}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
            {submitting ? "Adding…" : "Add Device"}
          </button>
        </div>

      </div>
    </Modal>
  );
}