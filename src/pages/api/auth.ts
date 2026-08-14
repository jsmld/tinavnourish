import type { APIRoute } from 'astro';

/**
 * Decap CMS GitHub OAuth — step 1 of 2.
 *
 * Visited in a popup opened by the Decap editor. We generate a short-lived
 * signed `state` value, drop it in an HttpOnly cookie, and redirect to
 * GitHub's authorize endpoint. `/api/callback` later verifies that the
 * cookie matches the `state` GitHub hands back.
 *
 * This route only ever runs on the deployed site: with `local_backend: true`
 * Decap talks to `npx decap-server` directly and bypasses the proxy entirely.
 */

// Astro 7 has no `output: 'hybrid'`; with `output: 'static'` we opt out of
// prerender per route so the Vercel adapter emits a real serverless function.
export const prerender = false;

export const COOKIE_NAME = 'decap_oauth_state';
const STATE_TTL_SECONDS = 10 * 60; // 10 minutes

/** Get the absolute origin used to build redirect URIs. Falls back to the
 *  request origin if no `site:` is configured in astro.config. */
function origin(site: URL | undefined, request: URL): string {
  return (site ?? request).origin;
}

/** Base64url-encode a byte buffer (no padding) for cookie-safe strings. */
function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = '';
  for (const b of view) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Constant-time string compare to avoid timing-leak on the state check. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

/** Verify a signed state token produced by `signState()`. */
export async function verifyState(token: string, secret: string): Promise<boolean> {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;
  const expected = await sig(payloadB64, secret);
  if (!timingSafeEqual(expected, sigB64)) return false;
  try {
    const json = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const { exp } = JSON.parse(json) as { exp: number };
    return Date.now() < exp;
  } catch {
    return false;
  }
}

/** Create a signed state token: base64url({exp}) . base64url(hmac). */
async function signState(secret: string): Promise<string> {
  const exp = Date.now() + STATE_TTL_SECONDS * 1000;
  const payload = JSON.stringify({ exp });
  const payloadB64 = btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${payloadB64}.${await sig(payloadB64, secret)}`;
}

async function sig(payloadB64: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64));
  return b64url(mac);
}

export const GET: APIRoute = async ({ site, url, cookies }) => {
  const clientId = import.meta.env.OAUTH_CLIENT_ID;
  const secret = import.meta.env.OAUTH_COOKIE_SECRET ?? import.meta.env.OAUTH_CLIENT_SECRET;

  if (!clientId) {
    return new Response(
      'OAUTH_CLIENT_ID is not configured. Set it in your Vercel project environment variables.',
      { status: 500 },
    );
  }
  if (!secret) {
    return new Response(
      'OAUTH_COOKIE_SECRET (or OAUTH_CLIENT_SECRET) is not configured.',
      { status: 500 },
    );
  }

  const baseOrigin = origin(site, url);
  const redirectUri = `${baseOrigin}/api/callback`;
  const state = await signState(secret);

  const secure = baseOrigin.startsWith('https://');
  cookies.set(COOKIE_NAME, state, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: STATE_TTL_SECONDS,
  });

  const githubUrl = new URL('https://github.com/login/oauth/authorize');
  githubUrl.searchParams.set('client_id', clientId);
  githubUrl.searchParams.set('redirect_uri', redirectUri);
  githubUrl.searchParams.set('scope', 'repo');
  githubUrl.searchParams.set('state', state);

  return new Response(null, {
    status: 302,
    headers: { Location: githubUrl.toString() },
  });
};
