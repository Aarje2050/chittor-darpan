/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // ✅ Allows production builds to succeed even if there are type errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // ✅ Ignores ESLint during builds (Vercel too)
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['localhost', 'your-supabase-storage-url'],
  },
  async redirects() {
    return [
      // WordPress migration redirects
      {
        source: '/listing/:slug',
        destination: '/business/:slug',
        permanent: true,
      },
      {
        source: '/listing-category/:category',
        destination: '/:category',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig