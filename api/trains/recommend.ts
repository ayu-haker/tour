export const config = { runtime: "edge" };

function param(u: URL, k: string, v?: string) {
  if (v) u.searchParams.set(k, v);
}

export default async function handler(req: Request) {
  try {
    if (req.method !== "GET")
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", Allow: "GET" },
      });

    const { searchParams } = new URL(req.url);
    const from = (searchParams.get("from") || "").trim();
    const to = (searchParams.get("to") || "").trim();
    const date = (searchParams.get("date") || "").trim();
    const fromCode = (searchParams.get("fromCode") || from.split(" - ")[0] || "").toUpperCase();
    const toCode = (searchParams.get("toCode") || to.split(" - ")[0] || "").toUpperCase();

    const key = (process.env as any).RAPIDAPI_KEY || "";
    if (!key)
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    const url = new URL("https://irctc1.p.rapidapi.com/api/v1/trainsBetweenStations");
    param(url, "fromStationCode", fromCode);
    param(url, "toStationCode", toCode);

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
    if (!r.ok)
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    const json: any = await r.json().catch(() => ({} as any));
    const list = (json.data || json.trains || [])
      .map((it: any) => {
        const code = it.train_number || it.trainNo || it.number || it.train?.number || "";
        const name = it.train_name || it.name || it.train?.name || "Train";
        const dep = it.from_std || it.src_departure_time || it.departure_time || it.from_time;
        const arr = it.to_std || it.dest_arrival_time || it.arrival_time || it.to_time;
        if (!dep || !arr) return null;
        const dateStr = date || new Date().toISOString().slice(0, 10);
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
        if (d2 < d1) d2 += 24 * 60 * 60 * 1000;
        const duration = Math.max(0, Math.round((d2 - d1) / 60000));
        return {
          id: `rec-train-${code}-${departTime}`,
          provider: name,
          code: String(code),
          from,
          to,
          departTime,
          arriveTime,
          durationMinutes: duration,
          price: 0,
          currency: "INR",
          seatsAvailable: 0,
          updatedAt: new Date().toISOString(),
        };
      })
      .filter(Boolean);

    return new Response(JSON.stringify(list), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
