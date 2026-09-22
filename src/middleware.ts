import { NextResponse, type NextRequest } from "next/server";
import { buildContentSecurityPolicy } from "@/shared/security/content-security-policy";

const COOKIE_NAME = "fs_admin_session";
const SECRET = process.env.NEXTAUTH_SECRET ?? "";

async function isValidToken(token: string | undefined): Promise<boolean> {
  if (!token || !SECRET) return false;
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

function withReportOnlyCsp(request: NextRequest): { headers: Headers; csp: string } {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildContentSecurityPolicy({
    nonce,
    isDev: process.env.NODE_ENV === "development",
  });
  const headers = new Headers(request.headers);
  headers.set("content-security-policy-report-only", csp);
  return { headers, csp };
}

function attachCsp(response: NextResponse, csp: string): NextResponse {
  response.headers.set("Content-Security-Policy-Report-Only", csp);
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { headers, csp } = withReportOnlyCsp(request);

  if (pathname === "/admin/login") {
    return attachCsp(NextResponse.next({ request: { headers } }), csp);
  }

  if (pathname.startsWith("/admin")) {
    const ok = await isValidToken(request.cookies.get(COOKIE_NAME)?.value);
    if (!ok) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return attachCsp(NextResponse.redirect(url), csp);
    }
  }

  return attachCsp(NextResponse.next({ request: { headers } }), csp);
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
