import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return new NextResponse(
      "ADMIN_PASSWORD is not set — the admin panel is disabled until you set it.",
      { status: 503 }
    );
  }

  const auth = req.headers.get("authorization");
  if (auth) {
    const [scheme, encoded] = auth.split(" ");
    if (scheme === "Basic" && encoded) {
      const [, suppliedPassword] = atob(encoded).split(":");
      if (suppliedPassword === password) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("Autoryzacja wymagana.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Panel administracyjny"' },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
