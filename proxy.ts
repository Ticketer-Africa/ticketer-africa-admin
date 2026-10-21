import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** /login, remembering where the person was going (checked by safeNextPath on login). */
function loginRedirect(req: NextRequest, error?: string) {
  const url = new URL("/login", req.url);
  const { pathname, search } = req.nextUrl;
  if (pathname !== "/") url.searchParams.set("next", `${pathname}${search}`);
  if (error) url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (path.startsWith("/login")) {
    return NextResponse.next();
  }

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  const sessionCookie = req.cookies.get("ticketer_admin_sid")?.value;

  try {
    const res = await fetch(`${apiBase}/v1/auth/me`, {
      method: "GET",
      headers: {
        Cookie: sessionCookie ? `ticketer_admin_sid=${sessionCookie}` : "",
        "x-ticketer-app": "admin",
      },
    });

    if (res.status !== 200) {
      return loginRedirect(req);
    }

    const data = await res.json();
    const role = data?.user?.role;

    if (role !== "ADMIN" && role !== "SUPERADMIN") {
      return loginRedirect(req, "unauthorized");
    }

    return NextResponse.next();
  } catch {
    return loginRedirect(req);
  }
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
