import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Destination = {
  id: string;
  name: string;
  country: string;
  region: "Europe" | "Asia" | "Americas" | "Africa" | "Oceania";
  budgetLevel: "$" | "$$" | "$$$";
  highlights: string[];
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

export default function Explore() {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<string>("");
  const [budget, setBudget] = useState<string>("");

  const filtered = useMemo(() => {
    return DATA.filter((d) =>
      (!q || (d.name + d.country).toLowerCase().includes(q.toLowerCase())) &&
      (!region || d.region === region) &&
      (!budget || d.budgetLevel === budget)
    );
  }, [q, region, budget]);

  return (
    <SiteLayout>
      <div className="flex items-end flex-wrap gap-3">
        <div className="flex-1 min-w-60">
          <label className="block text-sm font-medium mb-1">Search</label>
          <Input placeholder="City or country" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="min-w-40">
          <label className="block text-sm font-medium mb-1">Region</label>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
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
          <Select value={budget} onValueChange={setBudget}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any</SelectItem>
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
              <div className="mt-4">
                <Button variant="secondary">View Details</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </SiteLayout>
  );
}
