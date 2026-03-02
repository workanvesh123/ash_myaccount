---
inclusion: manual
---

# SSR Setup and Configuration

## Scope – When to Read This

### This file applies when you:
- Configure SSR for a new product or application
- Set up local SSR development environment with DynaCon
- Configure HTTP transfer cache settings
- Debug SSR server startup or configuration issues
- Serve SSR applications locally with `nx serve-ssr`
- Configure SSR fallback timeouts or server settings

### This file does NOT cover:
- Writing SSR-compatible code (see `ssr-integration.md`, `ssr-dom-and-browser-apis.md`)
- Platform detection and conditional execution (see `ssr-platform-and-execution-context.md`)
- Server overrides and shims (see `ssr-server-overrides-and-shims.md`)

**Rule:** If you're setting up SSR infrastructure or configuration, consult this file. For writing SSR-compatible code, see other SSR steering files.

---

## Core Principles

- **P1 – Explicit HTTP Cache Opt-In:** HTTP requests are only cached when explicitly marked with `transferCache: true`. Configure `withHttpTransferCacheOptions` to filter requests.
- **P2 – DynaCon-Driven SSR Enablement:** SSR is enabled via DynaCon configuration (`FrontendHost.Features.ServerSideRendering`). Local development requires DynaCon overrides.
- **P3 – Serve with Theme Context:** Always serve SSR applications with a theme configuration (`nx serve-ssr host-app -c {theme}`). SSR requires brand context.
- **P4 – Debug with Node Inspector:** Use `--inspect` flag with Chrome DevTools for server-side debugging. Never rely on console logs alone.

---

## Do / Don't Guidelines

### Do
- Serve SSR with theme: `yarn nx serve-ssr host-app -c gamebookers`
- Configure DynaCon to enable SSR locally 
- Mark HTTP requests with `transferCache: true` for caching
- Use `--inspect localhost:1234` for debugging with Chrome DevTools
- Configure `withHttpTransferCacheOptions` filter to control cache behavior

### Don't
- Don't serve SSR without theme configuration (breaks brand-specific features)
- Don't assume HTTP requests are cached by default (requires explicit opt-in)
- Don't debug SSR issues without Node Inspector (stack traces are essential)

---

## Standard Patterns

### Serving SSR Locally

**⚠️ Important:** serving SSR is extremely computation heavy. Only configure & serve it when specifically asked for it. Don't use this to test any given change.

```bash
# ✅ Serve with theme configuration
yarn nx serve-ssr host-app -c gamebookers

# ✅ Debug with Node Inspector (only when actively debugging)
yarn nx serve-ssr host-app -c gamebookers --inspect localhost:1234
# Then open chrome://inspect and configure port 1234
# Note: SSR is memory-intensive. Close other applications if needed.
```

### DynaCon Configuration for Local SSR
```json
{
  "Configuration": {
    "FrontendHost.Features.ServerSideRendering": {
      "IsEnabled": { "Values": [{ "Value": true, "Priority": 18446744073709551615 }] },
      "Host": { "Values": [{ "Value": { "default": "http://localhost:9999" }, "Priority": 18446744073709551615 }] }
    },
    "FrontendHost.Features.ClientApp": {
      "Values": [{ "Value": "SsrServer", "Priority": 18446744073709551615 }]
    }
  }
}
```

### HTTP Transfer Cache Configuration
```typescript
// packages/host-app/src/app.config.ts
import { provideClientHydration, withHttpTransferCacheOptions } from '@angular/platform-browser';

bootstrapApplication(AppComponent, {
  providers: [
    provideClientHydration(
      withEventReplay(),
      withHttpTransferCacheOptions({
        includePostRequests: true,
        filter: (req) => !!req.transferCache, // Only cache requests explicitly marked
      }),
    ),
  ]
});
```

**Important:** Only mark requests for caching if they return:
- Static/shared data (configuration, translations, static content)
- Non-user-specific data (public game lists, general settings)

**Never cache:**
- User-specific data e.g. `/api/user`, `/api/account`, `/api/balance`.
  - Always be aware if an API call returns user-specific responses, the above are only examples
