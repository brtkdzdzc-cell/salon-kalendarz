import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import Input from "../components/Input.jsx";
import Button from "../components/Button.jsx";
import Modal from "../components/Modal.jsx";

export default function Clients({ onRepeat }) {
  const [q, setQ] = useState("");
  const [clients, setClients] = useState([]);
  const [open, setOpen] = useState(false);
  const [clientModal, setClientModal] = useState({ open: false, client: null, history: [] });
  const [form, setForm] = useState({ full_name: "", phone: "", notes: "" });


  async function load() {
    const { data } = await api.get("/clients", { params: q ? { q } : {} });
    setClients(data.clients);
  }
  useEffect(()=>{ load(); }, [q]);

  async function create() {
    await api.post("/clients", form);
    setOpen(false);
    setForm({ full_name: "", phone: "", notes: "" });

    await load();
  }

  async function openClient(c) {
    const { data } = await api.get(`/clients/${c.id}/history`);
    setClientModal({ open:true, client:c, history:data.history });
  }

  async function importVcf(file) {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await api.post("/clients/import/vcf", fd, { headers: { "Content-Type": "multipart/form-data" }});
    alert(`Import zakończony. Dodano: ${data.created}, zaktualizowano: ${data.updated}`);
    await load();
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-lg font-extrabold">Klientki</div>
        <Button onClick={()=>setOpen(true)}>Dodaj</Button>
      </div>

      <div className="mt-3 flex gap-2">
        <Input placeholder="Szukaj (imię, tel, email)..." value={q} onChange={(e)=>setQ(e.target.value)} />
      </div>

      <div className="mt-4 space-y-2">
        {clients.map(c => (
          <button key={c.id} onClick={()=>openClient(c)}
            className="w-full text-left bg-white/5 border border-white/10 rounded-3xl p-4 active:scale-[0.998] transition"
          >
            <div className="font-semibold">{c.full_name}</div>
            <div className="text-xs text-slate-300 mt-1">{c.phone || "—"} • {c.email || "—"}</div>
          </button>
        ))}
      </div>

      <div className="mt-6 bg-white/5 border border-white/10 rounded-3xl p-4">
        <div className="font-semibold">Import kontaktów</div>
        <div className="text-xs text-slate-300 mt-1">
          Najprościej: eksportuj kontakty do pliku <b>.vcf</b> i wgraj tutaj.
        </div>
        <div className="mt-3">
          <input type="file" accept=".vcf,text/vcard" onChange={(e)=>{ if (e.target.files?.[0]) importVcf(e.target.files[0]); }} />
        </div>
      </div>

      <Modal open={open} title="Nowa klientka" onClose={()=>setOpen(false)}
        footer={<div className="flex gap-2"><Button variant="ghost" className="flex-1" onClick={()=>setOpen(false)}>Anuluj</Button><Button className="flex-1" onClick={create}>Zapisz</Button></div>}
      >
        <div className="space-y-3">
          <div><div className="text-xs text-slate-300 mb-1">Imię i nazwisko</div><Input value={form.full_name} onChange={(e)=>setForm(f=>({ ...f, full_name: e.target.value }))} /></div>
          <div><div className="text-xs text-slate-300 mb-1">Telefon</div><Input value={form.phone} onChange={(e)=>setForm(f=>({ ...f, phone: e.target.value }))} /></div>
          
          <div><div className="text-xs text-slate-300 mb-1">Uwagi (o klientce)</div><Input value={form.notes} onChange={(e)=>setForm(f=>({ ...f, notes: e.target.value }))} /></div>
        </div>
      </Modal>

      <Modal open={clientModal.open} title={clientModal.client ? clientModal.client.full_name : "Klientka"} onClose={()=>setClientModal({ open:false, client:null, history:[] })}>
        <div className="text-sm text-slate-200">
          <div className="text-xs text-slate-300">Historia zabiegów</div>
          <div className="mt-2 space-y-2">
            {clientModal.history.length === 0 ? <div className="text-slate-400 text-sm">Brak wizyt.</div> : null}
            {clientModal.history.map(h => (
              <div key={h.id} className="bg-white/5 border border-white/10 rounded-2xl p-3">
                <div className="font-semibold">{h.service_name}</div>
                <div className="text-xs text-slate-300 mt-1">
                  {new Date(h.start_at).toLocaleString("pl-PL")} • {h.employee_name}
                </div>
                {h.notes ? <div className="text-xs text-slate-200 mt-2 whitespace-pre-wrap">{h.notes}</div> : null}
                <div className="mt-2">
                  <Button variant="ghost" onClick={() => { onRepeat?.(h); setClientModal({ open:false, client:null, history:[] }); }}>
                    Ponów zabieg
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
