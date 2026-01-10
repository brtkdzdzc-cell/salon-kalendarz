import React, { useEffect } from "react";
import Button from "./Button.jsx";

export default function Modal({ open, title, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-slate-900 border border-white/10 rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 max-h-[85vh] overflow-auto">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold">{title}</h2>
          <Button variant="ghost" onClick={onClose}>Zamknij</Button>
        </div>
        <div className="mt-4">{children}</div>
        {footer ? <div className="mt-5">{footer}</div> : null}
      </div>
    </div>
  );
}
