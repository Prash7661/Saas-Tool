export async function GET() {
  return new Response('google-site-verification: googleb1508dbb10d29cf0.html', {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
