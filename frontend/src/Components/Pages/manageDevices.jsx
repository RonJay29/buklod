import { useState, useEffect } from "react";
import EditDeviceModal        from "../modal/editDeviceModal";
import AddDeviceModal         from "../modal/addDeviceModal";
import DeleteDeviceModal      from "../modal/deleteDeviceModal";
import ViewDeviceModal        from "../modal/viewDeviceModal";
import SignCertificateModal   from "../modal/Signcertificatemodal";
import api                    from "../../services/api";

const IconEdit = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4">
    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IconTrash = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4">
    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a1 1 0 00-1-1h-4a1 1 0 00-1 1m-4 0h10" />
  </svg>
);
const IconPlus = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
    <path d="M12 4v16m8-8H4" />
  </svg>
);
const IconEye = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4">
    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const IconCert = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4">
    <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);
const IconDevice = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-5 h-5">
    <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
  </svg>
);

const FILTERS = [
  { key: "all",      label: "All"      },
  { key: "signed",   label: "Signed"   },
  { key: "unsigned", label: "Unsigned" },
  { key: "revoked",  label: "Revoked"  },
];

const statusBadge = {
  signed: (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Signed
    </span>
  ),
  unsigned: (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-600">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Unsigned
    </span>
  ),
  revoked: (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-rose-50 text-rose-600">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Revoked
    </span>
  ),
};

