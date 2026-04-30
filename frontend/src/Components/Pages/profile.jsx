import { useState, useEffect, useRef } from "react";
import api from "../../services/api";

function getUserFromToken() {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1]));
  } catch { return null; }
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function deriveExpiry(certifiedDate) {
  if (!certifiedDate) return null;
  const d = new Date(certifiedDate);
  if (isNaN(d)) return null;
  d.setFullYear(d.getFullYear() + 2);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Validity bar ──────────────────────────────────────────────────────────────
function ValidityBar({ issuedDate, expiryDate }) {
  if (!issuedDate || !expiryDate) return null;
  const issued   = new Date(issuedDate);
  const expiry   = new Date(expiryDate);
  const now      = new Date();
  if (isNaN(issued) || isNaN(expiry)) return null;
  const pct      = Math.max(0, Math.min(100, ((now - issued) / (expiry - issued)) * 100));
  const daysLeft = Math.max(0, Math.round((expiry - now) / 86_400_000));
  const isExpired = now > expiry;
  const bar = isExpired ? "bg-rose-400" : pct > 75 ? "bg-amber-400" : "bg-emerald-400";
  const txt = isExpired ? "text-rose-500" : pct > 75 ? "text-amber-500" : "text-emerald-500";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-slate-900 font-semibold">Validity</span>
        <span className={`text-[11px] font-bold ${txt}`}>
          {isExpired ? "Expired" : `${daysLeft} days left`}
        </span>
      </div>
      <div className="h-1.5 bg-blue-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${bar}`} style={{ width:`${pct}%` }}/>
      </div>
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>{issuedDate}</span>
        <span>{expiryDate}</span>
      </div>
    </div>
  );
}

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyChip({ value }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard?.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-slate-100 hover:bg-blue-100 text-slate-400 hover:text-blue-600 transition"
    >
      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3 h-3">
        {copied
          ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
          : <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
        }
      </svg>
    </button>
  );
}

