export function cls(...xs) {
  return xs.filter(Boolean).join(" ");
}
export function toLocalInputValue(iso) {
  // ISO -> yyyy-MM-ddTHH:mm (local)
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth()+1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}
export function fromLocalInputValue(v) {
  // local -> ISO
  return new Date(v).toISOString();
}
