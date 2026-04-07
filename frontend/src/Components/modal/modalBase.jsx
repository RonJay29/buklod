// Shared base modal wrapper
const IconClose = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
    <path d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl shadow-slate-200/80 border border-slate-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 className="text-[15px] font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto" style={{ maxHeight: "calc(100vh - 140px)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function Field({ label, value, onChange, placeholder, mono = false, readOnly = false }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition
          ${mono ? "font-mono" : ""}
          ${readOnly ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-800"}`}
      />
    </div>
  );
}