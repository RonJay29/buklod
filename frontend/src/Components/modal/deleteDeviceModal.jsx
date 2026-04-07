import { Modal } from "./modalBase";

export default function DeleteDeviceModal({ device, onClose, onConfirm }) {
  return (
    <Modal title="Remove Device" onClose={onClose}>
      <div className="flex flex-col gap-5">
        <p className="text-sm text-slate-500">
          Are you sure you want to remove{" "}
          <span className="font-semibold text-slate-800">{device?.name}</span>?{" "}
          This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(device.id); onClose(); }}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 transition"
          >
            Yes, Remove
          </button>
        </div>
      </div>
    </Modal>
  );
}