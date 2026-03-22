import { useState, useEffect } from "react";
import { Modal, Field } from "./ModalBase";

export default function EditDeviceModal({ device, onClose, onSave }) {
  const [form, setForm]     = useState({ name: "", deviceId: "", macAddress: "", location: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (device) {
      setForm({
        name:       device.name,
        deviceId:   device.deviceId,
        macAddress: device.macAddress,
        location:   device.location,
      });
    }
  }, [device]);

  const set = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
    if (errors[key]) setErrors({ ...errors, [key]: false });
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())       e.name       = "Device name is required";
    if (!form.deviceId.trim())   e.deviceId   = "Device ID is required";
    if (!form.macAddress.trim()) e.macAddress = "MAC address is required";
    if (!form.location.trim())   e.location   = "Location is required";
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

        <div className="grid grid-cols-2 gap-3">
          {/* Name */}
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

          {/* Device ID */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">
              Device ID <span className="text-rose-500">*</span>
            </label>
            <input
              value={form.deviceId}
              onChange={set("deviceId")}
              placeholder="e.g. DEV-001"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-slate-50 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition font-mono ${
                errors.deviceId ? "border-rose-400 bg-rose-50" : "border-slate-200"
              }`}
            />
            {errors.deviceId && <p className="text-[11px] text-rose-500">{errors.deviceId}</p>}
          </div>
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
              placeholder="e.g. Village I"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-slate-50 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition ${
                errors.location ? "border-rose-400 bg-rose-50" : "border-slate-200"
              }`}
            />
            {errors.location && <p className="text-[11px] text-rose-500">{errors.location}</p>}
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          <span className="text-rose-500">*</span> All fields are required
        </p>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
}