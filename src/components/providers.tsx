import { Suspense } from "react";
import { ConvexAuthNextjsServerProvider } from "@/lib/auth-server";

/**
 * Convex + cookie-based auth. The server provider reads the auth cookie, so
 * under cacheComponents it renders inside a Suspense boundary and streams.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ConvexAuthNextjsServerProvider>{children}</ConvexAuthNextjsServerProvider>
    </Suspense>
  );
}
