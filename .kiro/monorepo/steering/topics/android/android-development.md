# Android Development Guide

## Philosophy

All Android development workflows should be executable from the command line. Android Studio is optional for routine tasks.

---

## ⚠️ IMPORTANT: Never Blame the Emulator

**The emulator works correctly.** If something isn't working:
- Check your code first
- Verify permissions are granted
- Ensure location is being sent (`adb emu geo fix`)
- Check if GPS provider has a cached location (`adb shell dumpsys location`)

Do NOT assume "emulator issues" - debug the actual problem.

---

## ⚠️ CRITICAL: Known Performance Issues

### GTM Triple-Loading (FIXED January 2026)

**The Android app was loading Google Tag Manager THREE times:**

1. **Native: `SingleInitializeManager.initTagManager()`** - 500ms blocking main thread
2. **Native: `InitializeManager.initTagManager()`** - 500ms blocking main thread  
3. **Web: GTM loaded via JavaScript** - the only one that should exist

**Impact:** 1000ms added to app startup, completely unnecessary.

**Why this happened:**
- Legacy code from when native had more UI (SliderGames tracking)
- Copy-paste between `SingleInitializeManager` and `InitializeManager`
- No one noticed because it "worked"

**Fix:** Removed both native GTM calls. Web GTM handles all tracking.

**Lesson:** The wrapper app should be THIN. If web already does something, native shouldn't duplicate it.

**iOS comparison:** iOS never loaded the GTM SDK. It uses Firebase Analytics (`Analytics.logEvent`) which can forward to GTM server-side. No blocking, no duplication.

| Platform | GTM SDK | Blocking | Approach |
|----------|---------|----------|----------|
| iOS | ❌ None | 0ms | Firebase Analytics only |
| Android (before) | ✅ 2x | 1000ms | Loaded GTM SDK twice |
| Android (after) | ❌ None | 0ms | Removed, web handles it |
| Web | ✅ 1x | N/A | The only place GTM should exist |

### SensitivePageHandler Regex Bug (TODO)

**Problem:** `SensitivePageHandler` takes 2-9ms per invocation because it compiles regex patterns on every call.

```java
// This treats EVERY url pattern as regex - compiles on each call!
for (String page : notificationPages) {
    if (loadedURL.matches(page)) {  // ← Regex compilation here, 2-5ms
```

**Issues:**
1. `String.matches()` compiles regex on every call (~2-5ms)
2. No pattern caching - same patterns recompiled repeatedly  
3. Called for ALL 43 events, but only cares about `ON_PAGE_LOAD` and `SensitivePage`
4. Nested loops: O(hosts × pages) iterations

**Fix:** EventRouter will reduce invocations. Regex patterns should be pre-compiled at config load time.

### CloudFlare Request Interception (Staging/Beta Only)

**Location:** `ParentWebViewClient.shouldInterceptRequest()` (line 261-300)

**Problem:** In staging/beta environments, when `cloudFlareAccessConfig.isInterceptAllUrls()` is true, the code does **synchronous HTTP calls** for every WebView resource:

```java
// This blocks the WebView thread for EVERY resource load
HttpURLConnection connection = (HttpURLConnection) urlString.openConnection();
// ... headers ...
InputStream inputStream = connection.getInputStream();  // BLOCKING!
```

**Impact:** 
- Blocks WebView resource loading thread
- Every JS, CSS, image, font file waits for synchronous HTTP
- Only affects staging/beta, but slows development testing significantly

**Fix:** Use OkHttp async client or cache CloudFlare headers.

### SharedPreferences.commit() Overuse (P3)

**Problem:** 161 uses of `commit()` vs 69 uses of `apply()` in betdroid-lib.

- `commit()` is **synchronous** - blocks calling thread until write completes
- `apply()` is **asynchronous** - returns immediately, writes in background

**Key offenders:**
- `Prefs.java` - 30+ commit() calls
- `EnvPrefs.java` - 5 commit() calls
- `ActivityHelper.java` - commit() in loops

**Impact:** Minor (milliseconds per call), but adds up during startup and state changes.

**Fix:** Replace `commit()` with `apply()` except where return value is needed.

---

## EventRouter (IN PROGRESS)

### Status

