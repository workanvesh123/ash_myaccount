---
inclusion: fileMatch
fileMatchPattern: ['packages/payments/**/*']
---

# Payments – Package Context

## 1. Role & Scope

### What Payments is responsible for
- Cashier application (deposits, withdrawals, payment method management)
- Quick Deposit feature (inline deposit flows across products)
- Betslip Quick Deposit (deposit from betslip context in sports)
- Payment provider integrations and API clients
- Payment card utilities (NGPG card tokenization and validation)
- Shared payment utilities and helpers

### What Payments is NOT responsible for
- User balance display (owned by `@frontend/vanilla/features/balance-breakdown`)
- Transaction history UI (owned by `@frontend/myaccount`)
- Responsible gaming deposit limits (owned by `@frontend/vanilla/features/deposit-limits`)
- Bonus/promotion logic (owned by `@frontend/promo`)
- Authentication flows (owned by `@frontend/vanilla/features/login`)

**Decision rule:**  
If the change is about **payment processing, deposit/withdrawal flows, or payment provider integration**, it belongs here.  
If it's about **balance display, transaction history, or account management**, it belongs in `myaccount` or `vanilla`.

---

## 2. Library Structure & Purpose

### Primary libraries
- `cashier-entrypoint-lib/` – Cashier app shell, routing, main layout
- `quickdeposit-feature/` – Quick deposit component for inline deposit flows
- `betslipqd-feature/` – Betslip quick deposit integration for sports
- `cashier-providers-data-access/` – Payment provider API clients and services
- `common-utils/` – Shared payment utilities, validators, helpers
- `ngpgcard-utils/` – NGPG card tokenization and validation utilities
- `e2e/` – E2E test utilities and page objects

### Library purpose rules
- `cashier-entrypoint-lib` → Full cashier application (routing, guards, main UI)
- `quickdeposit-feature` → Embeddable quick deposit component for products
- `betslipqd-feature` → Sports betslip-specific deposit integration
- `cashier-providers-data-access` → Payment provider API integration
- `common-utils` → Shared utilities, validators, formatters
- `ngpgcard-utils` → Card tokenization and PCI-compliant card handling
- `e2e` → Test infrastructure (not imported by production code)

### Import patterns
```typescript
// ✅ Correct: Barrel exports
import { QuickDepositComponent } from '@frontend/payments/quickdeposit-feature';
import { BetslipQdComponent } from '@frontend/payments/betslipqd-feature';
import { PaymentProviderService } from '@frontend/payments/cashier-providers-data-access';
import { formatCurrency } from '@frontend/payments/common-utils';

// ❌ Wrong: Deep imports
import { QuickDepositComponent } from '../../../payments/quickdeposit-feature/src/component';
```

---

## 3. Public API & Consumers

### Public exports
- `cashier-entrypoint-lib` → `CASHIER_ROUTES`, routing configuration
- `quickdeposit-feature` → `QuickDepositComponent`, deposit services
- `betslipqd-feature` → `BetslipQdComponent`, betslip deposit integration
- `cashier-providers-data-access` → Payment provider services, API clients
- `common-utils` → Validators, formatters, shared types
- `ngpgcard-utils` → Card tokenization utilities

### Who is allowed to import Payments
- ✅ Allowed:
  - Product applications (sports, casino, bingo, etc.) for quick deposit
  - Host app for cashier routing
  - MyAccount for payment method management
- ❌ Not allowed:
  - Design system (DS is a dependency of Payments, not the reverse)
  - Vanilla core services (Payments depends on Vanilla, not the reverse)

**Rule:**  
Always import from barrel exports (`public-api.ts` or `index.ts`). Never import from internal paths.

---

## 4. Internal Structure & Code Placement

### Cashier entrypoint structure
- `src/lib/routes/` – Route definitions and lazy-loaded components
- `src/lib/guards/` – Route guards (auth, feature flags)
- `src/lib/services/` – Cashier-specific services
- `src/lib/components/` – Shell components (layout, navigation)

### Feature library structure
- `src/lib/components/` – Feature UI components
- `src/lib/services/` – Feature-specific services and state
- `src/lib/models/` – Feature-specific types and interfaces
- `src/lib/utils/` – Feature-specific utilities

### Data access structure
- `src/lib/services/` – API clients and provider services
- `src/lib/models/` – DTOs and API response types
- `src/lib/mappers/` – API ↔ domain model transformations

### Placement rules
- **New deposit/withdrawal flow** → Add to `cashier-entrypoint-lib/routes/`
- **New payment provider** → Add service to `cashier-providers-data-access/services/`
- **Shared payment utility** → Add to `common-utils/utils/`
- **Card validation logic** → Add to `ngpgcard-utils/`

---

## 5. Development Patterns

### Component architecture
- Use **standalone components** with `ChangeDetectionStrategy.OnPush`
- Use **signals** for reactive state, **computed** for derived state
- Use **toSignal()** to convert observables to signals in components
- Support **SSR** – never access `window`/`document` directly

### Service patterns
- Use **dependency injection** via `inject()` function
- Use **signals** for reactive state in services
- Use **RxJS** for HTTP calls and async operations
- Clean up subscriptions with `takeUntilDestroyed()`

