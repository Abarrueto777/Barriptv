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
      redirect: 'follow',
      signal: AbortSignal.timeout(8000), // 8s timeout
    });

    if (!response.ok) {
      return placeholderImage();
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
    // Silently return placeholder on any error (timeout, connection refused, etc.)
    // These are common when provider URLs are invalid or blocked.
    return placeholderImage();
  }
}

/**
 * Returns a simple 1x1 transparent PNG placeholder.
 * Allows the page to render without broken image icons.
 */
function placeholderImage(): NextResponse {
  // 1x1 transparent PNG (smallest valid PNG)
  const png = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00,
    0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0d, 0x49, 0x44, 0x41, 0x54, 0x08, 0x5b, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00, 0x03, 0x01, 0x01, 0x00, 0x18,
    0xdd, 0x8d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);

  return new NextResponse(png, {
    status: 200,
    headers: {
      'content-type': 'image/png',
      'cache-control': 'public, max-age=86400',
    },
  });
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
