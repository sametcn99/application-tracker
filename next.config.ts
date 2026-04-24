import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
	output: "standalone",
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{ key: "X-Frame-Options", value: "DENY" },
					{
						key: "Referrer-Policy",
						value: "strict-origin-when-cross-origin",
					},
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{
						key: "Content-Security-Policy",
						value:
							"default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self'",
					},
				],
			},
		];
	},
	experimental: {
		serverActions: {
			bodySizeLimit: "16mb",
		},
		proxyClientMaxBodySize: "16mb",
	},
};

export default withNextIntl(nextConfig);
