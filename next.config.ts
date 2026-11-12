import type { NextConfig } from "next";

// Origins allowed to embed this app in an iframe (the Canvas LTI placement).
const frameAncestors = process.env.FRAME_ANCESTORS ?? "'self' https://*.instructure.com";

const nextConfig: NextConfig = {
  // PGlite loads WASM/data files at runtime; pg has optional native bindings. Keep both out of the bundle.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Allow framing only by Canvas. Do NOT add X-Frame-Options: DENY. It would break the LTI embed.
          { key: "Content-Security-Policy", value: `frame-ancestors ${frameAncestors}` },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
