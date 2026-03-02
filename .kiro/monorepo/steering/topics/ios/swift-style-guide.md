# Swift Style Guide

Modern Swift style guide for iOS wrapper development. Based on Google's Swift Style Guide and Apple's API Design Guidelines, updated for Swift 6.

---

## Swift 6 Concurrency

### Actor Isolation

```swift
// ✅ Use actors for shared mutable state
actor SessionManager {
    private var sessions: [String: Session] = [:]
    
    func add(_ session: Session) {
        sessions[session.id] = session
    }
}

// ✅ Use @MainActor for UI state
@MainActor
final class ViewModel: ObservableObject {
    @Published var items: [Item] = []
}

// ❌ Avoid singletons with shared mutable state
class SessionManager {
    static let shared = SessionManager()
    private var sessions: [String: Session] = [:]  // Data race!
}
```

### Sendable

```swift
// ✅ Value types are implicitly Sendable
struct UserData: Sendable {
    let id: String
    let name: String
}

// ✅ Use @unchecked Sendable only with internal synchronization
final class ThreadSafeCache: @unchecked Sendable {
    private let lock = NSLock()
    private var cache: [String: Data] = [:]
    
    func get(_ key: String) -> Data? {
        lock.lock()
        defer { lock.unlock() }
        return cache[key]
    }
}

// ❌ Never use @unchecked Sendable without synchronization
final class UnsafeCache: @unchecked Sendable {
    private var cache: [String: Data] = [:]  // Data race!
}
```

### Async/Await

```swift
// ✅ Use async/await for asynchronous code
func fetchUser() async throws -> User {
    let data = try await networkService.fetch(endpoint)
    return try decoder.decode(User.self, from: data)
}

// ✅ Use MainActor.run for UI updates in async contexts
Task { [weak self] in
    let result = await fetchData()
    await MainActor.run {
        self?.updateUI(result)
    }
}

// ❌ Avoid mixing GCD with structured concurrency
Task {
    let result = await fetchData()
    DispatchQueue.main.async {  // Unnecessary, use MainActor.run
        self.updateUI(result)
    }
}

// ❌ Never block with semaphores in async code
func badFetch() async -> Data {
    let semaphore = DispatchSemaphore(value: 0)  // Will deadlock!
    // ...
}
```

### Task Management

```swift
// ✅ Always use [weak self] in Task blocks for non-singletons
Task { [weak self] in
    guard let self else { return }
    let data = await fetchData()
    await MainActor.run {
        self.items = data
    }
}

// ✅ Use TaskGroup for parallel work
func fetchAll(ids: [String]) async throws -> [Item] {
    try await withThrowingTaskGroup(of: Item.self) { group in
        for id in ids {
            group.addTask { try await fetchItem(id) }
        }
        return try await group.reduce(into: []) { $0.append($1) }
    }
}

// ✅ Cancel tasks when no longer needed
private var fetchTask: Task<Void, Never>?

func startFetch() {
    fetchTask?.cancel()
    fetchTask = Task { [weak self] in
        // ...
    }
}
```

---

## Naming

### General Rules

```swift
// ✅ Clear, descriptive names
let maximumLoginAttempts = 3
func fetchUserProfile(for userId: String) async throws -> UserProfile

// ❌ Abbreviated or unclear names
let maxAttempts = 3
func fetch(_ id: String) async throws -> UserProfile
```

### Types and Protocols

```swift
// ✅ Types: UpperCamelCase, nouns
struct UserProfile { }
class NetworkManager { }
enum AuthenticationState { }

// ✅ Protocols: UpperCamelCase
// - Capabilities: -able, -ible, -ing
protocol Sendable { }
protocol Loading { }

// - Descriptions: noun
protocol Collection { }
protocol Delegate { }
```

### Functions and Methods

```swift
// ✅ Verb phrases for actions
func removeAll()
func insert(_ item: Item, at index: Int)

// ✅ Noun phrases for accessors
var isEmpty: Bool { }
func distance(to point: Point) -> Double

// ✅ Boolean properties/methods: is, has, can, should
var isEnabled: Bool
var hasContent: Bool
func canPerform(_ action: Action) -> Bool
```

### Parameters

```swift
// ✅ Omit first label when it's clear from function name
func contains(_ element: Element) -> Bool
func append(_ item: Item)

// ✅ Use prepositions for clarity
func move(from source: Int, to destination: Int)
func convert(_ value: Double, to unit: Unit) -> Double

// ✅ Weak type parameters need labels
func add(_ observer: NSObject, for keyPath: String)  // Not: add(_ observer: NSObject, _ keyPath: String)
```

---

## Code Organization

### File Structure

