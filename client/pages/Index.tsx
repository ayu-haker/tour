import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteLayout } from "@/components/layout/SiteLayout";

export default function Index() {
  const navigate = useNavigate();

  return (
    <SiteLayout>
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-b from-indigo-50 to-transparent p-8 md:p-12">
        <div className="relative z-10">
          <div className="flex gap-5 max-lg:flex-col">
            <div className="w-1/2 max-lg:w-full">
              <div className="max-w-3xl">
                <p className="text-[14px] leading-5 tracking-[0.7px] font-semibold text-indigo-600 uppercase">Your travel command center</p>
                <h1 className="mt-3 text-[60px] leading-[60px] font-extrabold tracking-[-0.015em]">
                  Welcome to <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-extrabold">TOUR</span>
                </h1>
                <p className="mt-4 text-[18px] leading-7 text-muted-foreground">
                  Explore destinations, plan budgets, book hotels and rides, order food, and more — all in one place.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button size="lg" asChild>
                    <Link to="/explore">Explore Destinations</Link>
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate('/budget')}>Plan Your Budget</Button>
                </div>
              </div>
            </div>
            <div className="w-1/2 ml-5 max-lg:w-full max-lg:ml-0" />
          </div>
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Featured Services</h2>
          <span className="inline-flex items-center gap-2 rounded-full border bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">Most Popular</span>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <ServiceCard title="Hotel Booking" count="100+ hotels" desc="Find and book perfect accommodation" to="/hotels" icon="🏨" />
          <ServiceCard title="Cab Booking" count="200+ drivers" desc="Book reliable rides to your destination" to="/cabs" icon="🚖" />
          <ServiceCard title="Food Delivery" count="150+ restaurants" desc="Delicious local cuisine delivered" to="/food" icon="🍜" />
          <ServiceCard title="Tourist Spots" count="500+ locations" desc="Discover amazing places to visit" to="/spots" icon="🗺️" />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Quick Access</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {[
            { label: 'Hospitals', to: '/hospitals' },
            { label: 'Transport', to: '/transport' },
            { label: 'Budget Planner', to: '/budget' },
            { label: 'Emergency', to: '/emergency' },
            { label: 'Profile', to: '/profile' },
            { label: 'Support', to: '/support' },
          ].map((q) => (
            <Link key={q.label} to={q.to} className="rounded-lg border bg-card p-4 text-center hover:shadow-sm transition-shadow">
              <span className="font-medium">{q.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}

function ServiceCard({ title, count, desc, to, icon }: { title: string; count: string; desc: string; to: string; icon: string }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-blue-100 text-blue-600 text-xl">{icon}</div>
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <span className="text-xs text-muted-foreground">{count}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription>{desc}</CardDescription>
        <div className="mt-4">
          <Button asChild variant="secondary">
            <Link to={to}>Open</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