EventRouter created at `betdroid-lib/src/main/com/bwinlabs/betdroid_lib/bridge/EventRouter.java`.

**Mirrors iOS pattern:**
- Handlers register for specific events they care about
- Events only dispatch to registered handlers (not all 43)
- Processing happens off main thread, handlers called on main thread
- Legacy fallback for unregistered events

### Usage

```java
// Register handler for specific events
EventRouter.getInstance().register("SensitivePageHandler", 
    Arrays.asList("ON_PAGE_LOAD", "SensitivePage", "SENSITIVE_PAGE"), 
    (eventName, params) -> {
        // Handle event
    });

// Unregister when done
EventRouter.getInstance().unregister("SensitivePageHandler");
```

### Migration Plan

1. ✅ **Phase 1:** Create EventRouter with legacy fallback
2. 🔄 **Phase 2:** Migrate handlers one by one to register with EventRouter
3. ⏳ **Phase 3:** Remove legacy broadcast system from WebContainer

### Expected Impact

| Metric | Before | After |
|--------|--------|-------|
| Handlers per event | 43 | 1-3 (only registered) |
| SensitivePageHandler calls | Every event | Only ON_PAGE_LOAD, SensitivePage |
| Bridge overhead | 45ms total | ~5ms total |

### Current Migration Status (January 2026)

**37 handlers migrated to EventRouter:**

| Handler | Events | Status |
|---------|--------|--------|
| SensitivePageHandler | ON_PAGE_LOAD, SensitivePage, SENSITIVE_PAGE | ✅ |
| GetGeoLocationHandler | GET_GEO_LOCATION_POSITION | ✅ |
| GameActiveHandler | GAME_IS_ACTIVE | ✅ |
| GameCloseHandler | CASINO_IDLE_GAME_CLOSED | ✅ |
| GameExitHandler | CASINO_GAME_EXIT | ✅ |
| RegistrationHandler | POST_REGISTRATION | ✅ |
| LanguageSwitchHandler | LANGUAGE_CHANGED | ✅ |
| LoginFailHandler | LOGIN_FAILED | ✅ |
| PasswordUpdateHandler | PASSWORD_UPDATED, PasswordUpdated | ✅ |
| PreviewPDFDownloadHandler | PREVIEW_DOWNLOAD_PDF | ✅ |
| UploadDocHandler | UPLOAD_DOC | ✅ |
| OpenMapsHandler | OPEN_MAPS | ✅ |
| ApplicationSettingsHandler | GET/SET/UPDATE_APPLICATION_SETTINGS | ✅ |
| AppInitilizedHandler | APP_INITIALIZED | ✅ |
| CCBInitlizeHandler | CCB_INITIALIZED, SET_TRACKER_IDS | ✅ |
| FeatureloadedHandler | FEATURE_LOADED | ✅ |
| TrackingEventHandler | BETPLACEMENT, BETCONFIRMATION, BETSLIP, DEPOSIT, WITHDRAW, REGISTRATION, LOGIN, LOGOUT, PAGE_VIEW | ✅ |
| LogoutHandler | LOGOUT | ✅ |
| InterceptorLoginHandler | PRE_LOGIN, POST_LOGIN | ✅ |
| ValidateCCBHandler | PRE_LOGIN, POST_LOGIN, IS_LOGGED_IN, REGISTRATION | ✅ |
| DataMigrationHandler | initiateMigrationFlow | ✅ |
| RememberMeFailHandler | REMEMBER_ME_LOGIN_FAILED | ✅ |
| KycProcessInitlizeHandler | KYC_PROCESS_INITALIZED, NEED_CAMERA_ACCESS, CAMERA_PERMISSION_GRANTED | ✅ |
| LoginInterceptorHandler | LOGIN_INTERCEPTOR | ✅ |
| KycBeaconsPoolingHandler | START_BEACON_POLLING, STOP_BEACON_POLLING | ✅ |
| ShareIntentHandler | ShareMyBet | ✅ |
| MasterAccountDetailsHandler | MASTER_ACCOUNT_DETAILS, LOGIN_USERNAME_PREFILL | ✅ |
| GPayHandler | GPAY_IS_READY_TO_PAY, GPAY_LOAD_PAYMENT_DATA | ✅ |
| DownloadHandler | DownloadAppClicked | ✅ |
| TriggertGeoLocationHandler | TRIGGER_GEO_LOCATION | ✅ |
| FastLoginHandler | Login_Screen_Active, IS_LOGGED_IN, LOGOUT | ✅ |
| StateSwitcherHandler | Location | ✅ |
| DeviceNotificationsHandler | isNotificationEnabled | ✅ |
| OSPrimerHandler | enableOSPrimer, SensitivePage, CCB_INITIALIZED | ✅ |
| SplashDismissHandler | FIRST_CONTENTFUL_PAINT, APP_INITIALIZED, FEATURE_LOADED | ✅ |
| ForceHeaderHandler | ON_PAGE_LOAD, RETRIEVE_POST_LOGIN | ✅ |
| NativeLoginHandler | OpenLogin, OpenRegistration, OpenInNewWebView | ✅ |
| NevadaCcbHandler | ON_PAGE_LOAD, OPEN_MENU, LOGOUT, etc. | ✅ |

