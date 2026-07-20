import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (path.startsWith("/login")) {
    return NextResponse.next();
  }

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  const sessionCookie = req.cookies.get("ticketer_sid")?.value;

  try {
    const res = await fetch(`${apiBase}/v1/auth/me`, {
      method: "GET",
      headers: {
        Cookie: sessionCookie ? `ticketer_sid=${sessionCookie}` : "",
      },
    });

    if (res.status !== 200) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const data = await res.json();
    const role = data?.user?.role;

    if (role !== "ADMIN" && role !== "SUPERADMIN") {
      return NextResponse.redirect(
        new URL("/login?error=unauthorized", req.url),
      );
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
