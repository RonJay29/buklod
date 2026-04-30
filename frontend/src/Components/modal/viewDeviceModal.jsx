import { useState, useEffect } from "react";
import api from "../../services/api";
import { useFormKeys } from "../../hooks/keyboardKeys";

// ── Icons ──────────────────────────────────────────────────────────────────────
const IconCertificate = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-5 h-5">
    <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);
const IconDevice = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-5 h-5">
    <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
  </svg>
);
const IconRevoked = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-5 h-5">
    <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

function DetailRow({ label, value, mono = false }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{label}</span>
      <span className={`text-sm text-slate-800 break-words ${mono ? "font-mono" : "font-medium"}`}>
        {value || "—"}
      </span>
    </div>
  );
}

// ── Re-sign panel ──────────────────────────────────────────────────────────────
function ReSignPanel({ device, onSigned, onClose }) {
  const [certificate, setCertificate] = useState("");
  const [generating,  setGenerating]  = useState(true);
  const [signing,     setSigning]     = useState(false);
  const [certError,   setCertError]   = useState("");
  const [signError,   setSignError]   = useState("");

  useEffect(() => {
    (async () => {
      setGenerating(true);
      setCertError("");
      try {
        const { data } = await api.get("/devices/generate-certificate");
        setCertificate(data.certificate);
      } catch {
        setCertError("Failed to fetch certificate from CA.");
      } finally {
        setGenerating(false);
      }
    })();
  }, []);

  const handleReSign = async () => {
    if (!certificate) return;
    setSigning(true);
    setSignError("");
    try {
      const { data } = await api.put(`/devices/${device.id}/sign-certificate`, { certificate });
      onSigned(data.device);
      onClose();
    } catch (err) {
      setSignError(err.response?.data?.message || "Failed to re-sign certificate");
    } finally {
      setSigning(false);
    }
  };

  // Enter = re-sign, Escape = close panel
  useFormKeys(handleReSign, onClose, !signing && !generating && !!certificate);

  return (
    <div className="rounded-xl border bg-emerald-50/50 border-emerald-200 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-emerald-600"><IconCertificate /></span>
        <span className="text-[13px] font-semibold text-slate-700">Re-sign Certificate</span>
        <span className="ml-auto text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
          New from CA
        </span>
      </div>

      {generating ? (
        <div className="flex items-center gap-2 text-slate-400 text-xs bg-white border border-emerald-100 rounded-lg px-3 py-2.5">
          <svg className="w-3.5 h-3.5 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          Fetching certificate from CA…
        </div>
      ) : certError ? (
        <div className="text-[11px] text-rose-500 bg-white border border-rose-100 rounded-lg px-3 py-2.5">
          {certError}
        </div>
      ) : (
        <div className="bg-white border border-emerald-100 rounded-lg px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-sans block mb-1">Certificate Serial</p>
          <span className="font-mono text-[11px] text-slate-700 break-all">{certificate}</span>
        </div>
      )}

      <p className="text-[11px] text-emerald-700 leading-relaxed">
        A new certificate has been fetched from the CA. Click <strong>Re-sign</strong> to bind it to this device.
      </p>

      {signError && <p className="text-[11px] text-rose-500">{signError}</p>}

      <button
        onClick={handleReSign}
        disabled={signing || generating || !certificate}
        className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {signing ? "Re-signing…" : "Re-sign Certificate"}
      </button>
    </div>
  );
}

