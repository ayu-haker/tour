import { useEffect, useMemo, useRef, useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function extractQuery(raw: string) {
  try {
    const u = new URL(raw);
    const last = decodeURIComponent(u.pathname.split("/").filter(Boolean).pop() || "");
    const q = u.searchParams.get("q") || u.searchParams.get("query") || "";
    const titleLike = last.replace(/[-_]+/g, " ").trim();
    return (q || titleLike || raw).trim();
  } catch {
    return raw.trim();
  }
}

type WikiResult = { title: string; description?: string; url: string; thumbnail?: string } | null;

export default function Scanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [raw, setRaw] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [info, setInfo] = useState<WikiResult>(null);

  const supported = useMemo(() => typeof window !== "undefined" && "BarcodeDetector" in window, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  async function start() {
    setError(null);
    setInfo(null);
    setRaw("");
    setQuery("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
      setScanning(true);
      tick();
    } catch (e: any) {
      setError("Could not access camera. Allow permissions and retry.");
    }
  }

  function stop() {
    setScanning(false);
    setStream((s) => {
      s?.getTracks().forEach((t) => t.stop());
      return null;
    });
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  async function tick() {
    if (!scanning) return;
    try {
      // @ts-expect-error BarcodeDetector may not exist in TS lib
      const det = new window.BarcodeDetector({ formats: ["qr_code", "ean_13", "code_128", "upc_a", "upc_e"] });
      const video = videoRef.current!;
      const codes = await det.detect(video);
      if (codes && codes[0]) {
        const val = String(codes[0].rawValue || "");
        setRaw(val);
        const q = extractQuery(val);
        setQuery(q);
        stop();
        fetchInfo(q);
        return;
      }
    } catch (e: any) {
      // ignore frame errors
    }
    requestAnimationFrame(tick);
  }

  async function fetchInfo(q: string) {
    if (!q) return setInfo(null);
    try {
      let r = await fetch(`/api/free/wiki?q=${encodeURIComponent(q)}`);
      if (r.status === 404) r = await fetch(`/api/free/wiki?q=${encodeURIComponent(q)}`);
      const data = await r.json();
      setInfo((data?.result as WikiResult) || null);
    } catch {
      setInfo(null);
    }
  }

  function handleManualLookup() {
    const q = extractQuery(query || raw);
    setQuery(q);
    fetchInfo(q);
  }

  return (
    <SiteLayout>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>QR Scanner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!supported && (
              <p className="text-sm text-amber-600">This browser does not support built-in QR scanning. Type or paste text below and use Lookup.</p>
            )}
            <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-[60vh] object-contain rounded-md border" />
            <div className="flex flex-wrap gap-2">
              <Button onClick={start} disabled={!supported}>{scanning ? "Scanning…" : "Start Scan"}</Button>
              <Button variant="outline" onClick={stop}>Stop</Button>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="grid gap-2">
              <Label htmlFor="raw">Detected/Entered Text or URL</Label>
              <Input id="raw" value={query || raw} onChange={(e) => setQuery(e.target.value)} placeholder="Place name or URL" />
              <div className="flex gap-2">
                <Button onClick={handleManualLookup}>Lookup</Button>
                {(raw || query).startsWith("http") && (
                  <Button variant="secondary" asChild>
                    <a href={(query || raw)} target="_blank" rel="noopener noreferrer">Open Link</a>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Knowledge</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!info && <div className="text-muted-foreground text-sm">Scan a QR or enter a place name to see details.</div>}
            {info && (
              <div className="space-y-2">
                <div className="text-lg font-semibold">{info.title}</div>
                {info.thumbnail && (
                  <img src={info.thumbnail} alt="thumbnail" className="w-full max-h-64 object-cover rounded" />
                )}
                {info.description && <p className="text-sm leading-relaxed">{info.description}</p>}
                <div className="flex gap-2">
                  <Button variant="secondary" asChild>
                    <a href={info.url} target="_blank" rel="noopener noreferrer">Open Wikipedia</a>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SiteLayout>
  );
}
