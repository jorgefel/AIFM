import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Los sourcemaps de navegador no son necesarios para la aplicación pública.
  productionBrowserSourceMaps: false,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://aifm.onrender.com/api/:path*", // Proxy al backend en Render
      },
    ];
  },
};

export default nextConfig;
