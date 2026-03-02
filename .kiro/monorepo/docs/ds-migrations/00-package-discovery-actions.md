# Package Discovery Actions

## Purpose

Establish product/package context and identify primary brands with their configurations for URL generation. This action runs **ONCE per package** and the results are cached for all components in that package.

---

## Critical Rule: Code Proof Required

**Every statement in the output document MUST include code proof with file reference.**

- ✅ **Correct**: "Brand: ladbrokes.com (Source: `packages/bingo/e2e/core/src/constants/config-constants.ts:5` - `LABELS = ['ladbrokes.com', ...]`)"
- ❌ **Wrong**: "Brand: ladbrokes.com" (no proof)

**Format for Code Proof**:
```
Statement: {extracted_value}
Source: {file_path}:{line_number}
Code: `{actual_code_snippet}`
```

**Rules**:
1. Every brand name MUST cite the exact file and line number where it was found
2. Every language code MUST cite the exact file and line number from labelBaseUrlMap
3. Every URL pattern MUST cite the exact file and line number where it was extracted
4. If a value uses fallback, explicitly state: "Using fallback (no source found in codebase)"
5. Never infer or assume values - only extract what exists in the code

**Purpose**: Prevent hallucinations and ensure all data is traceable to actual code.

---

## Execution Model

- **Run Once**: Execute this action ONE time per product/package
- **Cache Results**: Store output in `data/{package_name}-context.md`
- **Reuse**: All components in the same package use the cached context

**Example**:
```
Package: bingo with 5 components
→ Run package discovery: 1 time
→ Cache: data/bingo-context.md
→ Components 1-5: Reuse cached context
```

---

## How to Extract Code Proof

**For every value extracted from code**:

