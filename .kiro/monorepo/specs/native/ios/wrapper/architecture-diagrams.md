# iOS Architecture: Before & After

## Before (Current State)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MainViewController                                  │
│                  (1,160 lines - renamed from SliderRootViewController)       │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ • App launch logic                                                      │ │
│  │ • Child controller management                                           │ │
│  │ • SliderGames SDK integration                                           │ │
│  │ • Orientation handling                                                  │ │
│  │ • Quick game popup UI                                                   │ │
│  │ • Wallet/balance updates                                                │ │
│  │ • KYC status checks                                                     │ │
│  │ • Deep link handling                                                    │ │
│  │ • Login/logout observers                                                │ │
│  │ • Alert views                                                           │ │
│  │ • Localization                                                          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                      WebViewController                                  │ │
│  │                         (1,928 lines)                                   │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │  │ • WKWebView setup & configuration                                │  │ │
│  │  │ • WKNavigationDelegate (URL policy, sensitive pages)             │  │ │
│  │  │ • WKUIDelegate (popups, alerts)                                  │  │ │
│  │  │ • WKScriptMessageHandler (JS→Native)                             │  │ │
│  │  │ • JS injection                                                   │  │ │
│  │  │ • Event routing (NotificationCenter)                             │  │ │
│  │  │ • Loading/splash screen                                          │  │ │
│  │  │ • App lifecycle (foreground/background)                          │  │ │
│  │  │ • Analytics (AppsFlyer, DataDog)                                 │  │ │
│  │  │ • Error handling & Kibana logging                                │  │ │
│  │  │ • Safari view controller                                         │  │ │
│  │  │ • Haptics                                                        │  │ │
│  │  │ • LexisNexis/TMX fraud SDK                                       │  │ │
│  │  │ • Social logins                                                  │  │ │
│  │  │ • Maps integration                                               │  │ │
│  │  │ • Popup bridge (Braintree)                                       │  │ │
│  │  │ • Toast/banner UI                                                │  │ │
│  │  │ • Precise location UI                                            │  │ │
│  │  │ • Video fullscreen                                               │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘

Problems:
• 3,088 lines in 2 files
• Single Responsibility Principle violated
• Untestable (UIKit dependencies everywhere)
• Any change risks breaking unrelated features
• New developers overwhelmed
```

---

## After (Target State)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          RootViewController                                  │
│                            (~200 lines)                                      │
│                    Container + delegates to coordinator                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RootCoordinator                                    │
│                            (~150 lines)                                      │
│              Child controller orchestration, orientation                     │
└─────────────────────────────────────────────────────────────────────────────┘
                          │                    │
            ┌─────────────┘                    └─────────────┐
            ▼                                                ▼
┌───────────────────────────┐                  ┌───────────────────────────┐
│  SliderGamesCoordinator   │                  │    WebViewController      │
│       (~400 lines)        │                  │       (~400 lines)        │
│  • SliderGames SDK        │                  │  • Holds WKWebView        │
│  • Wallet updates         │                  │  • Coordinates components │
│  • KYC checks             │                  │  • IBOutlet connections   │
│  • Quick game popup       │                  └───────────────────────────┘
└───────────────────────────┘                              │
                                          ┌────────────────┼────────────────┐
                                          │                │                │
                                          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Pure Logic Layer                                │
│                           (Testable, No UIKit)                               │
├─────────────────────┬─────────────────────┬─────────────────────────────────┤
│  URLPolicyDecider   │    EventRouter      │      WebMessageHandler          │
│   (✅ 22 tests)     │    (✅ 95% cov)     │        (✅ tested)              │
│  • Sensitive pages  │  • Event routing    │  • WKScriptMessage parsing      │
│  • Safari redirect  │  • Handler registry │  • CCBModel creation            │
│  • Apple Pay detect │  • Async dispatch   │                                 │
├─────────────────────┼─────────────────────┼─────────────────────────────────┤
│  AnalyticsBridge    │   KibanaLogger      │       JSInjector                │
│  • AppsFlyer        │  • Error logging    │  • JS injection                 │
│  • DataDog          │  • Diagnostics      │  • Bridge setup                 │
├─────────────────────┼─────────────────────┼─────────────────────────────────┤
│  HapticsManager     │   MapsLauncher      │     LexisNexisManager           │
│  • UIFeedbackGen    │  • Apple/Google     │  • TMXProfiling                 │
└─────────────────────┴─────────────────────┴─────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              UI Components                                   │
│                         (Thin, Presentation Only)                            │
├─────────────────────┬─────────────────────┬─────────────────────────────────┤
│   SafariPresenter   │   ToastPresenter    │     SplashController            │
│  • Present/dismiss  │  • Show/hide toast  │     (✅ exists)                 │
│  • Cashier callback │  • Banner UI        │  • Timeout logic                │
├─────────────────────┼─────────────────────┼─────────────────────────────────┤
│ WebNavigationHandler│  AddressBarCtrl     │    WebViewFactory               │
│  • WKNavDelegate    │  • Header visibility│  • WKWebView config             │
└─────────────────────┴─────────────────────┴─────────────────────────────────┘

Benefits:
• ~1,150 lines in view controllers (down from 3,088)
• Single Responsibility per component
• Pure logic is unit testable
• Changes isolated to relevant component
• New developers can understand one piece at a time
• Components reusable across features
```

