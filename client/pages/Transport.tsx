import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { LeafletMap, MapMarker } from "@/components/maps/LeafletMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Minimal sample networks for key cities (coords approximated)
const NETWORKS = {
  Delhi: {
    Metro: {
      stations: [
        { name: "Kashmere Gate", pos: [28.6679, 77.2274] as [number, number] },
        { name: "Rajiv Chowk", pos: [28.6328, 77.2197] as [number, number] },
        { name: "Hauz Khas", pos: [28.545, 77.2049] as [number, number] },
      ],
    },
    Bus: {
      stations: [
        { name: "ISBT Kashmere Gate", pos: [28.667, 77.227] as [number, number] },
        { name: "AIIMS Ring Rd", pos: [28.5672, 77.210] as [number, number] },
        { name: "Saket", pos: [28.5245, 77.206] as [number, number] },
      ],
    },
    Train: {
      stations: [
        { name: "New Delhi Jn", pos: [28.642, 77.219] as [number, number] },
        { name: "Hazrat Nizamuddin", pos: [28.588, 77.250] as [number, number] },
      ],
    },
  },
  Mumbai: {
    Metro: {
      stations: [
        { name: "Ghatkopar", pos: [19.085, 72.908] as [number, number] },
        { name: "Andheri", pos: [19.1197, 72.8468] as [number, number] },
        { name: "DN Nagar", pos: [19.126, 72.841] as [number, number] },
      ],
    },
    Bus: {
      stations: [
        { name: "Kurla", pos: [19.072, 72.879] as [number, number] },
        { name: "BKC", pos: [19.067, 72.842] as [number, number] },
        { name: "Bandra", pos: [19.0607, 72.836] as [number, number] },
      ],
    },
    Train: {
      stations: [
        { name: "Churchgate", pos: [18.9353, 72.8277] as [number, number] },
        { name: "Dadar", pos: [19.0183, 72.8424] as [number, number] },
        { name: "Borivali", pos: [19.228, 72.8594] as [number, number] },
      ],
    },
  },
  Bengaluru: {
    Metro: {
      stations: [
        { name: "Majestic", pos: [12.9778, 77.5727] as [number, number] },
        { name: "MG Road", pos: [12.9735, 77.611] as [number, number] },
        { name: "Indiranagar", pos: [12.9784, 77.6408] as [number, number] },
      ],
    },
    Bus: {
      stations: [
        { name: "Kempegowda Bus Stn", pos: [12.9772, 77.572] as [number, number] },
        { name: "Domlur", pos: [12.961, 77.638] as [number, number] },
        { name: "Marathahalli", pos: [12.9567, 77.701] as [number, number] },
      ],
    },
    Train: {
      stations: [
        { name: "KSR Bengaluru", pos: [12.978, 77.568] as [number, number] },
        { name: "Yeshwanthpur", pos: [13.028, 77.540] as [number, number] },
      ],
    },
  },
};

type City = keyof typeof NETWORKS;
type Mode = keyof (typeof NETWORKS)[City];

export default function Transport(){
  const [city, setCity] = useState<City>("Delhi");
  const [mode, setMode] = useState<Mode>("Metro");

  const stations = NETWORKS[city][mode].stations;
  const markers: MapMarker[] = stations.map((s, i) => ({ id: `${i}`, position: s.pos, title: s.name }));
  const path = stations.map((s) => s.pos);
  const center = stations[Math.floor(stations.length / 2)].pos;

  return (
    <SiteLayout>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Public Transport</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label>City</Label>
              <Select value={city} onValueChange={(v)=>setCity(v as City)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Delhi">Delhi</SelectItem>
                  <SelectItem value="Mumbai">Mumbai</SelectItem>
                  <SelectItem value="Bengaluru">Bengaluru</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mode</Label>
              <Select value={mode} onValueChange={(v)=>setMode(v as Mode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Metro">Metro</SelectItem>
                  <SelectItem value="Bus">Bus</SelectItem>
                  <SelectItem value="Train">Train</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 text-sm text-muted-foreground">Shows sample station nodes and the route polyline like city apps. Replace dataset with live feeds later.</div>
          </CardContent>
        </Card>

        <LeafletMap center={center as [number,number]} markers={markers} path={path as [number,number][]} />
      </div>
    </SiteLayout>
  );
}