1. **Read the file** using `readFile` tool
2. **Identify the exact line number** where the value appears
3. **Copy the actual code snippet** (don't paraphrase or summarize)
4. **Document in format**:
   ```
   Value: {extracted_value}
   Source: {file_path}:{line_number}
   Code: `{actual_code_snippet}`
   ```

**Example - Extracting Brand Names**:
```bash
# Step 1: Read the file
readFile("packages/bingo/e2e/core/src/constants/config-constants.ts")

# Step 2: Find LABELS constant at line 12
# Step 3: Copy actual code from lines 12-16
# Step 4: Document with proof

Brand 1: ladbrokes.com
  Source: packages/bingo/e2e/core/src/constants/config-constants.ts:13
  Code: `'ladbrokes.com',`
```

**Example - Extracting Language Codes**:
```bash
# Step 1: Read the file
readFile("packages/bingo/e2e/core/src/constants/config-constants.ts")

# Step 2: Find labelBaseUrlMap function at line 45
# Step 3: Find return statement for brand at line 48
# Step 4: Document with proof

ladbrokes.com → Language: en
  Source: packages/bingo/e2e/core/src/constants/config-constants.ts:48
  Code: `return 'https://www.ladbrokes.com/en/bingo';`
  Extraction: Parsed /en/ from URL path
```

**Tools to Use**:
- `readFile` - Read source files to extract values
- `grepSearch` - Find specific patterns in files
- Always include line numbers in output
- Always copy actual code, never paraphrase

---

## Process

### Step 1: Read Product Context

**Action**: Read product/package context file
- **Location**: `.kiro/steering/packages/{package_name}/*.md`
- **Extract**: Product overview, architecture, key features, routing patterns

**Example**:
```bash
# For bingo package
Read: .kiro/steering/packages/bingo/bingo-context.md
Read: .kiro/steering/packages/bingo/bingo-entrypoint-lib.context.md
Read: .kiro/steering/packages/bingo/bingo-frontend-lib.context.md
```

---

### Step 2: Extract Brand Configuration (Priority Order)

**Primary Source**: `packages/{product}/e2e/core/src/constants/config-constants.ts`
- **Target**: `LABELS` constant (array of brand strings)
- **Pattern**: `export const LABELS = ['brand1.com', 'brand2.com', 'brand3.com'];`
- **Extract**: 1-3 primary brands (prioritize: sportingbet, ladbrokes, coral, betmgm)

**Example with Code Proof**:
```typescript
// packages/bingo/e2e/core/src/constants/config-constants.ts:12-16
export const LABELS = [
  'ladbrokes.com',
  'coral.co.uk',
  'sportingbet.com'
];
```

**Document as**:
```
Brand 1: ladbrokes.com
  Source: packages/bingo/e2e/core/src/constants/config-constants.ts:13
  Code: `'ladbrokes.com',`

Brand 2: coral.co.uk
  Source: packages/bingo/e2e/core/src/constants/config-constants.ts:14
  Code: `'coral.co.uk',`

Brand 3: sportingbet.com
  Source: packages/bingo/e2e/core/src/constants/config-constants.ts:15
  Code: `'sportingbet.com'`
```

**Secondary Source** (if LABELS not found): `packages/{product}/e2e/core/playwright.config.ts`
- **Target**: `labelProjectConfig()` function calls
- **Pattern**: Look for `labelProjectConfig('brand.com', ...)`
- **Extract**: Brand names from function calls

**Example**:
```typescript
// packages/bingo/e2e/core/playwright.config.ts
export default defineConfig({
  projects: [
    labelProjectConfig('ladbrokes.com', ...),
    labelProjectConfig('coral.co.uk', ...),
    labelProjectConfig('sportingbet.com', ...)
  ]
});
```

**Fallback** (if both sources fail):
```typescript
['sportingbet.com', 'ladbrokes.com', 'coral.co.uk']
```

---

### Step 3: Extract Language Codes

**Action**: Find `labelBaseUrlMap` function in config-constants.ts
- **Target**: `labelBaseUrlMap` function that maps brands to base URLs
- **Pattern**: Extract language codes from URL paths
- **Common Languages**: en, es, pt-br, de, it, el, da, pt, en-ca

**Example with Code Proof**:
```typescript
// packages/bingo/e2e/core/src/constants/config-constants.ts:45-56
export function labelBaseUrlMap(label: string): string {
  switch (label) {
    case 'ladbrokes.com':
      return 'https://www.ladbrokes.com/en/bingo';
    case 'coral.co.uk':
      return 'https://www.coral.co.uk/en/bingo';
    case 'sportingbet.com':
      return 'https://www.sportingbet.com/en/bingo';
    default:
      return '';
  }
}
```

**Document as**:
```
ladbrokes.com → Language: en
  Source: packages/bingo/e2e/core/src/constants/config-constants.ts:48
  Code: `return 'https://www.ladbrokes.com/en/bingo';`
  Extracted: /en/ from URL path

coral.co.uk → Language: en
  Source: packages/bingo/e2e/core/src/constants/config-constants.ts:50
  Code: `return 'https://www.coral.co.uk/en/bingo';`
  Extracted: /en/ from URL path

sportingbet.com → Language: en
  Source: packages/bingo/e2e/core/src/constants/config-constants.ts:52
  Code: `return 'https://www.sportingbet.com/en/bingo';`
  Extracted: /en/ from URL path
```

---

### Step 4: Extract URL Construction Parameters

**Subdomain Selection**:
- **Default**: `www`
- **Exceptions**: 
  - `casino` for vistabet.gr, danskespil.dk, sportingbet.gr
  - Check product-specific patterns in context files

**Product Path Mapping**:
- **Casino**: `games` (default), `casino` (US brands), `slots` (German brands)
- **Bingo**: `bingo`
- **Sports**: `sports`
- **Promo**: `promotions` or product-specific path
- **Source**: Extract from `labelUrlPathSuffix` or product name

**Authentication Requirements**:
- Check if routes require authentication
- Extract from route guards or context files

---

### Step 5: Generate Package Context Document

**Output File**: `data/{package_name}-context.json`

**Format References**:
- **Schema**: `.kiro/templates/ds-migration/data/schemas/package-context.schema.json`
- **Template**: `.kiro/templates/ds-migration/data/package-context.template.json`

**Key Requirements**:
- Follow the JSON schema structure exactly
- Include source references (file path + line number) for all extracted values
- Use the template placeholders as a guide
- Validate against the schema before saving

---

## Outputs

**File**: `data/{package_name}-context.json`

**Format**: JSON following schema at `.kiro/templates/ds-migration/data/schemas/package-context.schema.json`

**Template**: Use `.kiro/templates/ds-migration/data/package-context.template.json` as structure guide

**Contains**:
1. 1-3 primary brands (prioritize: sportingbet, ladbrokes, coral, betmgm)
2. Brand-specific language codes
3. URL construction parameters (subdomain, product path)
4. Authentication requirements
5. Base URL patterns for each brand
6. Source references with file paths and line numbers for all extracted values
7. Validation checklist status

---

## Error Handling

**If LABELS constant not found**:
- Try playwright.config.ts labelProjectConfig calls
- If that fails, use fallback: `['sportingbet.com', 'ladbrokes.com', 'coral.co.uk']`

**If language codes not found**:
- Use default: `en` for all brands

**If URL patterns unclear**:
- Use defaults: subdomain=`www`, product_path=`{product_name}`

**If all sources fail**:
- Continue with defaults and document in context file
- Note: "Using fallback configuration - verify URLs manually"

---

## Validation Checklist

**Before proceeding to component discovery**:
- [ ] Package context file created at `data/{package_name}-context.md`
- [ ] 1-3 primary brands identified **with file references**
- [ ] Language codes extracted for each brand **with file references**
- [ ] URL construction parameters documented **with sources**
- [ ] Base URL patterns validated
- [ ] **Every extracted value has code proof (file:line + code snippet)**
- [ ] **Fallback values are explicitly marked as "Using fallback"**
- [ ] **No inferred or assumed values without code proof**

**Code Proof Validation**:
- [ ] Each brand name cites exact file and line number
- [ ] Each language code cites exact file and line number
- [ ] Each URL pattern component has source attribution
- [ ] All code snippets are actual code from the files (not paraphrased)
- [ ] Line numbers are accurate and verifiable

**If validation fails**:
- Document issues in context file with explanation
- Use fallback values and mark them explicitly
- Continue with component discovery (don't block workflow)
- Note: "⚠️ Some values use fallback - verify URLs manually"
