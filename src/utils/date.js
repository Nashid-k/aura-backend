function pad(value) {
  return String(value).padStart(2, '0');
}

export function toDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDateKey(value) {
  return new Date(`${value}T00:00:00`);
}

export function addDays(value, amount) {
  const date = value instanceof Date ? new Date(value) : fromDateKey(value);
  date.setDate(date.getDate() + amount);
  return date;
}

export function startOfWeek(value) {
  const date = value instanceof Date ? new Date(value) : fromDateKey(value);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}
