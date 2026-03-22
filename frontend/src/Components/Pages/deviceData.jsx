import { useState } from "react";
import ViewDataModal from "../modal/viewData";

const allData = [
  { id: 1,  device:"Village I Sensors",   deviceId:"DEV-001", macAddress:"A4:C3:F0:12:34:56", timestamp:"Mar 19, 2026 08:00", temperature:28.4, humidity:72, soilMoisture:45, rainfall:0.0, certificate:"3A:9F:2C:BB:01:DE:44:78:FA:CC:10:29:38:7E:90:12" },
  { id: 2,  device:"Village II Sensors",  deviceId:"DEV-002", macAddress:"B8:27:EB:45:67:89", timestamp:"Mar 19, 2026 08:05", temperature:27.1, humidity:68, soilMoisture:38, rainfall:0.0, certificate:"7B:11:4D:CC:02:EF:55:89:AB:DD:21:30:49:8F:A1:23" },
  { id: 3,  device:"Village III Sensors", deviceId:"DEV-003", macAddress:"DC:A6:32:78:9A:BC", timestamp:"Mar 19, 2026 08:10", temperature:29.0, humidity:75, soilMoisture:52, rainfall:1.2, certificate:null },
  { id: 4,  device:"Village I Sensors",   deviceId:"DEV-001", macAddress:"A4:C3:F0:12:34:56", timestamp:"Mar 19, 2026 09:00", temperature:29.2, humidity:70, soilMoisture:44, rainfall:0.0, certificate:"3A:9F:2C:BB:01:DE:44:78:FA:CC:10:29:38:7E:90:12" },
  { id: 5,  device:"Village II Sensors",  deviceId:"DEV-002", macAddress:"B8:27:EB:45:67:89", timestamp:"Mar 19, 2026 09:05", temperature:28.5, humidity:66, soilMoisture:37, rainfall:0.0, certificate:"7B:11:4D:CC:02:EF:55:89:AB:DD:21:30:49:8F:A1:23" },
  { id: 6,  device:"Village III Sensors", deviceId:"DEV-003", macAddress:"DC:A6:32:78:9A:BC", timestamp:"Mar 19, 2026 09:10", temperature:30.1, humidity:73, soilMoisture:50, rainfall:0.8, certificate:null },
  { id: 7,  device:"Village I Sensors",   deviceId:"DEV-001", macAddress:"A4:C3:F0:12:34:56", timestamp:"Mar 19, 2026 10:00", temperature:31.0, humidity:65, soilMoisture:42, rainfall:0.0, certificate:"3A:9F:2C:BB:01:DE:44:78:FA:CC:10:29:38:7E:90:12" },
  { id: 8,  device:"Village II Sensors",  deviceId:"DEV-002", macAddress:"B8:27:EB:45:67:89", timestamp:"Mar 19, 2026 10:05", temperature:30.3, humidity:63, soilMoisture:35, rainfall:0.0, certificate:"7B:11:4D:CC:02:EF:55:89:AB:DD:21:30:49:8F:A1:23" },
  { id: 9,  device:"Village III Sensors", deviceId:"DEV-003", macAddress:"DC:A6:32:78:9A:BC", timestamp:"Mar 19, 2026 10:10", temperature:31.8, humidity:70, soilMoisture:48, rainfall:2.4, certificate:null },
  { id: 10, device:"Village I Sensors",   deviceId:"DEV-001", macAddress:"A4:C3:F0:12:34:56", timestamp:"Mar 19, 2026 11:00", temperature:32.5, humidity:61, soilMoisture:40, rainfall:0.0, certificate:"3A:9F:2C:BB:01:DE:44:78:FA:CC:10:29:38:7E:90:12" },
  { id: 11, device:"Village II Sensors",  deviceId:"DEV-002", macAddress:"B8:27:EB:45:67:89", timestamp:"Mar 19, 2026 11:05", temperature:31.7, humidity:60, soilMoisture:33, rainfall:0.0, certificate:"7B:11:4D:CC:02:EF:55:89:AB:DD:21:30:49:8F:A1:23" },
  { id: 12, device:"Village III Sensors", deviceId:"DEV-003", macAddress:"DC:A6:32:78:9A:BC", timestamp:"Mar 19, 2026 11:10", temperature:33.2, humidity:68, soilMoisture:46, rainfall:0.5, certificate:null },
];