**Legacy handler count: 45 → 6 (87% reduction)**

**Remaining in legacy (6 handlers):**

| Handler | Reason |
|---------|--------|
| InitiateRiskAssessmentHandler | Empty stub, overridden in US labels |
| DeepLinkHandler | Doesn't filter events, just logs |
| WMIDHandler | Config-driven, listens for dynamic events from Dynacon |
| kycMessageFromWeb | Empty stub, overridden in KYC labels |
| onfidoMessage | Empty stub, overridden in Onfido labels |
| OneTimePageLoadHandler | Config-driven, listens for dynamic events |

### Why 6 Handlers Remain in Legacy

These handlers are either:

1. **Empty stubs** - Methods like `kycMessageFromWeb()` and `onfidoMessage()` are empty in `HomeActivityWrapper` but overridden in label-specific subclasses. Migrating these requires updating all subclasses.

2. **Config-driven** - `WMIDHandler` and `OneTimePageLoadHandler` listen for events specified in Dynacon config, not hardcoded event names. They check `DeeplinkConfig.getDeepLinkNavCCB()` at runtime to determine which event to process.

3. **No-op handlers** - `DeepLinkHandler.messageFromWeb()` just logs and returns. It's kept for other methods like `handleDeepLink()`.

### Parity with iOS

| Metric | Android (Before) | Android (Now) | iOS |
|--------|------------------|---------------|-----|
| Application.onCreate | 1118ms | **113ms** | ~100ms |
| Activity.onCreate | - | **156ms** | ~150ms |
| Splash dismissed | ~5000ms | **~3200ms** | ~3000ms |
| Legacy handlers | 45 | **6** | 0 |
| EventRouter handlers | 0 | **37** | 13 |
| Events routed | 0% | **~95%** | 100% |

iOS has 13 EventRouter registrations vs Android's 37 because:
- Android has more handlers (legacy codebase)
- iOS consolidated handlers during audit
- Android has label-specific handlers (Nevada, NJ, etc.)

### Launch Timeline (Android)

```
🚀 [Launch] app start
🚀 [Launch] 14ms Firebase init
🚀 [Launch] 94ms Dynacon init start
🚀 [Launch] 118ms Application.onCreate complete
🚀 [Launch] 156ms HomeActivityWrapper.onCreate
🚀 [Launch] ~2500ms splash FRAGMENT CLOSED (user sees content)
🚀 [Launch] ════════════════════════════════════════
🚀 [Launch] Total launch-to-content: ~2500ms
🚀 [Launch] ════════════════════════════════════════
```

### Next Steps for Full Parity

To migrate the remaining 6 handlers:

1. **Empty stubs** - Move subclass overrides to EventRouter registrations in each label's Activity
2. **Config-driven** - Add dynamic event registration to EventRouter based on Dynacon config
3. **DeepLinkHandler** - Can be removed from legacy since `messageFromWeb` is a no-op

This is lower priority since the remaining handlers don't significantly impact performance.

---

## Documentation

| Document | Location | Purpose |
|----------|----------|---------|
| **Technical Reference** | `player-experience-engineering-strategy/docs/native/Android_Technical_Reference.md` | Architecture, classes, bridge |
| **Audit Plan** | `player-experience-engineering-strategy/docs/native/Android_Technical_Audit_Plan.md` | Audit findings, fixes |
| **iOS Comparison** | `player-experience-engineering-strategy/docs/native/iOS_Technical_Audit_Remediation.md` | Reference for Android fixes |

