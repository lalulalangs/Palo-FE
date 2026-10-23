import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";
  const { pathname } = request.nextUrl;

  // Aset statis, gambar, font, dan internal Next.js selalu dilewatkan
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/media") ||
    pathname.startsWith("/img") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    /\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|woff2?|map)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  // Jika mode maintenance diaktifkan:
  if (isMaintenanceMode) {
    requestHeaders.set("x-maintenance-mode", "1");

    if (pathname !== "/maintenance") {
      const url = request.nextUrl.clone();
      url.pathname = "/maintenance";
      return NextResponse.rewrite(url, {
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Matcher mencakup semua path selain file internal Next.js
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
