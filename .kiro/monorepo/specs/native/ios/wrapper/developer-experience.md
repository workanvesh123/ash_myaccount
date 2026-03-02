# iOS Developer Experience

Quick reference for daily iOS wrapper development. For full details, see the [iOS Technical Audit](ios-audit.md).

**Status:** Unified `Wrapper` target supporting all 138 labels (328 with distribution variants)  
**Branch:** `f/sj-ios-audit-fixes`

---

## Quick Start

```bash
cd native/ios/wrapper

# Build + install + launch
make run label=bwin_sportsbook_at_dev

# Stream logs (Ctrl+C to stop)
make stream-logs

# Check for crashes after launch
make show-crashes
```

---

## Makefile Commands

All commands run from `native/ios/wrapper/`. Run `make help` for full list.

### Label Management
| Command | Description |
|---------|-------------|
| `make list-labels` | List all labels |
| `make list-labels filter=X` | Search by name |
| `make set-label label=X` | Switch to label X (non-interactive) |
| `make set-label` | Interactive picker (humans only) |
| `make current-label` | Show current label |

### Build & Run
| Command | Description |
|---------|-------------|
| `make build` | Build Debug |
| `make build label=X` | Set label + build |
| `make run` | Build + install + launch |
| `make run label=X` | Full cycle for label |
| `make fresh` | Uninstall + install + launch (test fresh state) |
| `make release` | Build Release |

### Debugging
| Command | Description |
|---------|-------------|
| `make stream-logs` | Stream app logs |
| `make show-crashes` | Recent crash reports |
| `make info` | Built app info (bundle ID, URL scheme) |
| `make app-info` | Installed app info |

### Simulator
| Command | Description |
|---------|-------------|
| `make set-location loc=nj` | Set GPS (nj, ny, pa, nv, gb, etc.) |
| `make reset-simulator` | Erase + reboot simulator |
| `make deep-link path=X host=Y` | Open deep link |

---

## Geolocation Testing

**Set location BEFORE app launch** - the app reads GPS at startup:

```bash
# Set location first
make set-location loc=nj    # Newark, NJ

# Then launch
make run label=playmgmsports_nj_dev
```

Run `make set-location` to see all 47 locations (27 US states + 20 countries).

**State caching:** First launch uses GPS. Subsequent launches use cached state. Use `make fresh` to test fresh state detection.

---

## Log Categories

```bash
make stream-logs
```

| Category | Emoji | Purpose |
|----------|-------|---------|
| `[Launch]` | 🚀 | App startup timing |
| `[Bridge]` | 🌉 | JS↔Native events |
| `[Router]` | 📡 | Event routing |
| `[iOS-GPS]` | 📍 | GPS location |
| `[iOS-State]` | 🗺️ | State detection |
| `[Auth]` | 🔐 | Login/logout |
| `[Geo]` | 📍 | GeoComply checks |

---

## Version Identification

The splash screen shows the git commit hash alongside the version number:

```
1.2.3 (0de5569)
```

This makes it trivial to identify exactly which code is running on any device - no more guessing from version numbers alone.

**Note:** `LOCATION_CHANGE` is web navigation, NOT GPS. See `[iOS-GPS]` for actual location.

---

## Before Committing

These files change on label switch but should NOT be committed:

```bash
git checkout -- Debug_Label.json Resources/sw/Common/ BuildConfig/Generated/
```

---

## Thread Safety Patterns

### Shared State Access

**Never write to shared state from async contexts without main thread dispatch:**

```swift
// ✅ Correct - Capture values, dispatch write to main
private func updateRegionDetails() {
    let region = deviceLocation?.region ?? ""
    let coordinates = deviceLocation?.latitude ?? ""
    
    DispatchQueue.main.async {
        EntainContext.regionContext = RegionContext(region: region, ...)
    }
}

// ❌ WRONG - Data race crash!
func callBatchWith(...) async -> APIResponse {
    EntainContext.regionContext = regionContext  // Crash: objc_retain
}
```

