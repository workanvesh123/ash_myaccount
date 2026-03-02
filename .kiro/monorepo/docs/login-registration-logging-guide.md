# Login & Registration Flow - Console Logging Guide

## Overview

Comprehensive console logging has been added to track the complete login and registration flow. All logs use emoji prefixes for easy visual scanning.

---

## Log Categories & Emojis

| Emoji | Category | Service | What It Tracks |
|-------|----------|---------|----------------|
| 🔐 | Login/Auth | LoginNavigationService | Login navigation, return URL management |
| 📝 | Registration | LoginNavigationService | Registration navigation |
| 🧭 | Navigation | NavigationService | All navigation decisions |
| 🔄 | Redirect | PostLoginActions | Post-login redirect actions |
| 💰 | Cashier | PostLoginActions | Cashier deposit navigation |
| 🎯 | Action | PostLoginActions | Action handler invocation |
| 🪝 | Hooks | LoginResponseHandler | Post-login hook execution |
| ✅ | Success | All | Successful operations |
| ❌ | Error | All | Failed operations |
| ⚠️ | Warning | All | Important notices |
| ➡️ | Navigation | All | Actual navigation execution |
| 🔍 | Decision | All | Decision points |
| 🗑️ | Cleanup | All | Data clearing |
| 🏠 | Home | All | Home navigation |
| ⏭️ | Skip | All | Skipped operations |

---

## Complete Flow Examples

### Example 1: Simple Login → Home

```javascript
// User clicks login button
🔐 [LoginNavigation] goToLogin called
  options: {}
  storedReturnUrl: null

// Login succeeds
🔐 [LoginResponseHandler] handle() START
  isCompleted: true
  username: "user@example.com"
  accountId: "12345"

✅ [LoginResponseHandler] Login completed - post-login phase

🪝 [LoginResponseHandler] Running post-login hooks
  hookCount: 3
  isLastIteration: true

✅ [LoginResponseHandler] Post-login hooks completed

🎯 [LoginResponseHandler] handle() COMPLETE - Final redirect
  action: "goToRedirectUrl"
  isCompleted: true

🎯 [PostLoginActions] invoke() called
  action: "goToRedirectUrl"
  availableHandlers: ["goToCashierDeposit", "goToRedirectUrl"]

✅ [PostLoginActions] Executing handler: goToRedirectUrl

🔄 [PostLoginActions] goToRedirectUrl

🔐 [LoginNavigation] getStoredLoginRedirect called
  returnUrl: null
  clearStoredRedirect: true

🏠 [LoginNavigation] No return URL, using home: /en/sports

🧭 [Navigation] goTo() called
  targetUrl: "/en/sports"
  isSameHost: true
  culture: "en"

⚡ [Navigation] Performing CLIENT-SIDE navigation
```

### Example 2: Login with Return URL

```javascript
// User on /casino/slots/game-123, clicks login
🔐 [LoginNavigation] storeReturnUrl called
  currentUrl: "/en/casino/slots/game-123"
  existingReturnUrl: null
  willStore: true

✅ [LoginNavigation] Return URL stored: /en/casino/slots/game-123

// After login
🔐 [LoginNavigation] getStoredLoginRedirect called
  returnUrl: "/en/casino/slots/game-123"
  clearStoredRedirect: true

✅ [LoginNavigation] Return URL resolved:
  original: "/en/casino/slots/game-123"
  resolved: "/en/casino/slots/game-123"

🗑️ [LoginNavigation] Cleared stored return URL

🧭 [Navigation] goTo() called
  targetUrl: "/en/casino/slots/game-123"
```

### Example 3: Login with Query Parameter Return URL

```javascript
// User lands on /login?rurl=%2Fen%2Fpromotions%2Fwelcome

🔐 [LoginNavigation] storeReturnUrlFromQuerystring called
  queryParams: { rurl: "/en/promotions/welcome" }

✅ [LoginNavigation] Return URL stored from querystring: /en/promotions/welcome

// After login
🔐 [LoginNavigation] getStoredLoginRedirect called
  returnUrl: "/en/promotions/welcome"

✅ [LoginNavigation] Return URL resolved:
  original: "/en/promotions/welcome"
  resolved: "/en/promotions/welcome"
```

### Example 4: Registration Navigation

```javascript
// User clicks register button
📝 [LoginNavigation] goToRegistration called
  targetUrl: "/mobileportal/register"
  options: { appendReferrer: true }
  customUrl: false

🧭 [Navigation] goTo() called
  targetUrl: "/mobileportal/register?referrer=..."
  options: { appendReferrer: true }
```

### Example 5: Login Interceptor (Workflow)

```javascript
// Login requires additional steps (KYC, etc.)
🔐 [LoginResponseHandler] handle() START
  isCompleted: false
  redirectUrl: "/workflow/kyc"
  action: null

⚠️ [LoginResponseHandler] Login NOT completed - workflow phase (interceptor)
  redirectUrl: "/workflow/kyc"
  action: null

➡️ [LoginResponseHandler] Redirecting to workflow
  url: "/workflow/kyc"
  action: null

🧭 [Navigation] goTo() called
  targetUrl: "/workflow/kyc"
```

### Example 6: Custom Post-Login Action