const TODAY         = "Mar 19, 2026";
const ROWS_PER_PAGE = 10;
const devices       = ["All Devices", "Village I Sensors", "Village II Sensors", "Village III Sensors"];

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onPrev, onNext, onPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-xs text-slate-400">Page {page} of {totalPages}</p>
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3.5 h-3.5">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-medium transition ${
              p === page
                ? "bg-blue-600 text-white border-blue-600"
                : "border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={onNext}
          disabled={page === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3.5 h-3.5">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DeviceData() {
  const [deviceFilter, setDeviceFilter] = useState("All Devices");
  const [search, setSearch]             = useState("");
  const [page, setPage]                 = useState(1);
  const [viewData, setViewData]         = useState(null);

  const filtered = allData.filter((row) => {
    const matchDevice = deviceFilter === "All Devices" || row.device === deviceFilter;
    const matchSearch =
      row.device.toLowerCase().includes(search.toLowerCase()) ||
      row.deviceId.toLowerCase().includes(search.toLowerCase()) ||
      row.macAddress.toLowerCase().includes(search.toLowerCase()) ||
      row.timestamp.toLowerCase().includes(search.toLowerCase());
    return matchDevice && matchSearch;
  });

  const handleDeviceFilter = (d) => { setDeviceFilter(d); setPage(1); };
  const handleSearch       = (e) => { setSearch(e.target.value); setPage(1); };

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const totalDevices    = new Set(allData.map((r) => r.deviceId)).size;
  const todayData       = allData.filter((r) => r.timestamp.startsWith(TODAY));
  const latestTimestamp = allData.length ? allData[allData.length - 1].timestamp : "—";

  const kpis = [
    { label: "Total Data Received", value: allData.length,   suffix: "records", color: "text-blue-600",    small: false },
    { label: "Total Devices",       value: totalDevices,      suffix: "devices", color: "text-slate-800",   small: false },
    { label: "Received Today",      value: todayData.length,  suffix: "records", color: "text-emerald-600", small: false },
    { label: "Latest Transmission", value: latestTimestamp,   suffix: "",        color: "text-indigo-600",  small: true  },
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-1 hover:shadow-md hover:shadow-blue-100 hover:border-blue-200 transition-all duration-200"
          >
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">{k.label}</span>
            <span className={`font-semibold font-mono tracking-tight ${k.color} ${k.small ? "text-base mt-1" : "text-2xl"}`}>
              {k.value}
            </span>
            {k.suffix && <span className="text-[11px] text-slate-400">{k.suffix}</span>}
          </div>
        ))}
      </div>

      {/* Table panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col gap-4">

        {/* Panel header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-[15px] font-medium text-slate-800">All Received Data</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {filtered.length} record{filtered.length !== 1 ? "s" : ""}
              {filtered.length > ROWS_PER_PAGE &&
                ` — showing ${(page - 1) * ROWS_PER_PAGE + 1}–${Math.min(page * ROWS_PER_PAGE, filtered.length)}`}
            </p>
          </div>
          {/* Device filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {devices.map((d) => (
              <button
                key={d}
                onClick={() => handleDeviceFilter(d)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                  deviceFilter === d
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                {d === "All Devices" ? d : d.replace(" Sensors", "")}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search by device, MAC address, or timestamp…"
            value={search}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
          />
        </div>

        {/* Table */}
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-4 bg-slate-50 px-5 py-2.5 text-[11px] uppercase tracking-wider text-slate-400 font-medium border-b border-slate-200">
            <span>Device</span>
            <span>MAC Address</span>
            <span>Timestamp</span>
            <span className="text-right">Details</span>
          </div>

          {paginated.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-slate-300 text-sm">
              No data found
            </div>
          ) : (
            paginated.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-4 items-center px-5 py-3.5 border-t border-slate-100 text-sm text-slate-700 hover:bg-blue-50/40 transition"
              >
                <div>
                  <p className="font-medium text-slate-800 text-[13px]">{row.device}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{row.deviceId}</p>
                </div>
                <span className="font-mono text-xs text-slate-500">{row.macAddress}</span>
                <span className="text-xs text-slate-500">{row.timestamp}</span>
                <div className="flex justify-end">
                  <button
                    onClick={() => setViewData(row)}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-200 transition"
                  >
                    <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-3.5 h-3.5">
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View All
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          onPage={(p) => setPage(p)}
        />
      </div>

      {/* View Data Modal */}
      {viewData && (
        <ViewDataModal data={viewData} onClose={() => setViewData(null)} />
      )}

    </div>
  );
}