// ── Device row (signed only) ───────────────────────────────────────────────────
function DeviceRow({ device, index }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border  transition-all duration-150 shadow-sm hover:shadow-md hover:border-blue-400 hover:bg-blue-50/40 ${
      index % 2 === 0 ? "bg-slate-50 border-slate-300" : "bg-white border-slate-100"
    }`}>
      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
        <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4">
          <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-slate-800 truncate">{device.name}</p>
        <p className="font-mono text-[10px] text-slate-400 truncate">{device.deviceId}</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1 h-1 rounded-full bg-blue-500"/>Signed
        </span>
        {device.certifiedDate && (
          <span className="text-[9px] text-slate-400 font-mono">{device.certifiedDate}</span>
        )}
      </div>
    </div>
  );
}

// ── Main Profile ──────────────────────────────────────────────────────────────
export default function Profile() {
  const user         = getUserFromToken();
  const fileInputRef = useRef(null);

  const [avatar,      setAvatar]      = useState(null);
  const [allDevices,  setAllDevices]  = useState([]);
  const [loadingCert, setLoadingCert] = useState(true);

  const fullName = [capitalize(user?.first_name), capitalize(user?.last_name)].filter(Boolean).join(" ") || "User";
  const initials = [user?.first_name, user?.last_name].filter(Boolean).map(n => n.charAt(0).toUpperCase()).join("") || "?";
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
      } catch { setAllDevices([]); }
      finally { setLoadingCert(false); }
    })();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please select an image file."); return; }
    if (file.size > 2 * 1024 * 1024)    { alert("Image must be smaller than 2MB."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setAvatar(ev.target.result); localStorage.setItem("profileAvatar", ev.target.result); };
    reader.readAsDataURL(file);
  };

  const signedDevices   = allDevices.filter(d => d.certStatus === "signed");
  const unsignedDevices = allDevices.filter(d => d.certStatus === "unsigned");
  const revokedDevices  = allDevices.filter(d => d.certStatus === "revoked");
  const primaryCert     = signedDevices[0] || null;
  const expiryDate      = primaryCert ? deriveExpiry(primaryCert.certifiedDate) : null;

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ═══════════════════════════════════════════
            LEFT COLUMN
        ═══════════════════════════════════════════ */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* ── Profile card ──────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">

            {/* Cover */}
            <div className="h-28 relative bg-gradient-to-br from-slate-800 via-blue-900 to-slate-900 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.4),transparent_55%)]"/>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.3),transparent_55%)]"/>
              <div className="absolute inset-0 opacity-[0.07]"
                style={{ backgroundImage:"linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize:"20px 20px" }}/>
            </div>

            <div className="px-6 pb-6">
              {/* Circle avatar — large, centered above fold */}
              <div className="flex flex-col items-center -mt-14 mb-4">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                    {avatar
                      ? <img src={avatar} alt="Profile" className="w-full h-full object-cover"/>
                      : <span className="text-white text-3xl font-black tracking-tight">{initials}</span>
                    }
                  </div>
                  <button onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 border-2 border-white flex items-center justify-center text-white transition shadow-md">
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3.5 h-3.5">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden"/>
                </div>

                {/* Name + role centered under avatar */}
                <h2 className="text-[18px] font-black text-slate-800 tracking-tight mt-3 leading-tight text-center">{fullName}</h2>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-widest mt-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"/>
                  {role}
                </span>
              </div>

              {/* Divider */}
              <div className="h-px bg-slate-100 mb-4"/>

              {/* Info rows */}
              <div className="flex flex-col gap-3">
                {[
                  { label:"Email",   value: email,                     mono: true  },
                  { label:"Role",    value: role,                       mono: false },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-50">
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold shrink-0">{label}</span>
                    <span className={`text-[12px] text-slate-700 truncate text-right ${mono ? "font-mono" : "font-medium"}`}>{value}</span>
                  </div>
                ))}
              </div>

              {avatar && (
                <button onClick={() => { setAvatar(null); localStorage.removeItem("profileAvatar"); }}
                  className="mt-4 text-[11px] text-slate-400 hover:text-rose-500 transition w-full text-center">
                  Remove photo
                </button>
              )}
            </div>
          </div>

          {/* ── Certificate card ──────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 border-b-8 border-b-blue-900 p-5 flex flex-col gap-4 shadow-sm">

            {/* Header */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-200/50 border border-blue-200 flex items-center justify-center shrink-0">
                <svg fill="none" stroke="#3b82f6" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4">
                  <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-bold text-slate-800">Digital Certificate</p>
                <p className="text-[10px] text-slate-400">Fabric CA</p>
              </div>
              {!loadingCert && (
                <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-widest ${
                  primaryCert
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-slate-100 text-slate-400 border-slate-200"
                }`}>
                  {primaryCert ? "Active" : "None"}
                </span>
              )}
            </div>

            {loadingCert ? (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Loading…
              </div>
            ) : primaryCert ? (
              <div className="flex flex-col gap-4">

                {/* Serial */}
                <div className="bg-blue-400/30 border border-blue-400/80 rounded-xl px-4 py-3">
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-1.5">Certificate</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-900 break-all flex-1">{primaryCert.certificate}</span>
                    <CopyChip className="bg-blue-400/30" value={primaryCert.certificate}/>
                  </div>
                </div>

                {/* Validity bar */}
                <ValidityBar issuedDate={primaryCert.certifiedDate} expiryDate={expiryDate}/>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label:"Issued By",    value:"—" },
                    { label:"Organization", value:"—" },
                    { label:"Date Issued",  value: primaryCert.certifiedDate || "—" },
                    { label:"Expires On",   value: expiryDate || "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col gap-1 bg-blue-400/30 border  border-blue-400/80 rounded-xl px-3 py-2.5">
                      <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">{label}</span>
                      <span className="text-[12px] text-slate-700 font-medium">{value}</span>
                    </div>
                  ))}
                </div>
                      
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-300 gap-2">
                <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="w-9 h-9 opacity-40">
                  <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                </svg>
                <p className="text-xs text-slate-400">No active certificate</p>
                <p className="text-[11px] text-slate-400 text-center leading-relaxed">Sign a device certificate from<br/>Manage Devices to activate.</p>
              </div>
            )}
          </div>

        </div>

        {/* ═══════════════════════════════════════════
            RIGHT COLUMN
        ═══════════════════════════════════════════ */}
        <div className="lg:col-span-3 flex flex-col gap-5">

          {/* ── Header card ───────────────────────── */}
          <div className="bg-gray-900 rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-[15px] font-black text-slate-200 tracking-tight">Signed Devices</h3>
                <p className="text-[12px] text-slate-400 mt-0.5">
                  {signedDevices.length} device{signedDevices.length !== 1 ? "s" : ""} with active certificates
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold px-3 py-1.5 rounded-xl bg-blue-800 text-slate-200 border border-blue-200">
                  {signedDevices.length} Signed
                </span>
                <span className="text-[10px] font-bold px-3 py-1.5 rounded-xl bg-slate-600 text-slate-200 border border-slate-200">
                  {unsignedDevices.length} Unsigned
                </span>
                {revokedDevices.length > 0 && (
                  <span className="text-[10px] font-bold px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                    {revokedDevices.length} Revoked
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Signed device list ────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-sm flex-1">

            {/* Table header */}
          
            <div className="grid px-4 py-3 bg-slate-700 border-b border-slate-200 text-[10px] uppercase tracking-widest text-slate-200 font-semibold"
              style={{ gridTemplateColumns:"1fr 1fr auto" }}>
              <span>Device</span>
              <span>DevEUI</span>
              <span className="text-right w-28">Cert / Date</span>
            </div>

            {loadingCert ? (
              <div className="flex items-center justify-center py-16 text-slate-400 text-xs gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Loading devices…
              </div>
            ) : signedDevices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-300 gap-2">
                <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="w-9 h-9 opacity-40">
                  <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
                </svg>
                <p className="text-sm text-slate-400">No signed devices yet</p>
                <p className="text-[11px] text-slate-400 text-center">Sign device certificates from the<br/>Manage Devices page.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 p-3 overflow-y-auto" style={{ maxHeight:"480px" }}>
                {signedDevices.map((device, i) => (
                  <DeviceRow key={device.id} device={device} index={i}/>
                ))}
              </div>
            )}

            {!loadingCert && signedDevices.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-200 bg-slate-700">
                <p className="text-[10px] text-slate-200">
                  Showing <span className="text-slate-200 font-semibold">{signedDevices.length}</span> signed device{signedDevices.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>

          {/* ── Blockchain summary ────────────────── */}
          <div className="bg-gray-900 rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center shrink-0">
                <svg fill="none" stroke="#7c3aed" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-200">Ledger</p>
                <p className="text-[10px] text-slate-400">Hyperledger Fabric · lorawanchannel</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label:"Total Devices Enrolled", value: allDevices.length,      bg:"bg-slate-200  border-slate-300",  val:"text-slate-800"  },
                { label:"On-chain (SIGNED)",       value: signedDevices.length,   bg:"bg-blue-200   border-blue-300",   val:"text-blue-700"   },
                { label:"Cert Revoked",   value: revokedDevices.length,  bg:"bg-rose-200   border-rose-300",   val:"text-rose-600"   },
              ].map(({ label, value, bg, val }) => (
                <div key={label} className={`rounded-xl border px-4 py-3 flex flex-col gap-1 ${bg}`}>
                  <span className="text-[9px] uppercase tracking-widest text-slate-900 font-semibold">{label}</span>
                  <span className={`text-3xl font-black font-mono leading-none ${val}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}