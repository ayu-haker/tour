import * as React from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATIONS, searchStations, type Station } from "@/data/stations";

export function StationCombobox({ label, value, onChange, name, placeholder }: { label: string; value: Station | null; onChange: (s: Station) => void; name: string; placeholder?: string }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const items = React.useMemo(() => searchStations(query, 20), [query]);

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <input type="hidden" name={name} value={value ? `${value.code} - ${value.name}` : ""} readOnly />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
            {value ? (
              <div className="text-left">
                <div className="font-medium">{value.code} - {value.name}</div>
                <div className="text-xs text-muted-foreground">{value.city}, {value.state}</div>
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder || "Select station"}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[min(28rem,90vw)]">
          <Command filter={(value, search) => (value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0)}>
            <CommandInput value={query} onValueChange={setQuery} placeholder="Search by code or name..." />
            <CommandList>
              <CommandEmpty>No station found.</CommandEmpty>
              <CommandGroup>
                {items.map((s) => (
                  <CommandItem key={s.code} value={`${s.code} ${s.name} ${s.city}`} onSelect={() => { onChange(s); setOpen(false); }}>
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <div className="font-medium">{s.code} - {s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.city}, {s.state}</div>
                      </div>
                      <Check className={cn("h-4 w-4", value?.code === s.code ? "opacity-100" : "opacity-0")} />
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
