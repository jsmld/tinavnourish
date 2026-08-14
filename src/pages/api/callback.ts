import type { APIRoute } from 'astro';
import { verifyState, COOKIE_NAME } from './auth';

/**
 * Decap CMS GitHub OAuth — step 2 of 2.
 *
 * GitHub redirects the popup here with `?code=...&state=...`. We:
 *   1. verify `state` against the cookie set in /api/auth,
 *   2. POST the code to GitHub's token endpoint to exchange it for an
 *      access token,
 *   3. return a tiny HTML page that runs `window.opener.postMessage(...)`
 *      with the exact payload prefix Decap's GitHub backend expects.
 *
 * On any failure we render a page whose own postMessage tells Decap the
 * login failed, so the popup still closes itself instead of hanging.
 */

export const prerender = false;

interface TokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

function origin(site: URL | undefined, request: URL): string {
  return (site ?? request).origin;
}

/** HTML that hands the token to the Decap opener window and closes the popup. */
function successHtml(token: string) {
  // The message prefix `'authorization: github'` is what Decap's popup relay
  // looks for; the JSON body shape is documented in its GitHub backend.
  const payload = JSON.stringify({ provider: 'github', token });
  return `<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>Logging in…</title></head>
  <body>
    <p>Finishing sign-in… you can close this window.</p>
    <script>
      (function () {
        var msg = 'authorization: github ${payload}';
        if (window.opener) {
          window.opener.postMessage(msg, window.location.origin);
        }
        window.close();
      })();
    </script>
  </body>
</html>`;
}

function errorHtml(message: string) {
  const payload = JSON.stringify({ provider: 'github', error: message });
  return `<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>Sign-in failed</title></head>
  <body>
    <p>Sign-in failed: ${message}</p>
    <script>
      (function () {
        var msg = 'authorization: github ${payload}';
        if (window.opener) {
          window.opener.postMessage(msg, window.location.origin);
        }
        window.close();
      })();
    </script>
  </body>
</html>`;
}

export const GET: APIRoute = async ({ site, url, cookies }) => {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieState = cookies.get(COOKIE_NAME)?.value;
  const secret = import.meta.env.OAUTH_COOKIE_SECRET ?? import.meta.env.OAUTH_CLIENT_SECRET;

  // Always clear the one-shot state cookie once consumed.
  cookies.delete(COOKIE_NAME, { path: '/' });

  if (!code || !state) {
    return new Response(errorHtml('Missing code or state from GitHub.'), {
      status: 400,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }
  if (!cookieState || !secret || !verifyState(cookieState, secret)) {
    return new Response(errorHtml('State mismatch or expired login. Please try again.'), {
      status: 400,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }
  // Defense in depth: the state in the URL must also match the cookie — not
  // just be a valid signature — so a stolen cookie can't be replayed with a
  // different state. verifyState covers signature/expiry; here we check equality.
  if (cookieState !== state) {
    return new Response(errorHtml('State mismatch. Please try again.'), {
      status: 400,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }

  const clientId = import.meta.env.OAUTH_CLIENT_ID;
  const clientSecret = import.meta.env.OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return new Response(
      errorHtml('Server misconfiguration: OAuth client credentials are missing.'),
      { status: 500, headers: { 'content-type': 'text/html; charset=utf-8' } },
    );
  }

  const baseOrigin = origin(site, url);
  const redirectUri = `${baseOrigin}/api/callback`;

  let tokenRes: Response;
  try {
    tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });
  } catch {
    return new Response(errorHtml('Could not reach GitHub to exchange the code.'), {
      status: 502,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }

  if (!tokenRes.ok) {
    return new Response(errorHtml(`GitHub token endpoint returned HTTP ${tokenRes.status}.`), {
      status: 502,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }

  const data = (await tokenRes.json()) as TokenResponse;
  if (data.error || !data.access_token) {
    const reason = data.error_description ?? data.error ?? 'no access token returned';
    return new Response(errorHtml(`GitHub rejected the code: ${reason}`), {
      status: 400,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }

  return new Response(successHtml(data.access_token), {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // The popup is same-origin; no special CSP needed. Prevent the page from
      // being framed elsewhere.
      'x-frame-options': 'DENY',
    },
  });
};
