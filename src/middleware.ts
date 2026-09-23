import { auth } from "@/contexts/auth";

const PUBLIC = ["/signin", "/api/auth"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (req.auth) return;
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return;

  if (pathname.startsWith("/api/")) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }
  return Response.redirect(new URL("/signin", req.nextUrl.origin));
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
