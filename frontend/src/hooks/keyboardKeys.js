import { useEffect, useRef } from "react";

/**
 * useFormKeys — handles Enter (submit) and Escape (cancel/close).
 *
 * Uses refs internally so the hook never needs to be re-registered
 * when form state changes — solves the stale closure problem.
 *
 * @param {Function|null} onEnter   — called on Enter key (e.g. handleSubmit)
 * @param {Function|null} onEscape  — called on Escape key (e.g. onClose)
 * @param {boolean}       enabled   — pass !loading or !submitting to disable during requests
 *
 * Usage:
 *   useFormKeys(handleSubmit, onClose, !loading);
 *   useFormKeys(handleAdd,    onClose, !submitting);
 *   useFormKeys(handleSubmit, null,    !loading);   // Enter only
 *   useFormKeys(null,         onClose, true);       // Escape only
 */
export function useFormKeys(onEnter, onEscape, enabled = true) {
  // Store latest callbacks in refs so the event listener
  // always calls the most up-to-date version without needing
  // to be re-registered on every render
  const onEnterRef  = useRef(onEnter);
  const onEscapeRef = useRef(onEscape);
  const enabledRef  = useRef(enabled);

  // Keep refs in sync with latest props on every render
  onEnterRef.current  = onEnter;
  onEscapeRef.current = onEscape;
  enabledRef.current  = enabled;

  useEffect(() => {
    const handler = (e) => {
      // Always read from refs — never from the closure
      if (!enabledRef.current) return;

      if (e.key === "Enter") {
        // Skip if focus is on a textarea (user wants a line break)
        // Skip if focus is on a button (let the button's own onClick fire)
        if (
          document.activeElement?.tagName === "TEXTAREA" ||
          document.activeElement?.tagName === "BUTTON"
        ) return;

        onEnterRef.current?.();
      }

      if (e.key === "Escape") {
        onEscapeRef.current?.();
      }
    };

    window.addEventListener("keydown", handler);

    // Cleanup removes the listener when the component unmounts
    // This ensures modals don't leave stale listeners after closing
    return () => window.removeEventListener("keydown", handler);

  }, []); // ← empty array: register once, refs handle the rest
}