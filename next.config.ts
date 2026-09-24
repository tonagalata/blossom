import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  // pdfkit (a dependency of @react-pdf/renderer) loads its standard fonts via
  // Node's package.json "imports" subpath map (e.g. "#standard-fonts/Helvetica").
  // Webpack's bundler doesn't resolve/copy those files correctly for the
  // deployed serverless function, causing a MODULE_NOT_FOUND at runtime on
  // Netlify. Marking these packages external makes Next.js leave them as
  // plain node_modules files (resolved by Node itself, which understands the
  // subpath imports) instead of bundling them.
  serverExternalPackages: ['@react-pdf/renderer', 'pdfkit', '@react-pdf/font'],
  // Belt-and-suspenders: explicitly include pdfkit's font data/standard-fonts
  // directories in the traced output for the PDF routes, since Next's static
  // file tracer can miss files only reachable via a dynamic subpath import.
  outputFileTracingIncludes: {
    '/api/**/pdf': ['./node_modules/pdfkit/js/**', './node_modules/@react-pdf/font/**'],
  },
}

export default nextConfig
