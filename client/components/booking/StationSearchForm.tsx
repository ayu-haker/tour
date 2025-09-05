import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StationCombobox } from "./StationCombobox";
import type { Station } from "@/data/stations";

export function StationSearchForm({ title, onSubmit }: { title: string; onSubmit: (f: { from: Station; to: Station; date: string; className: string }) => void }) {
  const [from, setFrom] = React.useState<Station | null>(null);
  const [to, setTo] = React.useState<Station | null>(null);
  const [date, setDate] = React.useState<string>(new Date().toISOString().slice(0,10));
  const [cls, setCls] = React.useState<string>("sleeper");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!from || !to || !date) return;
    onSubmit({ from, to, date, className: cls });
  }

  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-3">
          <StationCombobox label="From" name="from" value={from} onChange={setFrom} placeholder="Type station code or name" />
          <StationCombobox label="To" name="to" value={to} onChange={setTo} placeholder="Type station code or name" />
          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <Label>Class</Label>
            <Select value={cls} onValueChange={setCls}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sleeper">Sleeper</SelectItem>
                <SelectItem value="3A">3A</SelectItem>
                <SelectItem value="2A">2A</SelectItem>
                <SelectItem value="1A">1A</SelectItem>
                <SelectItem value="chair">Chair Car</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end"><Button type="submit">Search</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}