---

## Environment Setup

### Install Android Studio (Recommended)

```bash
brew install --cask android-studio
```

**First Launch Setup:**
1. Open Android Studio from `/Applications/Android Studio.app`
2. Complete setup wizard (downloads SDK ~2GB)
3. Tools → Device Manager → Create Device
4. Select Pixel 7 → Next → API 36 (download if needed) → Finish
5. Click play button to start emulator

Android Studio bundles Java, SDK, and emulator - no separate Java install needed.

### Environment Variables (One-Time Setup)

**⚠️ CRITICAL: Run this once to add paths permanently to your shell:**

```bash
echo 'export ANDROID_HOME=~/Library/Android/sdk
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"' >> ~/.zshrc && source ~/.zshrc
```

After this, `adb`, `emulator`, and `java` will be available in all new terminal sessions.

**For Kiro:** These paths are now in the user's `.zshrc`. No need to export them in every command.

### Verify Installation

```bash
# Check Java
java --version

# Check ADB
adb --version

# Check emulator
emulator -list-avds
```

---

## wrapper_sports Repository

**Location:** `/Users/Stephen.Jayna/repos/wrapper_sports`  
**Branch:** `f/sj-android-audit-fixes`

### Quick Start

```bash
cd /Users/Stephen.Jayna/repos/wrapper_sports

# Build + install BetMGM Sports NJ
./gradlew :labels:wrapper-playmgm-nj:installBetaDebug

# Launch app
adb shell am start -n com.playmgm.nj.sports_beta/com.bwinlabs.wrapper_playmgm_nj.ui.activity.HomeActivitySWPlaymgm

# Stream logs
adb logcat -s "Wrapper"
```

### Build Flavors

| Flavor | App ID | Signing | Use |
|--------|--------|---------|-----|
| `beta` | `com.playmgm.nj.sports_beta` | Debug | Local dev |
| `prod` | `com.playmgm.nj.sports` | Release | Production |
| `prodMarket` | `com.playmgm.nj.sports` | Release | Play Store |

### Release Builds (Play Store Signed)

To build `prodMarket` flavor (Play Store signed APK), you need keystore files and signing credentials.

**Setup:**

1. Ask an Android team member for:
   - `local.properties` file (contains signing credentials)
   - `do_not_delete.zip` (contains keystore files)

2. Extract keystores to a local directory:
   ```bash
   mkdir -p ~/keystores
   cd ~/keystores
   unzip ~/Downloads/do_not_delete.zip
   ```

3. Update `local.properties` paths for macOS:
   - Replace Windows paths (`C:\\wrapper\\do_not_delete\\`) with your local path
   - Example: `/Users/YourName/keystores/do_not_delete/`
   - Update `sdk.dir` to your Android SDK path

4. Copy `local.properties` to the repo root:
   ```bash
   cp ~/Downloads/local.properties /path/to/wrapper_sports/local.properties
   ```

**Build:**

```bash
cd /path/to/wrapper_sports
./gradlew :labels:wrapper-playmgm-nj:assembleProdMarketRelease
```

**Output:**
```
labels/wrapper-playmgm-nj/build/outputs/apk/prodMarket/release/betMGMSports_playmarket.apk
```

**⚠️ IMPORTANT:** Never commit `local.properties` or keystore files to version control.

### Key Labels

| Label | Gradle Path | Product |
|-------|-------------|---------|
| BetMGM Sports NJ | `:labels:wrapper-playmgm-nj` | Sports |
| BetMGM Sports PA | `:labels:wrapper-mgm-pa` | Sports |
| BetMGM Casino NJ | `:labels:cas-wrapper-playmgm-nj` | Casino |
| Borgata Sports NJ | `:labels:wrapper-borgata-nj` | Sports |

### APK Output Location

```
labels/wrapper-playmgm-nj/build/outputs/apk/build/out/wrapper-playmgm-nj-betaDebug.apk
```

---

## Debug Logging

### DebugLogger System

Created centralized logging at `betdroid-lib/src/main/com/bwinlabs/betdroid_lib/util/DebugLogger.java`.

**Stream all app logs:**
```bash
adb logcat -s "Wrapper"
```

