import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Basic Authentication Middleware
// 環境変数 AUTH_USER / AUTH_PASSWORD が設定されている場合のみ認証を有効化

export function middleware(request: NextRequest) {
    const authUser = process.env.AUTH_USER;
    const authPassword = process.env.AUTH_PASSWORD;

    // 認証情報が未設定の場合はスキップ（開発環境用）
    if (!authUser || !authPassword) {
        return NextResponse.next();
    }

    // Health check は認証不要
    if (request.nextUrl.pathname === "/health-check") {
        return NextResponse.next();
    }

    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
        return new NextResponse("Authentication required", {
            status: 401,
            headers: {
                "WWW-Authenticate": 'Basic realm="Secure Area"',
            },
        });
    }

    // Basic認証のデコード
    const authValue = authHeader.split(" ")[1];
    const [user, password] = atob(authValue).split(":");

    if (user !== authUser || password !== authPassword) {
        return new NextResponse("Invalid credentials", {
            status: 401,
            headers: {
                "WWW-Authenticate": 'Basic realm="Secure Area"',
            },
        });
    }

    return NextResponse.next();
}

// 適用対象のパス
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (public folder)
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\..*|health-check).*)",
    ],
};
