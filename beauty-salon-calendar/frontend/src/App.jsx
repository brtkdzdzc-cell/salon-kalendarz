import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { api, clearToken, getToken } from "./lib/api";
import { CalendarDays, Users, Shield, LogOut, Briefcase } from "lucide-react";

import Login from "./pages/Login.jsx";
import CalendarPage from "./pages/CalendarPage.jsx";
import Clients from "./pages/Clients.jsx";
import Employees from "./pages/Employees.jsx";
import Admin from "./pages/Admin.jsx";
import Button from "./components/Button.jsx";

function NavItem({ to, icon: Icon, label }) {
  const loc = useLocation();
  const active = loc.pathname === to;
  return (
    <Link to={to} className={"flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl " + (active ? "bg-white/10" : "bg-transparent")}>
      <Icon size={18} />
      <div className="text-[11px]">{label}</div>
    </Link>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [repeatDraft, setRepeatDraft] = useState(null);

  async function boot() {
    const t = getToken();
    if (!t) { setBooting(false); return; }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setBooting(false);
    }
  }

  useEffect(()=>{ boot(); }, []);

  function logout() {
    clearToken();
    setUser(null);
  }

  if (booting) {
    return <div className="min-h-screen flex items-center justify-center text-slate-300">Ładowanie…</div>;
  }

  if (!user) {
    return <Login onLoggedIn={(u)=>setUser(u)} />;
  }

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur border-b border-white/10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" className="w-7 h-7" alt="Salon" />
            <div className="font-extrabold">Salon</div>
            <div className="text-xs text-slate-300">({user.username})</div>
          </div>
          <Button variant="ghost" onClick={logout} title="Wyloguj"><LogOut size={18} /></Button>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<CalendarPage repeatDraft={repeatDraft} onConsumedRepeat={()=>setRepeatDraft(null)} />} />
        <Route path="/clients" element={<Clients onRepeat={(appt)=>setRepeatDraft(appt)} />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/admin" element={user.role === "admin" ? <Admin /> : <Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur border-t border-white/10">
        <div className="max-w-3xl mx-auto px-3 py-2 flex gap-2">
          <NavItem to="/" icon={CalendarDays} label="Kalendarz" />
          <NavItem to="/clients" icon={Users} label="Klientki" />
          <NavItem to="/employees" icon={Briefcase} label="Pracownicy" />
          {user.role === "admin" ? <NavItem to="/admin" icon={Shield} label="Admin" /> : null}
        </div>
      </nav>
    </div>
  );
}
