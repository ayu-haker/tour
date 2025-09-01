import { Link, NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const nav = [
  { to: "/", label: "Home" },
  { to: "/hotels", label: "Hotel Booking" },
  { to: "/cabs", label: "Cab Booking" },
  { to: "/food", label: "Food Delivery" },
  { to: "/hospitals", label: "Hospitals" },
  { to: "/transport", label: "Transport" },
  { to: "/spots", label: "Tourist Spots" },
  { to: "/budget", label: "Budget Planner" },
  { to: "/memories", label: "Memories" },
  { to: "/emergency", label: "Emergency" },
  { to: "/profile", label: "Profile" },
];

export function SiteHeader() {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center gap-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 grid place-items-center text-white font-bold">🏞️</div>
          <span className="font-extrabold text-xl tracking-tight">TOUR</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1 ml-6">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                cn(
                  "px-3 py-2 rounded-md text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent",
                  isActive && "bg-accent text-foreground"
                )
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </div>
      <div className="md:hidden border-t bg-background">
        <div className="container overflow-x-auto whitespace-nowrap py-2">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "inline-block px-3 py-2 text-sm rounded-md mr-2 border",
                pathname === n.to ? "bg-accent" : "bg-card"
              )}
            >
              {n.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
