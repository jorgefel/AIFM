import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Los sourcemaps de navegador no son necesarios para la aplicación pública.
  productionBrowserSourceMaps: false,
};

export default nextConfig;
