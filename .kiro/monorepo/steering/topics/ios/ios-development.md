# iOS Development Guide

## Philosophy

All iOS development workflows should be executable from the Kiro console. No need to open Xcode for routine tasks.

## ⚠️ Deprecated APIs to Avoid

### CLLocationManager.authorizationStatus() (Deprecated iOS 14)

**Use the instance property instead of the class method:**

```swift
// ✅ Correct - Instance property (iOS 14+)
let status = locationManager.authorizationStatus

// ❌ Wrong - Deprecated class method
let status = CLLocationManager.authorizationStatus()
```

The class method was deprecated in iOS 14. Always use the instance property on your `CLLocationManager` instance.

---

## Code Conventions

### Localized Strings

**Always use the `.localized` String extension:**

```swift
// ✅ Correct - Use .localized extension
let title = "login_button_title".localized
let message = "error_network_unavailable".localized

// ❌ Wrong - Verbose Bundle call
let title = Bundle.main.localizedString(forKey: "login_button_title", value: nil, table: nil)
```

The `.localized` extension is defined in `StringExtension.swift` and wraps the Bundle call. Using it keeps the codebase consistent and readable.

---

## Documentation

| Document | Location | Purpose |
|----------|----------|---------|
| **README** | `native/ios/wrapper/README.md` | Quick start, architecture, onboarding |
| **JS-Native Contract** | `native/ios/wrapper/docs/JS_NATIVE_CONTRACT.md` | Bridge event catalog for web team |
| **Geolocation Systems** | `native/ios/wrapper/docs/GEOLOCATION_SYSTEMS.md` | LocationPoll vs GeoComply vs State Switcher |
| **Technical Audit** | `.kiro/specs/native/ios/wrapper/ios-audit.md` | Full audit findings, target consolidation, remaining work |
| **Executive Report** | `.kiro/specs/native/ios/wrapper/ios-audit-executive-report.md` | Business-friendly summary |
| **Developer Experience** | `.kiro/specs/native/ios/wrapper/developer-experience.md` | Daily workflow quick reference |
| **Swift Style Guide** | `.kiro/steering/topics/ios/swift-style-guide.md` | Code conventions |

## Git Rules

- Always ask before committing or pushing changes. Never auto-commit or auto-push.
- Only `git add` specific files you intend to commit. Never use `git add -A` or `git add .` without checking `git status` first.
- Never amend commits after they've been pushed. Create a new commit instead.

---

## Swift Concurrency Best Practices

### Main Thread Dispatch in Async Contexts

**Use `MainActor.run` instead of `DispatchQueue.main.async` inside `Task {}` blocks:**

```swift
// ✅ Correct - Modern Swift concurrency
Task {
    let result = await someAsyncWork()
    await MainActor.run {
        self.updateUI(result)
    }
}

// ❌ Avoid - Redundant GCD dispatch inside structured concurrency
Task {
    let result = await someAsyncWork()
    DispatchQueue.main.async {
        self.updateUI(result)
    }
}
```

**Why:**
- `MainActor.run` is compiler-checked for thread safety
- Executes immediately if already on main thread (no redundant queue hop)
- Aligns with Swift 6 strict concurrency direction
- Clearer intent - explicitly marks UI code as main-actor-isolated

### Weak Self in Task Blocks

**Always use `[weak self]` in Task blocks for non-singleton classes:**

```swift
// ✅ Correct - Prevents retain cycles
Task { [weak self] in
    let result = await fetchData()
    await MainActor.run {
        self?.updateUI(result)
    }
}

// ✅ OK for singletons - They live forever anyway
// AppSessionManager.shared methods don't need weak self
Task {
    let result = await BatchService().callBatch()
    self.processResult(result)  // OK - self is singleton
}

// ❌ Avoid - Strong capture in view controllers
Task {
    let result = await fetchData()
    self.updateUI(result)  // Retains self until task completes
}
```

### Async/Await vs Completion Handlers

**Prefer async/await for new code:**

```swift
// ✅ Correct - Modern async/await
func fetchUserBalance() async -> WalletBalance? {
    let result = await WalletBalanceService().fetchUserBalance()
    return (result.response as? WalletBalanceInfoModel)?.accountBalance
}

// ❌ Avoid - Callback-based (legacy pattern)
func fetchUserBalance(completion: @escaping (WalletBalance?) -> Void) {
    WalletBalanceService().fetchUserBalance { result in
        completion((result.response as? WalletBalanceInfoModel)?.accountBalance)
    }
}
```

### Thread Safety

**Use `NSLock` for simple synchronization:**

```swift
// ✅ Correct - NSLock for thread-safe access
private let lock = NSLock()
private var _value: Int = 0

var value: Int {
    lock.lock()
    defer { lock.unlock() }
    return _value
}

// ❌ Avoid - Deprecated atomic operations
// OSAtomicCompareAndSwap32 is deprecated
```

### CLLocationManager Threading

**CLLocationManager MUST be created and used on the main thread.** Delegate callbacks are delivered on the thread where the manager was created. If created on a background thread (e.g., inside `Task {}`, `DispatchQueue.global()`, or completion handlers), callbacks will be silently dropped because background threads don't have a run loop.

```swift
// ✅ Correct - Ensure main thread before using CLLocationManager
func startMonitoringLocation() {
    if !Thread.isMainThread {
        DispatchQueue.main.async { [weak self] in
            self?.startMonitoringLocation()
        }
        return
    }
    locationManager.startUpdatingLocation()
}

// ❌ WRONG - Called from Task {} which may run on background thread
Task {
    let result = await someNetworkCall()
    locationManager.startUpdatingLocation()  // Callbacks silently dropped!
}
```

**Common pitfall:** Code inside `Task {}` blocks or after `await` may run on arbitrary threads. Always dispatch to main thread before interacting with CLLocationManager.

