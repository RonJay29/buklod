import { useState, useEffect, useRef } from "react";
import api from "../../services/api";

function getUserFromToken() {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

const IconCamera = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const IconCertificate = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-5 h-5">
    <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

function DetailRow({ label, value, mono = false }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{label}</span>
      <span className={`text-sm text-slate-800 font-medium ${mono ? "font-mono" : ""}`}>{value || "—"}</span>
    </div>
  );
}

// ── Certificate validity progress bar ─────────────────────────────────────────
function ValidityBar({ issuedDate, expiryDate }) {
  if (!issuedDate || !expiryDate) return null;

  // Parse "Mon DD, YYYY" format (e.g. "Apr 05, 2025")
  const issued  = new Date(issuedDate);
  const expiry  = new Date(expiryDate);
  const now     = new Date();

  if (isNaN(issued) || isNaN(expiry)) return null;

  const total   = expiry - issued;
  const elapsed = now   - issued;
  const pct     = Math.max(0, Math.min(100, (elapsed / total) * 100));
  const daysLeft= Math.max(0, Math.round((expiry - now) / 86_400_000));
  const isExpired = now > expiry;

  const barColor = isExpired
    ? "bg-rose-500"
    : pct > 75 ? "bg-amber-500"
    : "bg-emerald-500";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-500 font-medium">Certificate validity</span>
        <span className={isExpired ? "text-rose-500 font-semibold" : pct > 75 ? "text-amber-600 font-semibold" : "text-emerald-600 font-semibold"}>
          {isExpired ? "Expired" : `${daysLeft} days remaining`}
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-slate-400">
        <span>{issuedDate}</span>
        <span>{expiryDate}</span>
      </div>
    </div>
  );
}

