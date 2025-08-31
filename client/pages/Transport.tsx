import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { LeafletMap, MapMarker } from "@/components/maps/LeafletMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { STATE_CITIES } from "@/data/india";
import { Button } from "@/components/ui/button";

// Generate simple sample networks for any city center
function makeNetwork(center: [number, number]) {
  const [lat, lng] = center;
  const stations = [
    { name: "Central", pos: [lat, lng] as [number, number] },
    { name: "North", pos: [lat + 0.06, lng + 0.02] as [number, number] },
    { name: "East", pos: [lat + 0.02, lng + 0.08] as [number, number] },
    { name: "South", pos: [lat - 0.05, lng - 0.01] as [number, number] },
    { name: "West", pos: [lat - 0.01, lng - 0.07] as [number, number] },
  ];
  return stations;
}

export default function Transport(){
  const [stateName, setStateName] = useState<string>("Andhra Pradesh");
  const [city, setCity] = useState<string>(STATE_CITIES["Andhra Pradesh"][0].name);
  const [mode, setMode] = useState<"Metro" | "Bus" | "Train">("Metro");

  const center = useMemo(() => {
    const all = Object.values(STATE_CITIES).flat();
    return (all.find((c)=>c.name===city)?.center || [20.5937, 78.9629]) as [number, number];
  }, [city]);

  const stations = useMemo(() => makeNetwork(center), [center, mode]);
  const markers: MapMarker[] = stations.map((s, i) => ({ id: `${mode}-${i}`, position: s.pos, title: `${mode}: ${s.name}` }));
  const path = stations.map((s) => s.pos);

  return (
    <SiteLayout>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Public Transport (All States)</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label>State</Label>
              <Select value={stateName} onValueChange={(v)=>{ setStateName(v); setCity(STATE_CITIES[v][0].name); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(STATE_CITIES).map((s)=> (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>City</Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATE_CITIES[stateName].map((c)=> (
                    <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mode</Label>
              <Select value={mode} onValueChange={(v)=>setMode(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Metro">Metro</SelectItem>
                  <SelectItem value="Bus">Bus</SelectItem>
                  <SelectItem value="Train">Train</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 text-sm text-muted-foreground">Auto-generated station nodes and a route polyline for any selected state and city across India.</div>
          </CardContent>
        </Card>

        <LeafletMap center={center} markers={markers} path={path as [number,number][]} />
      </div>
    </SiteLayout>
  );
}