### Shared Static State (EntainContext, Singletons)

**Static vars and singleton properties accessed from async contexts MUST be updated on main thread:**

```swift
// ✅ Correct - Capture values, then dispatch write to main thread
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

// ❌ WRONG - Writing to static var from async context (data race!)
func callBatchWith(...) async -> APIResponse {
    // ... network call ...
    EntainContext.regionContext = regionContext  // Crash: objc_retain on deallocated object
}
```

**Why this crashes:** Swift's cooperative thread pool (`com.apple.root.user-initiated-qos.cooperative`) runs multiple async tasks concurrently. When one task writes to a static var while another reads it, the object can be deallocated mid-access, causing `objc_retain` crashes.

**Pattern for async → shared state:**
1. Capture all needed values into local variables (safe - stack allocated)
2. Dispatch the write to main thread (serializes access)
3. Never access shared mutable state directly from async context

**Applies to:**
- `EntainContext.*` static properties
- `AppSessionManager.shared.*` properties
- `UserDataModel.shared.*` properties
- `URLCache.shared` (reads and writes)
- Any singleton with mutable state

### Conditional SDK Imports

**Use `#if canImport()` for optional device-only frameworks:**

```swift
// ✅ Correct - Works on simulator AND device builds without the SDK
#if canImport(UnityFramework)
import UnityFramework

class UnityGELoader: DynamicLoader {
    // Real Unity implementation
}
#else
// Stub for simulator AND non-Unity device builds
class UnityGELoader: DynamicLoader {
    // No-op stub
}
#endif

// ❌ WRONG - Fails on device builds when SDK not linked
#if !targetEnvironment(simulator)
import UnityFramework  // Linker error if Unity not available!
#endif
```

**Why:** `#if !targetEnvironment(simulator)` only checks the build target platform. On device builds, it always compiles the import, causing linker errors when the framework isn't linked. `#if canImport()` checks actual module availability at compile time.

**Used for:**
- `UnityFramework` - Only linked for Unity-enabled labels (BetMGM US, etc.)
- `AuthadaAuthenticationLibrary` - Only linked for German KYC labels
- `ZoomAuthentication` - Only linked for German KYC labels

---

## Quick Reference: Build, Install & Stream Logs

**Use the Makefile for all builds:**

```bash
cd native/ios/wrapper

# Build current label
make build

# Build + install + launch
make run

# Build specific label
make run label=bwin_sportsbook_at_dev

# Stream logs
make stream-logs
```

The Makefile includes `-skipPackagePluginValidation` and other optimizations. Don't use raw `xcodebuild` commands.

**If a command is missing from the Makefile, extend it** rather than using raw commands. This keeps optimizations centralized.

### Conditional SDK Linking

Some labels require device-only SDKs (Unity for SliderGames, Authada/Zoom for German KYC). The unified `Wrapper` target handles this automatically:

```bash
# Unity label (BetMGM Sports)
make set-label label=playmgmsports_nj_dev
# Output: ✓ Unity: 0.3.8 (linked)

# German KYC label (bpremium DE)
make set-label label=bpremium_sportsbook_de_dev
# Output: ✓ German KYC: linked (Authada, Zoom, IDnow)

# Regular label (no conditional SDKs)
make set-label label=borgatacasino_casino_dev
# Output: ✓ Unity: not needed, ✓ German KYC: not needed
```

**How it works:**
- `setup_sdks.py` creates symlinks based on `sdk_mapping.json`
- Build settings exclude device-only frameworks on simulator
- Run Script phase embeds frameworks only if symlinks exist
- `#if canImport()` guards allow code to compile on both platforms

**Bundle size impact:**
- German labels: +137MB (Authada + Zoom)
- Unity labels: +56MB (Unity framework)
- Regular labels: **+0MB** (frameworks not embedded)

**Both simulator and device builds work for all labels** - no need to switch targets.

**Verify build output after label switch:**

```bash
# Check built app info (bundle ID, display name, URL scheme)
make info

# Check installed app info (verify correct app on simulator)
make app-info
```

**Full workflow after code changes:**

```bash
# 0. Set simulator location BEFORE launch (required for geo features)
xcrun simctl location booted set 40.7357,-74.1724  # Newark, NJ

# 1. Build, install, launch
cd native/ios/wrapper
make run

# 2. Check for crashes (ALWAYS do this after launch)
make show-crashes

# 3. Stream logs (Ctrl+C to stop)
make stream-logs
```

**Build speed tip:** The Makefile uses `-skipPackagePluginValidation` which saves ~10s per build by skipping SPM plugin re-validation. Safe for this project since no SPM packages use build tool plugins. Remove it only after adding a package with a build plugin (rare).

### ⚠️ CRITICAL: Stream Logs BEFORE Taking Action

**Simulator logs expire within seconds.** Always start streaming BEFORE triggering the action you want to observe.

### Log Streaming Commands

There are TWO types of logs - use the right command for what you need:

```bash
# 1. OUR APP LOGS ONLY (os_log with subsystem "com.app.wrapper")
#    Shows: 🚀 [Launch], 📍 [iOS-GPS], 🗺️ [iOS-State], 🌉 [Bridge], etc.
xcrun simctl spawn booted log stream --level debug --info --predicate 'subsystem == "com.app.wrapper"'

# 2. SYSTEM LOGS ONLY (CoreLocation, UIKit, etc.)
#    Shows: CLLocationManager, authorization changes, system events
xcrun simctl spawn booted log stream --level debug --predicate 'processImagePath CONTAINS "Wrapper"'

# 3. BOTH (verbose - use when debugging system integration issues)
xcrun simctl spawn booted log stream --level debug --info --predicate '(subsystem == "com.app.wrapper") OR (processImagePath CONTAINS "Wrapper")'
```

