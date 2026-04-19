// ── Shared base modal wrapper ─────────────────────────────────────────────────
export function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-800/50 backdrop-blur-[2px] overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="min-h-full flex items-center justify-center px-4 py-6 sm:py-10">
        <div
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl shadow-slate-900/20 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
            <h2 className="text-[15px] font-semibold text-slate-800">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition"
            >
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Body */}
          <div className="px-6 py-5 overflow-y-auto max-h-[75vh]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shared input style — no glow, clean border ────────────────────────────────
export const inputClass = (hasError = false) =>
  `w-full px-4 py-2.5 rounded-xl border text-sm bg-slate-50 text-slate-800 placeholder-slate-300
   focus:outline-none focus:border-blue-400 focus:bg-white transition
   ${hasError ? "border-rose-400 bg-rose-50" : "border-slate-200"}`;