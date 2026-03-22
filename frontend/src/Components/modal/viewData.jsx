import { Modal } from "./ModalBase";

const IconCertificate = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-5 h-5">
    <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
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

function SensorBadge({ label, value, color }) {
  const styles = {
    red:    "bg-rose-50 text-rose-600 border-rose-100",
    blue:   "bg-blue-50 text-blue-700 border-blue-100",
    green:  "bg-emerald-50 text-emerald-700 border-emerald-100",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
  };
  return (
    <div className={`flex flex-col gap-1 rounded-xl border px-4 py-3 ${styles[color]}`}>
      <span className="text-[10px] uppercase tracking-wider font-medium opacity-70">{label}</span>
      <span className="text-lg font-semibold font-mono">{value}</span>
    </div>
  );
}

export default function ViewData({ data, onClose }) {
  if (!data) return null;

  const isCertSigned = !!data.certificate;

  return (
    <Modal title="Data Record Details" onClose={onClose}>
      <div className="flex flex-col gap-5">

        {/* Device identity */}
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Device Info</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <DetailRow label="Device Name"  value={data.device} />
            <DetailRow label="Device ID"    value={data.deviceId}   mono />
            <DetailRow label="MAC Address"  value={data.macAddress} mono />
            <DetailRow label="Timestamp"    value={data.timestamp} />
          </div>
        </div>

        {/* Sensor readings */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Sensor Readings</p>
          <div className="grid grid-cols-2 gap-3">
            <SensorBadge label="Temperature" value={`${data.temperature} °C`} color="red"    />
            <SensorBadge label="Humidity"    value={`${data.humidity} %`}     color="blue"   />
            <SensorBadge label="Soil Moisture" value={`${data.soilMoisture} %`} color="green" />
            <SensorBadge label="Rainfall"    value={`${data.rainfall.toFixed(1)} mm`} color="indigo" />
          </div>
        </div>

        {/* Digital certificate */}
        <div className={`rounded-xl border p-4 flex flex-col gap-3 ${isCertSigned ? "bg-blue-50/50 border-blue-200" : "bg-slate-50 border-slate-200"}`}>
          <div className="flex items-center gap-2">
            <span className={isCertSigned ? "text-blue-600" : "text-slate-400"}>
              <IconCertificate />
            </span>
            <span className="text-[13px] font-semibold text-slate-700">Digital Certificate</span>
            <span className={`ml-auto text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
              isCertSigned ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-500"
            }`}>
              {isCertSigned ? "Signed" : "Not Issued"}
            </span>
          </div>
          {isCertSigned ? (
            <div className="text-xs text-slate-500 font-mono bg-white border border-blue-100 rounded-lg px-3 py-2.5 break-all">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 not-italic font-sans block mb-1">Certificate Serial</span>
              {data.certificate}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No digital certificate has been issued for this device.</p>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition"
        >
          Close
        </button>

      </div>
    </Modal>
  );
}