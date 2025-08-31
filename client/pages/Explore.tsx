import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { LeafletMap, MapMarker } from "@/components/maps/LeafletMap";
import { saveJSON, loadJSON } from "@/lib/storage";

type Destination = {
  id: string;
  name: string;
  country: string;
  region: "Europe" | "Asia" | "Americas" | "Africa" | "Oceania";
  budgetLevel: "$" | "$$" | "$$$";
  highlights: string[];
  entryFeeInr?: number;
  dayCostInr?: number;
};

const DATA: Destination[] = [
  { id: "paris", name: "Paris", country: "France", region: "Europe", budgetLevel: "$$$", highlights: ["Eiffel Tower", "Louvre", "Seine"] },
  { id: "bali", name: "Bali", country: "Indonesia", region: "Asia", budgetLevel: "$$", highlights: ["Beaches", "Rice terraces", "Temples"] },
  { id: "kyoto", name: "Kyoto", country: "Japan", region: "Asia", budgetLevel: "$$$", highlights: ["Shrines", "Tea houses", "Gardens"] },
  { id: "lisbon", name: "Lisbon", country: "Portugal", region: "Europe", budgetLevel: "$$", highlights: ["Trams", "Pastéis de nata", "Miradouros"] },
  { id: "cusco", name: "Cusco", country: "Peru", region: "Americas", budgetLevel: "$$", highlights: ["Machu Picchu", "Incan history", "Andes"] },
  { id: "cape-town", name: "Cape Town", country: "South Africa", region: "Africa", budgetLevel: "$$", highlights: ["Table Mountain", "Winelands", "Beaches"] },
  { id: "queenstown", name: "Queenstown", country: "New Zealand", region: "Oceania", budgetLevel: "$$$", highlights: ["Adventure", "Lakes", "Skiing"] },
];

const USER_PLACES_KEY = "tour.userPlaces";

const BUDGET_TO_COST_INR: Record<Destination["budgetLevel"], number> = { "$": 2000, "$$": 5000, "$$$": 10000 };

export default function Explore() {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<string>("");
  const [budget, setBudget] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [placeTitle, setPlaceTitle] = useState("");
  const [placeDesc, setPlaceDesc] = useState("");
  const [entryFee, setEntryFee] = useState<string>("");
  const [dayCost, setDayCost] = useState<string>("");
  const [tempPos, setTempPos] = useState<[number, number] | null>(null);
  const [userPlaces, setUserPlaces] = useState<MapMarker[]>(() => loadJSON<MapMarker[]>(USER_PLACES_KEY, []));

  const filtered = useMemo(() => {
    return DATA.filter((d) =>
      (!q || (d.name + d.country).toLowerCase().includes(q.toLowerCase())) &&
      (!region || d.region === region) &&
      (!budget || d.budgetLevel === budget)
    );
  }, [q, region, budget]);

  function savePlaces(list: MapMarker[]) {
    setUserPlaces(list);
    saveJSON(USER_PLACES_KEY, list);
  }

  function addPlace() {
    if (!tempPos || !placeTitle) return;
    const pricing = [entryFee ? `Entry ₹${Number(entryFee)}` : null, dayCost ? `Day ₹${Number(dayCost)}` : null]
      .filter(Boolean)
      .join(" • ");
    const desc = [placeDesc, pricing].filter(Boolean).join(" — ");
    const item: MapMarker = { id: crypto.randomUUID(), position: tempPos, title: placeTitle, description: desc };
    const list = [item, ...userPlaces];
    savePlaces(list);
    setOpen(false);
    setTempPos(null);
    setPlaceTitle("");
    setPlaceDesc("");
    setEntryFee("");
    setDayCost("");
  }

  return (
    <SiteLayout>
      <div className="flex items-end flex-wrap gap-3">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add Tourist Place</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Tourist Place</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="t">Title</Label>
                  <Input id="t" value={placeTitle} onChange={(e)=>setPlaceTitle(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="d">Description</Label>
                  <Input id="d" value={placeDesc} onChange={(e)=>setPlaceDesc(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="fee">Entry Fee (₹)</Label>
                  <Input id="fee" type="number" min={0} value={entryFee} onChange={(e)=>setEntryFee(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="dc">Estimated Day Cost (₹)</Label>
                  <Input id="dc" type="number" min={0} value={dayCost} onChange={(e)=>setDayCost(e.target.value)} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Click on the map to set the location.</p>
              <LeafletMap onMapClick={(lat,lng)=>setTempPos([lat,lng])} markers={tempPos ? [{ id:"temp", position: tempPos, title: placeTitle, description: [placeDesc, entryFee && `Entry ₹${entryFee}`, dayCost && `Day ₹${dayCost}`].filter(Boolean).join(" — ") }] : []} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
                <Button onClick={addPlace}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <div className="flex-1 min-w-60">
          <label className="block text-sm font-medium mb-1">Search</label>
          <Input placeholder="City or country" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="min-w-40">
          <label className="block text-sm font-medium mb-1">Region</label>
          <Select value={region} onValueChange={(v)=>setRegion(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Europe">Europe</SelectItem>
              <SelectItem value="Asia">Asia</SelectItem>
              <SelectItem value="Americas">Americas</SelectItem>
              <SelectItem value="Africa">Africa</SelectItem>
              <SelectItem value="Oceania">Oceania</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-40">
          <label className="block text-sm font-medium mb-1">Budget</label>
          <Select value={budget} onValueChange={(v)=>setBudget(v === "any" ? "" : v)}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="$">$ Budget</SelectItem>
              <SelectItem value="$$">$$ Mid</SelectItem>
              <SelectItem value="$$$">$$$ Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" onClick={() => { setQ(""); setRegion(""); setBudget(""); }}>Reset</Button>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((d) => (
          <Card key={d.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl">{d.name}, {d.country}</CardTitle>
              <CardDescription>{d.region} • {d.budgetLevel}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {d.highlights.map((h) => <li key={h}>{h}</li>)}
              </ul>
              <div className="mt-3 text-sm">
                <span className="font-medium">Est. day:</span> ₹{(d.dayCostInr ?? BUDGET_TO_COST_INR[d.budgetLevel]).toLocaleString("en-IN")} {d.entryFeeInr ? `• Entry ₹${d.entryFeeInr}` : ""}
              </div>
              <div className="mt-4">
                <Button variant="secondary">Add to Plan</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-bold mb-2">Your Saved Places</h2>
        <LeafletMap markers={userPlaces} />
      </div>
    </SiteLayout>
  );
}
