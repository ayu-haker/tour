import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Mail, LifeBuoy, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

export default function Support() {
  const phone = "7063444943";
  const email = "ayushmanbosuroy@gmail.com";

  return (
    <SiteLayout>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Support</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <div className="text-sm text-muted-foreground">
                Reach us directly
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-2">
                <a
                  href={`tel:${phone}`}
                  className="inline-flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-accent"
                >
                  <Phone className="h-4 w-4" /> {phone}
                </a>
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-accent break-all"
                >
                  <Mail className="h-4 w-4" /> {email}
                </a>
              </div>
            </div>
            <div className="grid gap-2">
              <div className="text-sm text-muted-foreground">Common help</div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="secondary">
                  <Link to="/emergency">
                    <LifeBuoy className="h-4 w-4 mr-2" /> Emergency Contacts
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/profile">
                    <MessageSquare className="h-4 w-4 mr-2" /> My Requests
                  </Link>
                </Button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              We typically respond within 24 hours. For urgent matters, please
              call the support number above.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live Assistance</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="text-sm text-muted-foreground">
              Use the assistant button at bottom-right for instant help and
              quick actions.
            </div>
            <div>
              <Button asChild>
                <Link to="/">Open Assistant</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </SiteLayout>
  );
}
