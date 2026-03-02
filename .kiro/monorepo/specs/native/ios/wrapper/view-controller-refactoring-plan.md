# iOS View Controller Refactoring Plan

## Executive Summary

The Conjure audit identified two massive view controllers as critical technical debt:
- **WebViewController** (1,928 lines) - handles WebView, JS bridge, navigation, analytics, notifications, error handling
- **MainViewController** (1,160 lines) - formerly SliderRootViewController, handles app container, slider games, view state

This plan breaks these into focused, testable components following the patterns already established in `Wrapper/Bridge/`.

---

## Current State

### WebViewController (1,928 lines)
| Responsibility | Lines (est.) | Coupling |
|----------------|--------------|----------|
| WebView setup & configuration | ~150 | WKWebView |
| JS injection | ~50 | Web contract |
| JS message parsing (WKScriptMessageHandler) | ~100 | CCBModel |
| Event routing to handlers | ~200 | NotificationCenter (legacy) |
| WKNavigationDelegate | ~300 | URL handling, sensitive pages |
| WKUIDelegate | ~50 | Popups, alerts |
| Loading/splash screen | ~100 | UI state |
| App lifecycle (foreground/background) | ~150 | Notifications |
| Analytics (AppsFlyer, DataDog) | ~100 | SDKs |
| Error handling & Kibana logging | ~80 | Logging |
| Safari view controller | ~100 | External URLs |
| Haptics | ~50 | UIFeedbackGenerator |
| LexisNexis/TMX | ~80 | Fraud SDK |
| Social logins | ~50 | OAuth |
| Maps integration | ~80 | MapKit |
| Popup bridge | ~30 | Braintree |
| Toast/banner UI | ~80 | UI |
| Precise location UI | ~50 | Permissions |
| Video fullscreen | ~30 | Media |

### MainViewController (1,160 lines) ✅ RENAMED
*Formerly SliderRootViewController - renamed 2026-01-12*

| Responsibility | Lines (est.) | Coupling |
|----------------|--------------|----------|
| Child controller management | ~100 | WebViewController |
| SliderGames integration | ~400 | SliderGames SDK |
| Orientation handling | ~100 | UIDevice |
| Quick game popup | ~150 | UI |
| Wallet/balance updates | ~80 | WalletService |
| KYC status checks | ~50 | KYCManager |
| Deep link handling | ~80 | DeepLinkCoordinator |
| Login/logout observers | ~50 | NotificationCenter |
| Alert views | ~80 | UI |
| Localization | ~30 | Strings |

---

## Target Architecture

### Already Completed ✅
These components were extracted during the audit:

| Component | Location | Purpose |
|-----------|----------|---------|
| `EventRouter` | `Bridge/EventRouter.swift` | Routes JS events to registered handlers |
| `WebMessageHandler` | `Bridge/WebMessageHandler.swift` | Parses WKScriptMessage → CCBModel |
| `BridgeEvent` | `Bridge/BridgeEvent.swift` | Type-safe event definitions |
| `SplashController` | `Bridge/SplashController.swift` | Splash screen timeout logic |
| `URLPolicyDecider` | `Navigation/URLPolicyDecider.swift` | URL policy decisions (sensitive pages, external URLs) |
| **MainViewController** | `WebView/MainViewController.swift` | Renamed from SliderRootViewController |

### Phase 1: Extract Navigation & URL Handling (3-4 days)

**New Components:**

```
Wrapper/Navigation/
├── WebNavigationHandler.swift      # WKNavigationDelegate implementation
├── URLPolicyDecider.swift          # decidePolicyFor logic (sensitive pages, external URLs) ✅ DONE
├── SafariPresenter.swift           # SFSafariViewController management
└── AddressBarController.swift      # Header/address bar visibility
```

**WebNavigationHandler** (~200 lines)
- Extracts all `WKNavigationDelegate` methods
- Delegates policy decisions to `URLPolicyDecider`
- Emits navigation events for logging

**URLPolicyDecider** (~150 lines)
- `shouldOpenInSafari(url:)` - external URL detection
- `isSensitivePage(url:)` - login, deposit, withdrawal pages
- `isSliderSensitivePage(url:)` - slider game restrictions
- `shouldShowAddressBar(url:)` - header visibility rules

**SafariPresenter** (~80 lines)
- Present/dismiss `SFSafariViewController`
- Handle cashier callbacks
- Manage external casino URLs

**Impact:** WebViewController drops ~350 lines

---

### Phase 2: Extract Analytics & Logging (2-3 days)

**New Components:**

```
Wrapper/Analytics/
├── AnalyticsBridge.swift           # Unified analytics interface
├── AppsFlyerBridge.swift           # AppsFlyer-specific logic
├── DataDogBridge.swift             # DataDog initialization & logging
└── KibanaLogger.swift              # Error logging to Kibana
```

**AnalyticsBridge** (protocol + coordinator)
```swift
protocol AnalyticsBridge {
    func trackEvent(_ event: AnalyticsEvent)
    func setUserProperties(_ properties: [String: Any])
}
```

**Impact:** WebViewController drops ~180 lines

---

### Phase 3: Extract App Lifecycle (2 days)

**New Components:**

```
Wrapper/Lifecycle/
├── AppLifecycleObserver.swift      # Foreground/background handling
├── MemoryWarningHandler.swift      # didReceiveMemoryWarning logic
└── ScreenshotObserver.swift        # Screenshot detection
```