export default function ManageDevices() {
  const [devices,      setDevices]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [search,       setSearch]       = useState("");
  const [filter,       setFilter]       = useState("all");
  const [viewTarget,   setViewTarget]   = useState(null);
  const [editTarget,   setEditTarget]   = useState(null);
  const [addOpen,      setAddOpen]      = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [signTarget,   setSignTarget]   = useState(null);

  useEffect(() => { fetchDevices(); }, []);

  const fetchDevices = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/devices");
      setDevices(data.devices || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load devices");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (form) => {
    try {
      const { data } = await api.post("/devices", form);
      setDevices((prev) => [data.device, ...prev]);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add device");
    }
  };

  const handleSaveEdit = async (form) => {
    try {
      const { data } = await api.put(`/devices/${editTarget.id}`, form);
      setDevices((prev) => prev.map((d) => (d.id === editTarget.id ? data.device : d)));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update device");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/devices/${id}`);
      setDevices((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete device");
    }
  };

  // Used by both SignCertificateModal AND ViewDeviceModal re-sign flow
  const handleSigned = (updatedDevice) => {
    setDevices((prev) => prev.map((d) => (d.id === updatedDevice.id ? updatedDevice : d)));
  };

  const handleRevoke = async (id) => {
    try {
      const { data } = await api.put(`/devices/${id}/revoke-certificate`);
      setDevices((prev) => prev.map((d) => (d.id === id ? data.device : d)));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to revoke certificate");
    }
  };

  const filtered = devices.filter((d) => {
    const matchFilter = filter === "all" || d.certStatus === filter;
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase())     ||
      d.deviceId.toLowerCase().includes(search.toLowerCase()) ||
      d.location.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    all:      devices.length,
    signed:   devices.filter((d) => d.certStatus === "signed").length,
    unsigned: devices.filter((d) => d.certStatus === "unsigned").length,
    revoked:  devices.filter((d) => d.certStatus === "revoked").length,
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Devices", value: counts.all,      color: "text-gray-700" },
          { label: "Signed",        value: counts.signed,   color: "text-gray-700"  },
          { label: "Unsigned",      value: counts.unsigned, color: "text-gray-700" },
          { label: "Revoked",       value: counts.revoked,  color: "text-gray-700"  },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-1 hover:shadow-md hover:shadow-blue-100 hover:border-blue-200 transition-all duration-200">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">{s.label}</span>
            <span className={`text-2xl font-semibold font-mono tracking-tight ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Device list panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-medium text-slate-800">All Devices</h2>
            <p className="text-sm text-slate-400 mt-0.5">Manage connected sensors and their certificates</p>
          </div>
          <button onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2.5 rounded-xl transition">
            <IconPlus /> Add Device
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs px-4 py-2.5 rounded-xl flex items-center justify-between">
            {error}
            <button onClick={fetchDevices} className="underline ml-2">Retry</button>
          </div>
        )}

        {/* Filters + search */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
            {FILTERS.map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-150 ${
                  filter === f.key
                    ? "bg-white text-slate-800 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-700"
                }`}>
                {f.label}
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  f.key === "revoked"  ? "bg-slate-200 text-slate-600"   :
                  f.key === "signed"   ? "bg-slate-200 text-slate-600"   :
                  f.key === "unsigned" ? "bg-slate-200 text-slate-600" :
                  "bg-slate-200 text-slate-600"
                }`}>
                  {counts[f.key]}
                </span>
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-w-[200px]">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input type="text" placeholder="Search by name, ID, or location…"
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="grid bg-slate-50 px-5 py-2.5 text-[11px] uppercase tracking-wider text-slate-400 font-medium border-b border-slate-200"
            style={{ gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1.75fr" }}>
            <span>Device</span>
            <span>Device ID</span>
            <span>Location</span>
            <span>Certificate</span>
        
            <span className="text-right">Actions</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 text-sm gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Loading devices…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-300 gap-2">
              <IconDevice />
              <span className="text-sm">No devices found</span>
            </div>
          ) : (
            filtered.map((device) => {
              const status    = device.certStatus ?? "unsigned";
              const isSigned  = status === "signed";
              const isRevoked = status === "revoked";
              const canEdit   = status === "unsigned";

              return (
                <div key={device.id}
                  className={`grid items-center px-5 py-3.5 gap-4 border-t border-slate-100 text-sm transition
                    ${isRevoked ? "bg-rose-50/30 hover:bg-rose-50/50" : "text-slate-700 hover:bg-blue-50/40"}`}
                  style={{ gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1.75fr" }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isRevoked ? "bg-rose-50 border border-rose-100 text-rose-400"
                                : "bg-blue-50 border border-blue-100 text-blue-500"
                    }`}>
                      <IconDevice />
                    </div>
                    
                      <p className="font-medium text-slate-800 text-[13px] break-words ">{device.name}</p>
                    
                    
                  </div>

                  <span className="font-mono text-xs text-slate-500">{device.deviceId}</span>
                  <span className="text-slate-600 text-[13px] break-words">{device.location}</span>
                  <span>{statusBadge[status] || statusBadge.unsigned}</span>
                  

                  <div className="flex items-center justify-end gap-1 flex-wrap">
                    <button onClick={() => setViewTarget(device)}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-blue-200 transition">
                      <IconEye /> View
                    </button>

                    {status === "unsigned" && (
                      <button onClick={() => setSignTarget(device)}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-200 transition">
                        <IconCert /> Sign
                      </button>
                    )}

                    <button
                      onClick={() => canEdit && setEditTarget(device)}
                      disabled={!canEdit}
                      title={
                        isSigned  ? "Revoke certificate before editing" :
                        isRevoked ? "Device is revoked and cannot be edited" :
                        "Edit device"
                      }
                      className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition ${
                        !canEdit
                          ? "text-slate-300 border-slate-100 cursor-not-allowed"
                          : "text-slate-500 hover:text-blue-600 hover:bg-blue-50 border-slate-200 hover:border-blue-200"
                      }`}
                    >
                      <IconEdit /> Edit
                    </button>

                    <button onClick={() => setDeleteTarget(device)}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-rose-200 transition">
                      <IconTrash /> 
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {!loading && (
          <p className="text-xs text-slate-400 text-right">
            Showing {filtered.length} of {devices.length} device{devices.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {viewTarget && (
        <ViewDeviceModal
          device={viewTarget}
          onClose={() => setViewTarget(null)}
          onRevoke={handleRevoke}
          onSigned={handleSigned}   
        />
      )}
      {signTarget && (
        <SignCertificateModal device={signTarget} onClose={() => setSignTarget(null)} onSigned={handleSigned} />
      )}
      {editTarget && (
        <EditDeviceModal device={editTarget} onClose={() => setEditTarget(null)} onSave={handleSaveEdit} />
      )}
      {addOpen && (
        <AddDeviceModal onClose={() => setAddOpen(false)} onAdd={handleAdd} />
      )}
      {deleteTarget && (
        <DeleteDeviceModal device={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
      )}
    </div>
  );
}