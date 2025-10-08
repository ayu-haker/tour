import { Router } from "express";

const router = Router();

function wikiSearchUrl(q: string) {
  const u = new URL("https://en.wikipedia.org/w/rest.php/v1/search/title");
  u.searchParams.set("q", q);
  u.searchParams.set("limit", "1");
  return u.toString();
}

export type WikiResult = {
  title: string;
  description?: string;
  url: string;
  thumbnail?: string;
} | null;

router.get("/wiki", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json({ result: null });
    const sr = await fetch(wikiSearchUrl(q));
    const sdata = await sr.json().catch(() => ({}) as any);
    const page = sdata?.pages?.[0];
    if (!page) return res.json({ result: null });
    const title = page.title as string;
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const r = await fetch(summaryUrl);
    const data = await r.json();
    const result: WikiResult = {
      title: data.title || title,
      description: data.extract || page.description || undefined,
      url:
        data.content_urls?.desktop?.page ||
        `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
      thumbnail: data.thumbnail?.source,
    };
    res.json({ result });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "failed" });
  }
});

router.post("/overpass", async (req, res) => {
  try {
    const query: string = String((req.body?.query ?? req.body?.q ?? "")).trim();
    if (!query) return res.status(400).json({ error: "missing_query" });

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
          return res.json(json);
        } catch (e) {
          lastErr = e;
          continue;
        }
      } catch (e) {
        lastErr = e;
        continue;
      }
    }

    return res.status(502).json({ error: lastErr?.message || "overpass_failed" });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "failed" });
  }
});

export default router;
