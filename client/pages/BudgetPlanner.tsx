import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const COLORS = ["#4f46e5", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444"];

export default function BudgetPlanner() {
  const [days, setDays] = useState(5);
  const [people, setPeople] = useState(2);
  const [stay, setStay] = useState(120); // per night per room
  const [transport, setTransport] = useState(200); // total
  const [food, setFood] = useState(25); // per person per day
  const [misc, setMisc] = useState(100); // total

  const breakdown = useMemo(() => {
    const accommodation = stay * days;
    const meals = food * people * days;
    const t = transport;
    const m = misc;
    const total = accommodation + meals + t + m;
    return { accommodation, meals, transport: t, misc: m, total };
  }, [days, people, stay, transport, food, misc]);

  const data = [
    { name: "Stay", value: breakdown.accommodation },
    { name: "Food", value: breakdown.meals },
    { name: "Transport", value: breakdown.transport },
    { name: "Misc", value: breakdown.misc },
  ];

  return (
    <SiteLayout>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Plan Your Budget</CardTitle>
            <CardDescription>Adjust inputs to estimate your trip cost.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="days">Days</Label>
              <Input id="days" type="number" min={1} value={days} onChange={(e) => setDays(Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="people">People</Label>
              <Input id="people" type="number" min={1} value={people} onChange={(e) => setPeople(Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="stay">Accommodation per night ($)</Label>
              <Input id="stay" type="number" min={0} value={stay} onChange={(e) => setStay(Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="transport">Transport total ($)</Label>
              <Input id="transport" type="number" min={0} value={transport} onChange={(e) => setTransport(Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="food">Food per person per day ($)</Label>
              <Input id="food" type="number" min={0} value={food} onChange={(e) => setFood(Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="misc">Miscellaneous total ($)</Label>
              <Input id="misc" type="number" min={0} value={misc} onChange={(e) => setMisc(Number(e.target.value))} />
            </div>
            <div className="col-span-2 rounded-md bg-muted p-4 text-sm">
              Estimated Total: <span className="font-bold">${breakdown.total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Breakdown</CardTitle>
            <CardDescription>Visual overview of your spending plan.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" outerRadius={110} innerRadius={60} paddingAngle={4}>
                  {data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </SiteLayout>
  );
}
