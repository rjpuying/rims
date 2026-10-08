const pesoWhole = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const pesoCents = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormat = new Intl.NumberFormat("en-PH");

export function formatPeso(
  value: number | null | undefined,
  options?: { decimals?: boolean },
): string {
  const amount = value ?? 0;
  return options?.decimals ? pesoCents.format(amount) : pesoWhole.format(amount);
}

export function formatNumber(value: number | null | undefined): string {
  return numberFormat.format(value ?? 0);
}

export function formatQty(value: number | null | undefined): string {
  return numberFormat.format(value ?? 0);
}

export function manilaDateISO(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
  }).format(date);
}

export function formatManilaDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatManilaTime(date: Date): string {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatManilaDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${formatManilaDate(d)} · ${formatManilaTime(d)}`;
}

const manilaShort = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatManilaShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return manilaShort.format(d);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