**⚠️ The `--info` flag is REQUIRED to see our `os_log` output.** Without it, only system logs appear.

### Historical Logs (log show)

```bash
# Our app logs from last 60 seconds
xcrun simctl spawn booted log show --last 60s --info --debug --predicate 'subsystem == "com.app.wrapper"'

# System logs from last 60 seconds  
xcrun simctl spawn booted log show --last 60s --predicate 'processImagePath CONTAINS "Wrapper"'

# Both
xcrun simctl spawn booted log show --last 60s --info --debug --predicate '(subsystem == "com.app.wrapper") OR (processImagePath CONTAINS "Wrapper")'
```

### Capture to File (for Kiro)

```bash
LOG_FILE="/tmp/test.log"
xcrun simctl spawn booted log stream --level debug --info --predicate 'subsystem == "com.app.wrapper"' > "$LOG_FILE" 2>&1 &
LOG_PID=$!
sleep 1
# ... trigger action ...
sleep 3
kill $LOG_PID
cat "$LOG_FILE"
```

**For Kiro:** When testing location changes or other events, ALWAYS capture to a file with background streaming. Never rely on `log show --last` for time-sensitive events.

### Checking Historical Logs

When you need to check what happened recently (e.g., after a crash or unexpected behavior), use `--last 60s` minimum and look for PID changes to identify app restarts:

```bash
# Check last 60 seconds of logs
xcrun simctl spawn booted log show --last 60s --info --debug --predicate 'subsystem == "com.app.wrapper"'

# The PID column shows which app instance generated each log:
# PID 24435 = one app instance
# PID 24500 = app was restarted (new instance)
# A PID change mid-logs indicates the app crashed or was relaunched
```

**Reading the output:**
```
Timestamp                       Thread     Type   Activity  PID    TTL
2026-01-11 21:34:31.913947+0000 0x5b0aec   Info   0x0       24435  0    Wrapper: ...
                                                            ^^^^^
                                                            Watch this column
```

### ⚠️ CRITICAL: Set Simulator Location Before Launch

**Geolocation must be set BEFORE app launch.** The app reads location at startup; setting it after launch won't trigger state detection.

```bash
# Use make set-location for easy GPS setting
make set-location loc=nj    # Newark, NJ
make set-location loc=ny    # New York, NY
make set-location loc=pa    # Philadelphia, PA
make set-location loc=nv    # Las Vegas, NV
make set-location loc=gb    # London, UK

# Run 'make set-location' to see all 47 locations (27 US states + 20 countries)
```

**State Caching Behavior:**
- First launch → GPS determines state via reverse geocoding
- Subsequent launches → Uses cached `latestLaunchedState` from previous launch (GPS ignored)
- Mid-session changes → `significantLocationManager` monitors for 1km+ movement and sends to web
- To test fresh state detection → Use `make fresh` (uninstall + install + launch)

### ⚠️ CRITICAL: Always Check Crash Logs After Install

**After every install and launch, check for crash reports:**

```bash
# Check for recent crashes
ls -lt ~/Library/Logs/DiagnosticReports/ | grep -i wrapper | head -3

# If crash found, get the reason
cat ~/Library/Logs/DiagnosticReports/Wrapper-*.ips | grep -E '"termination"|"reasons"' | head -5
```

**Common crash causes:**
- `Library not loaded` → Missing framework in "Embed Frameworks" build phase
- `SIGABRT` with assertion → Check the crash backtrace for the failing code
- `EXC_BAD_ACCESS` → Memory issue, often nil pointer dereference

**Don't assume the app works just because it launched.** Silent crashes happen. Always verify.

### Deep Links

**Format:** Deep links use the `navigateTo(scheme,host/path)` format:

```bash
# Open a deep link
make deep-link path=en/sports/basketball host=sports.nj.betmgm.com

# Format: scheme://navigateTo(https,host/path)
# Example: betmgmsports://navigateTo(https,sports.nj.betmgm.com/en/sports/basketball)
```

**Common hosts by product:**
- BetMGM Sports NJ: `sports.nj.betmgm.com`
- BetMGM Casino NJ: `casino.nj.betmgm.com`
- Bwin Sports: `sports.bwin.com`

**How it works:**
1. Native receives URL with app's custom scheme (e.g., `betmgmsports://`)
2. `DeepLinkCoordinator` strips scheme, parses `navigateTo(scheme,host/path)`
3. Sends `NAVIGATE_TO` event to web with the full URL
4. Web app navigates to that path

### WebView URL Override (DEBUG builds)

Override the initial WebView URL to test against different environments:

```bash
# Set custom URL (persists across launches)
make set-web-url url=https://host-app-beta.int.nj.betmgm.com/en/sports

# Clear override (return to normal)
make clear-web-url
```

**Use cases:**
- Test feature branches deployed to k8s
- Test against staging/beta environments
- Debug specific web app versions

**Note:** This only affects DEBUG builds. The POS API URL remains unchanged (state detection still works). Relaunch app after setting.

---

## Makefile Build System

All iOS wrapper operations use the Makefile at `native/ios/wrapper/Makefile`. Run `make help` for the full list.

### ⚠️ CRITICAL: Kiro Must Use Non-Interactive Mode

**Kiro cannot use interactive commands.** Always use the direct `label=X` parameter:

```bash
# ✅ CORRECT for Kiro - non-interactive, specify label directly
make set-label label=bwin_sportsbook_at_dev
make run label=bwin_casino_live_dev

# ❌ WRONG for Kiro - launches interactive picker (will hang)
make set-label
```

### Command Reference (MECE)

All commands organized by category. Every command listed once.

#### Label Management