**Applies to:** `EntainContext.*`, `AppSessionManager.shared.*`, `UserDataModel.shared.*`, `URLCache.shared`

### CLLocationManager

**Must be created and used on main thread** - callbacks are delivered on creation thread:

```swift
// ✅ Correct
func startMonitoring() {
    if !Thread.isMainThread {
        DispatchQueue.main.async { [weak self] in
            self?.startMonitoring()
        }
        return
    }
    locationManager.startUpdatingLocation()
}

// ❌ WRONG - Callbacks silently dropped!
Task {
    await someNetworkCall()
    locationManager.startUpdatingLocation()
}
```

### Weak Self in Closures

```swift
// ✅ Correct - View controllers, non-singletons
Task { [weak self] in
    let result = await fetchData()
    await MainActor.run {
        self?.updateUI(result)
    }
}

// ✅ OK - Singletons live forever
// AppSessionManager.shared doesn't need weak self
```

---

## Architecture Overview

### One Target, All Products

The `Wrapper` target builds Sports, Casino, and Bingo. Product type is determined at runtime by `channel` in `labelFeatures.plist`:
- `SW` = Sports
- `CW` = Casino  
- `BW` = Bingo

### Build Dimensions

| Dimension | Options | Purpose |
|-----------|---------|---------|
| **Xcode Config** | Debug / Release | Optimization, logging |
| **Distribution** | `_dev` / `_beta` / (none) | Signing, bundle ID suffix |

### Conditional SDKs

Some labels require device-only SDKs:

```bash
# Unity label (BetMGM Sports)
make set-label label=playmgmsports_nj_dev
# Output: ✓ Unity: 0.3.8 (linked)

# German KYC label
make set-label label=bpremium_sportsbook_de_dev
# Output: ✓ German KYC: linked (Authada, Zoom, IDnow)

# Regular label
make set-label label=bwin_sportsbook_at_dev
# Output: ✓ Unity: not needed, ✓ German KYC: not needed
```

Both simulator and device builds work for all labels.

---

## Key Files

| File | Purpose |
|------|---------|
| `Wrapper/Bridge/EventRouter.swift` | JS↔Native message routing |
| `Wrapper/Bridge/BridgeEvent.swift` | Event definitions |
| `Wrapper/Classes/ViewController/WebView/MainViewController.swift` | Main app container |
| `Wrapper/Classes/ViewController/WebView/WebViewController.swift` | WebView management |
| `Wrapper/LabelConfigModels/FeatureFlags.swift` | Runtime feature flags |
| `Wrapper/Classes/APIClasses/BatchService.swift` | App config loading |
| `Wrapper/GeoComplyManager/DeviceLocationManager.swift` | GPS + state detection |
| `Wrapper/Navigation/URLPolicyDecider.swift` | URL policy decisions |

---

## Common Issues

### Logs Not Appearing
- Use `make stream-logs` (includes `--info` flag required for `os_log`)
- Check subsystem predicate: `subsystem == "com.app.wrapper"`

### Simulator Not Found
```bash
xcrun simctl list devices available | grep iPhone
```
Update destination in build command to match available simulator.

### Old Code Still Running
Multiple DerivedData folders may exist. Use `make clean` or `make nuke` for full cache clear.

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| [Technical Audit](ios-audit.md) | Full remediation details |
| [Executive Report](ios-audit-executive-report.md) | Business summary |
| [Steering Guide](../../../steering/topics/ios/ios-development.md) | AI-friendly commands, concurrency patterns |
| [Swift Style Guide](../../../steering/topics/ios/swift-style-guide.md) | Code conventions |
| [JS-Native Contract](../../../../native/ios/wrapper/docs/JS_NATIVE_CONTRACT.md) | Bridge event catalog |
| [Geolocation Systems](../../../../native/ios/wrapper/docs/GEOLOCATION_SYSTEMS.md) | LocationPoll vs GeoComply |
