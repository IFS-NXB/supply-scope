import { NextResponse, type NextRequest } from "next/server";

// HTTP Basic Auth gate for the public deployment.
//
// - Active whenever BASIC_AUTH_PASSWORD is set. It gates every page AND API
//   route, so unauthenticated visitors can't trigger shared-DB writes or burn
//   Anthropic / Firecrawl / Apify credits.
// - On Vercel with no password configured it FAILS CLOSED (503) rather than
//   serving an open, fully-live deployment by accident.
// - Locally (no VERCEL env and no password) it stays open for frictionless dev.

export const config = {
  matcher: [
    // Everything except Next internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|gif|svg|ico|webp|css|js|map|txt|woff2?)$).*)",
  ],
};

// Length-aware constant-time compare to avoid leaking match length via timing.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function unauthorized(): NextResponse {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="SupplyScope", charset="UTF-8"' },
  });
}

export function middleware(req: NextRequest) {
  const password = process.env.BASIC_AUTH_PASSWORD;

  if (!password) {
    // Fail closed on Vercel so a misconfigured deploy is never open + live.
    if (process.env.VERCEL === "1") {
      return new NextResponse(
        "Access gate not configured. Set BASIC_AUTH_PASSWORD in the Vercel project.",
        { status: 503 }
      );
    }
    return NextResponse.next(); // local / dev: open
  }

  const expectedUser = process.env.BASIC_AUTH_USER || "supplyscope";
  const header = req.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const i = decoded.indexOf(":");
      if (i >= 0) {
        const user = decoded.slice(0, i);
        const pass = decoded.slice(i + 1);
        if (safeEqual(user, expectedUser) && safeEqual(pass, password)) {
          return NextResponse.next();
        }
      }
    } catch {
      // malformed header → fall through to 401
    }
  }

  return unauthorized();
}