| Command | Mode | Description |
|---------|------|-------------|
| `make list-labels` | Non-interactive | List all labels |
| `make list-labels filter=X` | Non-interactive | List labels matching X |
| `make set-label label=X` | Non-interactive | Switch to label X directly |
| `make set-label` | **Interactive** | Opens picker UI (humans only) |
| `make current-label` | Non-interactive | Show currently configured label |

#### Build Operations

| Command | Description |
|---------|-------------|
| `make build` | Build Debug for current label |
| `make build label=X` | Set label + build Debug |
| `make build CONFIG=Release` | Build Release for current label |
| `make release` | Shorthand for `build CONFIG=Release` |
| `make release label=X` | Set label + build Release |
| `make clean` | Clean build folder |
| `make clean-derived` | Clear DerivedData only (faster than nuke) |

#### Simulator Operations

| Command | Description |
|---------|-------------|
| `make install` | Uninstall + install build on simulator (auto-boots) |
| `make launch` | Launch app on simulator |
| `make run` | Build + install + launch (full cycle) |
| `make run label=X` | Set label + build + install + launch |
| `make fresh` | Uninstall + install + launch (test fresh launch) |
| `make uninstall-app` | Remove app from simulator |
| `make restart-simulator` | Restart simulator (preserves apps) |
| `make reset-simulator` | Erase simulator + delete DerivedData + reboot |
| `make open-simulator` | Open Simulator.app |

#### Diagnostics

| Command | Description |
|---------|-------------|
| `make info` | Show built app info (bundle ID, name, URL scheme) |
| `make app-info` | Show installed app info from simulator |
| `make doctor` | Check dev environment (Xcode, simulators, pods) |
| `make show-crashes` | Show recent crash reports |

#### Debugging & Tools

| Command | Description |
|---------|-------------|
| `make stream-logs` | Stream app logs (Ctrl+C to stop) |
| `make logs` | Alias for stream-logs |
| `make open-xcode` | Open Xcode workspace |
| `make install-pods` | Run `pod install` |
| `make run-tests` | Run unit tests |
| `make test-bridge` | Run bridge/EventRouter tests only |
| `make nuke` | Clear ALL caches + reinstall pods (nuclear option) |

### Common Workflows

**Kiro: Build and run a specific label:**
```bash
cd native/ios/wrapper
make run label=bwin_sportsbook_at_dev
```

**Kiro: Full cache clear and rebuild (after weird build issues):**
```bash
cd native/ios/wrapper
make nuke
make run label=bwin_sportsbook_at_dev
```

**Kiro: Just switch label (no build):**
```bash
cd native/ios/wrapper
make set-label label=bwin_casino_live_dev
```

**Kiro: Find a label name:**
```bash
cd native/ios/wrapper
make list-labels filter=casino
```

**Kiro: Check current label:**
```bash
cd native/ios/wrapper
make current-label
```

**Kiro: Full debug cycle:**
```bash
cd native/ios/wrapper
make run label=bwin_sportsbook_at_dev
make stream-logs  # in separate terminal, or after Ctrl+C from app
```

### ⚠️ IMPORTANT: Reset Working Files Before Committing

After switching labels, these files are modified but should NOT be committed:
- `Debug_Label.json` - local label selection
- `Resources/sw/Common/*` - overlaid brand resources  
- `BuildConfig/Generated/Label_Current.xcconfig` - generated file

**Always reset before committing:**
```bash
git checkout -- Debug_Label.json Resources/sw/Common/ BuildConfig/Generated/Label_Current.xcconfig
```

---

## Labels & xcconfig Structure

### What is a Label?

A label defines a specific app variant: brand + distribution type. Labels are auto-discovered from `BuildConfig/Labels/`.

**Label naming pattern:** `{brand}_{product}_{variant}_{distribution}`
- `bwin_sportsbook_at_dev` → Bwin Sports AT, development signing
- `bwin_sportsbook_at_beta` → Bwin Sports AT, enterprise signing
- `bwin_sportsbook_at` → Bwin Sports AT, App Store signing

### Two Independent Build Dimensions

#### Dimension 1: Xcode Configuration (compiler settings)
- `Debug` - no optimization, logging on, HTTP allowed
- `Release` - optimized, logging off, HTTPS only

#### Dimension 2: Distribution Type (signing & bundle ID)
- `_dev` suffix → development signing, `.dev` bundle suffix
- `_beta` suffix → enterprise signing, `.ent` bundle suffix
- no suffix → App Store signing, production bundle ID

**Common combinations:**

| Use Case | Label suffix | Xcode Config | Result |
|----------|--------------|--------------|--------|
| Local dev | `_dev` | Debug | Dev signing, debuggable |
| Local dev (fast) | `_dev` | Release | Dev signing, optimized |
| TestFlight | `_beta` | Release | Enterprise signing |
| App Store | (none) | Release | Production signing |

### xcconfig File Locations

```
BuildConfig/
├── Labels/{bundle.id}/
│   ├── Dev.xcconfig      # _dev labels
│   ├── Beta.xcconfig     # _beta labels
│   └── Release.xcconfig  # production labels
├── Dev/
│   └── Debug_Wrapper.xcconfig   # Debug build settings
├── Release/
│   └── Release_Wrapper.xcconfig # Release build settings
└── Generated/
    └── Label_Current.xcconfig   # Generated by set-label
```

### How xcconfigs Combine

```
Debug_Wrapper.xcconfig                      ← Xcode "Debug" config
    └── Generated/Label_Current.xcconfig    ← generated by make set-label
            └── Labels/com.bwin.sportsbook.at/Dev.xcconfig  ← app identity
```

---

## Debugging

### Log Streaming

Stream all bridge, router, and launch events (Ctrl+C to stop):

```bash
xcrun simctl spawn booted log stream --level debug --predicate 'subsystem == "com.app.wrapper"'
```

