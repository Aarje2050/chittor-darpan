/** @type {import('next').NextConfig} */
const nextConfig = {
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