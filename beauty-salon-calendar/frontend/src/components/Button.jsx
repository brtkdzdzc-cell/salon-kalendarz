import React from "react";
import { cls } from "../lib/utils";

export default function Button({ className="", variant="primary", ...props }) {
  const base = "px-4 py-2 rounded-2xl text-sm font-semibold active:scale-[0.99] transition shadow-sm";
  const styles = {
    primary: "bg-indigo-500 hover:bg-indigo-400 text-white",
    ghost: "bg-white/5 hover:bg-white/10 text-slate-100",
    danger: "bg-rose-500 hover:bg-rose-400 text-white",
  };
  return <button className={cls(base, styles[variant] || styles.primary, className)} {...props} />;
}