### Log Format

All logs use consistent `[Category]` prefix with emojis for visual scanning:

| Category | Emoji | Examples |
|----------|-------|----------|
| `[Launch]` | 🚀 | `123ms checkpoint`, summary at FCP |
| `[Bridge]` | 🌉 | `← EVENT 0.05ms`, `Splash removed` |
| `[Router]` | 📡 | `+ handler: events`, `→ EVENT → handler` |
| `[WebView]` | 🌐 | `start url`, `commit 136ms url`, `finish 229ms url` |
| `[Lifecycle]` | 📱 | `→ active`, `→ background` |
| `[Network]` | 📶 | `✓ reachable via wifi` |
| `[Auth]` | 🔐 | `login started`, `✓ login success` |
| `[Biometric]` | 🔓 | `prompt shown (FaceID)`, `✓ success` |
| `[Geo]` | 📍 | `check started`, `✓ success`, `✗ failed` |
| `[Config]` | ⚙️ | `batch request started`, `✓ success` |
| `[Push]` | 🔔 | `token received`, `notification tapped` |
| `[Nav]` | 🔗 | `deep link received`, `queued` |
| `[Tap]` | 👆 | `touchstart → target` (native) |
| `[JS]` | ⚡ | JavaScript evaluation |
| `[Memory]` | ⚠️ | Memory warnings |

### Log Conventions

All debug logging uses `os_log` with the `com.app.wrapper` subsystem:

```swift
import os.log

private let log = OSLog(subsystem: DebugLogger.subsystem, category: "myfeature")

#if DEBUG
os_log("🔧 [MyFeature] %{public}@", log: log, type: .debug, message)
#endif
```

Or use the centralized `DebugLogger`:

```swift
DebugLogger.loginStarted()
DebugLogger.geoCheckSuccess(state: "NJ")
DebugLogger.pushNotificationReceived(title: "Bet won!")
```

### Categories

- `launch` - App launch profiling
- `timing` - Bridge events and performance measurements
- `router` - Event routing and handler dispatch
- `webview` - Page load lifecycle
- `lifecycle` - App state transitions
- `network` - Connectivity changes
- `auth` - Login/logout events
- `biometric` - TouchID/FaceID
- `geo` - GeoComply checks
- `config` - Batch config loading
- `push` - Push notifications
- `nav` - Deep links

### ⚠️ Confusing Event Names

**`LOCATION_CHANGE` is NOT GPS** - it's a web URL/route navigation event. When you see this in logs, it means the user navigated to a different page in the web app, not that their physical location changed.

| Event | Meaning |
|-------|---------|
| `LOCATION_CHANGE` | Web route/URL changed (user navigated) |
| `GEO_LOCATION_POSITION` | GPS coordinates sent to web |
| `GET_GEO_LOCATION_POSITION` | Web requesting GPS from native |
| `[iOS-State] significant location change` | Native CLLocationManager detected GPS movement |

---

## Building

### Build Debug

```bash
cd native/ios/wrapper
xcodebuild -workspace Wrapper.xcworkspace -scheme "Wrapper" \
  -destination "platform=iOS Simulator,name=iPhone 17,OS=26.2" \
  -configuration Debug build
```

### Clean Build

```bash
xcodebuild -workspace Wrapper.xcworkspace -scheme "Wrapper" \
  -destination "platform=iOS Simulator,name=iPhone 17,OS=26.2" \
  -configuration Debug clean build
```

### Build Release

```bash
xcodebuild -workspace Wrapper.xcworkspace -scheme "Wrapper" \
  -destination "platform=iOS Simulator,name=iPhone 17,OS=26.2" \
  -configuration Release build
```

### Check Build Result

```bash
xcodebuild ... 2>&1 | grep -E "(error:|BUILD SUCCEEDED|BUILD FAILED)"
```

---

## Running

### Find App Bundle

Multiple DerivedData folders may exist. Find the one with a valid app:

```bash
APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData/Wrapper-*/Build/Products/Debug-iphonesimulator -name "Wrapper.app" -type d -exec test -f {}/Info.plist \; -print -quit)
```

### Clean Install and Launch

```bash
APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData/Wrapper-*/Build/Products/Debug-iphonesimulator -name "Wrapper.app" -type d -exec test -f {}/Info.plist \; -print -quit)
BUNDLE_ID=$(/usr/libexec/PlistBuddy -c "Print :CFBundleIdentifier" "$APP_PATH/Info.plist")
xcrun simctl terminate booted "$BUNDLE_ID" 2>/dev/null || true
xcrun simctl uninstall booted "$BUNDLE_ID" 2>/dev/null || true
xcrun simctl install booted "$APP_PATH"
xcrun simctl launch booted "$BUNDLE_ID"
```

### Terminate App

```bash
BUNDLE_ID=$(/usr/libexec/PlistBuddy -c "Print :CFBundleIdentifier" "$APP_PATH/Info.plist")
xcrun simctl terminate booted "$BUNDLE_ID"
```

### Open Simulator

```bash
open -a Simulator
```

---

## Testing

### Run Specific Tests

```bash
xcodebuild test -workspace Wrapper.xcworkspace -scheme "Wrapper" \
  -destination "platform=iOS Simulator,name=iPhone 17,OS=26.2" \
  -only-testing:WrapperTests/EventRouterTests
```

### Run Multiple Test Suites

```bash
xcodebuild test -workspace Wrapper.xcworkspace -scheme "Wrapper" \
  -destination "platform=iOS Simulator,name=iPhone 17,OS=26.2" \
  -only-testing:WrapperTests/EventRouterTests \
  -only-testing:WrapperTests/WebMessageHandlerTests \
  -only-testing:WrapperTests/WebViewBridgeTests
```

