import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../../services/authService";

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

const navItems = [
  {
    label: "Main",
    links: [
      {
        name: "Dashboard",
        icon: (
          <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-[18px] h-[18px]">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        ),
      },
      {
        name: "Manage Devices",
        icon: (
          <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-[18px] h-[18px]">
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
      },
      {
        name: "Device's Data",
        icon: (
          <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-[18px] h-[18px]">
            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
      },
       {
        name: "Invoked Datasets",
        icon: (
          <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-[18px] h-[18px]">
            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        ),
      },
      {
        name: "Ledger",
        icon: (
          <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-[18px] h-[18px]">
            <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
     

    ],
  },
];

export default function Sidebar({ activePage, setActivePage }) {
  const [collapsed, setCollapsed]     = useState(false);
  const [loggingOut, setLoggingOut]   = useState(false);
  const [user, setUser]               = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef                   = useRef(null);
  const navigate                      = useNavigate();

  useEffect(() => {
    setUser(getUserFromToken());
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const firstName = capitalize(user?.first_name) || "User";
  const fullName  = [capitalize(user?.first_name), capitalize(user?.last_name)].filter(Boolean).join(" ") || "User";
  const initials  = [user?.first_name, user?.last_name].filter(Boolean).map((n) => n.charAt(0).toUpperCase()).join("") || "?";
  const role      = capitalize(user?.role) || "User";
  const email     = user?.email || "";

  const handleLogout = async () => {
    setDropdownOpen(false);
    setLoggingOut(true);
    try {
      await logoutUser();
    } catch {
      // silent fail
    } finally {
      setLoggingOut(false);
      localStorage.removeItem("accessToken");
      localStorage.setItem("logout", Date.now().toString());
      navigate("/login", { replace: true });
    }
  };

  const handleProfile = () => {
    setDropdownOpen(false);
    setActivePage("Profile");
  };

  return (
    <aside className={`
      flex flex-col h-screen sticky top-0 bg-gray-900
      transition-all duration-300 ease-in-out
      ${collapsed ? "w-[68px]" : "w-[220px]"}
      shrink-0
    `}>

      {/* Logo */}
      <div className={`flex items-center border-b border-blue-800/40 transition-all duration-300 ${
        collapsed ? "justify-center px-2 py-5" : "gap-3 px-5 py-6"
      }`}>
        {collapsed ? (
          <span className="text-cyan-400 font-bold text-[13px] tracking-widest leading-none uppercase">
            BKL
          </span>
        ) : (
          <span className="text-white font-semibold text-2xl tracking-tight leading-none">
            Buklod
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-1">
        {navItems.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="text-[10px] uppercase tracking-widest text-blue-400/50 px-5 pt-4 pb-1 font-medium">
                {section.label}
              </p>
            )}
            {collapsed && <div className="my-2 mx-3 border-t border-blue-800/40" />}
            {section.links.map((item) => {
              const isActive = activePage === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => setActivePage(item.name)}
                  title={collapsed ? item.name : undefined}
                  className={`
                    w-full flex items-center gap-3 px-5 py-2.5 text-[13.5px] transition-all duration-150
                    ${collapsed ? "justify-center px-0" : ""}
                    ${isActive
                      ? "bg-blue-500/20 text-white font-medium border-r-2 border-blue-400"
                      : "text-blue-200/60 hover:bg-blue-500/10 hover:text-blue-100"
                    }
                  `}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {!collapsed && <span>{item.name}</span>}
                  {!collapsed && isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-blue-800/40 flex flex-col gap-2">

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-blue-300/50 hover:text-blue-100 hover:bg-blue-500/10 transition text-xs"
        >
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
            className={`w-4 h-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}>
            <path d="M15 19l-7-7 7-7" />
          </svg>
          {!collapsed && <span>Collapse</span>}
        </button>

        {/* User dropdown trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            title={collapsed ? fullName : undefined}
            className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl bg-blue-500/10 border border-blue-400/10 hover:bg-blue-500/20 transition ${
              collapsed ? "justify-center" : ""
            }`}
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {initials}
            </div>

            {/* Name + role */}
            {!collapsed && (
              <>
                <div className="overflow-hidden flex-1 text-left">
                  <p className="text-white text-xs font-medium truncate">{firstName}</p>
                  <p className="text-blue-300/50 text-[11px] truncate">{role}</p>
                </div>
                {/* Chevron */}
                <svg
                  fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                  className={`w-3.5 h-3.5 text-blue-300/40 transition-transform duration-200 shrink-0 ${dropdownOpen ? "rotate-180" : ""}`}
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>

          {/* Dropdown menu — opens upward */}
          {dropdownOpen && (
            <div className={`absolute bottom-full mb-2 bg-gray-800 border border-blue-800/40 rounded-xl shadow-xl overflow-hidden z-50 ${
              collapsed ? "left-full ml-2 w-48" : "left-0 right-0"
            }`}>

              {/* User info header */}
              <div className="px-4 py-3 border-b border-blue-800/30">
                <p className="text-white text-xs font-medium truncate">{fullName}</p>
                <p className="text-blue-300/50 text-[11px] truncate mt-0.5">{email}</p>
              </div>

              {/* Profile button */}
              <button
                onClick={handleProfile}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-blue-200/70 hover:text-white hover:bg-blue-500/10 transition"
              >
                <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </button>

              {/* Divider */}
              <div className="mx-3 border-t border-blue-800/30" />

              {/* Logout button */}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {loggingOut ? "Logging out…" : "Logout"}
              </button>
            </div>
          )}
        </div>

      </div>
    </aside>
  );
}