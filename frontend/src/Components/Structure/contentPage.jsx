import { useState, useEffect, useRef } from "react";
import Dashboard     from "../Pages/dashboard";
import ManageDevices from "../Pages/manageDevices";
import DeviceData    from "../Pages/deviceData";
import Profile       from "../Pages/profile";
import Ledger            from "../Pages/ledger";
import InvokedDatasets   from "../Pages/invokeddatasets";

// ── Sample notifications ──────────────────────────────────────────────────────
const SAMPLE_NOTIFICATIONS = [
  {
    id: 1, type: "data",    read: false,
    title: "Data Received",
    message: "Village I Sensors transmitted a new packet",
    detail: "Temp: 29.4°C · Hum: 72% · Soil: 45% · Rain: 0.0mm",
    time: "Just now",
  },
  {
    id: 2, type: "block",   read: false,
    title: "Block Committed",
    message: "Hyperledger Fabric — Block #4822 committed",
    detail: "2 transactions · Latency: 142ms",
    time: "2 min ago",
  },
  {
    id: 3, type: "signed",  read: false,
    title: "Certificate Signed",
    message: "Village II Sensors certificate was signed",
    detail: "Serial: 7B:11:4D:CC:02:EF:55:89…",
    time: "5 min ago",
  },
  {
    id: 4, type: "device",  read: true,
    title: "Device Added",
    message: "Village III Sensors enrolled successfully",
    detail: "DevEUI: DC:A6:32:78:9A:BC · Location: Village III",
    time: "12 min ago",
  },
  {
    id: 5, type: "revoked", read: true,
    title: "Certificate Revoked",
    message: "Village IV Sensors certificate was revoked",
    detail: "Originally signed: Mar 01, 2026",
    time: "1 hr ago",
  },
  {
    id: 6, type: "rejected", read: true,
    title: "Payload Rejected",
    message: "Unverified payload dropped from DEV-007",
    detail: "Reason: No signed certificate found for DevEUI",
    time: "2 hr ago",
  },
];

// ── Notification type config ──────────────────────────────────────────────────
const TYPE_CONFIG = {
  data:     { label:"Data",      dot:"bg-blue-500",   icon:"M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10",  bg:"bg-blue-50",    text:"text-blue-600",    border:"border-blue-200"    },
  block:    { label:"Block",     dot:"bg-violet-500", icon:"M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",                                         bg:"bg-violet-50",  text:"text-violet-600",  border:"border-violet-200"  },
  signed:   { label:"Signed",   dot:"bg-green-500",  icon:"M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622", bg:"bg-green-50",  text:"text-green-700",  border:"border-green-200"  },
  device:   { label:"Device",   dot:"bg-cyan-500",   icon:"M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18",    bg:"bg-cyan-50",    text:"text-cyan-700",    border:"border-cyan-200"    },
  revoked:  { label:"Revoked",  dot:"bg-amber-500",  icon:"M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",          bg:"bg-amber-50",   text:"text-amber-700",   border:"border-amber-200"   },
  rejected: { label:"Rejected", dot:"bg-red-500",    icon:"M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",    bg:"bg-red-50",     text:"text-red-700",     border:"border-red-200"     },
};

// ── Floating Notification Panel ───────────────────────────────────────────────
function NotificationPanel({ notifications, onMarkRead, onMarkAllRead, onClose }) {
  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="absolute top-full right-0 mt-2 w-[380px] bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/80 z-50 overflow-hidden flex flex-col"
      style={{ maxHeight:"520px" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <p className="text-[14px] font-semibold text-slate-800">Notifications</p>
          {unread > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500 text-white">
              {unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button onClick={onMarkAllRead}
              className="text-[11px] text-blue-600 hover:underline font-medium">
              Mark all read
            </button>
          )}
          <button onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3.5 h-3.5">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Notification list */}
      <div className="overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-300 gap-2">
            <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="w-8 h-8">
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          notifications.map((n, i) => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.data;
            return (
              <button key={n.id} onClick={() => onMarkRead(n.id)}
                className={`w-full text-left flex items-start gap-3 px-5 py-3.5 border-b border-slate-50 hover:bg-slate-50/80 transition ${
                  !n.read ? "bg-blue-50/30" : "bg-white"
                }`}>

                {/* Icon */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${cfg.bg} ${cfg.border}`}>
                  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className={`w-4 h-4 ${cfg.text}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className={`text-[12px] font-semibold ${!n.read ? "text-slate-800" : "text-slate-600"}`}>
                      {n.title}
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{n.message}</p>
                  {n.detail && (
                    <p className={`text-[10px] font-mono mt-1 ${cfg.text} opacity-80`}>{n.detail}</p>
                  )}
                </div>

                {/* Unread dot */}
                {!n.read && (
                  <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${cfg.dot}`} />
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              <span className="text-[10px] text-slate-500">{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Page descriptions & router ────────────────────────────────────────────────
const pageDescriptions = {
  Dashboard:        "Track, and monitor your devices.",
  "Manage Devices": "Add, edit, and monitor your connected devices.",
  "Device's Data":  "View and export data from your devices.",
  Ledger:           "Full transaction and activity log.",
  "Invoked Datasets": "Manage and invoke device datasets to Hyperledger Fabric.",
  Profile:          "Your account details and certificate.",
};

function PageRouter({ activePage }) {
  switch (activePage) {
    case "Dashboard":      return <Dashboard activePage={activePage} />;
    case "Manage Devices": return <ManageDevices />;
    case "Device's Data":  return <DeviceData />;
    case "Profile":        return <Profile />;
    case "Ledger":           return <Ledger />;
    case "Invoked Datasets": return <InvokedDatasets />;
    default:
      return (
        <div className="flex flex-col items-center justify-center h-64 text-blue-300/50 text-sm gap-2">
          <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="w-10 h-10 text-blue-200/30">
            <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>{activePage} — coming soon</span>
        </div>
      );
  }
}

function formatDateTime(date) {
  const dateStr = date.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
  });
  return `${dateStr}  ${timeStr}`;
}

// ── Main content ──────────────────────────────────────────────────────────────
export default function MainContent({ activePage }) {
  const description = pageDescriptions[activePage] || "Welcome to Buklod.";
  const [now, setNow]                       = useState(new Date());
  const [panelOpen, setPanelOpen]           = useState(false);
  const [notifications, setNotifications]   = useState(SAMPLE_NOTIFICATIONS);
  const bellRef                             = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">

      {/* Topbar */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 h-[58px] flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-[15px] font-medium text-slate-800 leading-tight">{activePage}</h1>
          <p className="text-[11.5px] text-slate-400">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Live clock */}
          <span className="bg-blue-50 text-gray-700 border border-blue-200 text-xs font-mono px-3 py-1.5 rounded-full tabular-nums">
            {formatDateTime(now)}
          </span>

          {/* Notification bell — relative wrapper for panel positioning */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => setPanelOpen(v => !v)}
              className="relative w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition"
            >
              <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {/* Unread badge */}
              {unreadCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-blue-500 text-white text-[9px] font-bold px-1 leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-slate-300 rounded-full" />
              )}
            </button>

            {/* Floating panel */}
            {panelOpen && (
              <NotificationPanel
                notifications={notifications}
                onMarkRead={handleMarkRead}
                onMarkAllRead={handleMarkAllRead}
                onClose={() => setPanelOpen(false)}
              />
            )}
          </div>
        </div>
      </header>

      {/* Page body */}
      <main className="flex-1 p-8">
        <PageRouter activePage={activePage} />
      </main>

    </div>
  );
}