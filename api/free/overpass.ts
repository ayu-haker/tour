export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  try {
    if (req.method !== "POST")
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", Allow: "POST" },
      });

    let query = "";
    try {
      const body = await req.json();
      query = String(body?.query || body?.q || "").trim();
    } catch {}
    if (!query)
      return new Response(JSON.stringify({ error: "missing_query" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });

    const mirrors = [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
      "https://overpass.zbycz.uk/api/interpreter",
      "https://overpass.nchc.org.tw/api/interpreter",
    ];

    let lastErr: any = null;
    for (const url of mirrors) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 15000);
        const r = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            Accept: "application/json",
          },
          body: new URLSearchParams({ data: query }),
          signal: ctrl.signal,
        });
        clearTimeout(t);
        if (!r.ok) {
          lastErr = new Error(`status_${r.status}`);
          continue;
        }
        const text = await r.text();
        try {
          const json = JSON.parse(text);
          return new Response(JSON.stringify(json), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          lastErr = e;
          continue;
        }
      } catch (e) {
        lastErr = e;
        continue;
      }
    }

    return new Response(
      JSON.stringify({ error: lastErr?.message || "overpass_failed" }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
