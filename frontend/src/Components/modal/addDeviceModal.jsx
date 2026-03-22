import { useState, useEffect } from "react";
import { Modal, Field } from "./ModalBase";
import api from "../../services/api";

const emptyForm = { name: "", macAddress: "", location: "" };

export default function AddDeviceModal({ onClose, onAdd }) {
  const [form, setForm]         = useState(emptyForm);
  const [errors, setErrors]     = useState({});
  const [nextId, setNextId]     = useState("");
  const [loadingId, setLoadingId] = useState(true);

  // Fetch the next auto-generated device ID on modal open
  useEffect(() => {
    const fetchNextId = async () => {
      setLoadingId(true);
      try {
        const { data } = await api.get("/devices/next-id");
        setNextId(data.deviceId);
      } catch {
        setNextId("DEV-???");
      } finally {
        setLoadingId(false);
      }
    };
    fetchNextId();
  }, []);

  const set = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
    if (errors[key]) setErrors({ ...errors, [key]: false });
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())       e.name       = "Device name is required";
    if (!form.macAddress.trim()) e.macAddress = "MAC address is required";
    if (!form.location.trim())   e.location   = "Location is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = () => {
    if (!validate()) return;
    onAdd(form);
    onClose();
  };

  return (
    <Modal title="Add New Device" onClose={onClose}>
      <div className="flex flex-col gap-4">

        {/* Auto-generated Device ID — read only */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-2">
            Device ID
            <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              Auto-generated
            </span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={loadingId ? "Generating…" : nextId}
              readOnly
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-sm font-mono cursor-not-allowed select-none"
            />
            {/* Lock icon */}
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
            value={form.name}
            onChange={set("name")}
            placeholder="e.g. Village IV Sensors"
            className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-slate-50 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition ${
              errors.name ? "border-rose-400 bg-rose-50" : "border-slate-200"
            }`}
          />
          {errors.name && <p className="text-[11px] text-rose-500">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* MAC Address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">
              MAC Address <span className="text-rose-500">*</span>
            </label>
            <input
              value={form.macAddress}
              onChange={set("macAddress")}
              placeholder="e.g. A4:C3:F0:12:34:56"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-slate-50 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition font-mono ${
                errors.macAddress ? "border-rose-400 bg-rose-50" : "border-slate-200"
              }`}
            />
            {errors.macAddress && <p className="text-[11px] text-rose-500">{errors.macAddress}</p>}
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">
              Location <span className="text-rose-500">*</span>
            </label>
            <input
              value={form.location}
              onChange={set("location")}
              placeholder="e.g. Village IV"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-slate-50 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition ${
                errors.location ? "border-rose-400 bg-rose-50" : "border-slate-200"
              }`}
            />
            {errors.location && <p className="text-[11px] text-rose-500">{errors.location}</p>}
          </div>
        </div>

        {/* Certificate note */}
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4 text-amber-500 shrink-0 mt-0.5">
            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[11px] text-amber-700">
            Certificate signing is optional and can be done after adding the device. Once signed, the device details cannot be modified.
          </p>
        </div>

        <p className="text-[11px] text-slate-400">
          <span className="text-rose-500">*</span> All fields are required
        </p>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition">
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={loadingId}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
            Add Device
          </button>
        </div>

      </div>
    </Modal>
  );
}