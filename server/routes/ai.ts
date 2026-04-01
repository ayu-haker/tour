import { Router } from "express";

const router = Router();

function systemPrompt() {
  return `You are TOUR's in-app travel assistant. Answer concisely and help users with:
- Flights (live fares), Trains (IRCTC), Hotels, Cabs, Food, Tourist Spots/Explore, Transport, Hospitals, Budget, Emergency.
- Provide clear next steps and avoid long paragraphs. No markdown tables.
`;
}

router.post("/", async (req, res) => {
  try {
    const messages = (req.body?.messages ?? []) as {
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
      return res.json({ reply: text });
    }
    const last = messages[messages.length - 1]?.content || "";
    const reply = `I can help with flights, trains (IRCTC), hotels, cabs, food, tourist spots, explore, transport, hospitals, budget, and emergency. Tell me what you need: ${last.slice(0, 80)}`;
    return res.json({ reply });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "failed" });
  }
});

export default router;
