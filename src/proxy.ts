import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PUBLIC_PATHS = ["/login", "/api/auth"];

export default auth((req) => {
	const { pathname } = req.nextUrl;
	const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

	if (!req.auth && !isPublic) {
		const url = new URL("/login", req.url);
		url.searchParams.set("callbackUrl", pathname);
		return NextResponse.redirect(url);
	}

	if (req.auth && pathname === "/login") {
		return NextResponse.redirect(new URL("/", req.url));
	}

	return NextResponse.next();
});

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
