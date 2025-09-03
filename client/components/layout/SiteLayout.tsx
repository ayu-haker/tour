import { PropsWithChildren } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { BackgroundCanvas } from "@/components/three/BackgroundCanvas";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "react-router-dom";

export function SiteLayout({ children }: PropsWithChildren) {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const dark3d = pathname.startsWith("/profile");
  return (
    <div className="relative min-h-dvh bg-background text-foreground">
      <BackgroundCanvas dark={dark3d} />
      <SiteHeader />
      <main className="relative z-10 container py-6 sm:py-10">{children}</main>
      <SiteFooter />
    </div>
  );
}
