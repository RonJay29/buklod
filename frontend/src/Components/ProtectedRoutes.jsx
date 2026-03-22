import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { isAuthenticated } from "../services/authService";

export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(isAuthenticated());

  useEffect(() => {
    // Re-check auth whenever localStorage changes (fired by OTHER tabs)
    const handleStorage = (e) => {
      if (e.key === "logout" || e.key === "accessToken") {
        const stillAuthed = isAuthenticated();
        setAuthed(stillAuthed);
        if (!stillAuthed) {
          navigate("/login", { replace: true });
        }
      }
    };

    // Also re-check when this tab regains focus
    // (covers the case where the storage event was missed)
    const handleFocus = () => {
      const stillAuthed = isAuthenticated();
      setAuthed(stillAuthed);
      if (!stillAuthed) {
        navigate("/login", { replace: true });
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
    };
  }, [navigate]);

  if (!authed) {
    return <Navigate to="/login" replace />;
  }

  return children;
}