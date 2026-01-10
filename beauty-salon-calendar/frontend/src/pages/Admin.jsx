import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import Input from "../components/Input.jsx";
import Button from "../components/Button.jsx";
import Modal from "../components/Modal.jsx";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", role: "user" });
  const [pwdModal, setPwdModal] = useState({ open: false, id: null, password: "" });
  const [err, setErr] = useState("");

  async function load() {
    const { data } = await api.get("/admin/users");
    setUsers(data.users);
  }
  useEffect(()=>{ load(); }, []);

  async function create() {
    setErr("");
    try {
      await api.post("/admin/users", form);
      setOpen(false);
      setForm({ username: "", password: "", role: "user" });
      await load();
    } catch (e) {
      setErr(e?.response?.data?.error || "Błąd");
    }
  }

  async function changePwd() {
    try {
      await api.patch(`/admin/users/${pwdModal.id}/password`, { password: pwdModal.password });
      setPwdModal({ open: false, id: null, password: "" });
      alert("Hasło zmienione");
    } catch (e) {
      alert(e?.response?.data?.error || "Błąd");
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-extrabold">Administrator</div>
        <Button onClick={()=>setOpen(true)}>Dodaj konto</Button>
      </div>

      <div className="mt-4 bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
        <div className="grid grid-cols-3 text-xs text-slate-300 px-4 py-3 border-b border-white/10">
          <div>Login</div><div>Rola</div><div className="text-right">Akcje</div>
        </div>
        {users.map(u => (
          <div key={u.id} className="grid grid-cols-3 px-4 py-3 border-b border-white/5 text-sm items-center">
            <div className="font-semibold">{u.username}</div>
            <div className="text-slate-200">{u.role}</div>
            <div className="text-right">
              <Button variant="ghost" onClick={()=>setPwdModal({ open:true, id:u.id, password:"" })}>
                Zmień hasło
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} title="Nowe konto" onClose={()=>setOpen(false)}
        footer={<div className="flex gap-2"><Button variant="ghost" onClick={()=>setOpen(false)} className="flex-1">Anuluj</Button><Button onClick={create} className="flex-1">Utwórz</Button></div>}
      >
        <div className="space-y-3">
          <div>
            <div className="text-xs text-slate-300 mb-1">Login</div>
            <Input value={form.username} onChange={(e)=>setForm(f=>({ ...f, username: e.target.value }))} />
          </div>
          <div>
            <div className="text-xs text-slate-300 mb-1">Hasło</div>
            <Input type="password" value={form.password} onChange={(e)=>setForm(f=>({ ...f, password: e.target.value }))} />
          </div>
          <div>
            <div className="text-xs text-slate-300 mb-1">Rola</div>
            <select className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-2 text-sm"
              value={form.role} onChange={(e)=>setForm(f=>({ ...f, role: e.target.value }))}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </div>
          {err ? <div className="text-sm text-rose-300">{err}</div> : null}
        </div>
      </Modal>

      <Modal open={pwdModal.open} title="Zmień hasło" onClose={()=>setPwdModal({ open:false, id:null, password:"" })}
        footer={<div className="flex gap-2"><Button variant="ghost" onClick={()=>setPwdModal({ open:false, id:null, password:"" })} className="flex-1">Anuluj</Button><Button onClick={changePwd} className="flex-1">Zapisz</Button></div>}
      >
        <div>
          <div className="text-xs text-slate-300 mb-1">Nowe hasło</div>
          <Input type="password" value={pwdModal.password} onChange={(e)=>setPwdModal(m=>({ ...m, password: e.target.value }))} />
        </div>
      </Modal>
    </div>
  );
}
