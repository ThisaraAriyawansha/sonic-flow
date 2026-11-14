/** @type {import('next').NextConfig} */
// GitHub Pages serves the site under /sonic-flow; Vercel (and local) serve from root.
const basePath = process.env.GITHUB_ACTIONS === "true" ? "/sonic-flow" : "";

const nextConfig = {
  output: "export",
  basePath,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
