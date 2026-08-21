import { PageShell } from "@/components/PageShell";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, LockKeyhole } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

/** Authentication gate; the full student workspace replaces this route in phase 7. */
export default function PortalEntry() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) setLocation("/auth?next=/portal");
  }, [isAuthenticated, loading, setLocation]);

  if (loading || !isAuthenticated) {
    return <PageShell><div className="container flex min-h-[55vh] flex-col items-center justify-center px-4 text-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="mt-4 font-mono text-[0.64rem] text-muted-foreground">Checking your secure workspace session…</p></div></PageShell>;
  }

  return <PageShell><div className="container flex min-h-[55vh] flex-col items-center justify-center px-4 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><LockKeyhole className="h-6 w-6" /></span><h1 className="mt-5 font-display text-4xl font-bold text-foreground">Workspace access confirmed.</h1><p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">Your secure Project Polaris workspace is loading.</p></div></PageShell>;
}
