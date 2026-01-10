import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import Input from "../components/Input.jsx";
import Button from "../components/Button.jsx";
import Modal from "../components/Modal.jsx";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", color: "#7c3aed" });

  async function load() {
    const { data } = await api.get("/employees/all");
    setEmployees(data.employees);
  }
  useEffect(()=>{ load(); }, []);

  async function create() {
    await api.post("/employees", form);
    setOpen(false);
    setForm({ name: "", color: "#7c3aed" });
    await load();
  }

  async function toggleActive(emp) {
    await api.patch(`/employees/${emp.id}`, { active: emp.active ? 0 : 1 });
    await load();
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-extrabold">Pracownicy</div>
        <Button onClick={()=>setOpen(true)}>Dodaj</Button>
      </div>

      <div className="mt-4 space-y-2">
        {employees.map(e => (
          <div key={e.id} className="bg-white/5 border border-white/10 rounded-3xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ background: e.color || "#94a3b8" }} />
              <div className="font-semibold">{e.name}</div>
              {!e.active ? <span className="text-xs text-slate-400">(nieaktywny)</span> : null}
            </div>
            <Button variant="ghost" onClick={()=>toggleActive(e)}>{e.active ? "Dezaktywuj" : "Aktywuj"}</Button>
          </div>
        ))}
      </div>

      <Modal open={open} title="Nowy pracownik" onClose={()=>setOpen(false)}
        footer={<div className="flex gap-2"><Button variant="ghost" className="flex-1" onClick={()=>setOpen(false)}>Anuluj</Button><Button className="flex-1" onClick={create}>Utwórz</Button></div>}
      >
        <div className="space-y-3">
          <div>
            <div className="text-xs text-slate-300 mb-1">Imię / nazwa</div>
            <Input value={form.name} onChange={(e)=>setForm(f=>({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <div className="text-xs text-slate-300 mb-1">Kolor (w kalendarzu)</div>
            <Input value={form.color} onChange={(e)=>setForm(f=>({ ...f, color: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