### Filter Test Output

```bash
xcodebuild test ... 2>&1 | grep -E "(Test case|TEST SUCCEEDED|TEST FAILED|passed|failed)"
```

### Efficient Test Verification (Single Run)

**Never run the test suite twice to get different info.** Combine greps:

```bash
# Get pass/fail status AND count in one run
xcodebuild test ... 2>&1 | tee /tmp/test.log; \
  echo "---"; \
  grep -c "Test case.*passed" /tmp/test.log; \
  grep -E "(TEST SUCCEEDED|TEST FAILED)" /tmp/test.log

# Or inline without temp file (shows last few results + summary)
xcodebuild test ... 2>&1 | grep -E "(Test case.*passed|TEST SUCCEEDED|TEST FAILED)" | tail -10
```

---

## Simulator Management

### List Available Simulators

```bash
xcrun simctl list devices available
```

### Boot Simulator

```bash
xcrun simctl boot "iPhone 17"
```

### Get Booted Simulator

```bash
xcrun simctl list devices booted
```

---

## Project Structure

```
native/ios/wrapper/
├── Wrapper.xcworkspace    # Always use workspace (CocoaPods)
├── Wrapper.xcodeproj/     # Project file
├── Wrapper/               # Main app source
│   ├── Bridge/           # Native bridge components
│   ├── Classes/          # View controllers, utilities
│   └── ...
├── WrapperTests/          # Unit tests
└── Pods/                  # CocoaPods dependencies
```

---

## Common Issues

### "Framework not found"

Use workspace, not project:
```bash
# Wrong
xcodebuild -project Wrapper.xcodeproj ...

# Correct
xcodebuild -workspace Wrapper.xcworkspace ...
```

### Old Code Still Running After Build

Multiple DerivedData folders exist. Always:
1. Use `clean build` 
2. Find app bundle with valid `Info.plist`
3. Uninstall before installing

### Logs Not Appearing

- Ensure `#if DEBUG` wraps logging code
- Use `os_log` not `print()` for log stream visibility
- Check subsystem predicate matches exactly
- All logs must use `.debug` type

### Simulator Not Found

List available simulators and use exact name:
```bash
xcrun simctl list devices available | grep iPhone
```

### ⚠️ CRITICAL: Verify Simulator Availability Before Builds

**Always check the target simulator exists before running `xcodebuild`.** Build commands will fail with cryptic errors if the simulator name or OS version doesn't match an available device.

**Check available simulators:**
```bash
# List all available iPhone simulators
xcrun simctl list devices available | grep iPhone

# Example output:
#     iPhone 17 (A1B2C3D4-E5F6-...) (Shutdown)
#     iPhone 17 Pro (B2C3D4E5-F6A7-...) (Booted)
```

**Verify before build:**
```bash
# Check if specific simulator exists
SIMULATOR_NAME="iPhone 17"
if ! xcrun simctl list devices available | grep -q "$SIMULATOR_NAME"; then
    echo "❌ Simulator '$SIMULATOR_NAME' not found. Available simulators:"
    xcrun simctl list devices available | grep iPhone
    exit 1
fi
```

**Common causes of simulator mismatch:**
- Xcode update changed available simulators (e.g., `iPhone 16` → `iPhone 17`)
- OS version in destination doesn't exist (e.g., `OS=26.2` when only `26.0` installed)
- Simulator name has changed (e.g., `iPhone 14 Pro` vs `iPhone 17 Pro`)

**Fix: Update destination to match available simulators:**
```bash
# Get the latest available iOS version
LATEST_OS=$(xcrun simctl list runtimes | grep iOS | tail -1 | sed 's/.*iOS \([0-9.]*\).*/\1/')

# Get first available iPhone simulator
SIMULATOR=$(xcrun simctl list devices available | grep iPhone | head -1 | sed 's/.*\(iPhone[^(]*\).*/\1/' | xargs)

# Use in build command
xcodebuild -workspace Wrapper.xcworkspace -scheme "Wrapper" \
  -destination "platform=iOS Simulator,name=$SIMULATOR,OS=$LATEST_OS" \
  -configuration Debug build
```

**For Kiro:** Before any build command, verify the simulator exists. If the build fails with "device not found" or similar, list available simulators and adjust the destination parameter.

### No `timeout` Command on macOS

macOS doesn't have `timeout`. Use alternatives:
```bash
# Option 1: Use & and sleep + kill
command & PID=$!; sleep 10; kill $PID 2>/dev/null

# Option 2: Install coreutils via Homebrew
brew install coreutils
gtimeout 10 command

# Option 3: For log streaming, just use Ctrl+C
xcrun simctl spawn booted log stream ...  # Ctrl+C to stop
```

---

## Known Issues / TODO

### AppDelegate window Property (CRITICAL)

**Status:** ✅ FIXED (2026-01-12)

**Root Cause:** The SceneDelegate migration (commit `caa3bb7b213`) removed `var window: UIWindow?` from AppDelegate, assuming all labels would use SceneDelegate. However, ~39 labels still use `UIMainStoryboardFile` without `UIApplicationSceneManifest`, which requires the `window` property.

**Symptom:** App launches but shows blank white screen - WebView never loads.

**Fix:** AppDelegate MUST have `var window: UIWindow?` for backward compatibility:

```swift
class AppDelegate: UIResponder {
    /// Required for labels using UIMainStoryboardFile (without SceneDelegate)
    var window: UIWindow?
    // ...
}
```

**Labels affected:** ~39 labels without `UIApplicationSceneManifest` in Info.plist, including:
- BetMGM Sports/Casino NJ (`com.playmgmsports.nj`, `com.playmgmcasino.nj`)
- Borgata (`com.borgata.sports`, `com.borgatacasino.casino`)
- Ontario labels (`on.betmgm.*`, `on.bwin.*`, `on.party.*`)
- German labels (`de.bwin.*`, `de.premium.*`)
- And others

