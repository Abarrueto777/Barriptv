import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxies images from redworld.pro and other providers.
 * Accepts the image URL as a query param (base64-encoded for safety).
 * This allows images to load even when the provider blocks direct browser requests.
 */
export async function GET(request: NextRequest) {
  const imageUrl = request.nextUrl.searchParams.get('url');
  if (!imageUrl) {
    return NextResponse.json({ error: 'missing url param' }, { status: 400 });
  }

  let decodedUrl: string;
  try {
    decodedUrl = Buffer.from(imageUrl, 'base64').toString('utf-8');
  } catch {
    return NextResponse.json({ error: 'invalid url encoding' }, { status: 400 });
  }

  // Validate that the URL is from an allowed provider (redworld.pro, goldfull.pro, etc.)
  if (!isAllowedImageUrl(decodedUrl)) {
    return NextResponse.json({ error: 'forbidden provider' }, { status: 403 });
  }

  try {
    const response = await fetch(decodedUrl, {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      // Don't follow redirects if the provider uses them — we'll handle it.
      redirect: 'follow',
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'upstream error' }, { status: response.status });
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Return the image with aggressive caching — these don't change.
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'content-type': contentType,
        'cache-control': 'public, max-age=2592000', // 30 days
      },
    });
  } catch (e) {
    console.error('[ImageProxy] Fetch failed:', decodedUrl, e);
    return NextResponse.json({ error: 'fetch failed' }, { status: 502 });
  }
}

function isAllowedImageUrl(url: string): boolean {
  // Whitelist known safe image sources from IPTV providers.
  const allowed = [
    'redworld.pro',
    'goldfull.pro',
    'cdn.example.com',
    // Add more as needed.
  ];

  try {
    const parsed = new URL(url);
    return allowed.some((domain) => parsed.hostname?.includes(domain));
  } catch {
    return false;
  }
}
