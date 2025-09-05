import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Bot, MessageCircle } from "lucide-react";

type Msg = {
  role: "user" | "assistant";
  content: string;
  actions?: { label: string; to: string; external?: boolean }[];
};

function buildReply(input: string): Msg {
  const q = input.toLowerCase();
  const acts: { label: string; to: string; external?: boolean }[] = [];
  const chunks: string[] = [];

  if (q.includes("flight")) {
    chunks.push("I can help you find live flights and fares.");
    acts.push({ label: "Open Flights", to: "/flights" });
  }
  if (q.includes("train") || q.includes("irctc")) {
    chunks.push(
      "Search trains with station suggestions, or continue on IRCTC.",
    );
    acts.push({ label: "Open Trains", to: "/trains" });
    acts.push({
      label: "Open IRCTC",
      to: "https://www.irctc.co.in/nget/train-search",
      external: true,
    });
  }
  if (q.includes("hotel")) {
    chunks.push("Browse hotels by city, stars and price.");
    acts.push({ label: "Open Hotels", to: "/hotels" });
  }
  if (q.includes("cab")) {
    chunks.push("Book a cab with instant estimates.");
    acts.push({ label: "Open Cabs", to: "/cabs" });
  }
  if (q.includes("food")) {
    chunks.push("Explore local food and delivery.");
    acts.push({ label: "Open Food", to: "/food" });
  }
  if (
    q.includes("spot") ||
    q.includes("tourist") ||
    q.includes("places") ||
    q.includes("sightseeing")
  ) {
    chunks.push("Discover tourist spots and places to visit.");
    acts.push({ label: "Tourist Spots", to: "/spots" });
    acts.push({ label: "Explore Destinations", to: "/explore" });
  }
  if (q.includes("explore")) {
    chunks.push("Browse destinations, routes and ideas.");
    acts.push({ label: "Explore Destinations", to: "/explore" });
  }
  if (q.includes("hospital") || q.includes("medical")) {
    chunks.push("Find nearby hospitals and clinics.");
    acts.push({ label: "Hospitals", to: "/hospitals" });
  }
  if (q.includes("transport")) {
    chunks.push("Check transport options and info.");
    acts.push({ label: "Transport", to: "/transport" });
  }
  if (q.includes("profile") || q.includes("account")) {
    acts.push({ label: "Profile", to: "/profile" });
  }
  if (q.includes("upi") || q.includes("payment") || q.includes("pay")) {
    chunks.push("Generate a UPI link and QR to pay.");
    acts.push({ label: "UPI Payment", to: "/upi" });
  }
  if (q.includes("support") || q.includes("contact")) {
    acts.push({ label: "Support", to: "/support" });
  }
  if (q.includes("memories") || q.includes("photos")) {
    acts.push({ label: "Memories", to: "/memories" });
  }
  if (q.includes("partner")) {
    acts.push({ label: "Partner", to: "/partner" });
  }
  if (q.includes("budget")) {
    chunks.push("Plan your trip costs.");
    acts.push({ label: "Open Budget Planner", to: "/budget" });
  }
  if (q.includes("scanner") || q.includes("scan") || q.includes("qr")) {
    chunks.push("Open the QR scanner to scan tourist spot codes.");
    acts.push({ label: "Open Scanner", to: "/scanner" });
  }
  if (q.includes("emergency") || q.includes("help")) {
    chunks.push("Emergency contacts and resources are available.");
    acts.push({ label: "Open Emergency", to: "/emergency" });
  }
  if (acts.length === 0) {
    chunks.push("Here's what I can help with right now:");
    acts.push(
      { label: "Flights (live)", to: "/flights" },
      { label: "Trains (IRCTC)", to: "/trains" },
      { label: "Hotels", to: "/hotels" },
      { label: "Cabs", to: "/cabs" },
      { label: "Food", to: "/food" },
      { label: "Tourist Spots", to: "/spots" },
      { label: "Explore", to: "/explore" },
      { label: "Hospitals", to: "/hospitals" },
      { label: "Transport", to: "/transport" },
      { label: "Budget", to: "/budget" },
      { label: "Emergency", to: "/emergency" },
      { label: "Profile", to: "/profile" },
      { label: "Support", to: "/support" },
    );
  }

  return { role: "assistant", content: chunks.join(" "), actions: acts };
}

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi! I can guide you with flights, trains (IRCTC), hotels, cabs, food, tourist spots, explore and more. What do you need?",
      actions: [
        { label: "Flights (live)", to: "/flights" },
        { label: "Trains (IRCTC)", to: "/trains" },
        { label: "Tourist Spots", to: "/spots" },
        { label: "Explore", to: "/explore" },
        { label: "Hotels", to: "/hotels" },
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    try {
      let r = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: text }] }),
      });
      if (r.status === 404) {
        r = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: text }] }),
        });
      }
      const data = await r.json();
      const replyText = (data?.reply as string) || "";
      const actions = buildReply(text).actions;
      setMessages((m) => [
        ...m,
        { role: "assistant", content: replyText, actions },
      ]);

      if (/(spot|tourist|place|sightseeing|explore)/i.test(text)) {
        let rw = await fetch(`/api/free/wiki?q=${encodeURIComponent(text)}`);
        if (rw.status === 404)
          rw = await fetch(`/api/free/wiki?q=${encodeURIComponent(text)}`);
        const w = await rw.json().catch(() => ({}) as any);
        const res = w?.result as {
          title: string;
          description?: string;
          url: string;
        } | null;
        if (res) {
          setMessages((m) => [
            ...m,
            {
              role: "assistant",
              content: `${res.title}: ${res.description || ""}`.trim(),
              actions: [
                { label: "Open on Wikipedia", to: res.url, external: true },
              ],
            },
          ]);
        }
      }
    } catch {
      const fallback = buildReply(text);
      setMessages((m) => [...m, fallback]);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          aria-label="Assistant"
          className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg"
          size="icon"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(32rem,100vw)] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" /> Travel Assistant
          </SheetTitle>
        </SheetHeader>
        <div className="flex h-full flex-col">
          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === "assistant" ? "ml-0 mr-10" : "ml-10 mr-0"}
              >
                <div
                  className={
                    "rounded-lg border p-3 text-sm " +
                    (m.role === "assistant" ? "bg-card" : "bg-muted")
                  }
                >
                  {m.content}
                </div>
                {m.actions && m.actions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.actions.map((a, idx) =>
                      a.external ? (
                        <a
                          key={idx}
                          href={a.to}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded-md border px-2 py-1 text-xs hover:bg-accent"
                        >
                          {a.label}
                        </a>
                      ) : (
                        <Button key={idx} variant="secondary" size="sm" asChild>
                          <Link to={a.to} onClick={() => setOpen(false)}>
                            {a.label}
                          </Link>
                        </Button>
                      ),
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="border-t p-3 grid gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about flights, trains, hotels..."
              rows={3}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") send();
              }}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Press Ctrl/Cmd+Enter to send</span>
              <Button size="sm" onClick={send}>
                Send
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