// ── Single device cert row ─────────────────────────────────────────────────────
function DeviceCertRow({ device, index }) {
  const status = device.certStatus ?? "unsigned";
  const badgeMap = {
    signed:   "bg-blue-100 text-blue-700",
    unsigned: "bg-amber-100 text-amber-700",
    revoked:  "bg-rose-100 text-rose-600",
  };
  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition ${
      index % 2 === 0 ? "bg-slate-50 border-slate-100" : "bg-white border-slate-100"
    }`}>
      <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
        <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4">
          <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-slate-800 truncate">{device.name}</p>
        <p className="font-mono text-[10px] text-slate-400 truncate">{device.deviceId}</p>
      </div>
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${badgeMap[status] || badgeMap.unsigned}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
        {device.certifiedDate && (
          <span className="text-[10px] text-slate-400">{device.certifiedDate}</span>
        )}
      </div>
    </div>
  );
}

export default function Profile() {
  const user         = getUserFromToken();
  const fileInputRef = useRef(null);

  const [avatar,       setAvatar]       = useState(null);
  const [allDevices,   setAllDevices]   = useState([]);
  const [loadingCert,  setLoadingCert]  = useState(true);

  const fullName = [capitalize(user?.first_name), capitalize(user?.last_name)].filter(Boolean).join(" ") || "User";
  const initials = [user?.first_name, user?.last_name].filter(Boolean).map((n) => n.charAt(0).toUpperCase()).join("") || "?";
  const role     = capitalize(user?.role) || "User";
  const email    = user?.email || "—";

  useEffect(() => {
    const saved = localStorage.getItem("profileAvatar");
    if (saved) setAvatar(saved);
  }, []);

  useEffect(() => {
    (async () => {
      setLoadingCert(true);
      try {
        const { data } = await api.get("/devices");
        setAllDevices(data.devices || []);
      } catch {
        setAllDevices([]);
      } finally {
        setLoadingCert(false);
      }
    })();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please select an image file."); return; }
    if (file.size > 2 * 1024 * 1024)    { alert("Image must be smaller than 2MB."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatar(ev.target.result);
      localStorage.setItem("profileAvatar", ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatar(null);
    localStorage.removeItem("profileAvatar");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Certificate-derived data
  const signedDevices   = allDevices.filter((d) => d.certStatus === "signed"  && d.certificate);
  const revokedDevices  = allDevices.filter((d) => d.certStatus === "revoked");
  const primaryCert     = signedDevices[0] || null; // first signed device as the "profile" cert

  // Derive expiry: certifiedDate + 730 days (2 years) as a reasonable default
  const deriveExpiry = (certifiedDate) => {
    if (!certifiedDate) return null;
    const d = new Date(certifiedDate);
    if (isNaN(d)) return null;
    d.setFullYear(d.getFullYear() + 2);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const expiryDate = primaryCert ? deriveExpiry(primaryCert.certifiedDate) : null;

  // CA info — derived from the Fabric CA endpoint pattern in the routes
  const CA_NAME    = "Hyperledger Fabric CA";
  const CA_ORG     = "IoT Monitoring System";

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">

      {/* ── Profile card ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_50%,#3b82f6,transparent)]" />
        </div>

        <div className="px-8 pb-8">
          <div className="flex items-end gap-5 -mt-12 mb-2">
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-blue-500 flex items-center justify-center">
                {avatar ? (
                  <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-3xl font-semibold">{initials}</span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-700 border-2 border-white flex items-center justify-center text-white transition"
                title="Upload photo"
              >
                <IconCamera />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>

            {avatar && (
              <button onClick={handleRemoveAvatar} className="ml-auto mb-1 text-xs text-slate-400 hover:text-rose-500 transition">
                Remove photo
              </button>
            )}
          </div>

          <div className="mt-3 mb-6">
            <h2 className="text-xl font-semibold text-slate-800 leading-tight">{fullName}</h2>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {role}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-x-8 gap-y-5 border-t border-slate-100 pt-6">
            <DetailRow label="Full Name" value={fullName} />
            <DetailRow label="Email"     value={email}    mono />
            <DetailRow label="Role"      value={role} />
            <DetailRow label="User ID"   value={user?.id ? `#${user.id}` : "—"} mono />
          </div>
        </div>
      </div>

      {/* ── Certificate card ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center gap-2">
          <span className={loadingCert ? "text-slate-300" : primaryCert ? "text-blue-600" : "text-slate-400"}>
            <IconCertificate />
          </span>
          <h3 className="text-[14px] font-medium text-slate-800">Digital Certificate</h3>
          {!loadingCert && (
            <div className="ml-auto flex items-center gap-2">
              {/* Device count badge */}
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {signedDevices.length} device{signedDevices.length !== 1 ? "s" : ""} issued
              </span>
              <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                primaryCert ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
              }`}>
                {primaryCert ? "Active" : "Not Issued"}
              </span>
            </div>
          )}
        </div>

        {loadingCert && (
          <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Loading certificates…
          </div>
        )}

        {!loadingCert && primaryCert && (
          <div className="flex flex-col gap-5">

            {/* Certificate serial */}
            <div className="bg-blue-50/50 border border-blue-200 rounded-xl px-4 py-3 flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Certificate Serial</span>
              <span className="font-mono text-[12px] text-slate-800 break-all">{primaryCert.certificate}</span>
            </div>

            {/* Validity progress bar */}
            <ValidityBar issuedDate={primaryCert.certifiedDate} expiryDate={expiryDate} />

            {/* Main info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4 border-t border-slate-100 pt-4">

              {/* Issued by */}
              <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Issued By</span>
                <span className="text-sm text-slate-800 font-semibold">{CA_NAME}</span>
                <span className="text-[11px] text-slate-500">{CA_ORG}</span>
              </div>

              {/* Date issued */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Date Issued</span>
                <span className="text-sm text-slate-800 font-medium">{primaryCert.certifiedDate || "—"}</span>
              </div>

              {/* Expiry */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Expires On</span>
                <span className={`text-sm font-medium ${expiryDate && new Date(expiryDate) < new Date() ? "text-rose-600" : "text-slate-800"}`}>
                  {expiryDate || "—"}
                </span>
              </div>

              {/* Devices issued count */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Devices Issued</span>
                <span className="text-2xl font-bold font-mono text-blue-600 leading-tight">{signedDevices.length}</span>
                {revokedDevices.length > 0 && (
                  <span className="text-[11px] text-rose-500">{revokedDevices.length} revoked</span>
                )}
              </div>
            </div>

            {/* Bound device reference */}
            

            {/* All devices with certificates */}
            {signedDevices.length > 1 && (
              <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-1">
                  All Devices with Issued Certificates ({signedDevices.length})
                </p>
                {signedDevices.map((d, i) => (
                  <DeviceCertRow key={d.id} device={d} index={i} />
                ))}
              </div>
            )}
          </div>
        )}

        {!loadingCert && !primaryCert && (
          <p className="text-xs text-slate-400">
            No active certificate found. Sign a device certificate from the Manage Devices page to have it appear here.
          </p>
        )}
      </div>

    </div>
  );
}