import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { LeafletMap, MapMarker } from "@/components/maps/LeafletMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { loadJSON } from "@/lib/storage";

const CITIES: Record<string, { name: string; center: [number, number] }[]> = {
  North: [
    { name: "Delhi", center: [28.6139, 77.209] },
    { name: "Jaipur", center: [26.9124, 75.7873] },
    { name: "Agra", center: [27.1767, 78.0081] },
  ],
  West: [
    { name: "Mumbai", center: [19.076, 72.8777] },
    { name: "Goa", center: [15.4909, 73.8278] },
    { name: "Ahmedabad", center: [23.0225, 72.5714] },
  ],
  South: [
    { name: "Bengaluru", center: [12.9716, 77.5946] },
    { name: "Chennai", center: [13.0827, 80.2707] },
    { name: "Kochi", center: [9.9312, 76.2673] },
  ],
  East: [
    { name: "Kolkata", center: [22.5726, 88.3639] },
    { name: "Darjeeling", center: [27.041, 88.2663] },
  ],
};

type Hotel = { id: string; name: string; city: string; stars: 3 | 4 | 5; price: number; position: [number, number] };

const BASE_HOTELS: Hotel[] = [
  { id: "dl1", name: "Delhi Grand", city: "Delhi", stars: 5, price: 8500, position: [28.6139, 77.213] },
  { id: "dl2", name: "Connaught Suites", city: "Delhi", stars: 4, price: 5200, position: [28.6289, 77.218] },
  { id: "mum1", name: "Marine View", city: "Mumbai", stars: 5, price: 12000, position: [18.9388, 72.8258] },
  { id: "mum2", name: "Bandra Residency", city: "Mumbai", stars: 4, price: 6500, position: [19.0607, 72.836] },
  { id: "blr1", name: "Cubbon Park Hotel", city: "Bengaluru", stars: 4, price: 4800, position: [12.976, 77.592] },
  { id: "blr2", name: "Indiranagar Inn", city: "Bengaluru", stars: 3, price: 3000, position: [12.971, 77.640] },
  { id: "chn1", name: "Marina Shore", city: "Chennai", stars: 5, price: 9000, position: [13.058, 80.283] },
  { id: "goa1", name: "Baga Beach Resort", city: "Goa", stars: 4, price: 7000, position: [15.555, 73.751] },
  { id: "jai1", name: "Pink City Palace", city: "Jaipur", stars: 5, price: 7800, position: [26.923, 75.826] },
  { id: "agr1", name: "Taj View", city: "Agra", stars: 5, price: 8200, position: [27.173, 78.041] },
  { id: "kol1", name: "Howrah Horizon", city: "Kolkata", stars: 4, price: 5600, position: [22.585, 88.346] },
  { id: "kochi1", name: "Fort Kochi Heritage", city: "Kochi", stars: 4, price: 5200, position: [9.964, 76.242] },
];

const USER_PLACES_KEY = "tour.userPlaces";

function hotelsFromPlaces(): Hotel[] {
  const places = loadJSON<any[]>(USER_PLACES_KEY, []);
  const list: Hotel[] = [];
  for (const p of places) {
    const [lat, lng] = p.position as [number, number];
    list.push({ id: `pl-${p.id}-1`, name: `${p.title || "Tourist Spot"} Residency`, city: p.title || "Tourist Spot", stars: 4, price: 4200, position: [lat + 0.01, lng + 0.01] as [number,number] });
    list.push({ id: `pl-${p.id}-2`, name: `${p.title || "Tourist Spot"} View`, city: p.title || "Tourist Spot", stars: 5, price: 7800, position: [lat - 0.008, lng - 0.008] as [number,number] });
  }
  return list;
}

export default function Hotels(){
  const { toast } = useToast();
  const [region, setRegion] = useState<string>("North");
  const [city, setCity] = useState<string>("all");
  const [stars, setStars] = useState<string>("any");
  const [minPrice, setMinPrice] = useState(2000);
  const [maxPrice, setMaxPrice] = useState(12000);

  const allHotels = useMemo(() => [...BASE_HOTELS, ...hotelsFromPlaces()], []);

  const cityCenter = useMemo(() => {
    if (city === "all") return [20.5937, 78.9629] as [number, number];
    const list = Object.values(CITIES).flat();
    return list.find(c => c.name === city)?.center || [20.5937, 78.9629];
  }, [city]);

  const results = useMemo(() => {
    return allHotels.filter(h =>
      (city === "all" || h.city === city) &&
      (stars === "any" || h.stars === Number(stars)) &&
      h.price >= minPrice && h.price <= maxPrice
    );
  }, [allHotels, city, stars, minPrice, maxPrice]);

  const markers: MapMarker[] = results.map(h => ({ id: h.id, position: h.position, title: `${h.name} • ₹${h.price.toLocaleString("en-IN")}` }));

  function book(h: Hotel){
    toast({ title: "Booking created", description: `${h.name} in ${h.city} • ₹${h.price.toLocaleString("en-IN")}` });
  }

  return (
    <SiteLayout>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Hotel Booking (India)</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2 grid grid-cols-2 gap-4">
              <div>
                <Label>Region</Label>
                <Select value={region} onValueChange={(v)=>{ setRegion(v); const first = CITIES[v][0]; setCity(first.name); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(CITIES).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>City</Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CITIES[region].map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Check-in</Label>
              <Input type="date" />
            </div>
            <div>
              <Label>Check-out</Label>
              <Input type="date" />
            </div>
            <div>
              <Label>Guests</Label>
              <Input type="number" min={1} defaultValue={2} />
            </div>
            <div>
              <Label>Stars</Label>
              <Select value={stars} onValueChange={setStars}>
                <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="5">5 Star</SelectItem>
                  <SelectItem value="4">4 Star</SelectItem>
                  <SelectItem value="3">3 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Min Price (₹)</Label>
              <Input type="number" min={0} value={minPrice} onChange={e=>setMinPrice(Number(e.target.value||0))} />
            </div>
            <div>
              <Label>Max Price (₹)</Label>
              <Input type="number" min={0} value={maxPrice} onChange={e=>setMaxPrice(Number(e.target.value||0))} />
            </div>
          </CardContent>
        </Card>

        <div>
          <LeafletMap center={cityCenter as [number,number]} markers={markers} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map(h => (
          <Card key={h.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{h.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">{h.city} • {"★".repeat(h.stars)}</div>
              <div className="mt-2 font-semibold">₹{h.price.toLocaleString("en-IN")}/night</div>
              <Button className="mt-3" onClick={()=>book(h)}>Book Now</Button>
            </CardContent>
          </Card>
        ))}
        {results.length === 0 && <p className="text-sm text-muted-foreground">No hotels match your filters.</p>}
      </div>
    </SiteLayout>
  );
}
