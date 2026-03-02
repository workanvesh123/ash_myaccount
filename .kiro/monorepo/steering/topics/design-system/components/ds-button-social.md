---
inclusion: manual
description: "DsButtonSocial integration patterns for social authentication buttons with providers like Google, Apple, Facebook"
---

# DsButtonSocial Integration Instructions

## Context

This guidance applies when implementing social authentication buttons for login/signup with social media providers. Use this when working with files that contain or reference DsButtonSocial components.

## Component Import and Basic Usage

Always import `DsButtonSocial` from `@frontend/ui/button-social` for social authentication buttons.

```typescript
import { DsButtonSocial } from '@frontend/ui/button-social';

@Component({
  imports: [DsButtonSocial]
})
```

Always use semantic HTML: `<button ds-button-social>` for authentication actions, `<a ds-button-social>` for social provider redirects.

```html
<!-- Social authentication actions -->
<button ds-button-social socialApp="google" (click)="loginWithGoogle()">
  Continue with Google
</button>

<!-- Social provider redirects -->
<a ds-button-social socialApp="facebook" [href]="facebookLoginUrl">
  Sign in with Facebook
</a>
```

## Social Provider Configuration

Always choose socialApp from supported providers: apple, facebook, google, entain, yahoo, paypal, mlife.

```html
<!-- Supported social providers -->
<button ds-button-social socialApp="apple">Sign in with Apple</button>
<button ds-button-social socialApp="google">Continue with Google</button>
<button ds-button-social socialApp="facebook">Facebook Login</button>
<button ds-button-social socialApp="entain">Entain Account</button>
```

Always use provider-specific branding and terminology in button text.

```html
<!-- Provider-specific terminology -->
<button ds-button-social socialApp="apple">Sign in with Apple</button>
<button ds-button-social socialApp="google">Continue with Google</button>
<button ds-button-social socialApp="facebook">Continue with Facebook</button>
```

Never use generic text that doesn't match provider branding guidelines.

## Variant and Size Selection

Always use `variant="filled"` for primary social authentication and `variant="outline"` for secondary options.

```html
<!-- Primary social login -->
<button ds-button-social variant="filled" socialApp="google">
  Continue with Google
</button>

<!-- Secondary social option -->
<button ds-button-social variant="outline" socialApp="facebook">
  Also available: Facebook
</button>
```

Always use `size="large"` for main authentication flows, `size="medium"` for compact forms, `size="small"` for inline options.

```html
<!-- Main authentication page -->
<button ds-button-social size="large" socialApp="apple">
  Sign in with Apple
</button>

<!-- Compact registration form -->
<button ds-button-social size="medium" socialApp="google">
  Quick signup
</button>

<!-- Inline social options -->
<button ds-button-social size="small" socialApp="facebook">
  FB
</button>
```

Never combine unsupported variant configurations. Always validate against component constraints.

## Icon Projection and Branding

Always use `slot="start"` for social provider icons with icon names that exactly match the socialApp value (e.g., socialApp='facebook' requires icon name 'facebook').

```html
<button ds-button-social socialApp="google">
  Continue with Google
  <vn-icon slot="start" name="google" aria-hidden="true"></vn-icon>
</button>
```

Always hide decorative icons from screen readers using `aria-hidden="true"`.

```html
<button ds-button-social socialApp="apple">
  Sign in with Apple
  <vn-icon slot="start" name="apple" aria-hidden="true"></vn-icon>
</button>
```

Never use custom icons that don't match official provider branding. Always use design system provided social icons.

```html
<!-- ✅ Correct -->
<button ds-button-social socialApp="facebook">
  Continue with Facebook
  <vn-icon slot="start" name="facebook" aria-hidden="true"></vn-icon>
</button>

<!-- ❌ Incorrect -->
<button ds-button-social socialApp="facebook">
  Continue with Facebook
  <img src="custom-fb-icon.png" slot="start" />
</button>
```

## Signal-Based State Management

Always use signal-based inputs for dynamic social provider configuration.

```html
<button ds-button-social 
        [socialApp]="selectedProvider()" 
        [variant]="providerVariant()" 
        [disabled]="isAuthenticating()">
  {{ getProviderLabel() }}
</button>
```

Always bind loading and disabled states for authentication flows.

```html
<button ds-button-social 
        socialApp="google"
        [disabled]="isLoading() || !isProviderAvailable()"
        (click)="authenticateWithGoogle()">
  {{ isLoading() ? 'Signing in...' : 'Continue with Google' }}
</button>
```

Never use manual subscriptions for social button state. Always leverage computed signals.

## Layout and Form Integration

