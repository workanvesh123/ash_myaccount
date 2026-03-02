---
inclusion: fileMatch
fileMatchPattern: ['packages/themepark/**/*']
---

# Themepark – Multi-Brand Theming System

## 1. Role & Scope

### What Themepark does
- Provides multi-brand theming infrastructure for all products (sports, casino, bingo, poker, etc.)
- Manages 30+ brand themes (bwin, coral, ladbrokes, mgm, party, sportingbet, etc.) with shared codebase
- Defines design tokens (colors, typography, spacing, icons) via SCSS variables and CSS custom properties
- Supports theme inheritance (e.g., `premium` inherits from `bwin`, `mgm-dice` inherits from `whitelabel-epcot`)
- Generates brand-specific CSS bundles consumed by product applications

### What Themepark does NOT do
- Does not contain Angular components (use Design System for UI components)
- Does not implement business logic or feature code (belongs in product packages)
- Does not define component-specific styles (components style themselves using Themepark tokens)

**Decision rule:**  
If the change is about **brand-specific colors, fonts, icons, or design tokens**, it belongs in Themepark.  
If it's about **component structure or behavior**, it belongs in **Design System** or **product packages**.

## 2. Public API & Intended Consumers

### Public surface
- Each theme exports: `all-styles.scss`, `_all-configs.scss`, `package.json`
- Themes are consumed via: `@themes/{theme-name}` (e.g., `@themes/bwin`, `@themes/coral`)
- Design tokens exposed as CSS custom properties on `:root` and SCSS variables
- Icon fonts generated per theme in `icons/` directories

### Who is allowed to import Themepark
- ✅ Allowed: All product applications (sports, casino, bingo, poker, myaccount, etc.)
- ✅ Allowed: Design System components (for token references)
- ✅ Allowed: Vanilla shared features
- ❌ Not allowed: Backend services, build tooling (except theme build scripts)

**Rule:**  
Always reference tokens via CSS custom properties (`var(--color-primary)`) or SCSS variables (`$color-primary`), never hardcode hex values.

## 3. Internal Structure & Where to Put New Code

### Directory layout
```
packages/themepark/
├── themes/{theme-name}/          # Individual brand themes
│   ├── configs/                  # SCSS variable definitions
│   │   ├── global/              # Colors, typography, spacing
│   │   └── components/          # Component-specific overrides
│   ├── styles/                   # Theme-specific style rules
│   ├── icons/                    # Brand-specific icon fonts
│   ├── fonts/                    # Brand-specific web fonts
│   ├── img/                      # Brand-specific images
│   ├── _all-configs.scss         # Aggregates all config files
│   └── all-styles.scss           # Aggregates all style files
├── app/                          # Themepark preview application
├── deprecated/                   # Legacy themes (do not extend)
└── themes-data-utils/            # Build utilities for theme generation
```

### Placement rules
- **New brand theme**: Create in `themes/{brand-name}/` following existing structure
- **New design token**: Add to `themes/{theme}/configs/global/` (colors, typography, spacing)
- **Component-specific override**: Add to `themes/{theme}/configs/components/{component}.scss`
- **Brand-specific icon**: Add to `themes/{theme}/icons/` and regenerate icon font
- **Shared base styles**: Add to `themes/whitelabel/` (inherited by most themes)

**If unsure:**  
Check if similar token exists in `whitelabel` theme first. Prefer reusing existing tokens over creating new ones.

## 4. Extension Patterns

### When adding new functionality
- **New theme**: Inherit from `whitelabel` or `whitelabel-epcot` base theme via `peerDependencies` in `package.json`
- **New token**: Define in `configs/global/` using mid-layer SCSS variables that map to CSS custom properties
- **Theme-specific override**: Scope to theme namespace to avoid global impact

### Checklist for new code
- [ ] Uses CSS custom properties (`$xyz`) not raw hex values (`$var-xyz`)
- [ ] Follows BEM naming conventions for class names
- [ ] Runs `yarn stylelint packages/themepark/**/*.scss` before commit
- [ ] Does not create colors/tokens without Design System/UX approval
- [ ] Maps mid-layer variables to existing foundation tokens (never to hex codes)
- [ ] Documents why if using `$var-xyz` instead of `$xyz` (e.g., SASS function requirement)

### Critical SCSS variable rules
- **Always use** `$xyz` (points to CSS custom property) for runtime theming
- **Avoid** `$var-xyz` (points to static hex/value) unless required by SASS functions
- **Never** map new variables to `_colors.scss` directly
- **Never** create foundation tokens (colors, fonts, spacing) without UX/Design System approval

## 5. Invariants & Contracts

