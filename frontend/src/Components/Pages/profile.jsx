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

export default function Profile() {
  const user         = getUserFromToken();
  const fileInputRef = useRef(null);

  const [avatar, setAvatar]           = useState(null);
  const [certDevice, setCertDevice]   = useState(null);
  const [loadingCert, setLoadingCert] = useState(true);

  const fullName = [capitalize(user?.first_name), capitalize(user?.last_name)].filter(Boolean).join(" ") || "User";
  const initials = [user?.first_name, user?.last_name].filter(Boolean).map((n) => n.charAt(0).toUpperCase()).join("") || "?";
  const role     = capitalize(user?.role) || "User";
  const email    = user?.email || "—";

  useEffect(() => {
    const saved = localStorage.getItem("profileAvatar");
    if (saved) setAvatar(saved);
  }, []);

  useEffect(() => {
    const fetchCert = async () => {
      setLoadingCert(true);
      try {
        const { data } = await api.get("/devices");
        const signed = data.devices.find((d) => d.certStatus === "signed" && d.certificate);
        setCertDevice(signed || null);
      } catch {
        setCertDevice(null);
      } finally {
        setLoadingCert(false);
      }
    };
    fetchCert();
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

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">

        {/* Banner — taller so avatar + name sit fully below it */}
        <div className="h-32 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_50%,#3b82f6,transparent)]" />
        </div>

        <div className="px-8 pb-8">
          {/* Avatar row — pushed up over the banner */}
          <div className="flex items-end gap-5 -mt-12 mb-2">

            {/* Avatar */}
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

            {/* Remove photo — floated right, aligned to bottom */}
            {avatar && (
              <button
                onClick={handleRemoveAvatar}
                className="ml-auto mb-1 text-xs text-slate-400 hover:text-rose-500 transition"
              >
                Remove photo
              </button>
            )}
          </div>

          {/* Name + badge — below the avatar row with proper spacing */}
          <div className="mt-3 mb-6">
            <h2 className="text-xl font-semibold text-slate-800 leading-tight">{fullName}</h2>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {role}
            </span>
          </div>

          {/* Detail grid — 4 columns on wide layout */}
          <div className="grid grid-cols-4 gap-x-8 gap-y-5 border-t border-slate-100 pt-6">
            <DetailRow label="Full Name" value={fullName} />
            <DetailRow label="Email"     value={email}    mono />
            <DetailRow label="Role"      value={role} />
            <DetailRow label="User ID"   value={user?.id ? `#${user.id}` : "—"} mono />
          </div>
        </div>
      </div>

      {/* Certificate card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className={loadingCert ? "text-slate-300" : certDevice ? "text-blue-600" : "text-slate-400"}>
            <IconCertificate />
          </span>
          <h3 className="text-[14px] font-medium text-slate-800">Digital Certificate</h3>
          {!loadingCert && (
            <span className={`ml-auto text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
              certDevice ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
            }`}>
              {certDevice ? "Active" : "Not Issued"}
            </span>
          )}
        </div>

        {loadingCert && (
          <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Loading certificate…
          </div>
        )}

        {!loadingCert && certDevice && (
          <div className="flex flex-col gap-4">
            {/* Certificate serial */}
            <div className="bg-blue-50/50 border border-blue-200 rounded-xl px-4 py-3 flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Certificate Serial</span>
              <span className="font-mono text-[12px] text-slate-800 break-all">{certDevice.certificate}</span>
            </div>

            {/* Meta info — 4 columns */}
            <div className="grid grid-cols-4 gap-x-8 gap-y-3 border-t border-slate-100 pt-4">
              <div className="flex flex-col gap-1 col-span-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Bound to Device</span>
                <span className="text-sm text-slate-800 font-medium">{certDevice.name}</span>
                <span className="text-[11px] text-slate-400 font-mono">{certDevice.deviceId}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Signed On</span>
                <span className="text-sm text-slate-800 font-medium">{certDevice.certifiedDate || "—"}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Location</span>
                <span className="text-sm text-slate-800 font-medium">{certDevice.location || "—"}</span>
              </div>
            </div>
          </div>
        )}

        {!loadingCert && !certDevice && (
          <p className="text-xs text-slate-400">
            No active certificate found. Sign a device certificate to have it appear here.
          </p>
        )}
      </div>

    </div>
  );
}