export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://saas-tool-final.vercel.app/sitemap.xml',
  };
}
