# Contact-form runbook (Reveltek)

Docs-only slice. No code changes, no secrets. The lead-capture proxy, the
`contact.astro` frontend wiring, and the publish-time endpoint injection land
in later slices; this file fixes the contract they must all implement so the
slices can proceed in parallel without drifting.

Ported from the Ravonics implementation (read-only sources, not modified):

- `Ravonics-Website/proxy/README.md` — routes table, non-secret settings,
  health contract, deploy and frontend-cutover procedure.
- `Ravonics-Website/scripts/verify-proxy.mjs` — safe smoke test model
  (health + preflight + untrusted-origin rejection + malformed JSON,
  no lead created).
- `Ravonics-Infrastructure/docs/observability.md` — privacy-aware KQL over
  `requests` / `traces` / `AzureDiagnostics`, no lead PII.

Reveltek naming throughout is `REVELTEK_*` / `reveltek-*` / `reveltek.com`.
Any value shown as `<placeholder>` is decided at approval time (see
Approval checklist) and must never be committed once it becomes real.

## 1. Current state

`src/pages/contact.astro` renders a static placeholder form (`action="#"`):
one "Your Full Name" text input, one "Your Email Address" input, one optional
"Your Phone" input, one "Write Message" textarea, and a "Send Message" submit
button. There is no endpoint plumbing, no Turnstile widget, and no honeypot
field yet. The page already shows the mailto fallback address
`info@reveltek.com`; that address stays as the last-resort fallback after
cutover (see section 3).

## 2. Payload schema

The browser posts `application/json` to the proxy. The proxy forwards the
payload verbatim (minus the anti-abuse plumbing fields) to the D365 Logic App
intake flow, adding attribution fields (`proxy_form`, `proxy_source`,
`proxy_received_utc`, `proxy_client_ip`).

| JSON field        | D365 lead attribute | Source / rule                                              |
|-------------------|---------------------|------------------------------------------------------------|
| `subject`         | `subject`           | Constant: `Website Contact Form`                           |
| `firstname`       | `firstname`         | Split from the Full Name input (everything but last token) |
| `lastname`        | `lastname`          | Split from the Full Name input (last token)                |
| `emailaddress1`   | `emailaddress1`     | Email input, trimmed, lowercased                           |
| `telephone1`      | `telephone1`        | Phone input; omit when empty (it is optional)              |
| `description`     | `description`       | Message textarea                                           |
| `leadsourcecode`  | `leadsourcecode`    | Constant: `Website Contact`                                |

Anti-abuse plumbing fields (consumed by the proxy, never forwarded to D365):

| JSON field           | Purpose                                                                                  |
|----------------------|------------------------------------------------------------------------------------------|
| `cf_turnstile_token` | Cloudflare Turnstile token from the page widget; verified server-side, fails closed      |
| `company_website`    | Honeypot. Hidden/off-screen input, left empty. Non-empty arrivals are silently dropped (proxy still returns 200 so bots get no signal) |

Proxy enforcement, ported unchanged from Ravonics: payload cap
(`MAX_BODY_BYTES`), honeypot drop, spam heuristic (>= 5 URLs or BBCode markup
in free-text fields -> 422), per-IP sliding-window rate limit (`RATE_LIMIT_MAX`
/ `RATE_LIMIT_WINDOW_MS` -> 429 + `Retry-After`), server-side Turnstile
verification, and CORS restricted to `ALLOWED_ORIGINS`. On upstream failure the
proxy returns 502 with an `info@reveltek.com` message and the form keeps its
mailto fallback — a lead is never silently dropped.

## 3. Endpoint contract

- The page reads its target from `window.REVELTEK_FORM_ENDPOINTS`, a global
  written at publish time (never hand-edited, never committed with real
  URLs — same pattern as Ravonics `scripts/inject-endpoints.sh` writing
  `js/form-endpoints.js`). Shape:

  ```js
  window.REVELTEK_FORM_ENDPOINTS = {
    contact: "https://<public-proxy-base>/api/lead/contact"
  };
  ```

- The contact form POSTs the section-2 payload to `contact`. Until the proxy
  slice lands and the injection step exists, the form keeps its current
  non-posting behavior and the only working channel is the mailto fallback.
- Mailto fallback (permanent, pre- and post-cutover): `info@reveltek.com`.
  Any proxy 5xx, Turnstile outage, or missing `REVELTEK_FORM_ENDPOINTS` entry
  surfaces a message pointing the visitor at that address.

## 4. Proxy settings reference (non-secret)

Names only. Real values live exclusively in Function App Settings or Key
Vault references (see Approval checklist); no `local.settings.json` with real
values is ever committed.

