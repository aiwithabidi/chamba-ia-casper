import { setupConvexAuthServer } from "@convex-dev/auth/ssr";
import { setupConvexAuthNextjs } from "@convex-dev/auth/ssr/nextjs";
import { api } from "../../convex/_generated/api";

// The session lives in httpOnly cookies (not localStorage), so it survives
// iOS Add to Home Screen: WebKit copies cookies into the installed web app.
// Cookie lifetime follows the refresh token (30-day session by default).
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;
const secure = process.env.NODE_ENV === "production";

/** Route handlers mounted at /auth/{signin,refresh,signout}. */
export const authRoutes = setupConvexAuthServer({
  convexUrl,
  refreshSession: api.auth.refreshSession,
  signOut: api.auth.signOut,
  signIn: [api.auth.signInWithUsernamePassword, api.auth.signUpWithUsernamePassword],
  cookieOptions: { secure },
});

export const { convexAuthNextjsProxy, ConvexAuthNextjsServerProvider } = setupConvexAuthNextjs({
  convexUrl,
  refreshSession: api.auth.refreshSession,
  isAuthenticated: api.auth.isAuthenticated,
  cookieOptions: { secure },
});
