/**
 * Converts provider image URLs to proxied ones (server-side version).
 * Only proxies URLs from redworld.pro and similar blocked providers.
 * Other URLs (CDNs, public images) are left as-is.
 * Uses Buffer for encoding (server-only).
 */
export function buildImageUrl(logoUrl: string | null, origin: string): string | null {
  if (!logoUrl) return null;

  // If it's already a relative URL or data URI, use as-is.
  if (logoUrl.startsWith('/') || logoUrl.startsWith('data:')) {
    return logoUrl;
  }

  // Only proxy URLs from restricted providers. Others can load directly.
  const restrictedProviders = ['redworld.pro', 'goldfull.pro'];
  const needsProxy = restrictedProviders.some((provider) => logoUrl.includes(provider));

  if (!needsProxy) {
    // URL is from a public CDN or service, use directly.
    return logoUrl;
  }

  // Encode the URL in base64 to safely pass it as a query parameter.
  const encoded = Buffer.from(logoUrl).toString('base64');
  return `${origin}/api/image-proxy?url=${encodeURIComponent(encoded)}`;
}

/**
 * Client-side version of buildImageUrl. Uses btoa() instead of Buffer.
 * Safe to use in 'use client' components.
 */
export function buildImageUrlClient(logoUrl: string | null, origin: string): string | null {
  if (!logoUrl) return null;

  // If it's already a relative URL or data URI, use as-is.
  if (logoUrl.startsWith('/') || logoUrl.startsWith('data:')) {
    return logoUrl;
  }

  // Only proxy URLs from restricted providers.
  const restrictedProviders = ['redworld.pro', 'goldfull.pro'];
  const needsProxy = restrictedProviders.some((provider) => logoUrl.includes(provider));

  if (!needsProxy) {
    return logoUrl;
  }

  // Encode using btoa() (available in browser).
  const encoded = btoa(logoUrl);
  return `${origin}/api/image-proxy?url=${encodeURIComponent(encoded)}`;
}
