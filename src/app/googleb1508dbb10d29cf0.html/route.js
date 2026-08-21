export async function GET() {
  return new Response('google-site-verification: googleb1508dbb10d29cf0.html', {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
