import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Bed, Car, Utensils, MapPin, Plane, Train, QrCode } from "lucide-react";
import AssistantWidget from "@/components/chat/AssistantWidget";

export default function Index() {
  const navigate = useNavigate();

  return (
    <SiteLayout>
      <section className="relative overflow-hidden rounded-2xl border p-6 sm:p-8 md:p-12">
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 to-background/80" />
        <div className="relative z-10">
          <div className="flex gap-5 max-lg:flex-col">
            <div className="w-full lg:w-1/2">
              <div className="max-w-3xl">
                <p className="text-xs sm:text-sm leading-5 tracking-[0.08em] font-semibold text-indigo-500 uppercase">
                  Your travel command center
                </p>
                <h1 className="mt-3 text-4xl sm:text-5xl md:text-6xl leading-tight font-extrabold tracking-[-0.015em]">
                  Welcome to{" "}
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-extrabold">
                    TOUR
                  </span>
                </h1>
                <p className="mt-4 text-base sm:text-lg leading-7 text-muted-foreground">
                  Explore destinations, plan budgets, book hotels and rides,
                  order food, and more — all in one place.
                </p>
                <div className="mt-6 grid grid-cols-2 sm:inline-flex sm:flex-wrap gap-3">
                  <Button size="lg" asChild className="w-full sm:w-auto">
                    <Link to="/explore" aria-label="Explore Destinations">
                      Explore
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate("/budget")}
                    className="w-full sm:w-auto"
                  >
                    Budget Planner
                  </Button>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2 ml-0 lg:ml-5" />
          </div>
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Featured Services</h2>
          <span className="inline-flex items-center gap-2 rounded-full border bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            Most Popular
          </span>
        </div>
        <div className="grid gap-3 sm:gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
          <ServiceCard
            title="Flight Booking"
            count="Live fares"
            desc="Search and book flights with live updates"
            to="/flights"
            icon={<Plane className="h-5 w-5" />}
          />
          <ServiceCard
            title="Train Booking"
            count="Live availability"
            desc="Find trains and check seat availability"
            to="/trains"
            icon={<Train className="h-5 w-5" />}
          />
          <ServiceCard
            title="Hotel Booking"
            count="100+ hotels"
            desc="Find and book perfect accommodation"
            to="/hotels"
            icon={<Bed className="h-5 w-5" />}
          />
          <ServiceCard
            title="Cab Booking"
            count="200+ drivers"
            desc="Book reliable rides to your destination"
            to="/cabs"
            icon={<Car className="h-5 w-5" />}
          />
          <ServiceCard
            title="Food Delivery"
            count="150+ restaurants"
            desc="Delicious local cuisine delivered"
            to="/food"
            icon={<Utensils className="h-5 w-5" />}
          />
          <ServiceCard
            title="Tourist Spots"
            count="500+ locations"
            desc="Discover amazing places to visit"
            to="/spots"
            icon={<MapPin className="h-5 w-5" />}
          />
          <ServiceCard
            title="Scanner"
            count="QR"
            desc="Scan QR codes at tourist spots"
            to="/scanner"
            icon={<QrCode className="h-5 w-5" />}
          />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Quick Access</h2>
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Hospitals", to: "/hospitals" },
            { label: "Transport", to: "/transport" },
            { label: "Scanner", to: "/scanner" },
            { label: "Budget Planner", to: "/budget" },
            { label: "Emergency", to: "/emergency" },
            { label: "Profile", to: "/profile" },
            { label: "Support", to: "/support" },
          ].map((q) => (
            <Link
              key={q.label}
              to={q.to}
              className="rounded-xl border bg-card p-4 sm:p-5 text-center hover:shadow-sm transition-shadow active:scale-[0.99]"
            >
              <span className="font-medium text-sm sm:text-base">
                {q.label}
              </span>
            </Link>
          ))}
        </div>
      </section>
      <AssistantWidget />
    </SiteLayout>
  );
}

function ServiceCard({
  title,
  count,
  desc,
  to,
  icon,
}: {
  title: string;
  count: string;
  desc: string;
  to: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow active:scale-[0.99]">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-blue-100 text-blue-600 text-xl sm:h-12 sm:w-12">
            {icon}
          </div>
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <span className="text-xs text-muted-foreground">{count}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription>{desc}</CardDescription>
        <div className="mt-4">
          <Button asChild variant="secondary" className="w-full sm:w-auto">
            <Link to={to} aria-label={`${title} open`}>
              Open
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