---

## Data Flow: JS → Native Event

### Before
```
WKWebView
    │
    ▼ WKScriptMessage
WebViewController.userContentController(_:didReceive:)
    │
    ├─► Parse JSON to CCBModel (inline)
    │
    ├─► Post NotificationCenter notification
    │
    └─► 15+ observers receive notification
            │
            ├─► Each re-parses CCBModel
            ├─► Each switches on eventName
            └─► Scattered handling across codebase
```

### After
```
WKWebView
    │
    ▼ WKScriptMessage
WebMessageHandler.parse(_:)           ◄── Testable
    │
    ▼ CCBModel
EventRouter.route(_:)                 ◄── Testable, 95% coverage
    │
    ▼ Typed event + parameters
Registered Handler                    ◄── Single point of handling
    │
    ├─► URLPolicyDecider (if URL event)
    ├─► AnalyticsBridge (if tracking event)
    ├─► SliderGamesCoordinator (if game event)
    └─► etc.
```

---

## Test Coverage: Before vs After

| Component | Before | After |
|-----------|--------|-------|
| URL policy logic | 0% | 95%+ (URLPolicyDecider) |
| Event routing | 0% | 95% (EventRouter) |
| Message parsing | 0% | 80%+ (WebMessageHandler) |
| Analytics | 0% | 70%+ (AnalyticsBridge) |
| SliderGames integration | 0% | 80%+ (SliderGamesCoordinator) |
| **Total testable lines** | **~200** | **~2,000** |

---

## File Size Comparison

| File | Before | After |
|------|--------|-------|
| MainViewController | 1,160 | ~200 |
| WebViewController | 1,928 | ~400 |
| **New components** | 0 | ~1,500 (spread across 15+ files) |
| **Total lines** | 3,088 | ~2,100 |
| **Testable lines** | ~200 | ~1,500 |

---

## Migration Path

```
Phase 0 (Done)
    │
    ▼
┌─────────────────────────────────────────┐
│ EventRouter, WebMessageHandler,         │
│ BridgeEvent, SplashController           │
│ URLPolicyDecider (22 tests)             │
│ MainViewController (renamed)            │
└─────────────────────────────────────────┘
    │
    ▼ Phase 1: Wire URLPolicyDecider into WebViewController
    │
    ▼ Phase 2: Extract Analytics
    │
    ▼ Phase 3: Extract Lifecycle
    │
    ▼ Phase 4: Extract SDKs
    │
    ▼ Phase 5: Extract SliderGamesCoordinator from MainViewController
    │
    ▼ Phase 6: Final WebViewController cleanup
    │
    ▼
┌─────────────────────────────────────────┐
│ Clean, testable, maintainable           │
│ architecture                            │
└─────────────────────────────────────────┘
```

---

*Created: January 12, 2026*
*Updated: January 12, 2026 - MainViewController rename completed*
