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

export default router;