**Prevention:** When merging from `develop/native-ios`:
1. Never remove `var window: UIWindow?` from AppDelegate
2. Check if changes assume SceneDelegate-only - many labels still use old lifecycle
3. Test with a label that does NOT have `UIApplicationSceneManifest` (e.g., `playmgmsports_nj_dev`)

### ~~State Switcher Mid-Session Detection Not Working~~ (RESOLVED 2026-01-12)

**Status:** ✅ FIXED

**Root Cause:** `CLLocationManager` was being created on a background thread. `startMonitoringLocationChanges()` is called from `parseLocation()`, which runs inside a `Task {}` block after a network call. Swift Tasks can run on background threads, so the `significantLocationManager` was created on a background thread. CLLocationManager delivers delegate callbacks on the thread where it was created, and background threads don't have a run loop, so callbacks were silently dropped.

**Fix:** Added main thread check at the start of `startMonitoringLocationChanges()`:
```swift
if !Thread.isMainThread {
    DispatchQueue.main.async { [weak self] in
        self?.startMonitoringLocationChanges()
    }
    return
}
```

**Lesson learned:** Always ensure CLLocationManager is created and used on the main thread. Code inside `Task {}` blocks or after `await` may run on arbitrary threads.

**Key files:**
- `native/ios/wrapper/Wrapper/GeoComplyManager/DeviceLocationManager.swift`
- `native/ios/wrapper/docs/GEOLOCATION_SYSTEMS.md` (threading documentation added)

### ~~UserDataModel Data Race~~ (RESOLVED 2026-01-12)

**Status:** ✅ FIXED

**Root Cause:** `isLoggedIn` was written from a background thread during logout (called from `Task {}` in DeviceLocationManager during state switch) while being read from main thread in 30+ UI locations.

**Fix:** Wrapped `isLoggedIn` assignment in `DispatchQueue.main.async`:
```swift
func logout() {
    DispatchQueue.main.async {
        self.isLoggedIn = NSNumber(value: false)
    }
    self.security = nil
}
```

**Key file:** `native/ios/wrapper/Wrapper/Classes/Models/UserDataModel.swift`


---

## Merging from develop/native-ios

The `origin/develop/native-ios` branch has 12+ targets (Sports, Casino, Bingo variants). Our branch has 1 unified `Wrapper` target. Special handling required.

### project.pbxproj Conflicts

**NEVER take "theirs" for project.pbxproj.** Their file is 4x larger with duplicate entries for each target.

**Strategy:**
1. Keep our project.pbxproj (`git checkout --ours`)
2. Identify new files from their branch
3. Manually add to our single Wrapper target

**Required entries for new Swift files:**

```
// 1. PBXBuildFile (Sources) - near line 24
XXXXXXXX2E952DCC00BEE567 /* NewFile.swift in Sources */ = {isa = PBXBuildFile; fileRef = YYYYYYYY2E952DCC00BEE567 /* NewFile.swift */; };

// 2. PBXFileReference - alphabetically sorted section ~line 570
YYYYYYYY2E952DCC00BEE567 /* NewFile.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = NewFile.swift; sourceTree = "<group>"; };

// 3. Add to PBXGroup (find parent folder's group)
children = (
    YYYYYYYY2E952DCC00BEE567 /* NewFile.swift */,
    ...
);

// 4. Add to Wrapper Sources build phase (AFE13471255AC35200203F29)
files = (
    XXXXXXXX2E952DCC00BEE567 /* NewFile.swift in Sources */,
    ...
);
```

**Required entries for new SPM packages:**

```
// 1. PBXBuildFile (Frameworks) - near line 24
333AB5202EBB0CF800C5472E /* PackageName in Frameworks */ = {isa = PBXBuildFile; productRef = 333AB51F2EBB0CF800C5472E /* PackageName */; };

// 2. XCRemoteSwiftPackageReference - ~line 4820
333AB51E2EBB0CF800C5472E /* XCRemoteSwiftPackageReference "package-repo" */ = {
    isa = XCRemoteSwiftPackageReference;
    repositoryURL = "https://github.com/org/package-repo";
    requirement = { kind = upToNextMajorVersion; minimumVersion = 1.0.0; };
};

// 3. XCSwiftPackageProductDependency - ~line 4950
333AB51F2EBB0CF800C5472E /* PackageName */ = {
    isa = XCSwiftPackageProductDependency;
    package = 333AB51E2EBB0CF800C5472E /* XCRemoteSwiftPackageReference "package-repo" */;
    productName = PackageName;
};

// 4. Add to project's packageReferences array (~line 3395)
333AB51E2EBB0CF800C5472E /* XCRemoteSwiftPackageReference "package-repo" */,

// 5. Add to Wrapper's packageProductDependencies (~line 3285)
333AB51F2EBB0CF800C5472E /* PackageName */,

// 6. Add to Wrapper Frameworks build phase (AFE13452255AC35200203F29)
333AB5202EBB0CF800C5472E /* PackageName in Frameworks */,
```

### Compile-Time Flag Migration

**Critical:** We eliminated 142 compile-time flags. Convert any merged `#if BW_*` to runtime:

| Compile-Time Flag | Runtime Replacement |
|-------------------|---------------------|
| `#if BW_MINI_GAMES_SUPPORTED` | `if FeatureFlags.shared.sliderGamesEnabled` |
| `#if BW_US_UNIFIED_APP` | `if FeatureFlags.shared.usUnifiedApp` |
| `#if BW_GEOCOMPLY_ENABLED` | `if FeatureFlags.shared.geoComplyEnabled` |
| `#if BW_ONFIDO_ENABLED` | `if FeatureFlags.shared.onfidoEnabled` |
| `#if BW_SPORTS_AUTHADA_SUPPORTED` | `if FeatureFlags.shared.authadaEnabled` |

