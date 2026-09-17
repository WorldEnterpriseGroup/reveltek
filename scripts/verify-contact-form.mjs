// Safe smoke check for the Reveltek lead-capture proxy.
// Modeled on Ravonics-Website/scripts/verify-proxy.mjs.
//
// Creates NO lead: the only POSTs sent are an untrusted-origin request the
// proxy must reject (403) and a malformed body it must reject before any
// upstream call (400). Safe to run against production at any time.
//
// Usage:
//   REVELTEK_PROXY_BASE=https://<public-proxy-base>/api \
//   REVELTEK_EXPECTED_VERSION=<release> \
//   REVELTEK_EXPECTED_PROXY_COMMIT=<sha> \
//   node scripts/verify-contact-form.mjs
const base = (process.env.REVELTEK_PROXY_BASE || 'https://reveltek-lead-proxy.azurewebsites.net/api').replace(
  /\/$/,
  ''
);
const expectedService = process.env.REVELTEK_EXPECTED_SERVICE || 'reveltek-lead-proxy';
const expectedVersion = process.env.REVELTEK_EXPECTED_VERSION || '';
const expectedCommit = process.env.REVELTEK_EXPECTED_PROXY_COMMIT || '';
const trustedOrigins = (process.env.REVELTEK_TRUSTED_ORIGINS || 'https://reveltek.com,https://www.reveltek.com')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function fail(message) {
  throw new Error(message);
}

async function expectJson(response, label) {
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    fail(`${label}: expected JSON response`);
  }
  return body;
}

const health = await fetch(`${base}/health`);
if (health.status !== 200) fail(`health: expected 200, received ${health.status}`);
if (health.headers.get('cache-control') !== 'no-store') fail('health: missing Cache-Control: no-store');
if (health.headers.get('x-content-type-options') !== 'nosniff')
  fail('health: missing X-Content-Type-Options: nosniff');
const healthBody = await expectJson(health, 'health');
if (healthBody.ok !== true || healthBody.service !== expectedService) {
  fail('health: unexpected service response');
}
if (!Array.isArray(healthBody.forms_configured) || !healthBody.forms_configured.includes('contact')) {
  fail('health: expected the contact form to be configured');
}
if (healthBody.turnstile !== 'configured' || healthBody.turnstile_required !== true) {
  fail('health: Turnstile is not configured as required');
}
if (expectedVersion && healthBody.version !== expectedVersion) {
  fail(`health: expected version ${expectedVersion}, received ${healthBody.version}`);
}
if (expectedCommit && healthBody.source_commit !== expectedCommit) {
  fail(`health: expected source commit ${expectedCommit}, received ${healthBody.source_commit}`);
}

for (const origin of trustedOrigins) {
  const preflight = await fetch(`${base}/lead/contact`, {
    method: 'OPTIONS',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type'
    }
  });
  if (preflight.status !== 204) fail(`preflight (${origin}): expected 204, received ${preflight.status}`);
  if (preflight.headers.get('access-control-allow-origin') !== origin) {
    fail(`preflight (${origin}): origin was not allowlisted`);
  }
  if (preflight.headers.get('access-control-allow-methods')?.split(/,\s*/).includes('POST') !== true) {
    fail(`preflight (${origin}): POST was not allowlisted`);
  }
  if (
    preflight.headers
      .get('access-control-allow-headers')
      ?.toLowerCase()
      .split(/,\s*/)
      .includes('content-type') !== true
  ) {
    fail(`preflight (${origin}): Content-Type was not allowlisted`);
  }
}

const untrustedPreflight = await fetch(`${base}/lead/contact`, {
  method: 'OPTIONS',
  headers: {
    Origin: 'https://example.invalid',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type'
  }
});
if (untrustedPreflight.status !== 204)
  fail(`preflight (untrusted): expected 204, received ${untrustedPreflight.status}`);
if (untrustedPreflight.headers.has('access-control-allow-origin')) {
  fail('preflight (untrusted): unexpected allow origin header');
}

const untrustedPost = await fetch(`${base}/lead/contact`, {
  method: 'POST',
  headers: {
    Origin: 'https://example.invalid',
    'Content-Type': 'application/json'
  },
  body: '{'
});
if (untrustedPost.status !== 403) {
  fail(`post (untrusted): expected 403, received ${untrustedPost.status}`);
}

const malformed = await fetch(`${base}/lead/contact`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: trustedOrigins[0] },
  body: '{'
});
if (malformed.status !== 400) fail(`malformed JSON: expected 400, received ${malformed.status}`);
const malformedBody = await expectJson(malformed, 'malformed JSON');
if (malformedBody.error !== 'invalid_json') fail('malformed JSON: unexpected error contract');

console.log(
  JSON.stringify(
    {
      ok: true,
      base,
      version: healthBody.version,
      sourceCommit: healthBody.source_commit,
      runtime: healthBody.runtime,
      forms: healthBody.forms_configured,
      checks: [
        'health',
        'cors-preflight-trusted-origins',
        'cors-rejects-untrusted-preflight',
        'cors-rejects-untrusted-post',
        'malformed-json'
      ]
    },
    null,
    2
  )
);
