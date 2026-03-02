# Toggle Backend Product in AppHost

Automatically enable or disable a backend product API in the AppHost configuration.

## Usage

Provide the product name (e.g., "Bingo", "MokaBingo", "Lotto", "Horseracing") and this command will:
1. Check if the product is currently enabled or disabled
2. Toggle its state (enable if disabled, disable if enabled)
3. Apply all necessary changes across the three required files

## Available Products to Toggle

Based on `ProductApi.cs`, ALL products can be toggled:

**Currently Enabled (by default):**
- **Sports** - `sports-api`
- **Ozone** - `ozone-api` 
- **Promo** - `promo-api`
- **Poker** - `poker-api`
- **MyAccount** - `myaccount-api`
- **Payments** - `payments-api`
- **Engagement** - `engagement-api`
- **Casino** - `casino-api`

**Currently Disabled (commented out):**
- **MokaBingo** - `mokabingo-api`
- **Lotto** - `lotto-api`
- **Horseracing** - `horseracing-api`
- **Bingo** - `bingo-api`

Note: Any product can be toggled on or off, including the currently enabled ones.

## Instructions for AI

When user requests: "Toggle [ProductName] backend" or "Enable/Disable [ProductName]":

### Step 1: Check Current State

Check `backend/host-app/Frontend.AppHost.AppHost/ProductApi.cs` to see if the product line is commented:
- If line starts with `//public static readonly ProductApi [ProductName]` → **Currently DISABLED**
- If line starts with `public static readonly ProductApi [ProductName]` → **Currently ENABLED**

### Step 2: Apply Toggle Changes

Based on the current state, apply the opposite changes:

#### If Currently DISABLED → ENABLE

**File 1:** `backend/host-app/Frontend.AppHost.AppHost/ProductApi.cs`
- Uncomment the product line (remove `//` prefix)
- Example: `//public static readonly ProductApi Bingo = new ("bingo", "bingo-api");`
- Becomes: `public static readonly ProductApi Bingo = new ("bingo", "bingo-api");`

**File 2:** `backend/host-app/Frontend.AppHost.AppHost/Frontend.AppHost.AppHost.csproj`
- Add project reference in alphabetical order within the `<ItemGroup>` section
- Format: `<ProjectReference Include="..\..\[productfolder]\Frontend.[ProductName].Api\Frontend.[ProductName].Api.csproj" />`
- Examples:
  - Bingo: `<ProjectReference Include="..\..\bingo\Frontend.Bingo.Api\Frontend.Bingo.Api.csproj" />`
  - MokaBingo: `<ProjectReference Include="..\..\mokabingo\Frontend.MokaBingo.Api\Frontend.MokaBingo.Api.csproj" />`
  - Lotto: `<ProjectReference Include="..\..\lottery\Frontend.Lottery.Api\Frontend.Lottery.Api.csproj" />`
  - Horseracing: `<ProjectReference Include="..\..\horseracing\Frontend.HorseRacing.Api\Frontend.HorseRacing.Api.csproj" />`

**File 3:** `backend/host-app/Frontend.AppHost.AppHost/DistributedApplicationBuilderExtensions.cs`
- Add the conditional block in logical order (after similar products)
- Template:
```csharp
if (projectsToRun.Contains(ProductApi.[ProductName]))
{
    projects.Add(builder.AddProject<Projects.Frontend_[ProductName]_Api>(ProductApi.[ProductName].Value, launchProfileName: launchProfileName));
}
```
- Examples:
  - Bingo: `Projects.Frontend_Bingo_Api`
  - MokaBingo: `Projects.Frontend_MokaBingo_Api`
  - Lotto: `Projects.Frontend_Lottery_Api` (note: Lottery, not Lotto)
  - Horseracing: `Projects.Frontend_HorseRacing_Api`

#### If Currently ENABLED → DISABLE

**File 1:** `backend/host-app/Frontend.AppHost.AppHost/ProductApi.cs`
- Comment out the product line (add `//` prefix)
- Example: `public static readonly ProductApi Bingo = new ("bingo", "bingo-api");`
- Becomes: `//public static readonly ProductApi Bingo = new ("bingo", "bingo-api");`

**File 2:** `backend/host-app/Frontend.AppHost.AppHost/Frontend.AppHost.AppHost.csproj`
- Remove the project reference line for this product

**File 3:** `backend/host-app/Frontend.AppHost.AppHost/DistributedApplicationBuilderExtensions.cs`
- Remove the entire conditional block for this product (the `if` statement and its body)

### Step 3: Report Changes

After applying changes, report:
- Product name
- Action taken (ENABLED or DISABLED)
- Files modified
- Next step: "Restart AppHost to see changes"

## Product Name Mappings

| Product Name | ProductApi Value | Project Name | Folder Name |
|--------------|------------------|--------------|-------------|
| Sports | sports | Frontend_Sports_Api | sports |
| Ozone | ozone | Frontend_Oxygen_Api | oxygen |
| Promo | promo | Frontend_Promo_Api | promo |
| Poker | poker | Frontend_Poker_Api | poker |
| MyAccount | myaccount | Frontend_MyAccount_Api | myaccount |
| Payments | payments | Frontend_Payments_Api | payments |
| Engagement | engagement | Frontend_Engagement_Api | engagement |
| Casino | casino | Frontend_Casino_Api | casino |
| Bingo | bingo | Frontend_Bingo_Api | bingo |
| MokaBingo | mokabingo | Frontend_MokaBingo_Api | mokabingo |
| Lotto | lotto | Frontend_Lottery_Api | lottery |
| Horseracing | horseracing | Frontend_HorseRacing_Api | horseracing |

**Special Cases:**
- Ozone → Oxygen (folder and project name)
- Lotto → Lottery (folder and project name)
- Horseracing → HorseRacing (project name uses PascalCase)

## Example Usage

**User:** "Toggle Bingo backend"

**AI Response:**
1. Check ProductApi.cs → Bingo is currently commented (DISABLED)
2. Apply ENABLE changes to all 3 files
3. Report: "✅ Bingo backend ENABLED. Restart AppHost to see bingo-api in Resources."

**User:** "Toggle Bingo backend" (again)

**AI Response:**
1. Check ProductApi.cs → Bingo is currently uncommented (ENABLED)
2. Apply DISABLE changes to all 3 files
3. Report: "✅ Bingo backend DISABLED. Restart AppHost and bingo-api will be removed from Resources."

## Notes

- Always check the current state first before toggling
- Maintain alphabetical order in project references
- Use correct project names (note: Lotto → Lottery, Horseracing → HorseRacing)
- Frontend routes remain available through host app regardless of backend state
- Disabling backends reduces resource usage during local development

