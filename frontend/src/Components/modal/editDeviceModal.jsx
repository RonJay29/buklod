import { useState, useEffect } from "react";
import { Modal } from "./ModalBase";

export default function editDeviceModal({ device, onClose, onSave }) {
  const [form, setForm]     = useState({ name: "", location: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (device) {
      setForm({ name: device.name, location: device.location });
    }
  }, [device]);

  const set = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
    if (errors[key]) setErrors({ ...errors, [key]: false });
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
    onSave(form);
    onClose();
  };

  return (
    <Modal title="Edit Device" onClose={onClose}>
      <div className="flex flex-col gap-4">

        {/* DevEUI — read only, cannot be changed */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-2">
            DevEUI
            <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              Cannot be changed
            </span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={device?.deviceId || ""}
              readOnly
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-sm font-mono cursor-not-allowed select-none"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
          </div>
        </div>

        {/* Device Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600">
            Device Name <span className="text-rose-500">*</span>
          </label>
          <input
            value={form.name}
            onChange={set("name")}
            placeholder="e.g. Village I Sensors"
            className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-slate-50 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition ${
              errors.name ? "border-rose-400 bg-rose-50" : "border-slate-200"
            }`}
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
            className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-slate-50 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition ${
              errors.location ? "border-rose-400 bg-rose-50" : "border-slate-200"
            }`}
          />
          {errors.location && <p className="text-[11px] text-rose-500">{errors.location}</p>}
        </div>

        <p className="text-[11px] text-slate-400">
          <span className="text-rose-500">*</span> All fields are required
        </p>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition">
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition">
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
}