| Setting                     | Non-secret value / default                              |
|-----------------------------|---------------------------------------------------------|
| `TURNSTILE_REQUIRED`        | `true` (`false` only for a staging bypass)              |
| `MAX_BODY_BYTES`            | `20971520`                                              |
| `RATE_LIMIT_MAX`            | `5`                                                     |
| `RATE_LIMIT_WINDOW_MS`      | `60000`                                                 |
| `ALLOWED_ORIGINS`           | `https://reveltek.com,https://www.reveltek.com`         |
| `SERVICE_VERSION`           | Deployed release identifier                             |
| `SERVICE_COMMIT`            | Immutable source commit deployed                        |
| `LOGICAPP_URL_*`            | Logic App SAS callback URL (SECRET, Key Vault or setting) |
| `TURNSTILE_SECRET`          | Turnstile secret key (SECRET, Key Vault or setting)     |

Health contract (`GET /api/health`, anonymous, `Cache-Control: no-store`,
`X-Content-Type-Options: nosniff`): JSON with `ok: true`,
`service: reveltek-lead-proxy`, `forms_configured` including `contact`,
`turnstile: configured`, `turnstile_required: true`, plus `version`,
`source_commit`, and `runtime`. The smoke script below asserts exactly this.

## 5. Smoke check

`scripts/verify-contact-form.mjs`, modeled on Ravonics `verify-proxy.mjs`:

```bash
REVELTEK_PROXY_BASE=https://<public-proxy-base>/api \
REVELTEK_EXPECTED_VERSION=<release> \
REVELTEK_EXPECTED_PROXY_COMMIT=<sha> \
node scripts/verify-contact-form.mjs
```

Checks, in order: health status/headers/body (including version and commit pin
when the env vars are set); CORS preflight for both `reveltek.com` and
`www.reveltek.com` (204 + echoed origin + POST + Content-Type allowlisted);
untrusted-origin preflight (204 with no `access-control-allow-origin`) and
untrusted-origin POST (403); malformed JSON POST from a trusted origin (400,
`invalid_json` error contract).

It creates no lead: the only POSTs it sends are an untrusted-origin request
the proxy must reject and a malformed body the proxy must reject before any
upstream call. Safe to run against production at any time.

## 6. KQL starter (no PII)

Privacy-aware by construction: request metadata and structured event fields
only. Never select lead bodies, email addresses, Logic App URLs, Turnstile
tokens, or other secrets.

```kusto
// Recent proxy requests and failures
requests
| where timestamp > ago(24h)
| where cloud_RoleName =~ 'reveltek-lead-proxy'
| project timestamp, name, resultCode, success, duration, operation_Id
| order by timestamp desc
```

```kusto
// Proxy application events
traces
| where timestamp > ago(24h)
| where cloud_RoleName =~ 'reveltek-lead-proxy'
| where message startswith '{"event":"reveltek.'
| project timestamp, severityLevel, message, operation_Id
| order by timestamp desc
```

```kusto
// Front Door blocks and origin health
AzureDiagnostics
| where TimeGenerated > ago(24h)
| where ResourceProvider == 'MICROSOFT.CDN'
| where Category in ('FrontDoorWebApplicationFirewallLog', 'FrontDoorHealthProbeLog')
| project TimeGenerated, Category, action_s, requestUri_s, ruleName_s,
    healthProbeResult_s, originName_s, host_s
| order by TimeGenerated desc
```

During a release, verify in order: Front Door health probes show the
`reveltek-proxy` origin healthy; `requests` shows `/api/health` returning 200;
WAF logs show expected blocks only, if any; `traces` contains the correlation
ID and outcome for a synthetic journey.

## 7. Approval checklist

Every item needs a named owner and a recorded decision before the proxy or
frontend slices ship. Nothing here is decided by this slice.

- [ ] **D365 tenant / environment + BU owner.** Which tenant and environment
  receives leads, and which business unit owns them. Intake-flow owner named.
- [ ] **Lead-only vs lead + contact, `companyname` mapping, dedupe.**
  The contact form collects no company name: decide whether intake creates a
  lead only or a lead + contact, what `companyname` is set to (if anything),
  and the duplicate-detection rule (e.g. match on `emailaddress1`).
- [ ] **Key Vault name + resource group / subscription.** Vault, RG, and
  subscription for the Logic App SAS URLs and `TURNSTILE_SECRET`; MSI `get`
  grant plan. `az` writes run against this subscription only.
- [ ] **Turnstile sitekey / secret for reveltek.com.** Widget sitekey for the
  frontend and secret for the proxy, registered for the reveltek.com hostname.
- [ ] **Front Door extend-vs-standalone + DNS window.** Whether the public
  proxy base extends the existing Front Door or stands up its own, and the DNS
  change window for cutover.
- [ ] **`az` write + `listCallbackUrl` handling.** Who runs the
  `functionapp config appsettings set` / `cors add` writes and the
  `.../listCallbackUrl?api-version=2016-06-01` retrieval, on which machine,
  with output handled as secret (never pasted into chat, issues, or docs).
- [ ] **ZZZ TEST prod protocol.** Live end-to-end test uses a `ZZZ TEST`
  company/payload prefix and the resulting D365 lead is deleted afterward;
  deleter named.