### Payment-specific patterns
```typescript
// ✅ Correct: Signal-based state
export class QuickDepositService {
  private readonly amount = signal<number>(0);
  private readonly selectedMethod = signal<PaymentMethod | null>(null);
  readonly canProceed = computed(() => 
    this.amount() > 0 && this.selectedMethod() !== null
  );
}

// ✅ Correct: SSR-safe payment provider initialization
afterNextRender(() => {
  this.initializePaymentProvider();
});
```

---

## 6. Dependencies & Boundaries

### Allowed dependencies
- `@frontend/design-system/*` – DS components for UI
- `@frontend/vanilla/core` – Shared services (UserService, ConfigService)
- `@frontend/vanilla/features/*` – Cross-product features (auth, navigation)
- `@frontend/vanilla/ssr` – SSR utilities and platform abstractions
- `@angular/*` – Angular framework packages
- RxJS – Reactive programming

### Forbidden dependencies
- Other product packages (`@frontend/sports`, `@frontend/casino`, etc.)
- Product-specific feature libraries
- Backend packages
- Direct payment provider SDKs (must be wrapped in services)

### Third-party integrations
- Payment provider SDKs must be wrapped in services
- Card tokenization libraries must be isolated in `ngpgcard-utils`
- PCI compliance: Never log or store raw card data
- Always provide SSR-safe overrides for browser-only payment SDKs

**Boundary rule:**  
Payments provides deposit/withdrawal flows TO products, never imports FROM products. Quick deposit is embedded in products, not the reverse.

---

## 7. Invariants & Contracts

### Business invariants
- Payment amounts must always be positive non-zero values
- Card data must never be logged or stored in application state
- Payment provider responses must be validated before processing
- Deposit limits must be checked before allowing transactions
- Failed transactions must be logged for audit purposes

### Data contracts
- **Input types:** Payment method DTOs, transaction requests, user balance
- **Output types:** Transaction results, payment method models, validation errors
- **API contracts:** Payment provider APIs, cashier backend APIs

**Critical rule:**  
Never change payment-related types without coordinating with backend team. Payment flows are security-critical and require careful validation.

---

## 8. Testing Requirements

### Unit tests
- **Framework:** Jest
- **Location:** Co-located `*.spec.ts` files
- **Coverage focus:**
  - Payment validation logic (amounts, limits, card validation)
  - Provider service integration
  - State management in deposit flows
  - Error handling and edge cases

### E2E tests
- **Framework:** Playwright
- **Location:** `packages/payments/e2e/`
- **Critical flows:**
  - Deposit flow (method selection, amount entry, submission)
  - Withdrawal flow (method selection, amount validation)
  - Quick deposit from product context
  - Betslip quick deposit from sports
  - Payment method management

### Test data
- Use mock payment providers in tests (never real payment APIs)
- Test fixtures in `e2e/data-access/`
- Mock card data must use test card numbers only

**Security rule:**  
Never use real payment credentials or card data in tests. Always use provider-specific test credentials.

---

## 9. Security & Compliance

### PCI compliance
- Never log raw card numbers, CVV, or expiry dates
- Use tokenization for card storage (via `ngpgcard-utils`)
- Card input fields must be isolated from application state
- Payment provider SDKs must handle sensitive data, not application code

### SSR considerations
- Payment provider SDKs are browser-only (provide server overrides)
- Never initialize payment SDKs on server
- Use `afterNextRender()` for payment provider initialization
- Guard all browser-only payment logic with platform checks

### Error handling
- Never expose payment provider error details to users
- Log payment errors securely (no sensitive data)
- Provide user-friendly error messages
- Track failed transactions for audit

---

## 10. Known Gotchas & FAQ

### Known pitfalls
- **Payment provider SDKs are browser-only** – Always guard initialization with `afterNextRender()`
- **Card validation is synchronous** – Use `ngpgcard-utils` for client-side validation before API calls
- **Deposit limits are enforced server-side** – Client-side checks are UX only, not security
- **Quick deposit embeds in products** – Changes affect all products using quick deposit
- **Betslip QD is sports-specific** – Don't add sports-specific logic to generic quick deposit

### Performance considerations
- Payment provider SDKs can be heavy – lazy load when possible
- Card validation runs on every keystroke – optimize for performance
- Quick deposit should render fast – minimize dependencies
- Cashier app is critical path – optimize bundle size

### FAQ

**Q: When should I use quick deposit vs full cashier?**  
A: Quick deposit for inline flows in products (sports betslip, casino lobby). Full cashier for comprehensive payment management.

**Q: Where do payment method icons belong?**  
A: In `common-utils/assets/` or use DS icon components if available.

**Q: How do I add a new payment provider?**  
A: Add service to `cashier-providers-data-access/services/`, implement provider interface, add provider configuration.

**Q: Can I import sports-specific code into betslip QD?**  
A: No. Betslip QD should use generic payment logic. Sports-specific integration happens in sports package.

**Q: How do I test payment flows without real APIs?**  
A: Use mock services in tests. E2E tests use provider test environments with test credentials.

**Q: Where do currency formatting utilities belong?**  
A: In `common-utils/utils/` for payment-specific formatting. Use vanilla utilities for general currency display.

---

## See Also

- `.kiro/steering/topics/angular-performance/` – OnPush, signals, change detection
- `.kiro/steering/topics/ssr/` – SSR-safe patterns for payment providers
- `.kiro/steering/topics/design-system/` – DS component usage in payment UI
