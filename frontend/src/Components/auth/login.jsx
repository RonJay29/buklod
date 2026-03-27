import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../../services/authService";

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode]       = useState("login");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", password: "",
  });

  const set = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
    setError("");
  };

  const handleSubmit = async () => {
  setError("");
  setLoading(true);
  try {
    if (mode === "login") {
      await loginUser({ email: form.email, password: form.password });
    } else {
      await registerUser({
        first_name: form.first_name,
        last_name:  form.last_name,
        email:      form.email,
        password:   form.password,
      });
    }
    // replace: true removes /login from history stack
    // so pressing back from /dashboard won't return to /login
    navigate("/dashboard", { replace: true });
  } catch (err) {
    setError(err.response?.data?.message || "Something went wrong");
  } finally {
    setLoading(false);
  }
  };

  return (
    <div className="w-full min-h-screen overflow-hidden flex bg-slate-900 text-white font-sans">

      {/* Left side */}
      <div className="hidden md:flex flex-1 p-8 ms-10 flex-col relative overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 left-32 w-56 h-56 bg-blue-900/30 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-2 mt-15 relative z-10">
          <h1 className="text-5xl font-bold">
            Buklod
            <br />
            <p className="text-lg text-slate-400 font-light max-w-md mt-1">
              A beautiful dashboard for managing your devices and sensor data. 
            </p>
          </h1>
          
        </div>

        <div className="flex flex-col gap-3 mt-10 relative z-10">
          {[
            { icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", label: "Real-time sensor analytics" },
            { icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", label: "Secure device management" },
            { icon: "M13 10V3L4 14h7v7l9-11h-7z", label: "Live data & instant alerts" },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-3 bg-blue-950/50 border border-blue-800/40 rounded-xl px-4 py-3 w-fit">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                <svg fill="none" stroke="#93c5fd" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
                  <path d={icon} />
                </svg>
              </div>
              <span className="text-sm text-slate-300">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right side - auth card */}
      <div className="flex flex-1 justify-end items-center p-8">
        <div className="relative w-full max-w-md">
          <div className="bg-white rounded-3xl me-10 border border-slate-200 overflow-hidden text-black shadow-2xl shadow-blue-950/50">

            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-8 text-white text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_50%,#3b82f6,transparent)]" />
           
              <h1 className="text-2xl font-bold tracking-tight relative z-10">
                {mode === "login" ? "Welcome back" : "Create account"}
              </h1>
              <p className="text-blue-300 text-sm mt-1 relative z-10">
                {mode === "login" ? "Sign in to your account" : "Join us today — it's free"}
              </p>
            </div>

            {/* Tab Toggle */}
            <div className="flex mx-6 mt-6 bg-slate-100 rounded-2xl p-1 border border-slate-200">
              {["login", "signup"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setMode(tab); setError(""); }}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                    mode === tab
                      ? "bg-gradient-to-r from-slate-800 to-blue-900 text-white shadow-md"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>

            {/* Form */}
            <div className="p-6 pt-4 space-y-4">

              {/* Error message */}
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs px-4 py-2.5 rounded-xl">
                  {error}
                </div>
              )}

              {mode === "signup" && (
                <div className="grid grid-cols-2 gap-3">
                  {[["first_name","First name"], ["last_name","Last name"]].map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
                      <input
                        type="text"
                        value={form[key]}
                        onChange={set(key)}
                        placeholder={label.split(" ")[0]}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email address</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={set("password")}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                  />
                  <button onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                    {showPass ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

             

              {mode === "signup" && (
                <label className="flex items-start gap-2 text-xs text-slate-500 cursor-pointer">
                  {/* <input type="checkbox" className="accent-blue-600 mt-0.5 rounded" />
                  <span>I agree to the <a href="#" className="text-blue-600 font-semibold underline underline-offset-2">Terms of Service</a> and <a href="#" className="text-blue-600 font-semibold underline underline-offset-2">Privacy Policy</a></span> */}
                </label>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-slate-800 via-blue-900 to-slate-800 text-white font-bold text-sm shadow-lg shadow-blue-950/40 hover:shadow-blue-900/60 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 mt-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
              >
                {loading
                  ? "Please wait…"
                  : mode === "login" ? "Sign In →" : "Create Account →"
                }
              </button>
            </div>

             {mode === "login" && (
                <div className="flex items-center justify-center text-xs">
                  {/* <label className="flex items-center gap-2 text-slate-500 cursor-pointer">
                    <input type="checkbox" className="accent-blue-600 rounded" />
                    Remember me
                  </label> */}
                 <p className="text-slate-400">Forgot Password? </p> <a href="#" className="text-blue-600 hover:text-blue-800  font-semibold transition"> Click here.</a>
                </div>
              )}

            {/* Footer */}
            <p className="text-center text-xs text-slate-400 pb-6">
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
                className="text-blue-600 font-bold hover:text-blue-800 transition"
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}