### Log Categories

| Category | Emoji | Example |
|----------|-------|---------|
| Launch | 🚀 | `🚀 [Launch] 1159ms Application.onCreate complete` |
| Bridge | 🌉 | `🌉 [Bridge] ← FEATURE_LOADED (→ 44 handlers)` |
| WebView | 🌐 | `🌐 [WebView] finish 316ms https://...` |
| Lifecycle | 📱 | `📱 [Lifecycle] onCreate HomeActivityWrapper` |
| Network | 📶 | `📶 [Network] ✓ reachable via wifi` |
| Auth | 🔐 | `🔐 [Auth] ✓ login success` |
| Biometric | 🔓 | `🔓 [Biometric] prompt shown` |
| Geo | 📍 | `📍 [Geo] ✓ success NJ` |
| Config | ⚙️ | `⚙️ [Config] ✓ batch success (1055ms)` |
| Push | 🔔 | `🔔 [Push] token received` |
| Nav | 🔗 | `🔗 [Nav] deeplink received` |
| State | 🗺️ | `🗺️ [State] switch NJ → PA` |

### Sample Output

```
🚀 [Launch] app start
🚀 [Launch] 27ms Firebase init
🚀 [Launch] 104ms Dynacon init start
🚀 [Launch] 1159ms Application.onCreate complete
📱 [Lifecycle] onCreate HomeActivityWrapper
🌐 [WebView] start https://www.nj.betmgm.com/en/sports
🌉 [Bridge] ← CCB_INITIALIZED (→ 45 handlers)
🌉 [Bridge] ← FEATURE_LOADED (→ 44 handlers)
🚀 [Launch] 4094ms splash dismissed
```

### Usage in Code

```java
import com.bwinlabs.betdroid_lib.util.DebugLogger;

// Launch timing
DebugLogger.launchAppStart();
DebugLogger.launchCheckpoint("Firebase init");
DebugLogger.launchSplashDismissed();

// Bridge events
DebugLogger.bridgeEventReceived("FEATURE_LOADED");
DebugLogger.bridgeEventSent("IS_LOGGED_IN");

// WebView
DebugLogger.webViewLoadStart(url);
DebugLogger.webViewPageFinished(url);

// Config
DebugLogger.configBatchStarted();
DebugLogger.configBatchSuccess();
```

---

## ⚠️ CRITICAL: Emulator AVDs for Market Testing

Three AVDs are configured to simulate devices across different markets:

| AVD Name | Market | Cores | RAM | Simulates |
|----------|--------|-------|-----|-----------|
| **Flagship_US** | US | 6 | 8GB | Pixel 8 Pro, Galaxy S24 Ultra |
| **MidRange_EU** | Europe | 4 | 4GB | Pixel 6a, Samsung A54 |
| **Budget_BR** | Brazil | 2 | 2GB | Moto G, Samsung A14 |

### Why This Matters

- **US users** typically have flagship devices - test for feature richness
- **European users** have mid-range devices - test for balanced performance
- **Brazilian users** often have budget devices - test for low-memory handling

### Quick Start Commands

```bash
export ANDROID_HOME=~/Library/Android/sdk
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

# List available AVDs
emulator -list-avds

# Start flagship (US testing)
emulator -avd "Flagship_US" -dns-server 8.8.8.8,8.8.4.4 -no-snapshot-load &

# Start mid-range (EU testing)
emulator -avd "MidRange_EU" -dns-server 8.8.8.8,8.8.4.4 -no-snapshot-load &

# Start budget (BR testing)
emulator -avd "Budget_BR" -dns-server 8.8.8.8,8.8.4.4 -no-snapshot-load &
```

### AVD Configuration Location

AVD configs are in `~/.android/avd/`. Key settings in `config.ini`:

```ini
hw.cpu.ncore=6    # CPU cores
hw.ramSize=8192   # RAM in MB
```

### Creating/Modifying AVDs

To create a new AVD or modify existing:

