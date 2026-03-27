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
  // "signed" = will enroll with the fetched cert | "unsigned" = skip cert for now
  const [certMode,    setCertMode]    = useState("signed");
  const [submitting,  setSubmitting]  = useState(false);

  // ── Auto-fetch certificate from CA on modal open ──────────────────────────
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
      // Fix #2: pass the actual certificate (or a placeholder PEM stub when unsigned)
      // so the backend receives a valid value and sets cert_status correctly.
      const payload = {
        name:       form.name.trim(),
        location:   form.location.trim(),
        devEUI:     form.devEUI.trim().toUpperCase(),
        hmacLength: form.hmacLength,
        // Backend expects a PEM-like string to validate; send the serial when
        // signing now, or a clearly-unsigned marker when deferring.
        certificate:
          certMode === "signed" && certificate
            ? certificate
            : "UNSIGNED",
        certStatus: certMode, // let the caller/backend know the intended status
      };
      await onAdd(payload);
      onClose();
    } catch {
      // errors surfaced via onAdd's alert
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (key) =>
    `w-full px-4 py-2.5 rounded-xl border text-sm bg-slate-50 text-slate-800 placeholder-slate-300
     focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition
     ${errors[key] ? "border-rose-400 bg-rose-50" : "border-slate-200"}`;

  return (
    <Modal title="Add New Device" onClose={onClose}>
      <div className="flex flex-col gap-4">

        {/* Device Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600">
            Device Name <span className="text-rose-500">*</span>
          </label>
          <input
            value={form.name}
            onChange={set("name")}
            placeholder="e.g. Village I Sensors"
            className={inputClass("name")}
          />
          {errors.name && <p className="text-[11px] text-rose-500">{errors.name}</p>}
        </div>

        {/* Location */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600">
            Location <span className="text-rose-500">*</span>
          </label>
          <input
            value={form.location}
            onChange={set("location")}
            placeholder="e.g. Village I"
            className={inputClass("location")}
          />
          {errors.location && <p className="text-[11px] text-rose-500">{errors.location}</p>}
        </div>

        {/* DevEUI */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-2">
            DevEUI <span className="text-rose-500">*</span>
            <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              16 hex characters
            </span>
          </label>
          <input
            value={form.devEUI}
            onChange={set("devEUI")}
            placeholder="e.g. A8B3C4D5E6F70102"
            maxLength={16}
            className={`${inputClass("devEUI")} font-mono uppercase`}
          />
          {errors.devEUI && <p className="text-[11px] text-rose-500">{errors.devEUI}</p>}
        </div>

        {/* HMAC Length */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600">HMAC Length (bytes)</label>
          <select
            value={form.hmacLength}
            onChange={set("hmacLength")}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
          >
            {[8, 12, 16, 20, 24, 32].map((n) => (
              <option key={n} value={n}>{n} bytes</option>
            ))}
          </select>
        </div>

        {/* ── Certificate section ────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-2">
            <IconCert />
            Certificate from CA
          </label>

          {/* Certificate display */}
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
              <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Certificate Serial</p>
              <p className="font-mono text-[12px] text-slate-800 break-all">{certificate}</p>
            </div>
          )}

          {/* Sign now vs unsigned toggle */}
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={() => setCertMode("signed")}
              disabled={!certificate || certLoading}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-xl border font-medium transition
                ${certMode === "signed" && certificate && !certLoading
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
            >
              <IconCert /> Sign Now
            </button>
            <button
              type="button"
              onClick={() => setCertMode("unsigned")}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-xl border font-medium transition
                ${certMode === "unsigned"
                  ? "bg-amber-500 text-white border-amber-500"
                  : "border-slate-200 text-slate-400 hover:border-amber-300 hover:text-amber-600"
                }`}
            >
              <IconLock /> Unsigned
            </button>
          </div>

          {certMode === "unsigned" && (
            <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Device will be enrolled without a certificate. You can sign it later from the devices table.
            </p>
          )}
        </div>

        <p className="text-[11px] text-slate-400">
          <span className="text-rose-500">*</span> Required fields
        </p>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition">
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={submitting || certLoading}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {submitting ? "Adding…" : "Add Device"}
          </button>
        </div>

      </div>
    </Modal>
  );
}