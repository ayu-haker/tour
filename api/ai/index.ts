export const config = { runtime: "edge" };

function systemPrompt() {
  return `You are TOUR's in-app travel assistant. Answer concisely and help users with:
- Flights (live fares), Trains (IRCTC), Hotels, Cabs, Food, Tourist Spots/Explore, Transport, Hospitals, Budget, Emergency.
- Provide clear next steps and avoid long paragraphs. No markdown tables.`;
}

export default async function handler(req: Request) {
  try {
    if (req.method !== "POST")
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", Allow: "POST" },
      });

    const body = await req.json().catch(() => ({}));
    const messages = (body?.messages ?? []) as {
      role: string;
      content: string;
    }[];
    const key = process.env.OPENAI_API_KEY;

    if (key) {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "system", content: systemPrompt() }, ...messages],
          temperature: 0.4,
          max_tokens: 300,
        }),
      });
      const data = await r.json();
      const text =
        data?.choices?.[0]?.message?.content ||
        "Sorry, I couldn't generate a reply.";
      return new Response(JSON.stringify({ reply: text }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const last = messages[messages.length - 1]?.content || "";
    const reply = `I can help with flights, trains (IRCTC), hotels, cabs, food, tourist spots, explore, transport, hospitals, budget, and emergency. Tell me what you need: ${last.slice(0, 80)}`;
    return new Response(JSON.stringify({ reply }), {
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
