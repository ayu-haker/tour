export const config = { runtime: "edge" };

function pick<T>(v: T | undefined, alt?: T): T | undefined {
  return v !== undefined ? v : alt;
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
    if (!from || !to)
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    const key = (process.env as any).AVIATIONSTACK_KEY || "";
    if (!key)
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    const params = new URLSearchParams();
    params.set("access_key", key);
    params.set("dep_iata", from.toUpperCase());
    params.set("arr_iata", to.toUpperCase());
    if (date) params.set("flight_date", date);
    params.set("limit", "10");
    params.set("flight_status", "scheduled");

    const url = `https://api.aviationstack.com/v1/flights?${params.toString()}`;

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok)
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    const json: any = await r.json();
    const list = (json.data || [])
      .map((it: any) => {
        const airline = pick(it.airline?.name, it.airline?.iata) || "Airline";
        const code =
          pick(it.flight?.iata, it.flight?.icao) || it.flight?.number || "";
        const dep = pick(
          it.departure?.scheduled,
          pick(it.departure?.estimated, it.departure?.actual),
        );
        const arr = pick(
          it.arrival?.scheduled,
          pick(it.arrival?.estimated, it.arrival?.actual),
        );
        if (!dep || !arr) return null;
        const d1 = new Date(dep).getTime();
        const d2 = new Date(arr).getTime();
        const duration =
          Number.isFinite(d1) && Number.isFinite(d2)
            ? Math.max(0, Math.round((d2 - d1) / 60000))
            : 0;
        return {
          id: `rec-${code}-${dep}`,
          provider: airline,
          code: code || "",
          from,
          to,
          departTime: new Date(dep).toISOString(),
          arriveTime: new Date(arr).toISOString(),
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
