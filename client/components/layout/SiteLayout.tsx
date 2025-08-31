import { PropsWithChildren } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { BackgroundCanvas } from "@/components/three/BackgroundCanvas";

export function SiteLayout({ children }: PropsWithChildren) {
  return (
    <div className="relative min-h-dvh bg-background text-foreground">
      <BackgroundCanvas />
      <SiteHeader />
      <main className="relative z-10 container py-10">{children}</main>
      <SiteFooter />
    </div>
  );
}
