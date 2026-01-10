import React from "react";
import { cls } from "../lib/utils";

export default function Input({ className="", ...props }) {
  return (
    <input
      className={cls("w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/60", className)}
      {...props}
    />
  );
}