```swift
// 1. Imports (alphabetized, system first)
import Foundation
import UIKit

import MyFramework

// 2. Type declaration
final class MyViewController: UIViewController {
    
    // MARK: - Properties (in order)
    // - IBOutlets
    // - Public properties
    // - Internal properties  
    // - Private properties
    
    @IBOutlet private var tableView: UITableView!
    
    private let viewModel: ViewModel
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Initialization
    
    init(viewModel: ViewModel) {
        self.viewModel = viewModel
        super.init(nibName: nil, bundle: nil)
    }
    
    // MARK: - Lifecycle
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        bindViewModel()
    }
    
    // MARK: - Private Methods
    
    private func setupUI() { }
    private func bindViewModel() { }
}

// 3. Extensions for protocol conformance (separate files for large protocols)
extension MyViewController: UITableViewDataSource {
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        viewModel.items.count
    }
}
```

### Access Control

```swift
// ✅ Explicit access control, most restrictive by default
public struct APIClient {
    public let baseURL: URL
    
    private let session: URLSession
    private let decoder: JSONDecoder
    
    public init(baseURL: URL) {
        self.baseURL = baseURL
        self.session = .shared
        self.decoder = JSONDecoder()
    }
    
    public func fetch<T: Decodable>(_ endpoint: String) async throws -> T {
        // ...
    }
}

// ❌ Avoid default (internal) when public/private is clearer
struct APIClient {  // Should be explicit about intended visibility
    let baseURL: URL
    // ...
}
```

### Extensions

```swift
// ✅ Use extensions to organize code by functionality
extension UserProfile {
    // Computed properties
    var displayName: String {
        "\(firstName) \(lastName)"
    }
}

extension UserProfile: Codable {
    // Protocol conformance in separate extension
}

extension UserProfile {
    // Factory methods
    static func guest() -> UserProfile {
        UserProfile(id: "guest", firstName: "Guest", lastName: "User")
    }
}
```

---

## Control Flow

### Guard for Early Exit

```swift
// ✅ Use guard for preconditions and early exits
func process(_ data: Data?) throws -> Result {
    guard let data else {
        throw ProcessingError.noData
    }
    guard !data.isEmpty else {
        throw ProcessingError.emptyData
    }
    guard let result = parse(data) else {
        throw ProcessingError.parseFailed
    }
    return result
}

// ❌ Avoid nested if-let pyramid
func process(_ data: Data?) throws -> Result {
    if let data {
        if !data.isEmpty {
            if let result = parse(data) {
                return result
            } else {
                throw ProcessingError.parseFailed
            }
        } else {
            throw ProcessingError.emptyData
        }
    } else {
        throw ProcessingError.noData
    }
}
```

### Switch Statements

```swift
// ✅ Exhaustive switches, no default when possible
enum State {
    case idle, loading, loaded(Data), failed(Error)
}

func handle(_ state: State) {
    switch state {
    case .idle:
        showPlaceholder()
    case .loading:
        showSpinner()
    case .loaded(let data):
        showContent(data)
    case .failed(let error):
        showError(error)
    }
}

// ✅ Use where for additional conditions
switch value {
case let x where x < 0:
    handleNegative(x)
case 0:
    handleZero()
case let x:
    handlePositive(x)
}
```

---

## Error Handling

### Custom Errors

```swift
// ✅ Domain-specific errors with associated values
enum NetworkError: Error, LocalizedError {
    case noConnection
    case timeout(seconds: Int)
    case httpError(statusCode: Int, data: Data?)
    case decodingFailed(underlying: Error)
    
    var errorDescription: String? {
        switch self {
        case .noConnection:
            return "No internet connection"
        case .timeout(let seconds):
            return "Request timed out after \(seconds) seconds"
        case .httpError(let code, _):
            return "Server error: \(code)"
        case .decodingFailed:
            return "Failed to process response"
        }
    }
}
```

### Result Type

```swift
// ✅ Use Result for synchronous operations that can fail
func validate(_ input: String) -> Result<ValidatedInput, ValidationError> {
    guard !input.isEmpty else {
        return .failure(.empty)
    }
    guard input.count >= 3 else {
        return .failure(.tooShort(minimum: 3))
    }
    return .success(ValidatedInput(value: input))
}

// Usage
switch validate(userInput) {
case .success(let validated):
    process(validated)
case .failure(let error):
    showError(error)
}
```

---

## Optionals

### Unwrapping

```swift
// ✅ Use if-let / guard-let for safe unwrapping
if let user = currentUser {
    greet(user)
}

guard let url = URL(string: urlString) else {
    return
}

// ✅ Use nil-coalescing for defaults
let name = user?.name ?? "Anonymous"

// ✅ Use optional chaining
let count = user?.posts?.count ?? 0

// ❌ Avoid force unwrapping except in tests or with invariants
let user = currentUser!  // Crash if nil
```

