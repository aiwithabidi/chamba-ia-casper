import { convexAuthNextjsProxy } from "@/lib/auth-server";

// Refreshes the auth cookies up front so the server provider hydrates the
// client with a fresh access token. No redirects: the client gate handles them.
export const proxy = convexAuthNextjsProxy();

export const config = {
  // Skip Next internals, static files, the manifest and the generated icons, and the /auth/* handlers,
  // which manage the session cookies themselves (a proxy refresh there would race the handler's own).
  matcher: [
    "/((?!auth/|_next/static|_next/image|img/|favicon\\.ico|manifest\\.webmanifest|apple-icon|icon|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|xml|webmanifest)$).*)",
  ],
};
