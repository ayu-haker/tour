export type SearchParams = { from: string; to: string; date: string; passengers?: number; class?: string };

export type TransportOption = {
  id: string;
  provider: string;
  code: string; // flight number or train number
  from: string;
  to: string;
  departTime: string; // ISO
  arriveTime: string; // ISO
  durationMinutes: number;
  price: number;
  currency: string;
  seatsAvailable: number;
  updatedAt: string; // ISO
};

function seededRandom(seed: number) {
  // xorshift32
  let x = seed | 0;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}

function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return h >>> 0;
}

function roundTo(n: number, step: number) {
  return Math.round(n / step) * step;
}

function pad(n: number, len = 2) {
  return n.toString().padStart(len, "0");
}

function addMinutes(iso: string, minutes: number) {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

export function generateOptions(kind: "flight" | "train", p: SearchParams, now = new Date()) {
  const { from, to, date } = p;
  const baseSeed = hashStr(`${kind}|${from}|${to}|${date}`);
  // Vary with current 30s window for "real-time" feel
  const timeSlice = Math.floor(now.getTime() / 30000);
  const rand = seededRandom(baseSeed ^ timeSlice);

  const providers =
    kind === "flight"
      ? ["IndiGo", "Air India", "Vistara", "SpiceJet", "Akasa Air"]
      : ["Rajdhani", "Shatabdi", "Duronto", "Garib Rath", "Tejas"];

  const count = 6 + Math.floor(rand() * 4); // 6-9 options
  const day = new Date(date);
  if (isNaN(day.getTime())) throw new Error("Invalid date");

  const options: TransportOption[] = [];
  for (let i = 0; i < count; i++) {
    const depHour = 5 + Math.floor(rand() * 18); // between 5:00 and 23:00
    const depMin = Math.floor(rand() * 60);
    const depart = new Date(day);
    depart.setHours(depHour, depMin, 0, 0);
    const duration = 45 + Math.floor(rand() * (kind === "flight" ? 300 : 1200));
    const arrive = new Date(depart);
    arrive.setMinutes(arrive.getMinutes() + duration);

    const basePrice = kind === "flight" ? 2000 + rand() * 12000 : 100 + rand() * 1500;
    const surge = 0.85 + rand() * 0.6; // 0.85x - 1.45x
    const price = roundTo(basePrice * surge, 10);

    const seats = 0 + Math.floor(rand() * 60);

    const provider = providers[Math.floor(rand() * providers.length)];
    const codePrefix = kind === "flight" ? provider.replace(/[^A-Z]/gi, "").slice(0, 2).toUpperCase() || "AI" : "TR";
    const code = `${codePrefix}${pad(100 + Math.floor(rand() * 900))}`;

    options.push({
      id: `${kind}-${code}-${depart.getTime()}`,
      provider,
      code,
      from,
      to,
      departTime: depart.toISOString(),
      arriveTime: arrive.toISOString(),
      durationMinutes: duration,
      price,
      currency: "INR",
      seatsAvailable: seats,
      updatedAt: new Date().toISOString(),
    });
  }

  // Sort by depart time
  options.sort((a, b) => a.departTime.localeCompare(b.departTime));
  return options;
}

export function validateParams(q: URLSearchParams) {
  const from = (q.get("from") || "").trim();
  const to = (q.get("to") || "").trim();
  const date = (q.get("date") || "").trim();
  if (!from || !to || !date) {
    throw new Error("from, to, date are required");
  }
  return { from, to, date } as SearchParams;
}
