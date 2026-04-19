import { useNavigate } from "react-router-dom";
import Sidebar     from "../Components/Structure/sidebar";
import MainContent from "../Components/Structure/contentPage";

// Maps sidebar display name → URL path
const pageToPath = {
  "Dashboard":        "/dashboard",
  "Manage Devices":   "/manage-devices",
  "Device's Data":    "/device-data",
  "Ledger":           "/ledger",
  "Invoked Datasets": "/invoked-datasets",
  "Profile":          "/profile",
};

export default function MainLayout({ page }) {
  const navigate = useNavigate();

  const setActivePage = (pageName) => {
    const path = pageToPath[pageName];
    if (path) navigate(path);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar activePage={page} setActivePage={setActivePage} />
      <div className="flex-1 overflow-y-auto">
        <MainContent activePage={page} />
      </div>
    </div>
  );
}