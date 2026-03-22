import { Modal } from "./ModalBase";

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
      <span className={`text-sm text-slate-800 ${mono ? "font-mono" : "font-medium"}`}>{value || "—"}</span>
    </div>
  );
}

export default function ViewDeviceModal({ device, onClose, onRevoke }) {
  if (!device) return null;

  const certStatus = device.certStatus || (device.certificate ? "signed" : "unsigned");
  const isSigned   = certStatus === "signed";
  const isRevoked  = certStatus === "revoked";

  const handleRevoke = () => {
    onRevoke(device.id);
    onClose();
  };

  return (
    <Modal title="Device Details" onClose={onClose}>
      <div className="flex flex-col gap-5">

        {/* Device identity header */}
        <div className={`flex items-center gap-4 p-4 rounded-xl border ${
          isRevoked ? "bg-rose-50/50 border-rose-200" : "bg-slate-50 border-slate-200"
        }`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            isRevoked
              ? "bg-rose-100 border border-rose-200 text-rose-500"
              : "bg-blue-50 border border-blue-100 text-blue-500"
          }`}>
            <IconDevice />
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-[15px]">{device.name}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {/* Cert status badge */}
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
              {certStatus === "unsigned" && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Unsigned
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Detail grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-1">
          <DetailRow label="Device ID"   value={device.deviceId}   mono />
          <DetailRow label="MAC Address" value={device.macAddress} mono />
          <DetailRow label="Location"    value={device.location} />
          <DetailRow label="Date Added"  value={device.dateAdded} />
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100" />

        {/* Certificate section — SIGNED */}
        {isSigned && (
          <div className="rounded-xl border bg-blue-50/50 border-blue-200 p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-blue-600"><IconCertificate /></span>
              <span className="text-[13px] font-semibold text-slate-700">Digital Certificate</span>
              <span className="ml-auto text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                Signed
              </span>
            </div>
            <div className="flex flex-col gap-1.5 text-xs text-slate-500 font-mono bg-white border border-blue-100 rounded-lg px-3 py-2.5 break-all">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 not-italic font-sans mb-0.5">
                Certificate Serial
              </span>
              {device.certificate}
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

        {/* Certificate section — REVOKED */}
        {isRevoked && (
          <div className="rounded-xl border bg-rose-50/50 border-rose-200 p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-rose-500"><IconRevoked /></span>
              <span className="text-[13px] font-semibold text-slate-700">Digital Certificate</span>
              <span className="ml-auto text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-600">
                Revoked
              </span>
            </div>

            {/* Revoked timeline */}
            <div className="flex flex-col gap-2 bg-white border border-rose-100 rounded-lg px-4 py-3">
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
        )}

        {/* Certificate section — UNSIGNED */}
        {certStatus === "unsigned" && (
          <div className="rounded-xl border bg-slate-50 border-slate-200 p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-400"><IconCertificate /></span>
              <span className="text-[13px] font-semibold text-slate-700">Digital Certificate</span>
              <span className="ml-auto text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-500">
                Not Issued
              </span>
            </div>
            <p className="text-xs text-slate-400">
              No digital certificate has been issued for this device.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition"
          >
            Close
          </button>
          {isSigned && (
            <button
              onClick={handleRevoke}
              className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 transition"
            >
              Revoke Certificate
            </button>
          )}
        </div>

      </div>
    </Modal>
  );
}