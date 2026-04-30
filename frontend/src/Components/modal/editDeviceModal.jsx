import { useState, useEffect } from "react";
import { Modal, inputClass } from "./modalBase";
import { useFormKeys } from "../../hooks/keyboardKeys";

export default function EditDeviceModal({ device, onClose, onSave }) {
  const [form,       setForm]       = useState({ name:"", location:"", description:"" });
  const [errors,     setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (device) {
      setForm({
        name:        device.name        || "",
        location:    device.location    || "",
        description: device.description || "",
      });
    }
  }, [device]);

  const set = (key) => (e) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: false }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())     e.name     = "Device name is required";
    if (!form.location.trim()) e.location = "Location is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    setSubmitting(true);
    onSave(form);
    onClose();
  };

  // ── Must be INSIDE the component, after handleSave is defined ─────────────
  useFormKeys(handleSave, onClose, !submitting);

  return (
    <Modal title="Edit Device" onClose={onClose}>
      <div className="flex flex-col gap-5">

        {/* Device identity strip */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
            <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-slate-800 truncate">{device?.name}</p>
            <p className="text-[11px] text-slate-400 font-mono truncate">{device?.deviceId}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Editable Fields</p>

          {/* DevEUI — locked */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-2">
              DevEUI
              <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                Cannot be changed
              </span>
            </label>
            <div className="relative">
              <input
                type="text" value={device?.deviceId || ""} readOnly
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 text-sm font-mono cursor-not-allowed select-none"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
            </div>
          </div>

          {/* Name */}
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

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">Description</label>
            <textarea
              value={form.description} onChange={set("description")}
              placeholder="Optional — describe this device's purpose or deployment notes"
              rows={3}
              className={`${inputClass()} resize-none`}
            />
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          <span className="text-rose-500">*</span> Required fields
        </p>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition">
            Cancel
          </button>
          <button onClick={handleSave} disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
}