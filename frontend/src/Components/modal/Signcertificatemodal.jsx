import { useState, useEffect } from "react";
import { Modal } from "./ModalBase";
import api from "../../services/api";

export default function SignCertificateModal({ device, onClose, onSigned }) {
  const [certificate, setCertificate] = useState("");
  const [loading, setLoading]         = useState(false);
  const [generating, setGenerating]   = useState(true);
  const [error, setError]             = useState("");

  // Fetch a randomly generated certificate serial on open
  useEffect(() => {
    const generate = async () => {
      setGenerating(true);
      try {
        const { data } = await api.get("/devices/generate-certificate");
        setCertificate(data.certificate);
      } catch {
        setError("Failed to generate certificate");
      } finally {
        setGenerating(false);
      }
    };
    generate();
  }, []);

  const handleSign = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.put(`/devices/${device.id}/sign-certificate`, {
        certificate,
      });
      onSigned(data.device);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to sign certificate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Sign Digital Certificate" onClose={onClose}>
      <div className="flex flex-col gap-5">

        {/* Device info */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
            <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-medium text-slate-800">{device?.name}</p>
            <p className="text-[11px] text-slate-400 font-mono">{device?.deviceId}</p>
          </div>
        </div>

        {/* Certificate preview */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-slate-600">Generated Certificate Serial</p>
          {generating ? (
            <div className="flex items-center gap-2 text-slate-400 text-xs py-3">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Generating certificate…
            </div>
          ) : (
            <div className="bg-blue-50/50 border border-blue-200 rounded-xl px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Certificate Serial</p>
              <p className="font-mono text-[12px] text-slate-800 break-all">{certificate}</p>
            </div>
          )}
          <p className="text-[11px] text-slate-400">
            This certificate will be permanently bound to this device and cannot be modified after signing.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs px-4 py-2.5 rounded-xl">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition"
          >
            Later
          </button>
          <button
            onClick={handleSign}
            disabled={loading || generating}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Signing…" : "Sign Certificate"}
          </button>
        </div>

      </div>
    </Modal>
  );
}