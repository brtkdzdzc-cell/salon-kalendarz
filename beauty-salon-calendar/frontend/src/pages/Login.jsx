import React, { useState } from "react";
import { api, setToken } from "../lib/api";
import Input from "../components/Input.jsx";
import Button from "../components/Button.jsx";

export default function Login({ onLoggedIn }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      const { data } = await api.post("/auth/login", { username, password });
      setToken(data.token);
      onLoggedIn?.(data.user);
    } catch (e) {
      setErr(e?.response?.data?.error || "Błąd logowania");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900/60 border border-white/10 rounded-3xl p-6 shadow">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" className="w-10 h-10" alt="Salon" />
          <div>
            <div className="text-lg font-extrabold">Salon — Kalendarz</div>
            <div className="text-xs text-slate-300">Logowanie</div>
          </div>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <div>
            <div className="text-xs text-slate-300 mb-1">Login</div>
            <Input value={username} onChange={(e)=>setUsername(e.target.value)} autoComplete="username" />
          </div>
          <div>
            <div className="text-xs text-slate-300 mb-1">Hasło</div>
            <Input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" autoComplete="current-password" />
          </div>
          {err ? <div className="text-sm text-rose-300">{err}</div> : null}
          <Button className="w-full" type="submit">Zaloguj</Button>
        </form>
        <div className="mt-4 text-xs text-slate-400">
          Domyślnie: admin / admin123 (zmień po uruchomieniu).
        </div>
      </div>
    </div>
  );
}