**For imports:** SliderGames is always linked (CocoaPod), import unconditionally:
```swift
// ✅ Correct
import SliderGames

// ❌ Wrong - compile-time flag
#if BW_MINI_GAMES_SUPPORTED
import SliderGames
#endif
```

### EventRouter Migration

Their code may use old NotificationCenter pattern for JS→Native events:

```swift
// ❌ Their pattern (old)
NotificationCenter.default.addObserver(self, 
    selector: #selector(messageToNative),
    name: .MessageToNativeNotificationName, object: nil)

@objc func messageToNative(notification: Notification) {
    guard let event = notification.object as? CCBModel else { return }
    // handle event
}

// ✅ Our pattern (EventRouter)
EventRouter.shared.register(id: "MyManager", for: [
    event1, event2, event3
]) { [weak self] eventName, parameters in
    let ccbModel = parameters != nil ? CCBParameters(info: parameters!) : nil
    self?.handleEvent(eventName, ccbModel: ccbModel)
}
```

### Post-Merge Verification

Run all 6 build scenarios:

```bash
cd native/ios/wrapper

# 1. Non-Unity Simulator
make set-label label=bwin_sportsbook_at_dev
xcodebuild -workspace Wrapper.xcworkspace -scheme Wrapper \
  -destination "platform=iOS Simulator,name=iPhone 17,OS=26.2" build

# 2. Non-Unity Device
xcodebuild -workspace Wrapper.xcworkspace -scheme Wrapper \
  -destination "generic/platform=iOS" build \
  CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO

# 3. Unity Simulator
make set-label label=playmgmsports_nj_dev
xcodebuild -workspace Wrapper.xcworkspace -scheme Wrapper \
  -destination "platform=iOS Simulator,name=iPhone 17,OS=26.2" build

# 4. Unity Device
xcodebuild -workspace Wrapper.xcworkspace -scheme Wrapper \
  -destination "generic/platform=iOS" build \
  CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO

# 5. German KYC Simulator
make set-label label=bpremium_sportsbook_de_dev
xcodebuild -workspace Wrapper.xcworkspace -scheme Wrapper \
  -destination "platform=iOS Simulator,name=iPhone 17,OS=26.2" build

# 6. German KYC Device
xcodebuild -workspace Wrapper.xcworkspace -scheme Wrapper \
  -destination "generic/platform=iOS" build \
  CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO
```

**Note:** Device builds without `CODE_SIGNING_ALLOWED=NO` will fail if provisioning profiles aren't installed. This is expected - the flag verifies code compiles for arm64.

### Files to Reset Before Committing

After switching labels, these files change but should NOT be committed:

```bash
git checkout -- \
  Debug_Label.json \
  Resources/sw/Common/ \
  BuildConfig/Generated/Label_Current.xcconfig
```


---

## Long-Term Vision: Kotlin Multiplatform (KMP)

### Strategy: Share Logic, Keep Native UI

The long-term goal is to migrate shared business logic to **Kotlin Multiplatform (KMP)** while keeping platform-native UI:

```
┌─────────────────────────────────────────────────────────────┐
│                      Shared (KMP)                           │
│  • Bridge event routing (EventRouter)                       │
│  • State detection & switching                              │
│  • Config parsing (Dynacon/Batch)                           │
│  • Location monitoring                                      │
│  • Session management                                       │
│  • Analytics/tracking                                       │
└─────────────────────────────────────────────────────────────┘
                    │                       │
         ┌─────────┴─────────┐   ┌─────────┴─────────┐
         │   iOS (Swift)     │   │  Android (Kotlin) │
         │   • UIKit/SwiftUI │   │  • Jetpack/Views  │
         │   • WKWebView     │   │  • Android WebView│
         │   • Native UX     │   │  • Native UX      │
         └───────────────────┘   └───────────────────┘
```

### Benefits

- **Single source of truth** for business logic
- **Consistent behavior** across platforms
- **Faster feature development** - implement once
- **Easier maintenance** - fix bugs once
- **Native UI performance** - no cross-platform UI framework

### Migration Path

1. **Current:** Separate Swift (iOS) and Java (Android) codebases
2. **Phase 1:** Audit and align architectures (in progress)
3. **Phase 2:** Extract shared logic interfaces
4. **Phase 3:** Implement shared module in Kotlin
5. **Phase 4:** Integrate KMP into both apps

### Candidates for Shared Logic

| Component | Complexity | Value |
|-----------|------------|-------|
| EventRouter | Low | High |
| State detection | Medium | High |
| Config parsing | Medium | Medium |
| Location monitoring | Medium | High |
| Session management | High | High |
| Bridge protocol | Low | High |

### Not Shared (Platform-Specific)

- UI components (UIKit/SwiftUI vs Jetpack/Views)
- WebView integration (WKWebView vs Android WebView)
- Platform APIs (CLLocationManager vs FusedLocationProvider)
- App lifecycle handling (UIApplicationDelegate vs Application)
- Push notification handling (APNs vs FCM)
- Biometric authentication (LocalAuthentication vs BiometricPrompt)

### Current Audit Alignment

The iOS and Android audits are identifying architectural patterns that can be unified:

| Pattern | iOS (Current) | Android (Current) | KMP Target |
|---------|---------------|-------------------|------------|
| Event routing | EventRouter | Broadcast to all | Shared EventRouter |
| State detection | Native CLLocationManager | Web-triggered | Shared logic, platform APIs |
| Config loading | Background thread | Main thread (blocking) | Shared async logic |
| Debug logging | DebugLogger.swift | DebugLogger.java | Shared logging |
