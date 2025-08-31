import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Transport(){
  return (
    <SiteLayout>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {["Metro", "Bus", "Train", "Bike Rentals", "Car Share", "Flights"].map((t)=> (
          <Card key={t} className="hover:shadow-md transition-shadow">
            <CardHeader><CardTitle>{t}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Browse schedules, pricing and options.</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </SiteLayout>
  );
}
