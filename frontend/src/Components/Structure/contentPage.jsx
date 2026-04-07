import { useState, useEffect } from "react";
import Dashboard     from "../Pages/dashboard";
import ManageDevices from "../Pages/manageDevices";
import DeviceData    from "../Pages/deviceData";
import Profile       from "../Pages/profile";
import Ledger        from "../Pages/ledger";

const pageDescriptions = {
  Dashboard:        "Track, and monitor your devices.",
  "Manage Devices": "Add, edit, and monitor your connected devices.",
  "Device's Data":  "View and export data from your devices.",
  Ledger:           "Full transaction and activity log.",
  Profile:          "Your account details and certificate.",
};

function PageRouter({ activePage }) {
  switch (activePage) {
    case "Dashboard":      return <Dashboard activePage={activePage} />;
    case "Manage Devices": return <ManageDevices />;
    case "Device's Data":  return <DeviceData />;
    case "Profile":        return <Profile />;
    case "Ledger":         return <Ledger/>;
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

export default function MainContent({ activePage }) {
  const description = pageDescriptions[activePage] || "Welcome to Buklod.";
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">

      {/* Topbar */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 h-[58px] flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-[15px] font-medium text-slate-800 leading-tight">{activePage}</h1>
          <p className="text-[11.5px] text-slate-400">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-blue-50 text-gray-700 border border-blue-200 text-xs font-mono px-3 py-1.5 rounded-full tabular-nums">
            {formatDateTime(now)}
          </span>
          {/* <button className="relative w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition">
            <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4">
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full" />
          </button> */}
        </div>
      </header>

      {/* Page body */}
      <main className="flex-1 p-8">
        <PageRouter activePage={activePage} />
      </main>

    </div>
  );
}