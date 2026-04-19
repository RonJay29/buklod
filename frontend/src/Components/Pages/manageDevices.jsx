import { useState, useEffect } from "react";
import EditDeviceModal      from "../modal/editDeviceModal";
import AddDeviceModal       from "../modal/addDeviceModal";
import DeleteDeviceModal    from "../modal/deleteDeviceModal";
import ViewDeviceModal      from "../modal/viewDeviceModal";
import SignCertificateModal from "../modal/Signcertificatemodal";
import api                  from "../../services/api";

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

const ROWS_PER_PAGE = 10;

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

// ── KPI card config — solid dark backgrounds ──────────────────────────────────
const kpiConfig = [
  { label:"Total Devices", key:"all",      bg:"bg-slate-800",   accent:"text-cyan-400",   icon:"M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" },
  { label:"Signed",        key:"signed",   bg:"bg-blue-700",    accent:"text-blue-200",   icon:"M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  { label:"Unsigned",      key:"unsigned", bg:"bg-amber-700",   accent:"text-amber-200",  icon:"M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" },
  { label:"Revoked",       key:"revoked",  bg:"bg-rose-800",    accent:"text-rose-200",   icon:"M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" },
];

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onPrev, onNext, onPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-xs text-slate-400">Page {page} of {totalPages}</p>
      <div className="flex items-center gap-1">
        <button onClick={onPrev} disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition">
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3.5 h-3.5">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
          <button key={p} onClick={() => onPage(p)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-medium transition ${
              p === page
                ? "bg-blue-600 text-white border-blue-600"
                : "border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600"
            }`}>{p}</button>
        ))}
        <button onClick={onNext} disabled={page === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition">
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3.5 h-3.5">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function ManageDevices() {
  const [devices,      setDevices]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [search,       setSearch]       = useState("");
  const [filter,       setFilter]       = useState("all");
  const [page,         setPage]         = useState(1);
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
      setDevices(prev => [data.device, ...prev]);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add device");
    }
  };

  const handleSaveEdit = async (form) => {
    try {
      const { data } = await api.put(`/devices/${editTarget.id}`, form);
      setDevices(prev => prev.map(d => d.id === editTarget.id ? data.device : d));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update device");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/devices/${id}`);
      setDevices(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete device");
    }
  };

  const handleSigned = (updatedDevice) => {
    setDevices(prev => prev.map(d => d.id === updatedDevice.id ? updatedDevice : d));
  };

  const handleRevoke = async (id) => {
    try {
      const { data } = await api.put(`/devices/${id}/revoke-certificate`);
      setDevices(prev => prev.map(d => d.id === id ? data.device : d));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to revoke certificate");
    }
  };

  const filtered = devices.filter(d => {
    const matchFilter = filter === "all" || d.certStatus === filter;
    const matchSearch =
      (d.name        || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.deviceId    || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.location    || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.description || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    all:      devices.length,
    signed:   devices.filter(d => d.certStatus === "signed").length,
    unsigned: devices.filter(d => d.certStatus === "unsigned").length,
    revoked:  devices.filter(d => d.certStatus === "revoked").length,
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  // Reset to page 1 on filter/search change
  const handleFilterChange = (key) => { setFilter(key); setPage(1); };
  const handleSearchChange = (e)   => { setSearch(e.target.value); setPage(1); };

  return (
    <div className="flex flex-col gap-6">

      {/* ── KPI Cards — solid dark backgrounds ───────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpiConfig.map(k => (
          <div key={k.label}
            className={`${k.bg} rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-sm hover:brightness-110 transition-all duration-200`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-white/60 font-semibold">{k.label}</span>
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"
                  className={`w-4 h-4 ${k.accent}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={k.icon} />
                </svg>
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white leading-none tracking-tight">
              {counts[k.key]}
            </span>
          </div>
        ))}
      </div>

      {/* ── Device list panel ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-8 flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
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
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl flex-wrap">
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => handleFilterChange(f.key)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-150 ${
                  filter === f.key
                    ? "bg-slate-700 text-slate-200 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-700"
                }`}>
                {f.label}
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600">
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
            <input type="text" placeholder="Search by name, ID, location, or description…"
              value={search} onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-200 text-slate-800 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-slate-200 overflow-x-auto">
          <div className="grid bg-slate-700 px-5 py-2.5 text-[11px] uppercase tracking-wider text-slate-200 font-medium border-b border-slate-200 min-w-[700px]"
            style={{ gridTemplateColumns:"1.5fr 1fr 1fr 1.5fr 1fr auto" }}>
            <span>Device</span>
            <span>Device ID</span>
            <span>Location</span>
            <span>Description</span>
            <span>Identity</span>
            <span className="w-[124px] text-right">Actions</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 text-sm gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Loading devices…
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-300 gap-2">
              <IconDevice />
              <span className="text-sm">No devices found</span>
            </div>
          ) : (
            paginated.map(device => {
              const status     = device.certStatus ?? "unsigned";
              const isUnsigned = status === "unsigned";
              const isSigned   = status === "signed";
              const isRevoked  = status === "revoked";

              return (
                <div key={device.id}
                  className={`grid items-start px-5 py-3.5 border-t border-slate-100 text-sm transition min-w-[700px]
                    ${isRevoked ? "bg-rose-50/30 hover:bg-rose-50/50" : "text-slate-700 hover:bg-blue-50/40"}`}
                  style={{ gridTemplateColumns:"1.5fr 1fr 1fr 1.5fr 1fr auto" }}>

                  {/* Device name */}
                  <div className="flex items-start gap-2 min-w-0 pr-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isRevoked ? "bg-rose-50 border border-rose-100 text-rose-400"
                      : isSigned ? "bg-blue-50 border border-blue-100 text-blue-500"
                      : "bg-amber-50 border border-amber-100 text-amber-500"
                    }`}>
                      <IconDevice />
                    </div>
                    <p className="font-medium text-slate-800 text-[13px] break-words whitespace-normal leading-snug">
                      {device.name}
                    </p>
                  </div>

                  {/* DevEUI */}
                  <span className="font-mono text-xs text-slate-500 break-all whitespace-normal pr-2">
                    {device.deviceId}
                  </span>

                  {/* Location */}
                  <span className="text-slate-600 text-[13px] break-words whitespace-normal pr-2">
                    {device.location}
                  </span>

                  {/* Description */}
                  <span className="text-slate-400 text-[12px] break-words whitespace-normal pr-2">
                    {device.description || <span className="italic text-slate-300">—</span>}
                  </span>

                  {/* Identity */}
                  <div className="pt-0.5">
                    {statusBadge[status] || statusBadge.unsigned}
                  </div>

                  {/* ── Action buttons — coloured backgrounds ────────── */}
                  <div className="flex items-center justify-end gap-1 w-[124px] shrink-0">

                    {/* View — always active, blue */}
                    <button
                      onClick={() => setViewTarget(device)}
                      title="View details"
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition">
                      <IconEye />
                    </button>

                    {/* Sign — emerald when available, grey when not */}
                    <button
                      onClick={() => isUnsigned && setSignTarget(device)}
                      disabled={!isUnsigned}
                      title={isUnsigned ? "Sign certificate" : "Already signed or revoked"}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg transition ${
                        isUnsigned
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                          : "bg-slate-100 text-slate-300 cursor-not-allowed"
                      }`}>
                      <IconCert />
                    </button>

                    {/* Edit — blue when available, grey when not */}
                    <button
                      onClick={() => isUnsigned && setEditTarget(device)}
                      disabled={!isUnsigned}
                      title={
                        isUnsigned ? "Edit device" :
                        isSigned   ? "Revoke certificate before editing" :
                        "Device is revoked and cannot be edited"
                      }
                      className={`w-8 h-8 flex items-center justify-center rounded-lg transition ${
                        isUnsigned
                          ? "bg-slate-100 text-slate-600 hover:bg-slate-600 hover:text-white"
                          : "bg-slate-100 text-slate-300 cursor-not-allowed"
                      }`}>
                      <IconEdit />
                    </button>

                    {/* Delete — rose when available, grey when not */}
                    <button
                      onClick={() => isUnsigned && setDeleteTarget(device)}
                      disabled={!isUnsigned}
                      title={isUnsigned ? "Delete device" : "Cannot delete a signed or revoked device"}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg transition ${
                        isUnsigned
                          ? "bg-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white"
                          : "bg-slate-100 text-slate-300 cursor-not-allowed"
                      }`}>
                      <IconTrash />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination + count */}
        {!loading && (
          <>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPrev={() => setPage(p => Math.max(1, p - 1))}
              onNext={() => setPage(p => Math.min(totalPages, p + 1))}
              onPage={p => setPage(p)}
            />
            <p className="text-xs text-slate-400 text-right">
              {filtered.length > ROWS_PER_PAGE
                ? `Showing ${(page - 1) * ROWS_PER_PAGE + 1}–${Math.min(page * ROWS_PER_PAGE, filtered.length)} of ${filtered.length} device${filtered.length !== 1 ? "s" : ""}`
                : `${filtered.length} of ${devices.length} device${devices.length !== 1 ? "s" : ""}`
              }
            </p>
          </>
        )}
      </div>

      {/* Modals */}
      {viewTarget   && <ViewDeviceModal      device={viewTarget}   onClose={() => setViewTarget(null)}   onRevoke={handleRevoke} onSigned={handleSigned} />}
      {signTarget   && <SignCertificateModal device={signTarget}   onClose={() => setSignTarget(null)}   onSigned={handleSigned} />}
      {editTarget   && <EditDeviceModal      device={editTarget}   onClose={() => setEditTarget(null)}   onSave={handleSaveEdit} />}
      {addOpen      && <AddDeviceModal                             onClose={() => setAddOpen(false)}     onAdd={handleAdd} />}
      {deleteTarget && <DeleteDeviceModal    device={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />}
    </div>
  );
}