### Design token contracts
- Foundation tokens (colors, typography, spacing) defined in `configs/global/`
- Component tokens inherit from foundation tokens via mid-layer variables
- Theme inheritance chain must not create circular dependencies
- Icon fonts must be regenerated when icons change (see documentation)

### Theme inheritance rules
- Child themes inherit parent via `peerDependencies` in `package.json`
- Child themes can override any parent token but must maintain token names
- `whitelabel` is the base theme for most brands
- `whitelabel-epcot` is the base for specific brands (mgm-dice, sports-interaction, sportingbet-br)

**Rule:**  
Changes to `whitelabel` theme have **global impact** across all child themes. Test thoroughly before committing.

## 6. Dependencies

### Allowed dependencies
- `@themes/whitelabel` or `@themes/whitelabel-epcot` (base themes)
- SCSS preprocessor and PostCSS plugins
- Icon font generation tools

### Forbidden dependencies
- Angular framework or components (Themepark is pure CSS/SCSS)
- Product-specific code from sports, casino, bingo, etc.
- Direct imports from Design System components

### Third-party usage
- SCSS/SASS for preprocessing
- PostCSS with autoprefixer (see `packages/dev-kit/src/browserslist/index.js`)
- Icon font generation tooling

**Rule:**  
Themepark is a pure styling layer. Never introduce Angular or JavaScript dependencies.

## 7. Testing Expectations

### Visual testing
- Themepark app (`yarn nx serve themepark-app`) provides visual preview of all themes
- Test theme changes across multiple brands before committing
- Verify inheritance chain works correctly for child themes

### Build validation
- Run `yarn nx build-themes themepark-{theme-name}-theme` to validate SCSS compilation
- Run `yarn stylelint packages/themepark/**/*.scss` to catch style violations
- Test with specific theme: `yarn nx serve themepark-app -c {theme-name}`
- Test all themes: `yarn nx serve themepark-app -c all`

**Rule:**  
Always test changes in at least 3 themes: `whitelabel` (base), `bwin` (reference), and the target brand.

## 8. Migration / Legacy

### Legacy sub-areas (avoid extending)
- `packages/themepark/deprecated/` – Old theme versions, do not modify
- Themes marked with version suffixes (e.g., `borgata` vs `borgata-2`) – prefer latest version

### Migration guidelines
- New themes must use CSS custom properties (`$xyz`) not static variables (`$var-xyz`)
- Old themes using `$var-xyz` are read-only unless full migration planned
- Icon font updates require regeneration (see Honey Badgers documentation)

**If you touch legacy code:**  
Coordinate with Honey Badgers team before making changes to deprecated themes or `whitelabel` base.

## 9. Known Pitfalls & FAQ

### Known pitfalls
- **Whitelabel changes impact all themes**: Always test inheritance chain when modifying `whitelabel`
- **SASS functions require `$var-xyz`**: CSS custom properties don't work in SASS functions like `darken()`, use `color-mix()` instead
- **Icon font caching**: Browser may cache old icon fonts, force refresh when testing icon changes
- **Theme build order**: Child themes must build after parent themes due to inheritance

### FAQ

**Q: When should I create a new theme vs modify existing?**  
A: Create new theme for new brand. Modify existing theme only for that brand's updates. Never modify `whitelabel` for brand-specific needs.

**Q: Where do I add a new color token?**  
A: Add to `themes/{theme}/configs/global/colors/` following existing file structure. Map to existing foundation color, never to hex code directly.

**Q: How do I test theme changes locally?**  
A: Run `yarn nx serve themepark-app -c {theme-name}` for single theme or `-c all` for all themes. Use `--watch` flag for live reloading.

**Q: Can I override Design System component styles in Themepark?**  
A: Only via design tokens. Never write component-specific CSS in Themepark. Use `configs/components/` for token overrides only.

**Q: What's the difference between `$xyz` and `$var-xyz`?**  
A: `$xyz` points to CSS custom property (runtime theming), `$var-xyz` points to static value (compile-time). Always prefer `$xyz` unless SASS function requires static value.

**Q: How do I add icons to a theme?**  
A: Follow icon addition documentation at honeybadgers.vie.pages.bwinparty.corp/themes/add-icons. Icons must be added to Figma UI-Kit first, then generated into theme.

## Contact & Resources

- **Team**: Honey Badgers (d.dtp.honeybadgers@entaingroup.com)
- **Documentation**: http://honeybadgers.vie.pages.bwinparty.corp/
- **Guidelines**: See `packages/themepark/COLLABORATION.md`
- **CSS Guidelines**: http://honeybadgers.vie.pages.bwinparty.corp/guidelines/css-code-guidelines
