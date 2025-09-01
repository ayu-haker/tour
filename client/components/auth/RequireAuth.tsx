import { PropsWithChildren } from "react";
import { useAuth } from "@/context/AuthContext";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function RequireAuth({ children }: PropsWithChildren) {
  const { user } = useAuth();
  if (!user) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md text-center">
          <p className="text-lg">You must be logged in to access this page.</p>
          <Button asChild className="mt-4"><Link to="/login">Login</Link></Button>
        </div>
      </SiteLayout>
    );
  }
  return <>{children}</>;
}
