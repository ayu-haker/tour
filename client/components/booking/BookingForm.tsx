import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BookingForm({ title, onSubmit, children }: { title: string; onSubmit: (form: Record<string, string>) => void; children?: React.ReactNode }){
  function handle(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const obj = Object.fromEntries(fd.entries()) as Record<string, string>;
    onSubmit(obj);
  }
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={handle}>
          <div>
            <Label htmlFor="from">From</Label>
            <Input id="from" name="from" placeholder="City / Address" required />
          </div>
          <div>
            <Label htmlFor="to">To</Label>
            <Input id="to" name="to" placeholder="City / Address" required />
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" type="date" required />
          </div>
          <div>
            <Label htmlFor="guests">Guests</Label>
            <Input id="guests" name="guests" type="number" min={1} defaultValue={1} />
          </div>
          {children}
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit">Search</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
