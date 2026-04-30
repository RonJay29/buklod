import { useFormKeys } from "../../hooks/keyboardKeys";
import { Modal } from "./modalBase";

export default function DeleteDeviceModal({ device, onClose, onConfirm }) {
  const handleConfirm = () => {
    onConfirm(device.id);
    onClose();
  };

  // ── Must be INSIDE the component, after handleConfirm is defined ──────────
  useFormKeys(handleConfirm, onClose, true);

  return (
    <Modal title="Remove Device" onClose={onClose}>
      <div className="flex flex-col gap-5">

        {/* Device identity strip */}
        <div className="flex items-center gap-4 p-4 rounded-xl border bg-rose-50/40 border-rose-200">
          <div className="w-12 h-12 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-500 shrink-0">
            <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-6 h-6">
              <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-slate-800 break-words">{device?.name}</p>
            <p className="font-mono text-[11px] text-slate-400 mt-0.5 truncate">{device?.deviceId}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{device?.location}</p>
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* Warning */}
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <svg fill="none" stroke="#e11d48" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4 shrink-0 mt-0.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
          <div className="flex flex-col gap-1">
            <p className="text-[12px] font-semibold text-rose-700">This action cannot be undone</p>
            <p className="text-[11px] text-rose-600 leading-relaxed">
              Removing this device will permanently delete all associated data, identity records, and batch history.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition">
            Cancel
          </button>
          <button onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 transition">
            Yes, Remove
          </button>
        </div>
      </div>
    </Modal>
  );
} 