import { useEffect, useMemo, useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { LeafletMap, MapMarker } from "@/components/maps/LeafletMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RestaurantCard, Restaurant, MenuItem } from "@/components/food/RestaurantCard";
import { loadJSON, saveJSON } from "@/lib/storage";

const CUISINES = ["North Indian", "South Indian", "Chinese", "Italian", "Street Food", "Desserts", "Bakery", "Biryani", "Punjabi", "Gujarati"];

const RESTAURANTS: Restaurant[] = [
  { id: "r1", name: "Spice Hub", city: "Delhi", cuisines: ["North Indian", "Chinese"], rating: 4.4, eta: 25, costForTwo: 500, veg: false, position: [28.61, 77.20], menu: [
    { id: "m1", name: "Paneer Butter Masala", price: 220, veg: true },
    { id: "m2", name: "Dal Makhani", price: 180, veg: true },
    { id: "m3", name: "Butter Chicken", price: 260 },
  ] },
  { id: "r2", name: "Curry Corner", city: "Delhi", cuisines: ["North Indian", "Biryani"], rating: 4.2, eta: 30, costForTwo: 450, position: [28.59, 77.22], menu: [
    { id: "m1", name: "Chicken Biryani", price: 240 },
    { id: "m2", name: "Veg Biryani", price: 200, veg: true },
    { id: "m3", name: "Raita", price: 60, veg: true },
  ] },
  { id: "r3", name: "Idli Dosa Express", city: "Bengaluru", cuisines: ["South Indian"], rating: 4.6, eta: 20, costForTwo: 300, veg: true, position: [12.9718, 77.593], menu: [
    { id: "m1", name: "Masala Dosa", price: 120, veg: true },
    { id: "m2", name: "Idli Vada", price: 100, veg: true },
    { id: "m3", name: "Filter Coffee", price: 70, veg: true },
  ] },
  { id: "r4", name: "Pizza Palace", city: "Mumbai", cuisines: ["Italian"], rating: 4.1, eta: 35, costForTwo: 700, position: [19.08, 72.88], menu: [
    { id: "m1", name: "Margherita", price: 299, veg: true },
    { id: "m2", name: "Veggie Delight", price: 349, veg: true },
    { id: "m3", name: "Pepperoni", price: 399 },
  ] },
];

const CART_KEY = "tour.food.cart";

type CartItem = { id: string; name: string; price: number; qty: number; restId: string; restName: string };

export default function Food(){
  const [q, setQ] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [sort, setSort] = useState("relevance");
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [focusRest, setFocusRest] = useState<Restaurant | null>(null);
  const [cart, setCart] = useState<CartItem[]>(() => loadJSON<CartItem[]>(CART_KEY, []));

  useEffect(() => { saveJSON(CART_KEY, cart); }, [cart]);

  function toggleCuisine(c: string){
    setCuisines((prev) => prev.includes(c) ? prev.filter(x=>x!==c) : [...prev, c]);
  }

  const filtered = useMemo(() => {
    let list = RESTAURANTS.filter(r =>
      (!vegOnly || r.veg) &&
      (!q || r.name.toLowerCase().includes(q.toLowerCase()) || r.cuisines.join(",").toLowerCase().includes(q.toLowerCase())) &&
      (cuisines.length === 0 || cuisines.some(c => r.cuisines.includes(c)))
    );
    switch (sort) {
      case "rating": list = [...list].sort((a,b)=>b.rating-a.rating); break;
      case "eta": list = [...list].sort((a,b)=>a.eta-b.eta); break;
      case "cost_low": list = [...list].sort((a,b)=>a.costForTwo-b.costForTwo); break;
      case "cost_high": list = [...list].sort((a,b)=>b.costForTwo-a.costForTwo); break;
    }
    return list;
  }, [vegOnly, q, cuisines, sort]);

  function addToCart(item: MenuItem, r: Restaurant){
    setCart(prev => {
      const idx = prev.findIndex(ci => ci.id === item.id && ci.restId === r.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
        return copy;
      }
      return [{ id: item.id, name: item.name, price: item.price, qty: 1, restId: r.id, restName: r.name }, ...prev];
    });
  }

  const markers: MapMarker[] = filtered.map(r => ({ id: r.id, position: r.position, title: `${r.name} • ${r.eta}m` }));
  const path = focusRest && userLoc ? [focusRest.position, userLoc] : undefined;

  function useMyLocation(){
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos)=>{
      setUserLoc([pos.coords.latitude, pos.coords.longitude]);
    });
  }

  const total = cart.reduce((s,c)=>s + c.price*c.qty, 0);

  return (
    <SiteLayout>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input placeholder="Search for restaurants or dishes" value={q} onChange={(e)=>setQ(e.target.value)} className="max-w-sm" />
            <div className="flex items-center gap-2">
              <Checkbox id="veg" checked={vegOnly} onCheckedChange={(v)=>setVegOnly(Boolean(v))} />
              <label htmlFor="veg" className="text-sm">Veg only</label>
            </div>
            <Select value={sort} onValueChange={(v)=>setSort(v)}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="rating">Top Rated</SelectItem>
                <SelectItem value="eta">Fast Delivery</SelectItem>
                <SelectItem value="cost_low">Cost: Low to High</SelectItem>
                <SelectItem value="cost_high">Cost: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            {CUISINES.map(c => (
              <button key={c} onClick={()=>toggleCuisine(c)} className={`text-xs px-3 py-1 rounded-full border ${cuisines.includes(c) ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                {c}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map(r => (
              <RestaurantCard key={r.id} r={r} onAdd={addToCart} onFocus={()=>setFocusRest(r)} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Delivery Map</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button variant="secondary" onClick={useMyLocation}>Use my location</Button>
                <Badge variant="outline">{userLoc ? "Location set" : "Click map to set"}</Badge>
              </div>
              <LeafletMap markers={markers} onMapClick={(lat,lng)=>setUserLoc([lat,lng])} path={path} center={(userLoc || filtered[0]?.position || [28.61,77.2]) as [number,number]} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Cart</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {cart.length === 0 && <p className="text-sm text-muted-foreground">Your cart is empty.</p>}
              {cart.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-sm border-b py-2">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-muted-foreground">{c.restName} • ₹{c.price} × {c.qty}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" onClick={()=>setCart(cs=>cs.map((x,j)=> j===i? {...x, qty: Math.max(1, x.qty-1)}:x))}>-</Button>
                    <Button size="icon" variant="outline" onClick={()=>setCart(cs=>cs.map((x,j)=> j===i? {...x, qty: x.qty+1}:x))}>+</Button>
                    <Button size="icon" variant="ghost" onClick={()=>setCart(cs=>cs.filter((_,j)=>j!==i))}>✕</Button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between font-semibold pt-2">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
              <Button disabled={cart.length===0} className="w-full">Place Order</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </SiteLayout>
  );
}
