import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type MenuItem = { id: string; name: string; price: number; veg?: boolean };
export type Restaurant = {
  id: string;
  name: string;
  city: string;
  cuisines: string[];
  rating: number; // 1-5
  eta: number; // minutes
  costForTwo: number; // INR
  veg?: boolean;
  position: [number, number];
  menu: MenuItem[];
};

export function RestaurantCard({ r, onAdd, onFocus }: { r: Restaurant; onAdd: (item: MenuItem, r: Restaurant) => void; onFocus?: () => void }){
  return (
    <Card className="hover:shadow-md transition-shadow" onMouseEnter={onFocus}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{r.name}</CardTitle>
          <Badge variant="secondary">{r.rating.toFixed(1)} ★</Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          {r.cuisines.join(", ")} • {r.eta}-{r.eta + 5} min • ₹{r.costForTwo} for two {r.veg ? "• Veg" : ""}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {r.menu.slice(0, 3).map((m) => (
            <Button key={m.id} size="sm" variant="outline" onClick={() => onAdd(m, r)}>
              + {m.name} • ₹{m.price}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
