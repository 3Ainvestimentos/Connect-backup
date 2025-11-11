import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DETECTIFY_IPS = new Set(["52.17.9.21", "52.17.98.131"]);

export function middleware(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  const userAgent = (req.headers.get("user-agent") || "").toLowerCase();

  // Permite Detectify APENAS se IP + User-Agent forem reconhecidos
  if (DETECTIFY_IPS.has(ip) && userAgent.includes("detectify")) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-detectify-scan", "true");
    
    // Log para rastreamento
    console.info(`[Detectify] Scan detectado de IP: ${ip}`);
    
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};