```javascript
// Server returns custom action
🔐 [LoginResponseHandler] handle() COMPLETE - Final redirect
  action: "goToCashierDeposit"

🎯 [PostLoginActions] invoke() called
  action: "goToCashierDeposit"
  availableHandlers: ["goToCashierDeposit", "goToRedirectUrl"]

✅ [PostLoginActions] Executing handler: goToCashierDeposit

💰 [PostLoginActions] goToCashierDeposit
  options: {}

➡️ [PostLoginActions] Opening cashier deposit
  returnUrl: "/en/sports"
  targetWindow: null
```

---

## How to Use These Logs

### 1. Track Return URL Flow

Filter console for `[LoginNavigation]`:

```javascript
// In browser console
console.log = (function(oldLog) {
  return function(...args) {
    if (args[0]?.includes?.('[LoginNavigation]')) {
      oldLog.apply(console, args);
    }
  };
})(console.log);
```

### 2. Debug Navigation Issues

Filter for `[Navigation]` to see all navigation decisions:

```javascript
// See why navigation chose full reload vs client-side
// Look for: "Navigation type decision"
```

### 3. Track Post-Login Actions

Filter for `[PostLoginActions]` to see which handler executed:

```javascript
// See which action was invoked and why
// Look for: "invoke() called" and "Executing handler"
```

### 4. Monitor Hook Execution

Filter for `[LoginResponseHandler]` to see hook flow:

```javascript
// See how many hooks ran and when
// Look for: "Running post-login hooks"
```

---

## Common Debugging Scenarios

### Scenario: User Not Redirected After Login

**What to check:**

1. Look for `getStoredLoginRedirect` - was return URL stored?
2. Check `goToRedirectUrl` - was it invoked?
3. Look for `Navigation type decision` - did it choose the right method?

**Expected logs:**
```
✅ [LoginNavigation] Return URL stored: /target/page
🔐 [LoginNavigation] getStoredLoginRedirect called
✅ [LoginNavigation] Return URL resolved: /target/page
🧭 [Navigation] goTo() called: /target/page
```

### Scenario: Wrong Page After Login

**What to check:**

1. Check `storeReturnUrl` - was the correct URL stored?
2. Look for `Return URL resolved` - was it modified?
3. Check for `No return URL, using home` - did it fall back?

**Expected logs:**
```
🔐 [LoginNavigation] storeReturnUrl called
  currentUrl: "/expected/page"
  willStore: true
✅ [LoginNavigation] Return URL stored: /expected/page
```

### Scenario: Registration Not Working

**What to check:**

1. Look for `goToRegistration called`
2. Check the `targetUrl` value
3. Look for `Navigation type decision`

**Expected logs:**
```
📝 [LoginNavigation] goToRegistration called
  targetUrl: "/mobileportal/register"
🧭 [Navigation] goTo() called
```

### Scenario: Custom Action Not Executing

**What to check:**

1. Look for `invoke() called` - was the action name correct?
2. Check `availableHandlers` - is your handler registered?
3. Look for `Executing handler` or `Handler not found`

**Expected logs:**
```
🎯 [PostLoginActions] invoke() called
  action: "myCustomAction"
  availableHandlers: ["goToCashierDeposit", "goToRedirectUrl", "myCustomAction"]
✅ [PostLoginActions] Executing handler: myCustomAction
```

---

## Security Logs

The system logs security-related rejections:

```javascript
// Dangerous URL patterns rejected
❌ [LoginNavigation] Return URL rejected (security: contains dangerous patterns): javascript:alert(1)

// External domains rejected
❌ [LoginNavigation] Return URL rejected (security: external domain): https://evil.com
```

---

## Performance Tracking

Look for timing information in logs:

```javascript
// Login duration
🔐 [LoginResponseHandler] handle() START
  // ... operations ...
🎯 [LoginResponseHandler] handle() COMPLETE - Final redirect
  // Time between these = total login handling time
```

---

## Tips for Production Debugging

1. **Enable logs temporarily**: Wrap console.log calls with a feature flag
2. **Filter by emoji**: Use browser console filters (e.g., `🔐` to see only login logs)
3. **Export logs**: Right-click console → Save as... to export for analysis
4. **Use timestamps**: Browser console shows timestamps - use them to track timing issues

---

## Modified Files

The following files now include comprehensive logging:

1. `packages/vanilla/lib/core/src/login/login-navigation.service.ts`
   - storeReturnUrl()
   - storeReturnUrlFromQuerystring()
   - goToRegistration()
   - goToLogin()
   - goToStoredReturnUrl()
   - getStoredLoginRedirect()

2. `packages/vanilla/lib/core/src/login/login-response-handler/login-response-handler.service.ts`
   - handle() - Complete flow tracking

3. `packages/vanilla/lib/core/src/login/post-login-actions.service.ts`
   - invoke()
   - register()
   - goToRedirectUrl()
   - goToCashierDeposit()

4. `packages/vanilla/lib/core/src/navigation/navigation.service.ts`
   - goTo() - Navigation decision tracking

---

## Next Steps

To add logging to your custom code:

```typescript
// In your component/service
async onLoginClick() {
  console.log('🎯 [MyComponent] Login button clicked', {
    currentUrl: window.location.href,
    targetReturnUrl: '/my/target/page'
  });
  
  inject(LoginStoreService).ReturnUrlFromLogin = '/my/target/page';
  
  console.log('✅ [MyComponent] Return URL set, opening login');
  await inject(LoginService).goToLogin();
}
```

Use the same emoji system for consistency!
