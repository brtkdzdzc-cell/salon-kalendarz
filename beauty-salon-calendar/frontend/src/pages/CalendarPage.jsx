import React, { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";

import { api } from "../lib/api";
import { makeSocket } from "../lib/socket";
import Modal from "../components/Modal.jsx";
import Input from "../components/Input.jsx";
import Button from "../components/Button.jsx";
import { fromLocalInputValue, toLocalInputValue } from "../lib/utils";

export default function CalendarPage({ repeatDraft, onConsumedRepeat }) {
  const calRef = useRef(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState("");
  const [events, setEvents] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    employee_id: null,
    client_id: null,
    start_at: "",
    end_at: "",
    service_name: "",
    notes: "",
  });
  const [err, setErr] = useState("");

  async function loadEmployees() {
    const { data } = await api.get("/employees");
    setEmployees(data.employees);
    if (!form.employee_id && data.employees[0]) setForm(f=>({ ...f, employee_id: data.employees[0].id }));
  }

  async function loadClients(q="") {
    const { data } = await api.get("/clients", { params: q ? { q } : {} });
    setClients(data.clients);
  }

  async function loadAppointments(rangeStart, rangeEnd) {
    const params = { start: rangeStart, end: rangeEnd };
    if (selectedEmployee !== "all") params.employeeId = selectedEmployee;
    const { data } = await api.get("/appointments", { params });
    setEvents(data.appointments.map(a => ({
      id: String(a.id),
      title: `${a.client_name} • ${a.service_name}`,
      start: a.start_at,
      end: a.end_at,
      backgroundColor: a.employee_color || undefined,
      borderColor: "transparent",
      extendedProps: a,
    })));
  }

  useEffect(() => {
    loadEmployees();
    loadClients();
    const socket = makeSocket();
    socket.on("appointmentsUpdated", () => {
      const apiCal = calRef.current?.getApi();
      if (apiCal) {
        const v = apiCal.view;
        loadAppointments(v.activeStart.toISOString(), v.activeEnd.toISOString());
      }
    });
    return () => socket.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { loadClients(clientSearch); }, [clientSearch]);

  // Repeat from history
  useEffect(() => {
    if (!repeatDraft) return;
    setOpen(true);
    setEditId(null);
    setForm(f => ({
      ...f,
      client_id: repeatDraft.client_id,
      employee_id: repeatDraft.employee_id,
      service_name: repeatDraft.service_name,
      notes: repeatDraft.notes || "",
    }));
    onConsumedRepeat?.();
  }, [repeatDraft, onConsumedRepeat]);

  function onSelect(info) {
    setErr("");
    setEditId(null);
    setOpen(true);
    
    const start = info.start;
    const end = info.end || new Date(info.start.getTime() + 60*60*1000);

    setForm(f => ({
      employee_id: f.employee_id || employees[0]?.id || null,
      client_id: f.client_id || null,
      start_at: toLocalInputValue(start.toISOString()),
      end_at: toLocalInputValue(end.toISOString()),
      service_name: f.service_name || "",
      notes: f.notes || "",
    }));
  }

  function onEventClick(click) {
    const a = click.event.extendedProps;
    setErr("");
    setEditId(Number(a.id));
    setOpen(true);
    setForm({
      employee_id: a.employee_id,
      client_id: a.client_id,
      start_at: toLocalInputValue(a.start_at),
      end_at: toLocalInputValue(a.end_at),
      service_name: a.service_name,
      notes: a.notes || "",
    });
  }

  async function save() {
    setErr("");
    try {
      const payload = {
        employee_id: Number(form.employee_id),
        client_id: Number(form.client_id),
        start_at: fromLocalInputValue(form.start_at),
        end_at: fromLocalInputValue(form.end_at),
        service_name: form.service_name,
        notes: form.notes,
      };
      if (!payload.employee_id || !payload.client_id) {
        setErr("Wybierz pracownika i klientkę.");
        return;
      }
      if (editId) {
        await api.patch(`/appointments/${editId}`, payload);
      } else {
        await api.post("/appointments", payload);
      }
      setOpen(false);
    } catch (e) {
      setErr(e?.response?.data?.error || "Błąd zapisu");
    }
  }

  async function remove() {
    if (!editId) return;
    if (!confirm("Usunąć wizytę?")) return;
    await api.delete(`/appointments/${editId}`);
    setOpen(false);
  }

  return (
    <div className="p-3 sm:p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-lg font-extrabold">Kalendarz</div>

        <div className="flex gap-2 items-center">
          <select
            className="rounded-2xl bg-white/5 border border-white/10 px-3 py-2 text-sm"
            value={selectedEmployee}
            onChange={(e)=>setSelectedEmployee(e.target.value)}
            title="Filtr pracownika"
          >
            <option value="all">Wszyscy</option>
            {employees.map(e => <option key={e.id} value={String(e.id)}>{e.name}</option>)}
          </select>
          <Button variant="ghost" onClick={()=>loadClients("")}>Odśwież</Button>
        </div>
      </div>

      <div className="mt-3 bg-white/5 border border-white/10 rounded-3xl p-2">
        <FullCalendar
  ref={calRef}
  plugins={[timeGridPlugin, dayGridPlugin, listPlugin, interactionPlugin]}
  initialView="timeGridWeek"
  height="auto"
  selectable={true}
  selectMirror={true}
  nowIndicator={true}
  firstDay={1}
  locale="pl"
  headerToolbar={{
    left: "prev,next today",
    center: "title",
    right: "timeGridDay,timeGridWeek,dayGridMonth,listWeek",
  }}
  slotMinTime="07:00:00"
  slotMaxTime="21:00:00"

  /* ✅ WIELE OSÓB W TEJ SAMEJ GODZINIE (widoczne osobno) */
  eventOverlap={true}
  slotEventOverlap={true}
  eventMaxStack={50}
  expandRows={true}

  /* ✅ Tapnięcie w kratkę godziny zawsze dodaje wizytę (mega ważne na telefonie) */
  dateClick={(info) => onSelect({ start: info.date, end: new Date(info.date.getTime() + 60 * 60 * 1000) })}

  select={onSelect}

  /* ✅ Klik w istniejącą wizytę: oprócz edycji zapamiętaj godzinę, żeby dodać kolejną */
  eventClick={(info) => {
    onEventClick(info);
    window.__lastSlotStart = info.event.start;
  }}

  events={events}
  datesSet={(arg) => loadAppointments(arg.start.toISOString(), arg.end.toISOString())}

  /* ✅ Czytelny kafelek = "wizualnie widać każdą osobę" */
  eventContent={(arg) => (
    <div style={{ padding: "4px 6px", lineHeight: 1.15 }}>
      <div style={{ fontWeight: 800, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {arg.event.title}
      </div>
      {arg.event.extendedProps?.service_name ? (
        <div style={{ fontSize: 11, opacity: 0.9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {arg.event.extendedProps.service_name}
        </div>
      ) : null}
    </div>
  )}
/>


      </div>

      <Modal
        open={open}
        title={editId ? "Edytuj wizytę" : "Nowa wizyta"}
        onClose={()=>setOpen(false)}
        footer={
          <div className="flex gap-2">
            {editId ? <Button variant="danger" className="flex-1" onClick={remove}>Usuń</Button> : null}
            <Button variant="ghost" className="flex-1" onClick={()=>setOpen(false)}>Anuluj</Button>
            <Button className="flex-1" onClick={save}>Zapisz</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <div className="text-xs text-slate-300 mb-1">Pracownik</div>
            <select className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-2 text-sm"
              value={form.employee_id ?? ""} onChange={(e)=>setForm(f=>({ ...f, employee_id: e.target.value }))}>
              <option value="" disabled>Wybierz...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>

          <div>
            <div className="text-xs text-slate-300 mb-1">Klientka</div>
            <Input placeholder="Szukaj klientki..." value={clientSearch} onChange={(e)=>setClientSearch(e.target.value)} />
            <select className="w-full mt-2 rounded-2xl bg-white/5 border border-white/10 px-4 py-2 text-sm"
              value={form.client_id ?? ""} onChange={(e)=>setForm(f=>({ ...f, client_id: e.target.value }))}>
              <option value="" disabled>Wybierz...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}{c.phone ? ` (${c.phone})` : ""}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-slate-300 mb-1">Start</div>
              <Input type="datetime-local" value={form.start_at} onChange={(e)=>setForm(f=>({ ...f, start_at: e.target.value }))} />
            </div>
            <div>
              <div className="text-xs text-slate-300 mb-1">Koniec</div>
              <Input type="datetime-local" value={form.end_at} onChange={(e)=>setForm(f=>({ ...f, end_at: e.target.value }))} />
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-300 mb-1">Rodzaj zabiegu</div>
            <Input value={form.service_name} onChange={(e)=>setForm(f=>({ ...f, service_name: e.target.value }))} placeholder="np. manicure hybrydowy" />
          </div>

          <div>
            <div className="text-xs text-slate-300 mb-1">Uwagi</div>
            <textarea
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/60"
              rows={4}
              value={form.notes}
              onChange={(e)=>setForm(f=>({ ...f, notes: e.target.value }))}
              placeholder="np. kolor, alergie, preferencje..."
            />
          </div>

          {err ? <div className="text-sm text-rose-300">{err}</div> : null}
        </div>
      </Modal>
    </div>
  );
}
