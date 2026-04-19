import { useState } from "react";
import { Modal, inputClass } from "./modalBase";

export default function AddDeviceModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name:        "",
    location:    "",
    devEUI:      "",
    description: "",
  });
  const [errors,     setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: false }));
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
        description: form.description.trim() || null,
      });
      onClose();
    } catch {
      // errors surfaced via onAdd's alert
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Add New Device" onClose={onClose}>
      <div className="flex flex-col gap-5">

        {/* ── Device Identity section ─────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Device Identity
          </p>

          {/* Device Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">
              Device Name <span className="text-rose-500">*</span>
            </label>
            <input
              value={form.name} onChange={set("name")}
              placeholder="e.g. Village I Sensors"
              className={inputClass(!!errors.name)}
            />
            {errors.name && <p className="text-[11px] text-rose-500">{errors.name}</p>}
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">
              Location <span className="text-rose-500">*</span>
            </label>
            <input
              value={form.location} onChange={set("location")}
              placeholder="e.g. Village I"
              className={inputClass(!!errors.location)}
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
              value={form.devEUI} onChange={set("devEUI")}
              placeholder="e.g. A8B3C4D5E6F70102"
              maxLength={16}
              className={`${inputClass(!!errors.devEUI)} font-mono uppercase tracking-widest`}
            />
            {errors.devEUI
              ? <p className="text-[11px] text-rose-500">{errors.devEUI}</p>
              : <p className="text-[11px] text-slate-400">The 64-bit EUI burned into the LoRaWAN module.</p>
            }
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">
              Description <span className="text-slate-300 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.description} onChange={set("description")}
              placeholder="Describe this device's purpose or deployment notes…"
              rows={3}
              className={`${inputClass()} resize-none`}
            />
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* Enrollment note */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <svg fill="none" stroke="#d97706" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4 shrink-0 mt-0.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
          <p className="text-[11px] text-amber-700 leading-relaxed">
            Device will be enrolled as <strong>Unsigned</strong>. Sign its certificate from the Manage Devices table after adding.
          </p>
        </div>

        <p className="text-[11px] text-slate-400">
          <span className="text-rose-500">*</span> Required fields
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition">
            Cancel
          </button>
          <button onClick={handleAdd} disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
            {submitting ? "Adding…" : "Add Device"}
          </button>
        </div>

      </div>
    </Modal>
  );
}