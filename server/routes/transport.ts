import { Router } from "express";
import { generateOptions, validateParams, type TransportOption } from "../../shared/transport";

const router = Router();

router.get("/flights/search", (req, res) => {
  try {
    const p = validateParams(new URLSearchParams(req.query as any));
    const options = generateOptions("flight", p);
    res.json(options);
  } catch (e: any) {
    res.status(400).json({ error: e?.message || "invalid" });
  }
});

router.get("/flights/recommend", async (req, res) => {
  try {
    const p = validateParams(new URLSearchParams(req.query as any));
    const key = process.env.AVIATIONSTACK_KEY || "";
    if (!key) return res.status(200).json({ data: [], note: "missing_key" });

    const params = new URLSearchParams();
    params.set("access_key", key);
    params.set("dep_iata", p.from.toUpperCase());
    params.set("arr_iata", p.to.toUpperCase());
    if (p.date) params.set("flight_date", p.date);
    params.set("limit", "10");
    params.set("flight_status", "scheduled");

    const url = `https://api.aviationstack.com/v1/flights?${params.toString()}`;

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) throw new Error(`upstream_${r.status}`);
    const json = await r.json();
    const list: TransportOption[] = (json.data || [])
      .map((it: any) => {
        const airline = it.airline?.name || it.airline?.iata || "Airline";
        const code = it.flight?.iata || it.flight?.icao || it.flight?.number || "";
        const dep = it.departure?.scheduled || it.departure?.estimated || it.departure?.actual;
        const arr = it.arrival?.scheduled || it.arrival?.estimated || it.arrival?.actual;
        if (!dep || !arr) return null;
        const d1 = new Date(dep).getTime();
        const d2 = new Date(arr).getTime();
        const duration = Number.isFinite(d1) && Number.isFinite(d2) ? Math.max(0, Math.round((d2 - d1) / 60000)) : 0;
        const id = `rec-${code}-${dep}`;
        const opt: TransportOption = {
          id,
          provider: airline,
          code: code || "",
          from: p.from,
          to: p.to,
          departTime: new Date(dep).toISOString(),
          arriveTime: new Date(arr).toISOString(),
          durationMinutes: duration,
          price: 0,
          currency: "INR",
          seatsAvailable: 0,
          updatedAt: new Date().toISOString(),
        };
        return opt;
      })
      .filter(Boolean);

    res.json(list);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "failed" });
  }
});

router.get("/trains/search", (req, res) => {
  try {
    const p = validateParams(new URLSearchParams(req.query as any));
    const options = generateOptions("train", p);
    res.json(options);
  } catch (e: any) {
    res.status(400).json({ error: e?.message || "invalid" });
  }
});

router.get("/trains/recommend", async (req, res) => {
  try {
    const p = validateParams(new URLSearchParams(req.query as any));
    const key = process.env.RAPIDAPI_KEY || "";
    if (!key) return res.status(200).json({ data: [], note: "missing_key" });
    // Try IRCTC trains between stations
    const fromCode = String((req.query as any).fromCode || "").toUpperCase() || String(p.from).split(" - ")[0].toUpperCase();
    const toCode = String((req.query as any).toCode || "").toUpperCase() || String(p.to).split(" - ")[0].toUpperCase();

    const url = new URL("https://irctc1.p.rapidapi.com/api/v1/trainsBetweenStations");
    url.searchParams.set("fromStationCode", fromCode);
    url.searchParams.set("toStationCode", toCode);

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const r = await fetch(url.toString(), {
      headers: {
        "X-RapidAPI-Key": key,
        "X-RapidAPI-Host": "irctc1.p.rapidapi.com",
      },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!r.ok) return res.status(200).json([]);
    const json = await r.json().catch(() => ({} as any));
    const list: TransportOption[] = (json.data || json.trains || [])
      .map((it: any) => {
        const code = it.train_number || it.trainNo || it.number || it.train?.number || "";
        const name = it.train_name || it.name || it.train?.name || "Train";
        const dep = it.from_std || it.src_departure_time || it.departure_time || it.from_time;
        const arr = it.to_std || it.dest_arrival_time || it.arrival_time || it.to_time;
        if (!dep || !arr) return null;
        // Build ISO from date + HH:MM
        const dateStr = p.date || new Date().toISOString().slice(0, 10);
        function toIso(d: string, hm: string) {
          const [hh, mm] = String(hm).split(":");
          const dt = new Date(`${d}T00:00:00Z`);
          dt.setUTCHours(Number(hh) || 0, Number(mm) || 0, 0, 0);
          return dt.toISOString();
        }
        const departTime = toIso(dateStr, dep);
        const arriveTime = toIso(dateStr, arr);
        const d1 = new Date(departTime).getTime();
        let d2 = new Date(arriveTime).getTime();
        if (d2 < d1) d2 += 24 * 60 * 60 * 1000; // handle next-day arrival
        const duration = Math.max(0, Math.round((d2 - d1) / 60000));
        const opt: TransportOption = {
          id: `rec-train-${code}-${departTime}`,
          provider: name,
          code: String(code),
          from: p.from,
          to: p.to,
          departTime,
          arriveTime,
          durationMinutes: duration,
          price: 0,
          currency: "INR",
          seatsAvailable: 0,
          updatedAt: new Date().toISOString(),
        };
        return opt;
      })
      .filter(Boolean);

    res.json(list);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "failed" });
  }
});

export default router;
