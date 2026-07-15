/** @type {import('next').NextConfig} */
// Static export for GitHub Pages project site:
//   served at https://supertext.github.io/supertext-order-api-documentation/
// basePath makes the baked-in /_next/... asset URLs resolve under that subpath.
const repo = 'supertext-order-api-documentation'

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: `/${repo}`,
  images: { unoptimized: true },
  trailingSlash: true,
}

export default nextConfig