// ── Main modal ─────────────────────────────────────────────────────────────────
export default function ViewDeviceModal({ device, onClose, onRevoke, onSigned }) {
  const [showReSign, setShowReSign] = useState(false);

  // Escape only — view modal has no Enter action
  // Also removes the old manual useEffect keydown listener
  useFormKeys(null, onClose, true);

  if (!device) return null;

  const status    = device.certStatus ?? "unsigned";
  const isSigned  = status === "signed";
  const isRevoked = status === "revoked";

  const handleRevoke = () => {
    onRevoke(device.id);
    onClose();
  };

  return (
    <div
      className="fixed bg-slate-800/50 inset-0 z-50 backdrop-blur-[2px] overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="min-h-full flex items-center justify-center px-4 py-6 sm:py-10">
        <div
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl shadow-slate-900/20 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
            <h2 className="text-[15px] font-semibold text-slate-800">Device Details</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition"
            >
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable body */}
          <div className="px-6 py-5 flex flex-col gap-5 overflow-y-auto max-h-[75vh]">

            {/* Device identity */}
            <div className={`flex items-start gap-4 p-4 rounded-xl border ${
              isRevoked ? "bg-rose-50/50 border-rose-200" : "bg-slate-50 border-slate-200"
            }`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                isRevoked
                  ? "bg-rose-100 border border-rose-200 text-rose-500"
                  : "bg-blue-50 border border-blue-100 text-blue-500"
              }`}>
                <IconDevice />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-[15px] break-words">{device.name}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {isSigned && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Signed
                    </span>
                  )}
                  {isRevoked && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Certificate Revoked
                    </span>
                  )}
                  {status === "unsigned" && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Unsigned
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Detail grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 px-1">
              <DetailRow label="Device ID (DevEUI)" value={device.deviceId} mono />
              <DetailRow label="Location"           value={device.location} />
              <DetailRow label="Date Added"         value={device.dateAdded} />
              <div className="sm:col-span-2">
                <DetailRow label="Description" value={device.description || "No description provided"} />
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* Certificate — SIGNED */}
            {isSigned && (
              <div className="rounded-xl border bg-blue-50/50 border-blue-200 p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600"><IconCertificate /></span>
                  <span className="text-[13px] font-semibold text-slate-700">Digital Certificate</span>
                  <span className="ml-auto text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">Signed</span>
                </div>
                <div className="bg-white border border-blue-100 rounded-lg px-3 py-2.5">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-sans block mb-1">Certificate</span>
                  <span className="font-mono text-[11px] text-slate-700 break-all whitespace-pre-wrap">{device.certificate}</span>
                </div>
                {device.certifiedDate && (
                  <div className="flex items-center gap-1.5 text-xs text-blue-600">
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0">
                      <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Signed on {device.certifiedDate}
                  </div>
                )}
              </div>
            )}

            {/* Certificate — REVOKED */}
            {isRevoked && (
              <>
                <div className="rounded-xl border bg-rose-50/50 border-rose-200 p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-rose-500"><IconRevoked /></span>
                    <span className="text-[13px] font-semibold text-slate-700">Digital Certificate</span>
                    <span className="ml-auto text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-600">Revoked</span>
                  </div>
                  <div className="bg-white border border-rose-100 rounded-lg px-4 py-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 uppercase tracking-wider text-[10px] font-medium">Signed on</span>
                      <span className="font-medium text-slate-700">{device.certifiedDate || "—"}</span>
                    </div>
                    <div className="h-px bg-rose-100" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-rose-400 uppercase tracking-wider text-[10px] font-medium">Revoked on</span>
                      <span className="font-medium text-rose-600">{device.revokedDate || "—"}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-rose-400">
                    This device's certificate has been permanently revoked and is no longer valid.
                  </p>
                </div>

                {!showReSign ? (
                  <button
                    onClick={() => setShowReSign(true)}
                    className="w-full py-2.5 rounded-xl border border-emerald-300 text-emerald-700 text-sm font-medium hover:bg-emerald-50 transition flex items-center justify-center gap-2"
                  >
                    <IconCertificate />
                    Re-sign with New Certificate
                  </button>
                ) : (
                  <ReSignPanel device={device} onSigned={onSigned} onClose={onClose} />
                )}
              </>
            )}

            {/* Certificate — UNSIGNED */}
            {status === "unsigned" && (
              <div className="rounded-xl border bg-slate-50 border-slate-200 p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400"><IconCertificate /></span>
                  <span className="text-[13px] font-semibold text-slate-700">Digital Certificate</span>
                  <span className="ml-auto text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-500">Not Issued</span>
                </div>
                <p className="text-xs text-slate-400">No digital certificate has been issued for this device.</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition">
                Close
              </button>
              {isSigned && (
                <button onClick={handleRevoke}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 transition">
                  Revoke Certificate
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}