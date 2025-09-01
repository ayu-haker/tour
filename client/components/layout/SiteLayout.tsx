import { PropsWithChildren } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { BackgroundCanvas } from "@/components/three/BackgroundCanvas";
import { useIsMobile } from "@/hooks/use-mobile";

export function SiteLayout({ children }: PropsWithChildren) {
  const isMobile = useIsMobile();
  return (
    <div className="relative min-h-dvh bg-background text-foreground">
      {!isMobile && <BackgroundCanvas />}
      <SiteHeader />
      <main className="relative z-10 container py-6 sm:py-10">{children}</main>
      <SiteFooter />
    </div>
  );
}