- Real-time data (live odds, game state, notifications)
- Authentication/session endpoints

### Marking Requests for Caching
```typescript
// ✅ Cache static/shared data
this.http.get('/api/config', { transferCache: true });
this.http.get('/api/translations', { transferCache: true });

// ✅ Do NOT cache user-specific data
// Always be aware if an API call returns user-specific responses, the following are only examples 
this.http.get('/api/user'); // No transferCache flag
this.http.get('/api/account'); // No transferCache flag
this.http.get('/api/balance'); // No transferCache flag

// ❌ Wrong: Caching user data causes stale/incorrect data
this.http.get('/api/user', { transferCache: true }); // NEVER do this
```

---

## Implementation Checklist

- [ ] Did you serve SSR with a theme configuration (`-c {theme}`)?
- [ ] Did you configure DynaCon to enable SSR locally (`IsEnabled: true`, `Host: localhost:9999`)?
- [ ] Did you set `ClientApp: "SsrServer"` in DynaCon for local development?
- [ ] Did you configure `withHttpTransferCacheOptions` filter in `app.config.ts`?
- [ ] Did you mark HTTP requests with `transferCache: true` for caching?
- [ ] Did you use `--inspect` flag for debugging server-side issues?

---

## Common Pitfalls & Anti-Patterns

- ❌ **Serving without theme:** Running `nx serve-ssr host-app` without `-c {theme}` breaks brand-specific features and routing.
- ❌ **Assuming HTTP cache is automatic:** Requests are NOT cached by default. Must explicitly set `transferCache: true` and configure filter.
- ❌ **Missing DynaCon configuration:** SSR won't work locally without `IsEnabled: true` and `Host: localhost:9999` in DynaCon overrides.
- ❌ **Debugging without Node Inspector:** Console logs are insufficient for SSR debugging. Always use `--inspect` with Chrome DevTools.
- ❌ **Forgetting ClientApp setting:** DynaCon must set `ClientApp: "SsrServer"` for local SSR to work correctly.

---

## Small Examples

```bash
# ✅ Correct: Serve SSR with theme and debugging
yarn nx serve-ssr host-app -c gamebookers --inspect localhost:1234
```

```typescript
// ✅ Correct: Cache static data only
this.http.get('/api/config', { transferCache: true });
this.http.get('/api/translations', { transferCache: true });
```

```typescript
// ✅ Correct: Do NOT cache user-specific data
this.http.get('/api/user'); // Intentionally not cached
this.http.get('/api/balance'); // Intentionally not cached
```

```typescript
// ❌ Wrong: Caching user data
this.http.get('/api/user', { transferCache: true }); // NEVER cache user data
```

---

## Escalation & Trade-offs

- If HTTP caching conflicts with real-time data:
  - **Never** use `transferCache` for user-specific endpoints like (`/api/user`, `/api/account`, `/api/balance`)
  - **Never** use `transferCache` for real-time data (live odds, game state, notifications)
  - **Only** enable `transferCache` for static/shared content (configuration, translations, public lists)
- If SSR debugging is difficult:
  - Use `--inspect` with Chrome DevTools for stack traces
  - Enable `PATCH_TIMEOUT` in `polyfills.server.ts` to trace pending tasks
  - Note: SSR debugging is memory-intensive; close other applications if needed
- If SSR performance is slow:
  - Review fallback timeout settings in DynaCon
  - Check for long-running async operations blocking server response

**Rule:** When in doubt about caching, **do not cache**. User-specific data must never be cached. Always document SSR-specific settings in comments.

---

## Related Steering Files

- `ssr-integration.md` – General SSR patterns and principles
- `ssr-platform-and-execution-context.md` – Platform detection and conditional execution
- `.kiro/steering/topics/ssr/ssr-rxjs-and-http.md` – HTTP caching and RxJS patterns
- `.kiro/steering/topics/ssr/ssr-anti-patterns.md` – Comprehensive SSR best practices
- `docs/ssr-development-guide/README.md` – Complete SSR setup and debugging guide
