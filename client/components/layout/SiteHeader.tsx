import { Link, NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, MoreVertical } from "lucide-react";

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
        <nav className="hidden md:flex items-center gap-1 ml-6">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                cn(
                  "px-3 py-2 rounded-md text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent",
                  isActive && "bg-accent text-foreground",
                )
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:flex">
            <AuthButtons />
          </div>
          <div className="md:hidden flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="outline" aria-label="Menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <div className="mt-8 grid gap-2">
                  {nav.map((n) => (
                    <NavLink
                      key={n.to}
                      to={n.to}
                      className={({ isActive }) =>
                        cn(
                          "px-3 py-2 rounded-md text-base border",
                          isActive ? "bg-accent" : "bg-card",
                        )
                      }
                    >
                      {n.label}
                    </NavLink>
                  ))}
                  <div className="mt-2">
                    <AuthButtons />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="More">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
      <div className="md:hidden border-t bg-background">
        <div className="container overflow-x-auto whitespace-nowrap py-2">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "inline-block px-4 py-3 text-base rounded-md mr-2 border",
                pathname === n.to ? "bg-accent" : "bg-card",
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