Always use `class="w-100"` for full-width social buttons in authentication forms.

```html
<div class="auth-form">
  <button ds-button-social class="w-100 mb-3" socialApp="google">
    Continue with Google
    <vn-icon slot="start" name="google" aria-hidden="true"></vn-icon>
  </button>
  <button ds-button-social class="w-100 mb-3" socialApp="facebook">
    Continue with Facebook
    <vn-icon slot="start" name="facebook" aria-hidden="true"></vn-icon>
  </button>
</div>
```

Always use wrapper elements for spacing and layout. Never apply display or positioning classes to button host.

```html
<!-- ✅ Correct -->
<div class="d-flex flex-column gap-3">
  <button ds-button-social socialApp="apple">Sign in with Apple</button>
  <button ds-button-social socialApp="google">Continue with Google</button>
</div>

<!-- ❌ Incorrect -->
<button ds-button-social class="d-flex mb-3" socialApp="apple">
  Sign in with Apple
</button>
```

Never override social button design tokens with custom styles. Always use component inputs for visual changes.

## Accessibility and Screen Reader Support

Always provide clear, descriptive button text that includes the provider name.

```html
<button ds-button-social socialApp="google" aria-label="Sign in using your Google account">
  Continue with Google
  <vn-icon slot="start" name="google" aria-hidden="true"></vn-icon>
</button>
```

Always use `aria-describedby` for additional context about social authentication.

```html
<button ds-button-social 
        socialApp="facebook" 
        aria-describedby="facebook-auth-help">
  Continue with Facebook
</button>
<div id="facebook-auth-help" class="sr-only">
  Opens Facebook login in a new window
</div>
```

Never rely solely on icons for social provider identification. Always include provider name in button text.

## Authentication Flow Patterns

Always handle authentication loading states by disabling the button and displaying a loading spinner or text (e.g., 'Signing in...').

```html
<button ds-button-social 
        socialApp="apple"
        [disabled]="isAuthenticating()"
        (click)="initiateAppleAuth()">
  @if (isAuthenticating()) {
    Connecting to Apple...
  } @else {
    Sign in with Apple
  }
  <vn-icon slot="start" name="apple" aria-hidden="true"></vn-icon>
</button>
```

Always provide error handling for failed social authentication attempts.

```html
<button ds-button-social 
        socialApp="google"
        [disabled]="hasAuthError()"
        (click)="retryGoogleAuth()">
  @if (hasAuthError()) {
    Retry Google Sign In
  } @else {
    Continue with Google
  }
</button>
```

Always group social authentication options with consistent hierarchy and spacing.

```html
<div class="social-auth-group">
  <button ds-button-social variant="filled" socialApp="apple" class="w-100 mb-3">
    Sign in with Apple
    <vn-icon slot="start" name="apple" aria-hidden="true"></vn-icon>
  </button>
  <button ds-button-social variant="outline" socialApp="google" class="w-100 mb-3">
    Continue with Google
    <vn-icon slot="start" name="google" aria-hidden="true"></vn-icon>
  </button>
  <button ds-button-social variant="outline" socialApp="facebook" class="w-100">
    Continue with Facebook
    <vn-icon slot="start" name="facebook" aria-hidden="true"></vn-icon>
  </button>
</div>
```

## Provider-Specific Considerations

Always follow provider-specific branding guidelines for button text and styling.

```html
<!-- Apple: "Sign in with Apple" -->
<button ds-button-social socialApp="apple">
  Sign in with Apple
</button>

<!-- Google: "Continue with Google" or "Sign in with Google" -->
<button ds-button-social socialApp="google">
  Continue with Google
</button>

<!-- Facebook: "Continue with Facebook" -->
<button ds-button-social socialApp="facebook">
  Continue with Facebook
</button>
```

Always use the variant specified by the provider's brand guidelines: 'primary' for Apple/Google, 'secondary' for Facebook/Twitter, 'tertiary' for custom providers.

```html
<!-- Apple typically uses filled variant -->
<button ds-button-social variant="filled" socialApp="apple">
  Sign in with Apple
</button>

<!-- Google can use either variant -->
<button ds-button-social variant="outline" socialApp="google">
  Continue with Google
</button>
```

Never modify provider colors or branding through custom CSS. Always trust component's provider-specific styling.

## Inverse Theming

Always apply `[inverse]="true"` when using this component on dark backgrounds. See `inverse-theming.md` for comprehensive guidance.

```html
<div class="dark-background">
  <button ds-button-social [inverse]="true" socialApp="google">
    Continue with Google
    <vn-icon slot="start" name="google" aria-hidden="true"></vn-icon>
  </button>
</div>
```
