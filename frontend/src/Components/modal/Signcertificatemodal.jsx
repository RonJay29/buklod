import { useState, useEffect } from "react";
import { Modal } from "./modalBase";
import api from "../../services/api";

export default function SignCertificateModal({ device, onClose, onSigned }) {
  const [certificate, setCertificate] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [generating,  setGenerating]  = useState(true);
  const [error,       setError]       = useState("");

  useEffect(() => {
    (async () => {
      setGenerating(true);
      setError("");
      try {
        const { data } = await api.get("/devices/generate-certificate");
        setCertificate(data.certificate);
      } catch {
        setError("Failed to fetch certificate from CA. Please close and try again.");
      } finally {
        setGenerating(false);
      }
    })();
  }, []);

  const handleSign = async () => {
    if (!certificate) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.put(`/devices/${device.id}/sign-certificate`, { certificate });
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

        {/* Device info strip */}
        <div className={`flex items-center gap-4 p-4 rounded-xl border bg-slate-50 border-slate-200`}>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
            <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-6 h-6">
              <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-slate-800 truncate">{device?.name}</p>
            <p className="font-mono text-[11px] text-slate-400 truncate mt-0.5">{device?.deviceId}</p>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Unsigned
            </span>
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* Certificate section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"
              className="w-4 h-4 text-blue-500 shrink-0">
              <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <p className="text-[13px] font-semibold text-slate-700">DICT PNPKI Certificate</p>
          </div>

          {generating ? (
            <div className="flex items-center gap-2 text-slate-400 text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Fetching certificate from CA…
            </div>
          ) : certificate ? (
            <div className="bg-blue-50/50 border border-blue-200 rounded-xl px-4 py-3">
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-1.5">
                Certificate Serial
              </p>
              <p className="font-mono text-[12px] text-slate-800 break-all leading-relaxed">
                {certificate}
              </p>
            </div>
          ) : null}

          <p className="text-[11px] text-slate-400 leading-relaxed">
            This certificate will be permanently bound to <strong className="text-slate-600">{device?.deviceId}</strong> and
            cannot be modified after signing. Only signed devices can transmit verified data.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-700 text-sm font-medium hover:bg-amber-100 transition">
            Sign Later
          </button>
          <button
            onClick={handleSign}
            disabled={loading || generating || !certificate}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Signing…" : "Sign Certificate"}
          </button>
        </div>

      </div>
    </Modal>
  );
}