**AppLifecycleObserver**
- Consolidates `applicationDidEnterBackground`, `applicationWillEnterForeground`
- Manages WebView pause/resume
- Handles settings bundle changes

**Impact:** WebViewController drops ~150 lines

---

### Phase 4: Extract SDK Integrations (2-3 days)

**New Components:**

```
Wrapper/SDKs/
├── LexisNexisManager.swift         # TMXProfiling setup
├── HapticsManager.swift            # UIFeedbackGenerator
├── MapsLauncher.swift              # Apple Maps / Google Maps
└── PopupBridgeHandler.swift        # Braintree PopupBridge
```

**Impact:** WebViewController drops ~240 lines

---

### Phase 5: Refactor MainViewController (4-5 days)

**Rename:** `SliderRootViewController` → `MainViewController` ✅ DONE (2026-01-12)

**New Components:**

```
Wrapper/Main/
├── MainViewController.swift        # Minimal container (~200 lines) ✅ RENAMED
├── MainCoordinator.swift           # Child controller orchestration
└── SliderGamesCoordinator.swift    # All SliderGames logic
```

**SliderGamesCoordinator** (~400 lines)
- Extracted from MainViewController
- Manages SliderGames SDK lifecycle
- Handles wallet updates, KYC checks
- Manages quick game popup

**MainCoordinator** (~150 lines)
- Decides which child controllers to load
- Handles orientation changes
- Manages deep link routing to children

**MainViewController** (~200 lines)
- Container view controller
- Delegates to MainCoordinator
- Minimal UI code

**Impact:** MainViewController drops from 1,160 to ~200 lines

---

### Phase 6: WebViewController Final Cleanup (2-3 days)

After phases 1-5, WebViewController should be ~800 lines. Final extraction:

**New Components:**

```
Wrapper/WebView/
├── WebViewFactory.swift            # WKWebView configuration
├── JSInjector.swift                # JavaScript injection
├── WebViewStateManager.swift       # Loading states, error states
└── ToastPresenter.swift            # Toast/banner UI
```

**Target:** WebViewController at ~400-500 lines, focused only on:
- Holding the WKWebView instance
- Coordinating between extracted components
- IBOutlet connections

---

## Implementation Order

| Phase | Component | Days | Risk | Dependencies |
|-------|-----------|------|------|--------------|
| 1 | Navigation & URL Handling | 3-4 | Medium | None |
| 2 | Analytics & Logging | 2-3 | Low | None |
| 3 | App Lifecycle | 2 | Low | None |
| 4 | SDK Integrations | 2-3 | Low | None |
| 5 | SliderRootViewController | 4-5 | High | Phase 1 |
| 6 | WebViewController Cleanup | 2-3 | Medium | Phases 1-4 |

**Total:** 15-20 days

---

## Testing Strategy

Each extracted component gets unit tests:

```
WrapperTests/
├── Navigation/
│   ├── URLPolicyDeciderTests.swift
│   └── WebNavigationHandlerTests.swift
├── Analytics/
│   └── AnalyticsBridgeTests.swift
├── Lifecycle/
│   └── AppLifecycleObserverTests.swift
└── Root/
    └── RootCoordinatorTests.swift
```

**Test coverage targets:**
- URLPolicyDecider: 90%+ (critical for security)
- EventRouter: Already at 95%
- New coordinators: 80%+

---

## Success Metrics

| Metric | Before | After | Current |
|--------|--------|-------|---------|
| WebViewController lines | 1,928 | ~400 | 1,928 |
| MainViewController lines | 1,160 | ~200 | 1,160 (renamed ✅) |
| Files > 500 lines | 15 | 5 | 15 |
| Unit test coverage (new code) | 0% | 80%+ | ~50% |
| Cyclomatic complexity (avg) | High | Medium | High |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking existing functionality | Incremental extraction with tests |
| SliderGames SDK coupling | Extract behind protocol |
| NotificationCenter dependencies | Migrate to EventRouter pattern |
| Merge conflicts during refactor | Small, focused PRs |

---

## Conjure Recommendations Addressed

| Conjure Recommendation | Status |
|------------------------|--------|
| "Rename Root view Controller" | ✅ Done (MainViewController) |
| "Extract slider logic into its own module" | Phase 5 (SliderGamesCoordinator) |
| "Introduce MVVM or coordinator structure" | Phases 5-6 (Coordinators) |
| "Refactor into WebMessageHandler" | ✅ Already done |
| "Refactor into JSInjector" | Phase 6 |
| "Refactor into WebEventRouter" | ✅ Already done (EventRouter) |
| "Refactor into WebCommandDispatcher" | Phase 6 (part of EventRouter) |
| "Refactor into NavigationDelegateHandler" | Phase 1 |
| "Refactor into ErrorHandler" | Phase 2 (KibanaLogger) |
| "Refactor into AnalyticsBridge" | Phase 2 |

---

## Quick Wins (Can Start Immediately)

1. **Extract `URLPolicyDecider`** - Pure logic, no UI, easy to test
2. **Extract `KibanaLogger`** - Already isolated, just needs extraction
3. **Extract `HapticsManager`** - Self-contained, 50 lines

These can be done in parallel with other work.

---

*Created: January 12, 2026*
*Based on: Conjure Phase 01 Technical Audit Report*
