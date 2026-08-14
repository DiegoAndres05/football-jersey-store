import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "fs_admin_session";
const SECRET =
  process.env.NEXTAUTH_SECRET ?? "local-dev-secret-change-me-in-production-please";

async function isValidToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [body, mac] = token.split(".");
  if (!body || !mac) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const signature = Uint8Array.from(Buffer.from(mac, "base64url"));
  return crypto.subtle.verify("HMAC", key, signature, new TextEncoder().encode(body));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const ok = await isValidToken(request.cookies.get(COOKIE_NAME)?.value);
    if (!ok) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};