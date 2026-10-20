import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isStaffAuthCutoverEnabled } from "@/features/auth/domain/staff-role";
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

async function hasSupabaseSession(request: NextRequest, response: NextResponse): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return false;
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  return Boolean(data.user);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { headers, csp } = withReportOnlyCsp(request);
  headers.set("x-pathname", pathname);

  if (pathname.startsWith("/admin")) {
    headers.set("x-admin-route", "true");
  }

  const response = NextResponse.next({ request: { headers } });
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const legacyOk = !isStaffAuthCutoverEnabled() && await isValidToken(request.cookies.get(COOKIE_NAME)?.value);
    const supabaseOk = await hasSupabaseSession(request, response);
    if (!legacyOk && !supabaseOk) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return attachCsp(NextResponse.redirect(url), csp);
    }
  }

  return attachCsp(response, csp);
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
