import { useEffect, useMemo, useRef, useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LeafletMap, MapMarker } from "@/components/maps/LeafletMap";

const INDIA_CENTER: [number, number] = [20.5937, 78.9629];

type Category = "Bike" | "Auto" | "Mini" | "Sedan" | "SUV";
const PRICING: Record<Category, { base: number; perKm: number }> = {
  Bike: { base: 20, perKm: 6 },
  Auto: { base: 25, perKm: 10 },
  Mini: { base: 40, perKm: 12 },
  Sedan: { base: 50, perKm: 15 },
  SUV: { base: 70, perKm: 18 },
};

function haversine(a: [number, number], b: [number, number]) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(s));
}

export default function Cabs() {
  const [pickup, setPickup] = useState<[number, number] | null>(null);
  const [drop, setDrop] = useState<[number, number] | null>(null);
  const [active, setActive] = useState<"pickup" | "drop">("pickup");
  const [category, setCategory] = useState<Category>("Auto");
  const [highDemand, setHighDemand] = useState(false);
  const [pickupText, setPickupText] = useState("");
  const [dropText, setDropText] = useState("");
  const [status, setStatus] = useState<"idle" | "searching" | "driver" | "ongoing">("idle");
  const [driverPos, setDriverPos] = useState<[number, number] | null>(null);
  const simRef = useRef<number | null>(null);

  const distanceKm = useMemo(() => (pickup && drop ? haversine(pickup, drop) : 0), [pickup, drop]);
  const etaMin = useMemo(() => (distanceKm ? Math.max(6, Math.round((distanceKm / 25) * 60)) : 0), [distanceKm]);
  const estimate = useMemo(() => {
    const { base, perKm } = PRICING[category];
    const surge = highDemand ? 1.5 : 1;
    const subtotal = base + perKm * distanceKm;
    const taxed = subtotal * 1.05; // GST 5%
    return Math.round(taxed * surge);
  }, [category, highDemand, distanceKm]);

  const markers: MapMarker[] = useMemo(() => {
    const list: MapMarker[] = [];
    if (pickup) list.push({ id: "pickup", position: pickup, title: `Pickup${pickupText ? ": " + pickupText : ""}` });
    if (drop) list.push({ id: "drop", position: drop, title: `Drop${dropText ? ": " + dropText : ""}` });
    if (driverPos) list.push({ id: "driver", position: driverPos, title: "Driver" });
    return list;
  }, [pickup, drop, pickupText, dropText, driverPos]);

  const path = pickup && drop ? [pickup, drop] : undefined;

  function onMapClick(lat: number, lng: number) {
    if (active === "pickup") setPickup([lat, lng]);
    else setDrop([lat, lng]);
  }

  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  function useLocation() {
    setLocError(null);
    if (!('geolocation' in navigator)) { setLocError('Geolocation is not supported on this device.'); return; }
    const isSecure = typeof window !== 'undefined' ? window.isSecureContext : true;
    if (!isSecure) { setLocError('Location requires HTTPS. Open the site over https://'); return; }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition((pos) => {
      const p: [number, number] = [pos.coords.latitude, pos.coords.longitude];
      setPickup(p);
      if (!pickupText) setPickupText('Current location');
      setActive('drop');
      setLocLoading(false);
    }, (err) => {
      if (err.code === err.PERMISSION_DENIED) setLocError('Permission denied. Enable location access in your browser settings.');
      else if (err.code === err.POSITION_UNAVAILABLE) setLocError('Location unavailable. Try again or check GPS.');
      else if (err.code === err.TIMEOUT) setLocError('Timed out while getting location. Try again.');
      else setLocError('Unable to get your location.');
      setLocLoading(false);
    }, { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 });
  }

  function requestRide() {
    if (!pickup || !drop) return;
    setStatus("searching");
    setTimeout(() => {
      setStatus("driver");
      setDriverPos(pickup);
      // Simulate movement
      const steps = 100;
      let i = 0;
      const start = pickup;
      const end = drop;
      simRef.current = window.setInterval(() => {
        i += 1;
        const t = Math.min(1, i / steps);
        const lat = start[0] + (end[0] - start[0]) * t;
        const lng = start[1] + (end[1] - start[1]) * t;
        setDriverPos([lat, lng]);
        if (t >= 1) {
          window.clearInterval(simRef.current!);
          setStatus("ongoing");
        }
      }, 300);
    }, 1200);
  }

  useEffect(() => () => { if (simRef.current) window.clearInterval(simRef.current); }, []);

  return (
    <SiteLayout>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Cab Booking</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div>
                <Label>Pickup</Label>
                <div className="flex gap-2">
                  <Input placeholder="Set on map or type" value={pickupText} onChange={(e)=>setPickupText(e.target.value)} />
                  <Button type="button" variant="outline" onClick={()=>{ setActive("pickup"); }}>Set on map</Button>
                  <Button type="button" variant="secondary" onClick={useLocation}>Use my location</Button>
                </div>
              </div>
              <div>
                <Label>Drop</Label>
                <div className="flex gap-2">
                  <Input placeholder="Set on map or type" value={dropText} onChange={(e)=>setDropText(e.target.value)} />
                  <Button type="button" variant="outline" onClick={()=>{ setActive("drop"); }}>Set on map</Button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {(Object.keys(PRICING) as Category[]).map((c) => (
                <Button key={c} variant={category === c ? "default" : "outline"} onClick={()=>setCategory(c)}>{c}</Button>
              ))}
              <Button variant={highDemand ? "destructive" : "outline"} onClick={()=>setHighDemand(v=>!v)}>{highDemand ? "High demand (ON)" : "High demand"}</Button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-md border p-3">
                <div className="text-muted-foreground">Distance</div>
                <div className="font-semibold">{distanceKm ? distanceKm.toFixed(2) : "-"} km</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-muted-foreground">ETA</div>
                <div className="font-semibold">{etaMin ? `${etaMin} min` : "-"}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-muted-foreground">Est. Fare</div>
                <div className="font-semibold">₹{estimate}</div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button size="lg" onClick={requestRide} disabled={!pickup || !drop || status === "searching"}>
                {status === "searching" ? "Searching..." : status === "driver" ? "Driver on the way" : "Request Ride"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div>
          <LeafletMap
            center={(pickup || drop || INDIA_CENTER) as [number, number]}
            markers={markers}
            onMapClick={onMapClick}
            path={path}
          />
        </div>
      </div>
    </SiteLayout>
  );
}
