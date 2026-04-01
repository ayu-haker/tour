export const config = { runtime: "edge" };

function wikiSearchUrl(q: string) {
  const u = new URL("https://en.wikipedia.org/w/rest.php/v1/search/title");
  u.searchParams.set("q", q);
  u.searchParams.set("limit", "1");
  return u.toString();
}

export default async function handler(req: Request) {
  try {
    if (req.method !== "GET")
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", Allow: "GET" },
      });
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    if (!q)
      return new Response(JSON.stringify({ result: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    const sr = await fetch(wikiSearchUrl(q));
    const sdata = await sr.json().catch(() => ({}) as any);
    const page = sdata?.pages?.[0];
    if (!page)
      return new Response(JSON.stringify({ result: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    const title = page.title as string;
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const r = await fetch(summaryUrl);
    const data = await r.json();
    const result = {
      title: data.title || title,
      description: data.extract || page.description || undefined,
      url:
        data.content_urls?.desktop?.page ||
        `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
      thumbnail: data.thumbnail?.source,
    };
    return new Response(JSON.stringify({ result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
