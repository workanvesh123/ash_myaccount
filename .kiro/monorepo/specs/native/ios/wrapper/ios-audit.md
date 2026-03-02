# iOS Technical Audit & Remediation

Technical specification for iOS wrapper remediation following the Phase 01 Technical Audit (Conjure, Dec 2025).

**Related Documents:**
- [Executive Report](ios-audit-executive-report.md) - Business-friendly summary
- [Developer Experience](developer-experience.md) - Daily workflow quick reference

---

## Table of Contents

1. [Completed Work](#1-completed-work)
2. [Remaining Work](#2-remaining-work)
3. [Target Consolidation](#3-target-consolidation)
4. [Technical Reference](#4-technical-reference)
5. [Appendix](#5-appendix)

---

## 1. Completed Work

### 1.1 Bridge Architecture (EventRouter) ✅

**Problem:** All JS→Native messages processed on main thread by 13 observers, each re-parsing every message. Caused UI freezes during login, geo checks, betting.

**Solution:** `EventRouter` singleton with:
- Serial background queue (`com.app.wrapper.processing`) - FIFO ordering
- Direct handler registration - components register for specific events only
- Allowlist filtering - unknown events dropped before parsing
- Main thread returns in <1ms

**Architecture:**
```
WKWebView → WebMessageHandler → EventRouter (background) → Handlers (main for UI)
                                     ↓
                              Legacy fallback (onLegacyEvent)
```

**Key Files:**
- `Wrapper/Bridge/EventRouter.swift` - Message routing
- `Wrapper/Bridge/BridgeEvent.swift` - Event enum and helpers
- `Wrapper/Bridge/SplashController.swift` - FCP handling, 4s timeout

**Migrated Handlers (12):**
| Handler | Events |
|---------|--------|
| LoginManager | LOGIN, LOGOUT, PRE_LOGIN, POST_LOGIN, LOGIN_FAILED, etc. |
| AccountSettingsManager | GET/SET/UPDATE_APPLICATION_SETTINGS |
| UserDataModel | User data, balance events |
| GeoComplyManager | TRIGGER_GEO_LOCATION, GEO_LOCATION_POSITION |
| LocationPoll | CCB_INITIALIZED, FEATURE_LOADED (geolocation) |
| DeviceLocationManager | Location |
| KYCManager | ONFIDO, IDNOW, AUTHADA |
| SensitivePageManager | SensitivePage |
| FeedbackManager | BetPlaced |
| CCBUtility | CCB_INITIALIZED |
| MainViewController | Slider game events |
| WebViewController | PRODUCT_CHANGED |

**Special Handling:**
- `FIRST_CONTENTFUL_PAINT` → Handled directly in EventRouter, triggers splash removal
- `FEATURE_LOADED` (geolocation) → Safety net in fallback force-inits LocationPoll if not ready

**Fallback behavior:**
- Registered events → EventRouter handlers (fast path)
- `FIRST_CONTENTFUL_PAINT` → Direct handling, no fallback
- `FEATURE_LOADED` (geolocation) → Force-inits LocationPoll, re-routes event
- Other unregistered events → Warning log + processed via `onLegacyEvent`
- Events not in allowlist → Silently dropped (unknown events)

---

### 1.2 Instant State Switcher ✅ ⭐ MAJOR UX WIN

**Problem:** State switcher toast ("Switch to New York?") took **4-5 minutes** to appear when user crossed state lines. Users crossing the George Washington Bridge would be in Manhattan before the app noticed they left New Jersey.

**Root Cause:** Native location polling was disabled (`pollingFrequency=0`), so the app relied on web's browser geolocation API which only polled every ~5 minutes.

**Solution:** `DeviceLocationManager` now monitors location continuously using **native iOS `CLLocationManager`** and forwards changes to web immediately.

**Key Points:**
- Uses **native iOS APIs only** - standard `CLLocationManager`
- **Does NOT use GeoComply** - no regulatory SDK involved
- **Zero battery impact** - uses cell/WiFi positioning (`kCLLocationAccuracyKilometer`), GPS chip stays off
- Works at any point in app lifecycle: launch, mid-session, or returning from background

```swift
// After initial state detection:
significantLocationManager.desiredAccuracy = kCLLocationAccuracyKilometer  // No GPS
significantLocationManager.distanceFilter = 1000  // 1km threshold
significantLocationManager.startUpdatingLocation()

// On location change → send to web immediately
func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    sendLocationToWeb(location)  // GEO_LOCATION_POSITION event
}
```

**Tested Scenarios:**
- App launch in new state → instant detection ✓
- Mid-session location change → instant detection ✓
- Background app, move states, foreground → detected on foreground ✓

**Result:** Toast appears in **<500ms** vs 4-5 minutes.

**File:** `Wrapper/GeoComplyManager/DeviceLocationManager.swift`

---

### 1.3 Thread Safety Crash Fix ✅

**Problem:** `EXC_BAD_ACCESS` / `SIGSEGV` crash in `sendAntiBlockEvasionKibanaLogs` when user is on VPN and receives a 403 response. Crash address `0x65757274` = ASCII "true" - a string value being dereferenced as a pointer.

**Root Cause:** `NetworkManager.getPublicIPAddress()` callback runs on URLSession's background delegate queue. The callback accessed non-thread-safe APIs (`ReachabilityHelper.getNetworkProvider()`) without dispatching to main thread.

**Solution:** Wrap callback body in `DispatchQueue.main.async`:
```swift
// Before (crashes)
NetworkManager.getPublicIPAddress { ipAddr in
    if let ipAddr = ipAddr {
        let obj = IPAddressLogs(networkType: ReachabilityHelper.getNetworkProvider(), ...)  // ❌ Background thread
    }
}

// After (safe)
NetworkManager.getPublicIPAddress { ipAddr in
    DispatchQueue.main.async {
        guard let ipAddr = ipAddr else { return }
        let obj = IPAddressLogs(networkType: ReachabilityHelper.getNetworkProvider(), ...)  // ✅ Main thread
    }
}
```

**File:** `Wrapper/Classes/Helper/AppSessionManager.swift`

**Note:** This bug existed on `main` branch - not introduced by audit work.

---

### 1.4 Performance Optimizations ✅

| Optimization | File | Impact |
|--------------|------|--------|
| Remove `UserDefaults.synchronize()` | 5 files, 7 calls | Reduced disk I/O |
| `delaysContentTouches = false` | WebView.swift | ~150ms faster taps |
| ProcessPool pre-warming | AppDelegate.swift | Faster first WebView |
| Deferred manager init | WebViewController.swift | Faster first frame |
| Splash timeout 30s → 4s | SplashController.swift | No more black screen |

---

### 1.5 Swift Concurrency Modernization ✅

Replaced `DispatchQueue.main.async` with `await MainActor.run` in async contexts:

| File | Method |
|------|--------|
| MainViewController | `callWalletAPI()` |
| AppSessionManager | `startBatchRequest()` (2 sites) |
| AppSessionManager | `requestAntiBlockEvasionUrls()` |
| FeedbackManager | `sendMailFeedback()` |

---

### 1.6 Memory Leak Fixes ✅

Fixed 6 strong delegate references:

| File | Property |
|------|----------|
| LocationPoll.swift | `deviceLocationDelegate`, `optimoveLocationDelegate` |
| DocumentUploadViewController.swift | `documentUploadDelegate` |
| ComboBoxPopoverViewController.swift | `documentTypeDelegate` |
| PreciseLocationViewController.swift | `delegate` |
| PreciseLocationViewPopup.swift | `delegate` |
| CustomLocationTableViewCell.swift | `delegate` |

---

### 1.7 Debug Logging Infrastructure ✅

Centralized `DebugLogger` with 12 categories:

| Category | Emoji | Purpose |
|----------|-------|---------|
| launch | 🚀 | App startup profiling |
| timing | 🌉 | Bridge event timing |
| router | 📡 | Event routing |
| webview | 🌐 | Page load lifecycle |
| lifecycle | 📱 | App state |
| network | 📶 | Connectivity |
| auth | 🔐 | Login/logout |
| biometric | 🔓 | TouchID/FaceID |
| geo | 📍 | GeoComply |
| config | ⚙️ | Batch config |
| push | 🔔 | Push notifications |
| nav | 🔗 | Deep links |

**Subsystem:** `com.app.wrapper`

**Stream logs:**
```bash
xcrun simctl spawn booted log stream --level debug --predicate 'subsystem == "com.app.wrapper"'
```

---

### 1.8 Launch Profiler ✅

`LaunchProfiler` tracks checkpoints from pre-main to FCP:

```
🚀 [Launch] ════════════════════════════════════════
🚀 [Launch]      62ms (+   62ms) didFinishLaunching START
🚀 [Launch]     143ms (+   55ms) Firebase configured
🚀 [Launch]     223ms (+    4ms) WebView load started
🚀 [Launch]     308ms (+   84ms) Deferred init COMPLETE
🚀 [Launch]    1838ms (+1530ms) FIRST_CONTENTFUL_PAINT
🚀 [Launch] ════════════════════════════════════════
🚀 [Launch] Total: 1838ms
```

**Key insight:** Native = 308ms (17%), Web = 1530ms (83%)

---

### 1.9 Unit Tests ✅

**Total: 792 tests** covering bridge infrastructure and pure logic modules:

| Suite | Tests | Coverage |
|-------|-------|----------|
| **Bridge Infrastructure** | | |
| EventRouterTests | 41 | Registration, routing, threading |
| BridgeEventTests | 22 | Event parsing |
| WebMessageHandlerTests | 11 | Message handling |
| DebugLoggerTests | 15 | Log categories |
| LaunchProfilerTests | 5 | Checkpoints |
| CCBModelTests | 16 | Legacy model |
| DeepLinkTests | 14 | URL parsing |
| ConstantsTests | 30 | String/enum consistency |
| **Pure Logic Configs** | | |
| FeatureFlagConfigTests | 25 | Feature flag logic |
| NetworkReachabilityConfigTests | 22 | Network state logic |
| SessionTimeoutConfigTests | 25 | Timeout calculations |
| AppLifecycleStateTests | 18 | State machine |
| BiometricConfigTests | 28 | Biometric availability |
| DeepLinkURLParserTests | 35 | URL parsing |
| MapsURLBuilderTests | 22 | Maps URL construction |
| HapticsConfigTests | 15 | Haptic feedback logic |
| URLPolicyDeciderTests | 22 | URL policy decisions |
| CachePolicyConfigTests | 22 | Cache policy logic |
| PushNotificationConfigTests | 25 | Push notification logic |
| AppVersionConfigTests | 33 | Version comparison |
| MaintenanceConfigTests | 33 | Maintenance mode |
| LocaleConfigTests | 25 | Locale handling |
| DateConfigTests | 28 | Date formatting |
| GeoConfigTests | 32 | Geolocation logic |
| ValidationConfigTests | 40 | Input validation |
| URLBuilderConfigTests | 31 | URL construction |
| RetryConfigTests | 30 | Retry/backoff strategies |
| LegacyClassMappingTests | 8 | NSCoding migration |
| Other | ~42 | Integration, performance |

**Run tests:**
```bash
cd native/ios/wrapper
make run-tests
# Or: xcodebuild test -workspace Wrapper.xcworkspace -scheme Wrapper \
#   -destination "platform=iOS Simulator,name=iPhone 17"
```

---

### 1.10 Click Synthesis Fix ✅

**Problem:** WebKit fails to fire click events in horizontally scrollable areas when `touchstart` and `touchend` fire on different elements (finger moves slightly during tap). Users experience "sticky buttons" requiring double-taps.

**Solution:** JavaScript click synthesis with robust scroll detection:

1. Inject `touch-action: manipulation` CSS (disables double-tap-to-zoom delay)
2. Track `touchstart` position and time
3. Monitor `touchmove` for scroll intent (>10px movement)
4. On `touchend`, determine if gesture was tap or scroll:
   - **Scroll detected if:** touchmove exceeded threshold OR final distance >30px OR duration >300ms with >10px movement
5. If tap detected and no natural click within 100ms, synthesize one

**Scroll Detection (3 layers):**
| Signal | Threshold | Purpose |
|--------|-----------|---------|
| `touchmove` tracking | >10px | Early scroll detection during gesture |
| Final distance | >30px | Catches fast flicks |
| Duration + movement | >300ms AND >10px | Catches slow drags |

**Performance:**
- DEBUG logging compiled out in release builds (no bridge overhead)
- `touchmove` handler bails immediately once scroll detected
- Uses squared distance comparison (no `Math.sqrt` in hot path)
- All event listeners are `passive: true` (don't block scrolling)

**Log output (DEBUG only):**
```
👆 [Tap] touchstart → BUTTON.bet-card
👆 [Tap] touchend → BUTTON.bet-card | ✓ TAP (dist:2px dur:85ms)
✅ [Tap] click → BUTTON.bet-card | natural click (browser handled)

👆 [Tap] touchstart → DIV.carousel
👆 [Tap] touchend → DIV.carousel | 📜 SCROLL (dist:320px dur:180ms moved)
🚫 [Tap] blocked → DIV.carousel | scroll detected
```

**File:** `Wrapper/Classes/Views/WebView/WebView.swift`

---

### 1.11 Build Configuration Cleanup ✅

Removed deprecated flags:
- `SWIFT_SWIFT3_OBJC_INFERENCE` (Swift 3 migration)
- `ENABLE_BITCODE` (removed in Xcode 14)
- Updated `CLANG_CXX_LANGUAGE_STANDARD` to `gnu++20`

Disabled LTO for Debug builds (faster iteration).

---

### 1.12 Build Time Analysis & Script Phase Caching ✅

**Clean build profile (iPhone 17 Simulator, Debug):**

| Phase | Tasks | Time | % |
|-------|-------|------|---|
| SwiftCompile | 464 | 270s | 55% |
| CompileC | 810 | 83s | 17% |
| ScanDependencies | 797 | 32s | 7% |
| SwiftDriver | 35 | 26s | 5% |
| CompileXIB | 69 | 24s | 5% |
| Other | - | ~55s | 11% |
| **Total** | **153 targets** | **~490s** | **100%** |

**Script phase caching implemented:**

Previously, 8 script phases ran on every build due to missing `inputPaths`/`outputPaths`. Now optimized:

| Script Phase | Input | Output | Result |
|--------------|-------|--------|--------|
| Twine (aggregate) | `strings.txt` | marker file | ✅ Cached |
| Twine (Wrapper) | `strings.txt` | `Localizable.strings` | ✅ Cached |
| Copy Config | `Debug_Label.json` | `Label_Current.xcconfig` | ✅ Cached |
| Update Uri From Dynacon | `Debug_Label.json` | marker file | ✅ Cached |
| Copy GoogleInfo Plist | `Debug_Label.json` | marker file | ✅ Cached |
| Copy Resources | `Debug_Label.json` | marker file | ✅ Cached |
| Strip Frameworks | — | marker file | ✅ Cached (skips in Debug) |
| FirebaseCrashlytics | — | marker file | ✅ Cached (skips in Debug) |

**Incremental build behavior:**
- Scripts only re-run when their inputs change (e.g., `Debug_Label.json` modified by label switch)
- Strip Frameworks and FirebaseCrashlytics skip in Debug builds (touch marker file and exit)
- All 8 scripts are now cached - no warnings about missing outputs

**Savings:** ~10-15s per incremental build.

**Additional optimization - `-skipPackagePluginValidation`:**

Adding this flag to `xcodebuild` saves another ~10s by skipping SPM plugin re-validation:

```bash
xcodebuild ... -skipPackagePluginValidation
```

Safe for this project since no SPM packages use build tool plugins (Alamofire, Firebase, Lottie, etc. are all runtime libraries). Only remove if adding an SPM package with a build plugin.

**Incremental build times (same label, no changes):**
- Without optimizations: ~30s
- With all optimizations (`make build`): **~6s**

---

### 1.13 NSKeyedArchiver Class Migration ✅

**Problem:** After target consolidation (12 targets → 1 `Wrapper`), users upgrading from old app versions cannot unarchive their persisted data. `NSKeyedArchiver` stores the fully-qualified class name including module (e.g., `Sports.FeedbackData`), but after the rename, the class is `Wrapper.FeedbackData`.

**Solution:** Register class name mappings for all historical target names at app launch, before any UserDefaults reads.

**Historical Targets (19):**
```
Sports, Casino, Bingo,
Sports_GeoComply, Casino_GeoComply, BingoUnified_GeoComply,
BetMGMSports_GeoComply, BetMGMCasino_GeoComply,
Sports_German, Casino_German,
Bingo_Without_Slider, Sports_Without_Slider,
CasinoWrapper, playMGMCasino, playMGMSports,
BorgataCasino, BorgataSports, PartyCasino_NJ, PartySports_NJ
```

**NSCoding Classes Migrated (7):**
- `FeedbackData` - App rating/feedback state
- `PosApiBaseUrlsList` - API endpoint cache
- `PosAppConfigurationTracker` - Dynacon configuration
- `SiteCoreItem` - CMS content cache
- `CurrentEnvironment` - Environment settings
- `LocationSpoofModel` - Debug location override
- `IndigoRegistered` - PlayMetrics registration

**Implementation:**
```swift
// Called at start of didFinishLaunchingWithOptions, before any UserDefaults reads
func registerLegacyClassMappings() {
    let legacyTargets = ["Sports", "Casino", "Bingo", ...]
    let nscodingClasses: [AnyClass] = [FeedbackData.self, ...]
    
    for legacyTarget in legacyTargets {
        for cls in nscodingClasses {
            let className = String(describing: cls)
            NSKeyedUnarchiver.setClass(cls, forClassName: "\(legacyTarget).\(className)")
        }
    }
}
```

**Key Files:**
- `Wrapper/Classes/Utils/LegacyClassMigration.swift` - Migration function
- `Wrapper/Classes/AppDelegate/AppDelegate.swift` - Calls migration at launch
- `WrapperTests/LegacyClassMappingTests.swift` - Unit tests (8 tests)

**Test Coverage:**
| Test | Purpose |
|------|---------|
| `test_registerLegacyClassMappings_registersAllCombinations` | Verifies all 133 mappings (19 targets × 7 classes) |
| `test_registerLegacyClassMappings_canBeCalledMultipleTimes` | Idempotency check |
| `test_unarchive_feedbackDataFromLegacySportsTarget` | End-to-end unarchive test |
| `test_unarchive_locationSpoofModelFromLegacyCasinoTarget` | End-to-end unarchive test |
| `test_unarchive_indigoRegisteredFromLegacyGeoComplyTarget` | End-to-end unarchive test |
| `test_allNSCodingClassesHaveMappings` | Coverage verification |

**Business Impact:**
- Users upgrading from any historical app version retain their data
- No data loss during target consolidation rollout
- Prevents crash on first launch after upgrade

---

### 1.14 AppDelegate window Property Fix ✅

**Problem:** After merging SceneDelegate migration from `develop/native-ios`, app launches but shows blank white screen - WebView never loads. Affects ~39 labels that don't have `UIApplicationSceneManifest` in their Info.plist.

**Root Cause:** The SceneDelegate migration (commit `caa3bb7b213`) removed `var window: UIWindow?` from AppDelegate, assuming all labels would use SceneDelegate. However, labels using `UIMainStoryboardFile` without `UIApplicationSceneManifest` require the `window` property for UIKit to set up the view hierarchy.

**Symptom:** System log shows:
```
The app delegate must implement the window property if it wants to use a main storyboard file.
```

**Solution:** Restore `var window: UIWindow?` in AppDelegate:
```swift
class AppDelegate: UIResponder {
    /// Required for labels using UIMainStoryboardFile (without SceneDelegate)
    var window: UIWindow?
    // ...
}
```

**Labels Affected (~39):**
- BetMGM Sports/Casino NJ (`com.playmgmsports.nj`, `com.playmgmcasino.nj`)
- Borgata (`com.borgata.sports`, `com.borgatacasino.casino`)
- Ontario labels (`on.betmgm.*`, `on.bwin.*`, `on.party.*`)
- German labels (`de.bwin.*`, `de.premium.*`)
- And others without `UIApplicationSceneManifest`

**Prevention:**
1. Never remove `var window: UIWindow?` from AppDelegate
2. When merging from `develop/native-ios`, check if changes assume SceneDelegate-only
3. Test with a label that does NOT have `UIApplicationSceneManifest` (e.g., `playmgmsports_nj_dev`)

**Key File:** `Wrapper/Classes/AppDelegate/AppDelegate.swift`

---

## 2. Remaining Work

### 2.1 Critical (Security)

**Note:** Player credentials are NOT at risk - login happens in WebView over HTTPS directly to web backend. The risks below relate to service keys and app integrity.

| Item | Business Outcome | Size | Risk if Not Done |
|------|------------------|------|------------------|
| **Hardcoded secrets** | Prevent service abuse, pass security audits | 3d | **High** - Third-party API keys (Datadog, Kinesis, AppFlyer) extractable; could be abused to pollute analytics or inflate costs |
| **Secret rotation** | Invalidate any potentially leaked keys | 2d | **Medium** - Exposed service keys remain usable until rotated |
| **RSA private key removal** | Prevent decryption of sensitive payloads | 2d | **High** - Hardcoded private key could decrypt data meant to be secure |
| **Client ID/secret to CI** | Prevent backend API impersonation | 1d | **Medium** - Someone could make API calls pretending to be the app |
| **Keychain migration** | Secure push token storage per Apple guidelines | 2d | **Low** - FCM token in UserDefaults; low impact if leaked |
| **SSL pinning** | Prevent man-in-the-middle on app↔backend calls | 3d | **Medium** - Native API calls (batch config, geo) interceptable on compromised networks |
| **Jailbreak detection** | Block compromised devices from betting | 2d | **High** - Fraud, cheating, regulatory requirement (US markets) |
| **WebView domain allowlist** | Prevent navigation to malicious sites | 1d | **Medium** - Phishing via injected content if web is compromised |
| **Payload validation** | Reject spoofed JS→Native messages | 2d | **Low** - Would require compromised web content first |

**Total: ~18 days**

### 2.2 Major (Architecture)

| Item | Business Outcome | Size | Risk if Not Done |
|------|------------------|------|------------------|
| **Dependency updates** | Security patches, new OS compatibility | 5d | **High** - Known CVEs in Datadog 2.x, Onfido 30.x |
| **Migrate to SPM** | Faster builds, simpler dependency management | 5d | **Medium** - CocoaPods maintenance burden, slower CI |
| **Remove unused deps** | Smaller binary, reduced attack surface | 2d | **Low** - SwiftyRSA, Unity frameworks add ~15MB |
| **Remove Objective-C** | Faster compilation, modern tooling support | 5d | **Low** - Tech debt, harder onboarding |
| ~~**Consolidate targets**~~ | ~~Simpler CI, fewer build configurations~~ | ~~8d~~ | ✅ **Done** - 12 → 1 unified `Wrapper` target (Phase 5) |
| **Dependency injection** | Testable code, mockable services | 10d | **Medium** - Singletons prevent unit testing |
| ~~**Remove legacy NotificationCenter**~~ | ~~Cleaner architecture, easier debugging~~ | ~~0.5d~~ | ✅ **Done** - EventRouter is sole handler for incoming messages |
| **Production validation** | Confirm changes work on real devices | 3d | **Critical** - Simulator-only testing misses device-specific issues |
| **Conditional SDK linking** | Enable device builds with per-label SDK selection | 2-3d | ✅ **Complete** |
| **MainViewController refactor** | Maintainable code, faster feature development | 5d | **Medium** - 1140 lines, single responsibility violation (renamed from SliderRootViewController ✅) |
| **WebViewController extraction** | Testable components, clearer ownership | 8d | **Medium** - 1798 lines, handles 10+ responsibilities |
| **MVVM/coordinator pattern** | Separation of concerns, testable logic | 10d | **Low** - Long-term maintainability |

**Total: ~63.5 days** (was 64, minus 0.5 for NotificationCenter removal)

### 2.3 Major (CI/CD & Release)

| Item | Business Outcome | Size | Risk if Not Done |
|------|------------------|------|------------------|
| **Automated quality gates** | Catch issues before merge, consistent code quality | 3d | **Medium** - Bugs reach production, inconsistent style |
| **Commit-tag workflows** | Build only affected labels, save CI resources | 2d | **Low** - All 80+ labels build on every change |
| **Automate TestFlight upload** | Faster releases, no manual IPA handling | 3d | **Medium** - Manual upload = wrong build risk, delays |
| **Automate versioning** | Consistent version numbers, audit trail | 2d | **Medium** - Manual entry = typos, duplicate versions |
| **Build channel segmentation** | Clear dev/QA/release separation | 2d | **Low** - All builds treated the same |
| **Approval gates** | QA sign-off before App Store submission | 1d | **Medium** - Untested builds could reach production |
| **Artifact retention** | Reproduce any historical build | 2d | **High** - Regulatory audits require build traceability |
| **Workflow chaining** | Predictable release pipeline | 2d | **Low** - Manual coordination between stages |

**Total: ~17 days**

### 2.4 Major (Testing)

| Item | Business Outcome | Size | Risk if Not Done |
|------|------------------|------|------------------|
| **UI tests** | Catch regressions in critical flows automatically | 8d | **High** - Manual QA bottleneck, missed regressions |
| **JS–Native bridge tests** | Verify web↔native contract on every change | 5d | **High** - Bridge breaks silently, login/geo failures |
| **Third-party SDK mocks** | Test without real GeoComply/Onfido calls | 5d | **Medium** - Can't unit test SDK integrations |
| **Test strategy document** | Consistent testing approach across team | 2d | **Low** - Ad-hoc testing, knowledge silos |
| **Memory leak detection** | Catch leaks before production | 2d | **Medium** - Crashes on low-memory devices |

**Total: ~22 days**

### 2.5 Major (Documentation)

| Item | Business Outcome | Size | Risk if Not Done |
|------|------------------|------|------------------|
| **Label ↔ Target mapping** | New devs can build any label immediately | 1d | **Medium** - Hours wasted guessing configurations |
| **JS–Native contract spec** | Web team knows what events iOS handles | 3d | **High** - Mismatched events, silent failures |
| **Third-party SDK docs** | Understand GeoComply/Onfido/AppFlyer flows | 3d | **Medium** - Tribal knowledge, single points of failure |
| **Architecture diagrams** | Visual understanding of system | 2d | **Low** - Onboarding friction |
| **Coding style guide** | Consistent code across team | 2d | **Low** - Style inconsistencies, review friction |
| **Onboarding guide** | New dev productive in days not weeks | 2d | **Medium** - 2-3 week onboarding currently |

**Total: ~13 days**

### 2.6 Major (Versioning & Branching)

| Item | Business Outcome | Size | Risk if Not Done |
|------|------------------|------|------------------|
| **Semantic versioning** | Clear indication of breaking changes | 2d | **Medium** - Date-based (25.12.10) conveys no meaning |
| **Unified versioning** | Same version dev→TestFlight→production | 1d | **High** - Can't trace TestFlight build to source |
| **Branch naming standard** | Consistent across monorepo | 1d | **Low** - iOS uses different convention than web |
| **Stale branch cleanup** | Clean repository, no accidental merges | 1d | **Low** - 40+ stale branches add noise |
| **Tag documentation** | Know which commit is in production | 1d | **Medium** - Can't identify production code |

**Total: ~6 days**

### 2.7 Major (Developer Account)

| Item | Business Outcome | Size | Risk if Not Done |
|------|------------------|------|------------------|
| **Device enrollment** | New devs can test on device immediately | 2d | **Medium** - Blocked on device provisioning |
| **ASO automation** | Screenshots generated automatically | 3d | **Low** - Manual screenshot capture per release |
| **ASO lead time process** | Marketing assets ready before release | 1d | **Medium** - Last-minute ASO scramble |

**Total: ~6 days**

### 2.8 Moderate (Quality)

| Item | Business Outcome | Size | Risk if Not Done |
|------|------------------|------|------------------|
| **Analytics unification** | Single source of truth for events | 5d | **Medium** - Firebase/AppsFlyer inconsistencies |
| **Event schema governance** | Approved event dictionary | 2d | **Low** - Event drift, analytics gaps |
| **App lifecycle tracking** | Measure cold start, background transitions | 2d | **Low** - Missing app_open, cold_start_duration |
| **Push notification tracking** | Measure push opt-in, engagement | 1d | **Low** - Missing push_permission_*, push_tapped |
| **Storyboard removal** | Programmatic UI, fewer merge conflicts | 8d | **Low** - Storyboards cause Xcode freezes |
| **Swift 6 compliance** | Future-proof for strict concurrency | 5d | **Low** - @preconcurrency warnings |
| ~~**Script phase caching**~~ | ~~Faster incremental builds~~ | ~~2d~~ | ✅ **Done** - See §1.12 |

**Total: ~23 days**

### 2.9 Major (Bridge Architecture)

Fundamental issues identified in the JS↔Native bridge implementation affecting both iOS and web sides.

| Item | Business Outcome | Size | Risk if Not Done |
|------|------------------|------|------------------|
| ~~**Dual routing systems**~~ | ~~Single code path, predictable behavior~~ | ~~3d~~ | ✅ **Done** - NotificationCenter removed from incoming path; EventRouter is sole handler |
| **No request-response correlation** | Match responses to requests reliably | 2d | **Low** - `id` field generated but unused; mitigated by ReplaySubject(1) pattern |
| **No error responses** | Web knows when native operations fail | 3d | **High** - Silent failures; web waits forever or times out with no error info |
| **String-based event names** | Compile-time validation of event names | 2d | **Low** - Typos cause silent failures; enums exist but not enforced |
| **Main thread JSON on responses** | Smooth UI during high-frequency events | 2d | **Medium** - `messageToWeb` serializes JSON and evaluates JS on main thread |
| **Bridge injection race condition** | No message loss during startup | 1d | **Low** - 5-second timeout abandons queued messages if handler not ready |
| **No backpressure** | Prevent memory growth under load | 2d | **Low** - Neither side signals "slow down"; queues grow unbounded |
| **Event map memory leak (web)** | Stable memory over long sessions | 1d | **Low** - `nativeEventsMap` creates ReplaySubjects never cleaned up |

**Total: ~13 days** (was 16, minus 3 for dual routing)

**Details:**

**Dual routing systems:** ✅ **Resolved.** NotificationCenter removed from incoming JS→Native path. EventRouter is now the sole handler for `messageToNative()`. Response path (`messageToWeb`) still uses NotificationCenter (`MessageToWebNotificationName`) which is appropriate - it's a broadcast to multiple listeners (WebViewController, DeepLinkCoordinator, etc.).

**No request-response correlation:** Web generates a GUID `id` for each event (`NativeAppService.sendToNative()`) but never checks it on response. iOS ignores the `id` entirely. However, this is mitigated by the `ReplaySubject(1)` pattern in `nativeEventsMap` - responses are matched by event type (`GET_X` → `SET_X`), and only the latest response per type is kept. This works because most request-response pairs are singletons (e.g., `GET_APPLICATION_SETTINGS` sent once at startup). Would only break if same request sent twice before first response arrives - theoretical, not observed in practice.

**No error responses:** When iOS fails (e.g., GeoComply error, KYC SDK crash), web has no way to know. Should add error event pattern:
```json
{ "eventName": "TRIGGER_GEO_LOCATION_ERROR", "parameters": { "code": "PERMISSION_DENIED", "message": "..." } }
```

**Main thread JSON on responses:** `WebViewController.messageToWeb()` does JSON serialization and `evaluateJavaScript` on main thread. High-frequency events (balance updates, geo position) cause UI jank. Should serialize on background, dispatch only the JS call to main.

**Bridge injection race condition:** The injected `messageToNative` function queues messages for 5 seconds waiting for native handler. After timeout, queue is abandoned (not flushed). Edge case but messages can be lost on slow startup.

---

### 2.10 Major (State Switcher / DeviceLocationManager) ✅ FIXED

**Status:** ✅ Fixed (2026-01-12)

**Root Cause:** `CLLocationManager` was being created on a background thread. `startMonitoringLocationChanges()` is called from `parseLocation()`, which runs inside a `Task {}` block. CLLocationManager delivers delegate callbacks on the thread where it was created, and background threads don't have a run loop, so callbacks were silently dropped.

**Fix:** Added main thread check at the start of `startMonitoringLocationChanges()`:
```swift
if !Thread.isMainThread {
    DispatchQueue.main.async { [weak self] in
        self?.startMonitoringLocationChanges()
    }
    return
}
```

**Testing:** Verified 3/3 successful mid-session state detections after fix.

**Files:**
- `native/ios/wrapper/Wrapper/GeoComplyManager/DeviceLocationManager.swift`
- `native/ios/wrapper/docs/GEOLOCATION_SYSTEMS.md` (threading documentation added)

**Remaining items (lower priority):**

| Item | Business Outcome | Size | Risk if Not Done |
|------|------------------|------|------------------|
| **Two async operations racing** | Predictable state detection | 2d | **Low** - Mitigated by `isLocationFetched` flag |
| **Config key format uncertainty** | Reliable state lookup | 1d | **Low** - Works in practice |

---

### 2.11 Data Race in UserDataModel ✅ FIXED

| Item | Business Outcome | Size | Risk if Not Done |
|------|------------------|------|------------------|
| **`isLoggedIn` written from background thread** | Prevent undefined behavior | 0.5d | **Medium** - Data race on logout |

**Status:** ✅ Fixed (2026-01-12)

**Root Cause:** `logout()` was called from background thread (inside `Task {}` in DeviceLocationManager during state switch), writing `isLoggedIn` while UI code reads it from main thread.

**Fix:** Wrapped `isLoggedIn` assignment in `DispatchQueue.main.async`:
```swift
func logout() {
    DispatchQueue.main.async {
        self.isLoggedIn = NSNumber(value: false)
    }
    self.security = nil
}
```

**File:** `native/ios/wrapper/Wrapper/Classes/Models/UserDataModel.swift`

---

### 2.12 Conditional SDK Linking ✅ COMPLETE

**Status:** ✅ Complete (2026-01-12, updated 2026-01-12)

**Problem:** Unified `Wrapper` target builds for simulator but fails for device. Four SDKs were not added to the unified target:

| SDK | Size | Labels Needing It | Source |
|-----|------|-------------------|--------|
| UnityFramework | 56MB (×4 versions) | 10 labels | CocoaPod (local) |
| AuthadaAuthenticationLibrary | 13MB | 8 German labels | Manual framework |
| ZoomAuthentication | 114MB | 8 German labels | Manual framework (Authada dependency) |
| IDnowSDK | ~10MB | 8 German labels | SPM |

**Why we can't just link them all:**
- 193MB of SDKs that most labels don't need
- Unity has 4 different versions for different labels (different game content)
- Only ~8-10 labels (out of 328) need each SDK bundle
- Unity and Authada are **device-only** (no simulator slices)

---

#### Final Solution (2026-01-12)

**Two key changes were required:**

**1. Swift conditional compilation:** Changed from `#if !targetEnvironment(simulator)` to `#if canImport(UnityFramework)`

```swift
// Before (broken for non-Unity device builds):
#if !targetEnvironment(simulator)
import UnityFramework
// Unity code
#endif

// After (works for all scenarios):
#if canImport(UnityFramework)
import UnityFramework
// Unity code
#endif
```

**File:** `native/ios/libs/slider-games/SliderGames/Classes/DynamicLoader/UnityGELoader.swift`

**Why:** `#if !targetEnvironment(simulator)` compiles Unity code on ALL device builds. When Unity isn't linked (non-Unity labels), compilation fails. `#if canImport()` checks module availability at compile time.

**2. Remove Unity from linker flags:** Removed `-weak_framework UnityFramework` from `OTHER_LDFLAGS[sdk=iphoneos*]`

**File:** `Wrapper.xcodeproj/project.pbxproj` (lines ~4530 and ~4628)

**Why:** The project had Unity as a weak framework for all device builds. This caused linker errors when the Unity symlink didn't exist. Unity is loaded dynamically at runtime via `Bundle.load()`, so it doesn't need to be linked at build time.

---

#### Verified Build Matrix (2026-01-12)

| Scenario | Label | Platform | Result |
|----------|-------|----------|--------|
| Non-Unity + Simulator | dk_bwin_casino_dev | iPhone 16e Simulator | ✅ BUILD SUCCEEDED |
| Non-Unity + Device | dk_bwin_casino_dev | generic/platform=iOS | ✅ BUILD SUCCEEDED |
| Unity + Simulator | playmgmsports_nj_dev | iPhone 16e Simulator | ✅ BUILD SUCCEEDED |
| Unity + Device | playmgmsports_nj_dev | generic/platform=iOS | ✅ BUILD SUCCEEDED |

---

#### How It Works Now

1. **`setup_sdks.py`** creates/removes `unity-framework-current` symlink based on label
2. **SliderGames podspec** adds Unity to `FRAMEWORK_SEARCH_PATHS[sdk=iphoneos*]` (search path only, no linking)
3. **`#if canImport(UnityFramework)`** in Swift code:
   - Simulator: Always uses stub (Unity has no simulator slice)
   - Device + Unity label: Uses real Unity code (symlink exists, module found)
   - Device + non-Unity label: Uses stub (no symlink, module not found)
4. **Run Script phase** embeds Unity framework only if symlink exists (device builds only)

---

#### Original Root Cause Analysis

**Root Cause - Unity:**
- `SliderGames` library imports `UnityFramework` (was guarded by `#if !targetEnvironment(simulator)`)
- Simulator: Code excluded, no Unity needed ✅
- Device: Code compiled, linker requires Unity ❌

**Root Cause - German KYC:**
- Authada, Zoom, IDnow were only in `Sports_German` and `Casino_German` targets on `main`
- Not added to unified `Wrapper` target

**SDKs to migrate:**

| SDK | Current State | Action |
|-----|--------------|--------|
| Unity | CocoaPods | Remove from Podfile, add to project with Optional linking |
| Authada | In project, not linked | Add to Link Binary, Optional, exclude on simulator |
| Zoom | In project, not linked | Add to Link Binary, Optional, exclude on simulator |
| IDnow | SPM | Keep as-is (SPM handles platform conditions) |

---

#### Implementation Steps (Phase 2)

**Step 1: Modify Xcode project for Unity**

Add to `project.pbxproj`:
```
1. PBXFileReference for UnityFramework.framework pointing to libs/unity-framework-current/
2. PBXBuildFile in Frameworks phase with settings = {ATTRIBUTES = (Weak, ); }
3. PBXBuildFile in Embed Frameworks phase (device only via Run Script)
```

Build Settings changes:
```
EXCLUDED_SOURCE_FILE_NAMES[sdk=iphonesimulator*] = UnityFramework.framework
FRAMEWORK_SEARCH_PATHS[sdk=iphoneos*] = $(inherited) $(PROJECT_DIR)/../libs/unity-framework-current
FRAMEWORK_SEARCH_PATHS[sdk=iphonesimulator*] = $(inherited)
OTHER_LDFLAGS[sdk=iphonesimulator*] = $(inherited) -weak_framework UnityFramework
```

**Step 2: Modify Xcode project for Authada**

Add to `project.pbxproj`:
```
1. PBXBuildFile in Frameworks phase with settings = {ATTRIBUTES = (Weak, ); }
2. PBXBuildFile in Embed Frameworks phase (device only via Run Script)
```

Build Settings changes:
```
EXCLUDED_SOURCE_FILE_NAMES[sdk=iphonesimulator*] = $(inherited) AuthadaAuthenticationLibrary.framework
OTHER_LDFLAGS[sdk=iphonesimulator*] = $(inherited) -weak_framework AuthadaAuthenticationLibrary
```

**Step 3: Modify Xcode project for Zoom**

Same pattern as Authada:
```
EXCLUDED_SOURCE_FILE_NAMES[sdk=iphonesimulator*] = $(inherited) ZoomAuthentication.framework
OTHER_LDFLAGS[sdk=iphonesimulator*] = $(inherited) -weak_framework ZoomAuthentication
```

**Step 4: Add Run Script for conditional embedding**

Add Run Script build phase "Embed Conditional Frameworks":
```bash
if [ "$PLATFORM_NAME" == "iphoneos" ]; then
    # Unity
    if [ -d "$PROJECT_DIR/../libs/unity-framework-current/UnityFramework.framework" ]; then
        cp -R "$PROJECT_DIR/../libs/unity-framework-current/UnityFramework.framework" "$TARGET_BUILD_DIR/$FRAMEWORKS_FOLDER_PATH/"
        codesign --force --sign "$EXPANDED_CODE_SIGN_IDENTITY" "$TARGET_BUILD_DIR/$FRAMEWORKS_FOLDER_PATH/UnityFramework.framework"
    fi
    
    # Authada (if symlink exists)
    if [ -L "$PROJECT_DIR/Wrapper/Vendor/Libs/conditional/AuthadaAuthenticationLibrary.framework" ]; then
        cp -R "$PROJECT_DIR/Wrapper/Vendor/Libs/conditional/AuthadaAuthenticationLibrary.framework" "$TARGET_BUILD_DIR/$FRAMEWORKS_FOLDER_PATH/"
        codesign --force --sign "$EXPANDED_CODE_SIGN_IDENTITY" "$TARGET_BUILD_DIR/$FRAMEWORKS_FOLDER_PATH/AuthadaAuthenticationLibrary.framework"
    fi
    
    # Zoom (if symlink exists)
    if [ -L "$PROJECT_DIR/Wrapper/Vendor/Libs/conditional/ZoomAuthentication.framework" ]; then
        cp -R "$PROJECT_DIR/Wrapper/Vendor/Libs/conditional/ZoomAuthentication.framework" "$TARGET_BUILD_DIR/$FRAMEWORKS_FOLDER_PATH/"
        codesign --force --sign "$EXPANDED_CODE_SIGN_IDENTITY" "$TARGET_BUILD_DIR/$FRAMEWORKS_FOLDER_PATH/ZoomAuthentication.framework"
    fi
fi
```

**Step 5: Remove Unity from Podfile**

```ruby
# REMOVE this block:
# unity_path = '../libs/unity-framework-current'
# if File.exist?(unity_path) ...
#   pod 'UnityFramework', :path => unity_path
# end
```

**Step 6: Update setup_sdks.py**

Keep symlink management for:
- Unity version selection (which version to link)
- German KYC enable/disable (whether to link at all)

The symlinks now control what the Run Script embeds, not what CocoaPods includes.

**Step 7: Verify Swift guards**

Ensure all SDK usage is guarded:
```swift
#if !targetEnvironment(simulator)
import UnityFramework
// Unity code
#endif

#if canImport(AuthadaAuthenticationLibrary)
import AuthadaAuthenticationLibrary
// Authada code
#endif
```

---

#### Files to Modify

| File | Changes |
|------|---------|
| `Wrapper.xcodeproj/project.pbxproj` | Add framework refs, build settings, Run Script |
| `Podfile` | Remove Unity pod |
| `BuildScripts/setup_sdks.py` | Keep as-is (symlink management) |
| `BuildConfig/sdk_mapping.json` | Keep as-is (label mapping) |
| Swift files using SDKs | Verify `#if` guards |

---

#### Expected Outcome

After implementation:

| Scenario | Result |
|----------|--------|
| `make build` (any label, simulator) | ✅ Builds, device-only SDKs excluded |
| `make build` (Unity label, device) | ✅ Builds with Unity |
| `make build` (German label, device) | ✅ Builds with Authada/Zoom |
| `make build` (regular label, device) | ✅ Builds without extra SDKs |
| Xcode UI → Build (simulator) | ✅ Works, no manual steps |
| Xcode UI → Build (device) | ✅ Works, no manual steps |

---

#### Rollback Plan

If issues arise:
1. Revert `project.pbxproj` changes
2. Restore Unity pod in Podfile
3. Run `pod install`
4. Use `make build-sim` for simulator (temporary workaround)

---

#### Step 7: Add Authada Source Files to Wrapper Target

**Problem Discovered:** The Authada source files (`Wrapper/Authada/*.swift`) were only in the German-specific targets on `main` branch, not in the unified `Wrapper` target. Device builds fail because these files aren't compiled.

**Solution:** Add all Authada source files to the Wrapper target's compile sources.

**Script:** `BuildScripts/add_authada_to_target.py`

This script:
1. Finds all .swift files in `Wrapper/Authada/`
2. Creates PBXBuildFile entries for files not already in compile sources
3. Adds entries to Wrapper target's PBXSourcesBuildPhase

**Files to add:**
- `Wrapper/Authada/AuthadaManager/AALProcessManager.swift`
- `Wrapper/Authada/AuthadaManager/AALChangePinManager.swift`
- `Wrapper/Authada/ViewController/Others/*.swift` (10 files)
- `Wrapper/Authada/ViewController/FivePinViewController/*.swift` (3 files)
- `Wrapper/Authada/ViewController/SixPinViewController/*.swift` (1 file)

**Why this works:**
- Authada framework is always in search paths → code compiles
- Weak linking → app doesn't crash if framework missing at runtime
- Run Script only embeds framework for German labels
- Non-German labels: code compiles but Authada features disabled at runtime

---

#### Progress Tracking

- [x] Created `sdk_mapping.json`
- [x] Created `setup_sdks.py` 
- [x] Updated Makefile with `set-label` integration
- [x] ~~Added `build-sim` workaround for simulator~~ (removed - no longer needed)
- [x] Fixed bundle ID matching for dev/beta/prod variants
- [x] **Modify project.pbxproj for simulator exclusion** (via configure_conditional_sdks.py)
- [x] **Add Run Script for conditional embedding**
- [x] **Remove Unity from Podfile**
- [x] **Add weak framework linking for device builds**
- [x] **Update SliderGames podspec with Unity search path**
- [x] **Test simulator build (all label types)** ✅ Unity, German, Regular all pass
- [x] **Add German KYC source files to Wrapper target** (via add_authada_to_target.py) - 17 files added
- [x] **Add IDnow SPM package to project** ✅ IDNowSDKCore-without-NFC linked (2026-01-12)
- [x] **Fix IDnow canImport guards** - require both IDNowSDKCore AND AuthadaAuthenticationLibrary
- [x] **Disable legacy IdNowViewController code** - ObjC file not in build, use IDNowAutoIdentViewController
- [x] **Test device build** ✅ BUILD SUCCEEDED (2026-01-12)

---

#### Developer Workflow After Implementation

```bash
# Switch to BetMGM US (needs Unity 0.3.8)
make set-label label=betmgm_sports_nj_dev

# Output:
# ✓ Label: com.playmgmsports.nj
# ✓ Unity: 0.3.8 (linked)
# ✓ German KYC: not needed
# 
# Unity version changed. Run: pod install

pod install
make build
```

```bash
# Switch to German label (needs German KYC, no Unity)
make set-label label=bwin_sports_de_dev

# Output:
# ✓ Label: sports.bwin.de2
# ✓ Unity: not needed
# ✓ German KYC: linked (Authada, Zoom, IDnow)
#
# Unity removed. Run: pod install

pod install
make build
```

```bash
# Switch to regular label (no conditional SDKs)
make set-label label=borgata_casino_dev

# Output:
# ✓ Label: com.borgata.casino
# ✓ Unity: not needed
# ✓ German KYC: not needed
```

---

#### Files to Create/Modify

| File | Action |
|------|--------|
| `BuildConfig/sdk_mapping.json` | Create |
| `BuildScripts/setup_sdks.py` | Create |
| `Podfile` | Modify (conditional Unity) |
| `Wrapper.xcodeproj` | Modify (add conditional framework refs) |
| `.gitignore` | Add symlink paths |
| `Makefile` | Modify (call setup_sdks) |

---

#### Size Impact

| Label Type | SDKs Bundled | Extra Size |
|------------|--------------|------------|
| Regular (310 labels) | None | 0 MB |
| Unity labels (10) | Unity | ~56 MB |
| German labels (8) | Authada+Zoom+IDnow | ~137 MB |

**Estimated effort:** 2-3 days

---

### 2.13 Data Race in BatchService.updateRegionDetails ✅ FIXED

| Item | Business Outcome | Size | Risk if Not Done |
|------|------------------|------|------------------|
| **`EntainContext.regionContext` written from async context** | Prevent crash | 0.5d | **High** - Production crash |

**Status:** ✅ Fixed (2026-01-12)

**Crash signature:**
```
Crashed: com.apple.root.user-initiated-qos.cooperative
0  libobjc.A.dylib  objc_retain_x23 + 16
1  BetMGMSports     BatchService.updateRegionDetails() + 114
```

**Root Cause:** `EntainContext.regionContext` is a static var being written from Swift's cooperative thread pool (async context) while potentially being read from other threads. Classic data race causing `objc_retain` crash on deallocated object.

**Fix:** Capture values into local variables, then dispatch write to main thread:
```swift
private func updateRegionDetails() {
    // Capture values from potentially thread-unsafe shared state
    let deviceLocation = AppSessionManager.shared.geoLocationData
    let region = (deviceLocation?.region ?? "") + "-" + (deviceLocation?.regionCode ?? "")
    let coordinates = (deviceLocation?.latitude ?? "") + "," + (deviceLocation?.longitude ?? "")
    let countryName = deviceLocation?.countryName
    
    // Update shared static context on main thread to prevent data races
    DispatchQueue.main.async {
        let regionContext = RegionContext(region: region,
                                          countryName: countryName,
                                          coordinates: coordinates)
        EntainContext.regionContext = regionContext
    }
}
```

**File:** `native/ios/wrapper/Wrapper/Classes/APIClasses/BatchService.swift`

**Pattern:** When updating shared static state (`EntainContext.*`, singletons) from async contexts:
1. Capture all needed values into local variables (stack-safe)
2. Dispatch the write to main thread (serializes access)
3. Never access shared mutable state directly from async context

---

### 2.14 Data Race in URLCache Access (CasinoAPI) ✅ FIXED

**Crash signature:** `objc_release_x19` in `URL.cacheData` getter

**Stack trace pattern:**
```
Thread 7 (com.apple.root.user-initiated-qos.cooperative):
  objc_release_x19
  URL.cacheData.getter
  FeedService.cachedData.getter
  FeedService.fetchCachedResponse.getter
```

**Root cause:** `URLCache.shared` is not thread-safe for concurrent read/write operations. The `cacheData` computed property and `storeCache` method were accessing `URLCache.shared` from multiple threads without synchronization.

**File:** `native/ios/libs/casino-api/CasinoAPI/Classes/Util/URLRequestExtension.swift`

**Fix:** Dispatch all `URLCache.shared` access to main thread:

```swift
var cacheData: Data? {
    // URLCache.shared is not thread-safe for concurrent access.
    // Must read on main thread to prevent data races with storeCache writes.
    if Thread.isMainThread {
        return URLCache.shared.cachedResponse(for: URLRequest(url: self))?.data
    }
    var result: Data?
    DispatchQueue.main.sync {
        result = URLCache.shared.cachedResponse(for: URLRequest(url: self))?.data
    }
    return result
}

func storeCache(with object: [String: Any]) {
    // URLCache.shared is not thread-safe for concurrent access.
    // Must write on main thread to prevent data races with cacheData reads.
    let url = self
    let store = {
        if let sampleReponse = url.sampleReponse,
           let data = object.data() {
            let cachedResponse = CachedURLResponse(response: sampleReponse, data: data)
            URLCache.shared.storeCachedResponse(cachedResponse, for: URLRequest(url: url))
        }
    }
    if Thread.isMainThread {
        store()
    } else {
        DispatchQueue.main.async {
            store()
        }
    }
}
```

**Pattern:** Same as BatchService fix - serialize access to shared mutable state via main thread dispatch.

**Callers affected:**
- `FeedService.cachedData` / `fetchCachedResponse`
- `JPGroupPoolService.cachedData` / `fetchCachedResponse`
- `POSAPI+Cache` (multiple properties)
- `SitecoreTeaserContentManager.fetchCachedResponse()`
- SliderGames `SGViewController.getLMTFeedFromCache()`

---

### 2.15 DispatchTimer Crash (block_destroy_helper) ✅ FIXED

**Crash signature:** `block_destroy_helper` in `com.apple.root.default-qos` thread

**Stack trace pattern:**
```
Crashed: com.apple.root.default-qos
0  libswiftCore.dylib             <redacted> + 32
1  libswiftCore.dylib             <redacted> + 152
2  BetMGMSports_GeoComply         block_destroy_helper + 408660 (<compiler-generated>)
...
7  libdispatch.dylib              _dispatch_source_handler_dispose + 36
8  libdispatch.dylib              _dispatch_source_latch_and_call + 508
9  libdispatch.dylib              _dispatch_source_invoke + 844
```

**Root cause:** `DispatchTimer` (utility library) had multiple issues:

1. **Strong capture in event handler:** The handler closure was captured strongly via `t.setEventHandler(handler: self.handler)`, creating a retain cycle when callers passed `self.someMethod`

2. **Struct with reference semantics:** `DispatchTimer` was a `struct` but contained a `DispatchSourceTimer` (reference type). Copy semantics caused issues with timer lifecycle.

3. **Unsafe cancel:** Calling `cancel()` on a suspended `DispatchSourceTimer` crashes. The old code didn't resume before cancelling.

4. **Race condition in cleanup:** Setting event handler to `nil` after `cancel()` could race with handler execution.

**File:** `native/ios/libs/utility/Utility/Classes/DispatchTimer.swift`

**Fix:**
1. Convert from `struct` to `final class` for proper reference semantics
2. Use `[weak self]` in event handler to break retain cycle
3. Add `NSLock` for thread-safe state management
4. Resume suspended timer before cancel (required by GCD)
5. Proper cleanup in `deinit`

```swift
public final class DispatchTimer {
    private let lock = NSLock()
    
    private func setupTimer() {
        let t = DispatchSource.makeTimerSource(queue: DispatchTimer.queue)
        t.schedule(deadline: .now() + interval, repeating: interval)
        // Capture handler weakly via self to allow cleanup
        t.setEventHandler { [weak self] in
            self?.lock.lock()
            let h = self?.handler
            self?.lock.unlock()
            h?()
        }
        timer = t
    }
    
    deinit {
        // Must resume before cancel if suspended, otherwise crash
        if wasSuspended { timer?.resume() }
        timer?.setEventHandler(handler: nil)
        timer?.cancel()
    }
}
```

**Callers affected (16 usages):**
- `ImmersiveLobbyCollectionViewController` (3 timers)
- `FeedViewModel`, `GamesEssentialsViewModel`, `JackpotTileViewModel`
- `SeeMoreSectionViewController`, `SearchDashboardFeed`
- `PlayerStatsWidgetViewModel`, `FreeSpinsOverlayGamesViewModel`
- `NativeGameManager`, `LobbyViewController`
- Various favorite toast timers

**No caller changes required** - the API is compatible (methods are no longer `mutating` but that's source-compatible).

---

### 2.16 Summary

| Category | Days | Risk Level |
|----------|------|------------|
| Security | 18 | High |
| Architecture | 56 | High |
| CI/CD & Release | 17 | Medium |
| Testing | 22 | High |
| Documentation | 13 | Medium |
| Versioning & Branching | 6 | Medium |
| Developer Account | 6 | Low |
| Quality | 23 | Low |
| Bridge Architecture | 13 | Medium |
| ~~State Switcher~~ | ~~7~~ | ✅ Fixed |
| ~~UserDataModel~~ | ~~0.5~~ | ✅ Fixed |
| **Conditional SDK Linking** | **2-3** | ✅ **Complete** |
| **Total** | **~176-177 days** | |

### 2.16 Recommended Phases

**Phase 0 - Unblock Device Builds (immediate):**
- ~~Conditional SDK linking (Unity, German KYC) - 2-3d~~ ✅ Complete
- *Outcome: Device builds work for all labels*

**Phase 1 - Security & Stability (4-6 weeks):**
- Security hardening (secrets to CI, RSA key removal, jailbreak detection) - 10d
- Production validation on real devices - 3d
- Dependency updates (Datadog, Onfido) - 5d
- *Outcome: Pass security audit, reduce regulatory risk*

**Phase 2 - Process & Automation (4-6 weeks):**
- CI/CD improvements (quality gates, Fastlane) - 10d
- UI tests for critical flows - 8d
- JS–Native contract documentation - 3d
- Unified versioning - 2d
- *Outcome: Faster releases, fewer regressions*

**Phase 3 - Architecture (8-10 weeks):**
- Legacy cleanup (NotificationCenter, Obj-C) - 8d
- View controller refactoring - 13d
- Dependency injection - 10d
- Target consolidation - 8d
- *Outcome: Maintainable codebase, faster feature development*

**Phase 4 - Polish (4 weeks):**
- Analytics unification - 5d
- Remaining documentation - 8d
- Storyboard removal - 8d
- Swift 6 compliance - 5d
- *Outcome: Modern, consistent codebase*

---

## 3. Target Consolidation

### 3.1 Summary

**12 targets → 1 unified `Wrapper` target** supporting all 328 labels across Sports, Casino, and Bingo.

The Conjure audit recommended "Reduce to 3 Core Apps". We exceeded this by achieving a single target—proving the artificial boundaries between products were unnecessary.

| Metric | Before | After |
|--------|--------|-------|
| App Targets | 12 | 1 |
| Config Files | 440 scattered | 328 in `Labels/` |
| Compile-Time Flags | 142 `#if BW_*` | 0 |
| CI Build Matrix | 12 × 4 | 1 × 4 |
| Lines Deleted | - | 16,966 |

### 3.2 Why One Target Works

| Aspect | Sports | Casino | Bingo |
|--------|--------|--------|-------|
| Source files | 267 | 256 | 252 |
| Shared files | 246 | 246 | 246 |
| Product type | Runtime (`SW`) | Runtime (`CW`) | Runtime (`BW`) |

The `channel` key in `labelFeatures.plist` already determines product type at runtime. No compile-time separation needed.

### 3.3 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Wrapper Target                          │
├─────────────────────────────────────────────────────────────────┤
│   All 328 labels: Sports, Casino, Bingo                         │
│   Product type from `channel` in labelFeatures.plist            │
│   All SDKs linked - runtime flags control activation            │
│   Unity excluded on simulator via #if !targetEnvironment        │
└─────────────────────────────────────────────────────────────────┘
```

### 3.4 Compile-Time → Runtime Migration

| Flag | Before | After |
|------|--------|-------|
| `BW_MINI_GAMES_SUPPORTED` | 72 | 0 |
| `BW_US_UNIFIED_APP` | 48 | 0 |
| `BW_GEOCOMPLY_ENABLED` | 11 | 0 |
| `BW_ONFIDO_ENABLED` | 5 | 0 |
| `BW_SPORTS_AUTHADA_SUPPORTED` | 6 | 0 |
| **Total** | **142** | **0** |

### 3.5 SDK Strategy

| SDK | Simulator | Strategy |
|-----|-----------|----------|
| GeoComplySDK | ✅ | Link always, runtime flag |
| Onfido | ✅ | Link always, runtime flag |
| SliderGames | ✅ | Link always, runtime flag |
| UnityFramework | ❌ | `#if !targetEnvironment(simulator)` |

### 3.6 xcconfig Structure

```
BuildConfig/
├── Dev/Debug_Wrapper.xcconfig      # How to build
├── Release/Release_Wrapper.xcconfig
├── Labels/com.bwin.casino.live/    # What app to build
│   ├── Dev.xcconfig
│   ├── Beta.xcconfig
│   └── Release.xcconfig
└── Generated/Label_Current.xcconfig
```

### 3.7 Phase History

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | FeatureFlags infrastructure | ✅ |
| 2 | Migrate 142 compile-time flags | ✅ |
| 3 | Restructure xcconfigs | ✅ |
| 4a-d | Create unified target, all configs | ✅ |
| 5 | Remove 11 legacy targets | ✅ |
| 6 | Rename resource folders | ✅ |
| 7 | xcconfig naming convention | ✅ |
| 8 | Makefile build system | ✅ |
| 9 | Build warning remediation | ✅ |

### 3.8 Deleted Targets

Removed 11 legacy targets:
- `Sports`, `Sports_GeoComply`, `Sports_German`
- `Casino`, `Casino_GeoComply`, `Casino_German`
- `Bingo`, `Bingo_Without_Slider`, `BingoUnified_GeoComply`
- `BetMGMSports_GeoComply`, `BetMGMCasino_GeoComply`

Remaining: `Wrapper`, `WrapperTests`, `ServiceNotification`, `twine`

### 3.9 Verified Build Matrix

| Distribution | Debug | Release |
|--------------|-------|---------|
| Dev | ✅ | ✅ |
| Beta | ✅ | ✅ |
| Release | ✅ | ✅ |
| Automation | ✅ | ✅ |

### 3.10 Remaining

- [ ] CI pipeline migration
- [ ] QA sign-off
- [ ] 1 week production validation

---

## 4. Technical Reference

### 4.1 EventRouter API

**Register handler:**
```swift
EventRouter.shared.register(
    id: "MyManager",
    for: [myEvent1, myEvent2]
) { [weak self] eventName, parameters in
    self?.handleEvent(eventName, parameters)
}
```

**Unregister:**
```swift
EventRouter.shared.unregister(id: "MyManager")
```

### 4.2 Event Allowlist

Core events handled by iOS:

**Auth:** LOGIN, LOGOUT, PRE_LOGIN, POST_LOGIN, LOGIN_FAILED, IS_LOGGED_IN
**Geo:** TRIGGER_GEO_LOCATION, GEO_LOCATION_POSITION, GET_GEO_LOCATION_POSITION
**Lifecycle:** APP_INITIALIZED, CCB_INITIALIZED, FIRST_CONTENTFUL_PAINT, FEATURE_LOADED
**Settings:** GET_APPLICATION_SETTINGS, UPDATE_APPLICATION_SETTINGS
**Navigation:** NAVIGATE_TO, PAGE_CLOSED, MENU_CLOSED
**KYC:** initiateOnFido, initiateIdNow, initiateAuthada

### 4.3 Launch Timeline

| Phase | Time | % |
|-------|------|---|
| Pre-main (dyld) | 62ms | 3% |
| Native init | 246ms | 14% |
| **Native total** | **308ms** | **17%** |
| WebView load | 571ms | 31% |
| Web JS + render | 959ms | 52% |
| **Web total** | **1530ms** | **83%** |
| **FCP** | **1838ms** | 100% |

### 4.4 Debug Logging Usage

```swift
// Use centralized logger
DebugLogger.loginStarted()
DebugLogger.geoCheckSuccess(state: "NJ")
DebugLogger.pushNotificationReceived(title: "Bet won!")

// Or create custom log
import os.log
private let log = OSLog(subsystem: DebugLogger.subsystem, category: "myfeature")
os_log("🔧 [MyFeature] %{public}@", log: log, type: .debug, message)
```

---

## 5. Appendix

### 5.1 Original Audit Findings

Source: Conjure x Entain Phase 01 Technical Audit Report (Dec 2025)

**Critical findings addressed:**
- JS→Native messages blocking main thread → EventRouter
- Splash screen 30s timeout → 4s + FCP handling
- Biometric blocking semaphore → async/await
- No simulator support → Sports_Without_Slider target
- No architecture documentation → README, specs, steering
- Target consolidation 12→1 → Unified `Wrapper` target (exceeded audit recommendation of 3)

**Critical findings remaining:**
- Hardcoded secrets in source
- No SSL pinning
- No jailbreak detection

### 5.2 Event Contract Gaps

| Gap | Status |
|-----|--------|
| FIRST_CONTENTFUL_PAINT | ✅ Now sent by web, handled by iOS |
| PASSKEY_* events | ❌ Web sends, iOS ignores |
| KYC naming mismatch | ⚠️ `ONFIDO` vs `initiateOnfido` |

### 5.3 Files Modified (This MR)

**Bridge:**
- EventRouter.swift, BridgeEvent.swift, SplashController.swift, WebMessageHandler.swift

**Handlers:**
- LoginManager.swift, AccountSettingsManager.swift, UserDataModel.swift
- GeoComplyManager.swift, LocationPoll.swift, DeviceLocationManager.swift
- KYCManager.swift, SensitivePageManager.swift, FeedbackManager.swift
- CCBUtility.swift, MainViewController.swift

**Logging:**
- DebugLogger.swift, LaunchProfiler.swift

**Tests:**
- EventRouterTests.swift, BridgeEventTests.swift, WebMessageHandlerTests.swift
- DebugLoggerTests.swift, LaunchProfilerTests.swift, CCBModelTests.swift
- DeepLinkTests.swift, ConstantsTests.swift

**Config:**
- Dev_Without_Slider.xcconfig, project.pbxproj

### 5.4 Rollback

**EventRouter:** Set `useEventRouter = false` in WebViewController.swift

**Splash timeout:** Revert SplashController.swift timeout constant

**All changes:** Revert this MR branch
