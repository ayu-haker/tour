import { Link, NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Menu } from "lucide-react";

const nav = [
  { to: "/", label: "Home" },
  { to: "/flights", label: "Flight Booking" },
  { to: "/trains", label: "Train Booking" },
  { to: "/hotels", label: "Hotel Booking" },
  { to: "/cabs", label: "Cab Booking" },
  { to: "/food", label: "Food Delivery" },
  { to: "/hospitals", label: "Hospitals" },
  { to: "/transport", label: "Transport" },
  { to: "/spots", label: "Tourist Spots" },
  { to: "/scanner", label: "Scanner" },
  { to: "/budget", label: "Budget Planner" },
  { to: "/memories", label: "Memories" },
  { to: "/partner", label: "Partner" },
  { to: "/emergency", label: "Emergency" },
  { to: "/profile", label: "Profile" },
];

function AuthButtons() {
  const { user, logout } = useAuth();
  if (!user) {
    return (
      <Button asChild variant="outline">
        <Link to="/login">Login</Link>
      </Button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="secondary">
        <Link to="/profile">{user.email}</Link>
      </Button>
      <Button variant="outline" onClick={logout}>
        Logout
      </Button>
    </div>
  );
}

export function SiteHeader() {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center gap-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 grid place-items-center text-white font-bold">
            🏞️
          </div>
          <span className="font-extrabold text-xl tracking-tight">TOUR</span>
        </Link>
        {/* desktop nav removed, using menu button instead */}
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="Menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {nav.map((n) => (
                  <DropdownMenuItem key={n.to} asChild>
                    <Link to={n.to}>{n.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <AuthButtons />
          </div>
          <div className="md:hidden flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="More">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/flights">Flight Booking</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/trains">Train Booking</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/hotels">Hotel Booking</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/cabs">Cab Booking</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/food">Food Delivery</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/spots">Tourist Spots</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile">Profile</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