### Implicitly Unwrapped Optionals

```swift
// ✅ Only for IBOutlets and test fixtures
@IBOutlet private var titleLabel: UILabel!

class MyTests: XCTestCase {
    var sut: SystemUnderTest!
    
    override func setUp() {
        sut = SystemUnderTest()
    }
}

// ❌ Never for regular properties
class BadExample {
    var delegate: MyDelegate!  // Use weak var delegate: MyDelegate? instead
}
```

---

## Memory Management

### Weak References

```swift
// ✅ Weak delegates
protocol ViewModelDelegate: AnyObject {
    func viewModelDidUpdate(_ viewModel: ViewModel)
}

class ViewModel {
    weak var delegate: ViewModelDelegate?
}

// ✅ Weak self in closures that outlive the call
networkService.fetch { [weak self] result in
    guard let self else { return }
    self.handleResult(result)
}

// ✅ Unowned when lifetime is guaranteed
class Parent {
    let child: Child
    
    init() {
        child = Child(parent: self)
    }
}

class Child {
    unowned let parent: Parent
    
    init(parent: Parent) {
        self.parent = parent
    }
}
```

---

## Documentation

### When to Document

```swift
// ✅ Document public APIs
/// Fetches the user profile for the given identifier.
///
/// - Parameter userId: The unique identifier of the user.
/// - Returns: The user's profile.
/// - Throws: `NetworkError.notFound` if the user doesn't exist.
public func fetchProfile(for userId: String) async throws -> UserProfile

// ✅ Document non-obvious behavior
/// The cache automatically evicts entries older than 5 minutes.
private let cache = ExpiringCache<String, Data>(ttl: 300)

// ❌ Don't document the obvious
/// The user's name.
var name: String  // Redundant
```

### Format

```swift
/// Brief single-line summary.
///
/// Additional details in a separate paragraph if needed.
/// Can span multiple lines.
///
/// - Parameters:
///   - first: Description of first parameter.
///   - second: Description of second parameter.
/// - Returns: Description of return value.
/// - Throws: Description of errors that can be thrown.
/// - Note: Additional information.
/// - Warning: Important caveats.
```

---

## Formatting

### Line Length

- Maximum 120 characters (Xcode default)
- Break long lines at logical points

### Braces

```swift
// ✅ Opening brace on same line
func doSomething() {
    if condition {
        // ...
    } else {
        // ...
    }
}

// ✅ Single-expression closures can be on one line
let doubled = numbers.map { $0 * 2 }

// ✅ Multi-line closures
let processed = items.map { item in
    let transformed = transform(item)
    return validate(transformed)
}
```

### Whitespace

```swift
// ✅ One blank line between functions
func first() { }

func second() { }

// ✅ No blank lines at start/end of type bodies
struct Example {
    let value: Int
    
    func doSomething() { }
}

// ✅ Spaces around operators
let sum = a + b
let range = 0..<10

// ✅ No space inside parentheses/brackets
let array = [1, 2, 3]
doSomething(with: value)
```

---

## SwiftLint

Enforce style with SwiftLint. Recommended rules:

```yaml
# .swiftlint.yml
disabled_rules:
  - trailing_whitespace  # Handled by Xcode

opt_in_rules:
  - empty_count
  - empty_string
  - fatal_error_message
  - first_where
  - force_unwrapping
  - implicitly_unwrapped_optional
  - last_where
  - legacy_random
  - modifier_order
  - overridden_super_call
  - private_action
  - private_outlet
  - prohibited_super_call
  - redundant_nil_coalescing
  - unowned_variable_capture
  - unused_declaration
  - weak_delegate

line_length:
  warning: 120
  error: 200

type_body_length:
  warning: 300
  error: 500

file_length:
  warning: 500
  error: 1000

function_body_length:
  warning: 50
  error: 100

identifier_name:
  min_length: 2
  excluded:
    - id
    - x
    - y
    - i
    - j
```

---

## Quick Reference

| Topic | Do | Don't |
|-------|-----|-------|
| Concurrency | `await MainActor.run { }` | `DispatchQueue.main.async { }` in Task |
| Shared state | `actor` or `@MainActor` | Singletons with mutable state |
| Closures | `[weak self]` in escaping | Strong capture in long-lived closures |
| Optionals | `guard let`, `if let`, `??` | Force unwrap `!` |
| Delegates | `weak var delegate` | Strong delegate references |
| Early exit | `guard` | Nested `if` pyramid |
| Errors | `throws` + custom `Error` | Return `-1` or `nil` for errors |
| Access | Explicit `private`/`public` | Default internal everywhere |
