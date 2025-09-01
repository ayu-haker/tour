import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import CameraCapture from "@/components/media/CameraCapture";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { loadJSON, saveJSON } from "@/lib/storage";
import { Star } from "lucide-react";

const MEM_KEY_V2 = "tour.memories.v2";

type Memory = {
  id: string;
  dataUrl: string;
  title: string;
  notes: string;
  rating: number; // 0-5
  createdAt: number;
};

function Rating({ value, onChange }: { value: number; onChange: (v: number) => void }){
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const idx = i + 1;
        const active = value >= idx;
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onChange(idx)}
            aria-label={`Rate ${idx}`}
            className="p-0.5"
          >
            <Star size={18} className={active ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"} />
          </button>
        );
      })}
    </div>
  );
}

export default function Memories(){
  const [items, setItems] = useState<Memory[]>(() => loadJSON<Memory[]>(MEM_KEY_V2, []));
  const [captureOpen, setCaptureOpen] = useState(false);
  const [preview, setPreview] = useState<Memory | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(0);

  function persist(next: Memory[]){
    setItems(next);
    saveJSON(MEM_KEY_V2, next);
  }

  function onCapture(dataUrl: string){
    setPendingPhoto(dataUrl);
    setTitle("");
    setNotes("");
    setRating(0);
    setFormOpen(true);
  }

  function saveMemory(){
    if (!pendingPhoto) return;
    const mem: Memory = { id: crypto.randomUUID(), dataUrl: pendingPhoto, title: title || "Untitled", notes, rating, createdAt: Date.now() };
    const next = [mem, ...items];
    persist(next);
    setPendingPhoto(null);
    setFormOpen(false);
  }

  function removeMemory(id: string){
    const next = items.filter(i => i.id !== id);
    persist(next);
    if (preview?.id === id) setPreview(null);
  }

  const hasItems = items.length > 0;
  const sorted = useMemo(() => items.slice().sort((a,b)=>b.createdAt - a.createdAt), [items]);

  return (
    <SiteLayout>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Memories</h1>
        <Dialog open={captureOpen} onOpenChange={setCaptureOpen}>
          <DialogTrigger asChild>
            <Button>Open Camera</Button>
          </DialogTrigger>
          <DialogContent className="max-w-full sm:max-w-xl max-h-[85vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Capture a Memory</DialogTitle>
            </DialogHeader>
            <CameraCapture onCapture={(d)=>{ onCapture(d); setCaptureOpen(false); }} />
          </DialogContent>
        </Dialog>
      </div>

      {!hasItems && (
        <p className="mt-6 text-sm text-muted-foreground">No memories yet. Open the camera to capture your first memory.</p>
      )}

      {hasItems && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((m) => (
            <Card key={m.id} className="overflow-hidden">
              <img src={m.dataUrl} alt={m.title} className="w-full h-40 object-cover" />
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center justify-between gap-2">
                  <span className="truncate" title={m.title}>{m.title}</span>
                  <Rating value={m.rating} onChange={(v)=>{ const next = items.map(it => it.id === m.id ? { ...it, rating: v } : it); persist(next); }} />
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground">
                <p className="line-clamp-3 whitespace-pre-wrap">{m.notes}</p>
                <p className="mt-2 text-xs">{new Date(m.createdAt).toLocaleString()}</p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={()=>setPreview(m)}>View</Button>
                <Button variant="destructive" onClick={()=>removeMemory(m.id)}>Delete</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-full sm:max-w-xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Save Memory</DialogTitle>
          </DialogHeader>
          {pendingPhoto && (
            <img src={pendingPhoto} alt="Preview" className="w-full max-h-60 object-contain rounded-md border" />
          )}
          <div className="grid gap-3">
            <div>
              <Label htmlFor="t">Title</Label>
              <Input id="t" value={title} onChange={(e)=>setTitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="n">Notes</Label>
              <Textarea id="n" rows={4} value={notes} onChange={(e)=>setNotes(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block">Rating</Label>
              <Rating value={rating} onChange={setRating} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={()=>setFormOpen(false)}>Cancel</Button>
              <Button onClick={saveMemory}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!preview} onOpenChange={(o)=>!o && setPreview(null)}>
        <DialogContent className="max-w-full sm:max-w-2xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{preview?.title ?? "Memory"}</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="grid gap-3">
              <img src={preview.dataUrl} alt={preview.title} className="w-full max-h-[70vh] object-contain rounded-md border" />
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{new Date(preview.createdAt).toLocaleString()}</p>
                <Rating value={preview.rating} onChange={(v)=>{ if (!preview) return; const next = items.map(it => it.id === preview.id ? { ...it, rating: v } : it); persist(next); setPreview({ ...preview, rating: v }); }} />
              </div>
              <p className="whitespace-pre-wrap text-sm">{preview.notes}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SiteLayout>
  );
}