```bash
# Copy existing config
mkdir -p ~/.android/avd/NewDevice.avd
cp ~/.android/avd/Flagship_US.avd/config.ini ~/.android/avd/NewDevice.avd/

# Create ini file
cat > ~/.android/avd/NewDevice.ini << EOF
avd.ini.encoding=UTF-8
path=$HOME/.android/avd/NewDevice.avd
path.rel=avd/NewDevice.avd
target=android-36.1
EOF

# Modify hardware specs
sed -i '' 's/hw.cpu.ncore=.*/hw.cpu.ncore=4/' ~/.android/avd/NewDevice.avd/config.ini
sed -i '' 's/hw.ramSize=.*/hw.ramSize=4096/' ~/.android/avd/NewDevice.avd/config.ini
```

---

## Emulator Commands

### ⚠️ CRITICAL: Ensure Emulator is Running Before Testing

**Always verify an emulator is running before any `adb` commands.** Commands will fail silently or with cryptic errors if no device is connected.

```bash
# Check if emulator is running
adb devices

# Expected output when running:
# List of devices attached
# emulator-5554   device

# If empty or "offline", start the emulator first
```

**For Kiro:** Before running any build+install+test sequence, ALWAYS run this check-and-start pattern:

```bash
export ANDROID_HOME=~/Library/Android/sdk
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

# Check and start emulator if needed
if ! adb devices | grep -q "emulator.*device"; then
    echo "Starting emulator..."
    nohup emulator -avd "Flagship_US" -dns-server 8.8.8.8,8.8.4.4 -no-snapshot-load > /tmp/emulator.log 2>&1 &
    for i in {1..30}; do
        sleep 1
        adb devices | grep -q "emulator.*device" && break
    done
fi
adb devices
```

### Start Emulator

```bash
# List available AVDs
emulator -list-avds

# Start with DNS fix (required for network)
emulator -avd "Flagship_US" -dns-server 8.8.8.8,8.8.4.4 -no-snapshot-load &

# Wait for boot
adb shell getprop sys.boot_completed  # Returns "1" when ready
```

### ⚠️ CRITICAL: Start Emulator Fully Detached (for Kiro)

**Problem:** If the emulator is started with simple `&` or `nohup ... &`, it may still be attached to the terminal session. When Kiro's command is interrupted (Ctrl+C), the emulator dies too.

**Solution:** Launch via Terminal.app which creates a truly independent process:

```bash
# Write launcher script
cat > /tmp/start_emu.sh << 'EOF'
#!/bin/bash
export PATH="$HOME/Library/Android/sdk/platform-tools:$HOME/Library/Android/sdk/emulator:$PATH"
emulator -avd "Flagship_US" -dns-server 8.8.8.8,8.8.4.4 -no-snapshot-load
EOF
chmod +x /tmp/start_emu.sh

# Launch in separate Terminal window
open -a Terminal /tmp/start_emu.sh

# Wait for boot
for i in {1..30}; do
    sleep 1
    adb devices 2>/dev/null | grep -q "emulator.*device" && echo "Ready" && break
done
```

**Why this works:** `open -a Terminal` spawns a completely separate process tree owned by Terminal.app, not Kiro's shell. Ctrl+C in Kiro won't affect it.

**Note:** Double-fork (`( nohup ... & ) &`) and `setsid` do NOT work reliably on macOS for this use case.

### Set Location

```bash
# Newark, NJ (note: longitude first, then latitude)
adb emu geo fix -74.1724 40.7357

# Common locations
adb emu geo fix -74.0060 40.7128   # New York, NY
adb emu geo fix -75.1652 39.9526   # Philadelphia, PA
adb emu geo fix -115.1398 36.1699  # Las Vegas, NV
adb emu geo fix -118.2437 34.0522  # Los Angeles, CA
```

### ⚠️ CRITICAL: Keep Google Maps Running for Route Playback

**The emulator only delivers location updates when an app is actively listening.** If using Extended Controls route playback:

```bash
# Start Maps in background BEFORE launching your app
adb shell am start -n com.google.android.apps.maps/com.google.android.maps.MapsActivity

# Then launch your app - it will get fresh coordinates from the route
adb shell am start -n com.playmgm.nj.sports_beta/com.bwinlabs.wrapper_playmgm_nj.ui.activity.HomeActivitySWPlaymgm
```

**Why:** Without an active location listener, the emulator caches the last known position and doesn't process route updates. Maps keeps a listener active, forcing the emulator to deliver coordinates.

**Alternative:** Use single-point location instead of routes - `adb emu geo fix` works without Maps running.

