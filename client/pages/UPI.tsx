import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { buildUpiUri, qrUrl, validateUpiId } from "@/lib/upi";

export default function UPI() {
  const [pa, setPa] = useState("");
  const [pn, setPn] = useState("");
  const [am, setAm] = useState<string>("");
  const [tn, setTn] = useState("");
  const [tr, setTr] = useState("");

  const uri = useMemo(
    () => buildUpiUri({ pa, pn, am: am || undefined, tn, tr, cu: "INR" }),
    [pa, pn, am, tn, tr],
  );
  const valid = useMemo(() => validateUpiId(pa), [pa]);

  function copy(text: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  return (
    <SiteLayout>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>UPI Payment</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div>
              <Label htmlFor="pa">Payee UPI ID</Label>
              <Input
                id="pa"
                placeholder="merchant@bank"
                value={pa}
                onChange={(e) => setPa(e.target.value)}
              />
              {!valid && pa && (
                <div className="text-xs text-red-600 mt-1">
                  Enter a valid UPI ID like username@bank
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="pn">Payee Name</Label>
              <Input
                id="pn"
                placeholder="Merchant / Recipient Name"
                value={pn}
                onChange={(e) => setPn(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="am">Amount (INR)</Label>
                <Input
                  id="am"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={am}
                  onChange={(e) => setAm(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="tr">Transaction Ref (optional)</Label>
                <Input
                  id="tr"
                  placeholder="INV-1001"
                  value={tr}
                  onChange={(e) => setTr(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="tn">Note</Label>
              <Textarea
                id="tn"
                rows={2}
                placeholder="Purpose / Note"
                value={tn}
                onChange={(e) => setTn(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => copy(uri)}
                disabled={!valid}
              >
                Copy UPI Link
              </Button>
              <Button type="button" asChild disabled={!valid}>
                <a href={uri} target="_self" rel="noreferrer">
                  Open in UPI App
                </a>
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Tip: On mobile, "Open in UPI App" will launch your UPI app. On
              desktop, scan the QR from your phone.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>QR Code</CardTitle>
          </CardHeader>
          <CardContent className="grid place-items-center gap-3">
            {valid ? (
              <img
                src={qrUrl(uri, 280)}
                alt="UPI QR"
                className="border rounded-md"
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                Enter a valid UPI ID to generate QR
              </div>
            )}
            {valid && (
              <div className="text-xs text-muted-foreground text-center">
                UPI Link:{" "}
                <button className="underline" onClick={() => copy(uri)}>
                  {uri}
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SiteLayout>
  );
}