### App Management

```bash
# Launch app
adb shell am start -n com.playmgm.nj.sports_beta/com.bwinlabs.wrapper_playmgm_nj.ui.activity.HomeActivitySWPlaymgm

# Force stop
adb shell am force-stop com.playmgm.nj.sports_beta

# Uninstall
adb uninstall com.playmgm.nj.sports_beta

# Clear data
adb shell pm clear com.playmgm.nj.sports_beta
```

### Debugging

```bash
# Check current activity
adb shell dumpsys activity activities | grep -i "playmgm" | head -5

# Get app info
adb shell dumpsys package com.playmgm.nj.sports_beta | grep -E "version|install"

# Kill emulator
adb emu kill
```

---

## Project Structure

```
wrapper_sports/
├── betdroid-lib/                    # Core library
│   └── src/main/com/bwinlabs/betdroid_lib/
│       ├── ui/activity/             # Activities
│       │   ├── HomeActivity.java    # Base activity
│       │   ├── HomeActivityWrapper.java  # Main (184KB!)
│       │   └── HomeActivitySWrapper.java # Sports variant
│       ├── wrapper_handler/         # Bridge handlers (52 files)
│       │   ├── CCBConstants.java    # Event constants
│       │   ├── StateSwitcherHandler.java
│       │   ├── SplashDismissHandler.java
│       │   └── ...
│       ├── location/                # GPS services
│       │   └── LocationHelper.java
│       ├── initialize/loadtask/     # Config loading
│       │   └── DynaconConfigLoadTask.java
│       ├── util/                    # Utilities
│       │   ├── Logger.java          # Legacy logger
│       │   └── DebugLogger.java     # NEW: Centralized logging
│       └── BetdroidApplication.java # Application class
├── bwinwebviewengine/               # WebView engine
│   └── src/main/java/com/ivy/bwinwebviewengine/
│       ├── WebContainer.java        # WebView wrapper
│       └── WebContainerInterface.java # Handler base
├── labels/                          # Brand variants (100+)
│   └── wrapper-playmgm-nj/          # BetMGM Sports NJ
├── lib-geocomply/                   # GeoComply SDK
└── build.gradle                     # Root build config
```

---

## Key Classes

| Class | Size | Purpose |
|-------|------|---------|
| `HomeActivityWrapper.java` | 184KB | Main activity, handler registration |
| `BetdroidApplication.java` | 57KB | App init, Firebase, Dynacon |
| `LocationHelper.java` | 19KB | FusedLocationProviderClient |
| `WebContainer.java` | - | Bridge dispatch, WebView wrapper |
| `StateSwitcherHandler.java` | 5KB | State switching |
| `SplashDismissHandler.java` | - | Splash dismiss on FCP |
| `Prefs.java` | 132KB | SharedPreferences (500+ keys) |

---

## Bridge Architecture

### Event Flow

```
Web App (JS)
    │
    ▼ window.messageToNative({eventName: "...", ...})
    │
JsNativeBridge.java
    │
    ▼ sendMessageToNative(json)
    │
WebContainer.java
    │
    ▼ notifyObserver() → ALL 45 handlers
    │
Handler 1, Handler 2, ... Handler 45
    │
    └── Each filters by eventName
```

### Key Events

| Event | Direction | Purpose |
|-------|-----------|---------|
| `CCB_INITIALIZED` | Web→Native | Bridge ready |
| `APP_INITIALIZED` | Web→Native | Web app ready |
| `FIRST_CONTENTFUL_PAINT` | Web→Native | Dismiss splash |
| `FEATURE_LOADED` | Web→Native | Component loaded |
| `GET_GEO_LOCATION_POSITION` | Web→Native | Request GPS |
| `GEO_LOCATION_POSITION` | Native→Web | GPS response |
| `IS_LOGGED_IN` | Both | Login state |
| `STATE_SWITCH` | Web→Native | State change |

### ⚠️ Known Issue

Every event dispatches to ALL 45 handlers. Each handler must filter by event name.

**Impact:** `FEATURE_LOADED` fires 50+ times = 2250+ handler invocations.

**Fix Needed:** Implement EventRouter pattern (like iOS).

---

## Performance Findings

### Launch Timeline

| Checkpoint | Elapsed | Notes |
|------------|---------|-------|
| App start | 0ms | BetdroidApplication.onCreate |
| Firebase init | 27ms | Fast |
| Dynacon init start | 104ms | - |
| Dynacon complete | 1159ms | ⚠️ **1055ms blocking!** |
| Activity onCreate | 1197ms | - |
| WebView start | 2260ms | - |
| FCP / Splash dismiss | 4094ms | User sees content |

### Issues Identified

| Issue | Impact | Priority |
|-------|--------|----------|
| Blocking batch call | 1055ms on main thread | P0 |
| 45 handlers per event | O(n) dispatch | P1 |
| No native state detection | 4-5 min delay | P1 |
| FEATURE_LOADED spam | 50+ events | P2 |
| 20s splash timeout | vs iOS 4s | P2 |

---

## Git Rules

- Always ask before committing or pushing changes
- Only `git add` specific files you intend to commit
- Never amend commits after they've been pushed
- Branch: `f/sj-android-audit-fixes`

---

## Related Documentation

- [Android Technical Reference](../../../player-experience-engineering-strategy/docs/native/Android_Technical_Reference.md)
- [Android Audit Plan](../../../player-experience-engineering-strategy/docs/native/Android_Technical_Audit_Plan.md)
- [iOS Development Guide](../ios/ios-development.md)
- [iOS Technical Audit](../../../player-experience-engineering-strategy/docs/native/iOS_Technical_Audit_Remediation.md)


---

## Bridge Performance Analysis

### Measurement Results (January 2026)

| Metric | Value |
|--------|-------|
| Total events (launch) | 73 |
| Handlers per event | 43-45 |
| Total handler invocations | ~3,200 |
| **Total bridge time** | **44.91 ms** |
| Average per event | 0.615 ms |

### Event Breakdown

| Event | Count | Total Time | Notes |
|-------|-------|------------|-------|
| `FEATURE_LOADED` | 56 | 13.36 ms | 77% of events |
| `ON_PAGE_LOAD` | 2 | 13.31 ms | Slow handler |
| `FIRST_CONTENTFUL_PAINT` | 4 | 7.22 ms | |
| `GET_APPLICATION_SETTINGS` | 1 | 5.56 ms | |
| Others | 10 | 5.46 ms | |

### Slowest Handlers

| Handler | Total Time | Notes |
|---------|------------|-------|
| `SensitivePageHandler` | 11.23 ms | 5.6 ms per call |
| `SplashDismissHandler` | 5.98 ms | One-time |
| `ApplicationSettingsHandler` | 5.40 ms | One-time |
| `DeepLinkHandler` | 2.59 ms | 0.32 ms per call |
| `TrackingEventHandler` | 1.63 ms | 0.035 ms per call |

### Key Insight

**Bridge overhead is NOT the main bottleneck.** 45 ms total is acceptable.

The real issues are:
1. **Blocking batch call** - 1,055 ms (P0)
2. **Slow individual handlers** - SensitivePageHandler, ApplicationSettingsHandler (P2)
3. **FEATURE_LOADED spam** - 56 events (P2)

### Revised Priority

| Issue | Original Priority | Revised Priority | Reason |
|-------|-------------------|------------------|--------|
| Blocking batch call | P0 | **P0** | 1,055 ms on main thread |
| EventRouter pattern | P1 | **P3** | Only 45 ms overhead |
| Slow handlers | - | **P2** | 11 ms for SensitivePageHandler |
| FEATURE_LOADED spam | P2 | **P2** | 56 events, web team fix |
| Native state detection | P1 | **P1** | 4-5 min delay |


---

## Long-Term Vision: Kotlin Multiplatform (KMP)

### Strategy: Share Logic, Keep Native UI

The long-term goal is to migrate shared business logic to **Kotlin Multiplatform (KMP)** while keeping platform-native UI:

```
┌─────────────────────────────────────────────────────────────┐
│                      Shared (KMP)                           │
│  • Bridge event routing                                     │
│  • State detection & switching                              │
│  • Config parsing (Dynacon)                                 │
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

1. **Current:** Separate Java (Android) and Swift (iOS) codebases
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

- UI components
- WebView integration
- Platform APIs (CLLocationManager, FusedLocationProvider)
- App lifecycle handling
- Push notification handling
