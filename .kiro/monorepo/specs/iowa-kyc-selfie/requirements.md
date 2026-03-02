# Iowa KYC Selfie Check - Requirements Document

## Ticket Reference
**Jira**: PJO-27729

## Executive Summary

Iowa (IA) gaming regulations require selfie verification as part of the KYC/Authentication flow, similar to the existing Massachusetts (MA) implementation. This is a **backend configuration change only** - no frontend code changes are required.

## Background

### Current Implementation Analysis

The KYC flow is **100% backend-driven** with frontend acting as a renderer:

```
Login → Backend returns { workflowType, redirectUrl: '/jumiokyc' }
→ Frontend redirects to /jumiokyc
→ Route loads JumioKycComponent (same for all jurisdictions)
→ Component calls getVerificationOptions({ useCase: "KYC" })
→ Backend POS API filters document types by jurisdiction
→ Frontend renders cards based on stepDetails returned
```

**Key Discovery**: Frontend has NO jurisdiction-specific code for MA vs IA. The difference is entirely in the backend POS API response structure.

### Jurisdiction Code Pattern

US states use `X` prefix in jurisdiction codes:
- `XNJ` = New Jersey
- `XMA` = Massachusetts  
- `XIA` = Iowa
- `XON` = Ontario (Canada)

**Frontend Detection**:
```typescript
// packages/myaccount/core-lib/src/lib/interceptors/jumio-kyc/jumio-kyc.component.ts:344
this.isUsnjUser = this.jurisdiction.startsWith('X');
```

This pattern is used for UI variations (e.g., showing SSN field), but NOT for document type restrictions.

## Requirements

### 1. User Story

**As an** Iowa player attempting to verify their identity  
**I want** to complete KYC verification using only Driver's License or State ID with a selfie  
**So that** I can comply with Iowa gaming regulations and access the platform

### 2. Acceptance Criteria

#### 2.1 Document Type Restrictions
- **MUST** allow only Driver's License and State ID
- **MUST NOT** allow Passport
- **MUST NOT** allow Proof of Address as separate document

#### 2.2 Selfie Requirement
- **MUST** require selfie verification for all Iowa KYC flows
- **MUST** present selfie as second step after document upload
- **MUST** submit document and selfie together (atomic operation)

#### 2.3 Workflow Integration
- **MUST** trigger KYC flow on login for unverified Iowa users
- **MUST** use same frontend route (`/jumiokyc`) as other jurisdictions
- **MUST** use same component (`JumioKycComponent`) as other jurisdictions

#### 2.4 Backend Configuration
- **MUST** configure Iowa jurisdiction code (`XIA`) in POS API
- **MUST** return correct `stepDetails` structure for Iowa users
- **MUST** match Ontario/Massachusetts multi-step workflow pattern

### 3. Technical Requirements

#### 3.1 Backend POS API Configuration

**Required Response Structure** for Iowa (`XIA`):
```json
{
  "statusCode": 200,
  "verificationSteps": [
    {
      "stepName": "IDENTITY",
      "stepStatus": "PENDING",
      "allowedDocuments": [
        { "type": "DRIVER_LICENSE", "name": "Driver's License" },
        { "type": "STATE_ID", "name": "State ID" }
      ]
    },
    {
      "stepName": "SELFIE",
      "stepStatus": "PENDING",
      "allowedDocuments": [
        { "type": "SELFIE", "name": "Selfie" }
      ]
    }
  ],
  "currentStepName": "IDENTITY",
  "verificationType": "Document",
  "verificationVendor": "Jumio"
}
```

**Critical**: NO `PASSPORT` or `PROOF_OF_ADDRESS` document types for Iowa.

#### 3.2 Workflow Type Configuration

Iowa must be configured to return appropriate `workflowType` for KYC fail scenarios:
- `workflowType = 2` (KYC Interceptor)
- `workflowType = 18` (KYC Interceptor variant)
- `workflowType = 32` (KYC Interceptor variant)

These workflow types trigger redirect to `/jumiokyc` route.

#### 3.3 Frontend Readiness (No Changes Required)

✅ **Already Implemented**:
- Multi-step workflows (Document + Selfie)
- Rendering cards based on `stepDetails` from backend
- Atomic submission (Document and Selfie together)
- Same route (`/jumiokyc`) for all jurisdictions
- Same component (`JumioKycComponent`)
- Jurisdiction detection (`this.isUsnjUser = this.jurisdiction.startsWith('X')`)

**Evidence**:
- `packages/myaccount/core-lib/src/lib/interceptors/jumio-kyc/jumio-kyc.component.ts` - Main component
- `packages/myaccount/core-lib/src/lib/interceptors/jumio-kyc/jumio-kyc-resource.service.ts` - API service
- `backend/myaccount/Frontend.MyAccount.Api/Api/Controllers/JumioKycController.cs` - C# proxy
- `backend/myaccount/Frontend.MyAccount.Api/ServiceClients/Kyc/PosApiKycService.cs` - POS API client

### 4. Configuration Locations

#### 4.1 Dynacon Configuration (Frontend-Facing)

**LabelHost > LoginRedirects**:
- Contains workflow interceptor routing (workflowType → URL mapping)
- MA and IA both have KBA interceptor configured
- Ontario has `Kyc` interceptor with `workflowtype IN ['2', '18', '32']` → `/jumiokyc`

**MobilePortal > MobilePortal.JumioKycv.1**:
- `EnableRevampedJumioFlow`
- `NationalityBasedDocuments`
- `SupportedDocTypes`
- `Composition` (for Revamped Jumio flow)
- `ShowKycOptionsLayout`

**Note**: Document type restrictions (Driver's License, State ID, Passport, etc.) are NOT in Dynacon. They are configured in POS API backend.

#### 4.2 POS API Backend Configuration

**Location**: POS API database or code (exact location TBD - requires backend team input)

**Endpoint**: `GET /Kyc.svc/Document/VerificationOptions?useCase=KYC`

**Configuration Required**:
- Jurisdiction-specific document type mappings
- Step definitions (IDENTITY, SELFIE)
- Allowed documents per step per jurisdiction

### 5. Reference Implementations

#### 5.1 Ontario (XON) - Working Multi-Step Example
- Uses same multi-step workflow (Document + Selfie)
- Frontend renders based on backend response
- Atomic submission

#### 5.2 Massachusetts (XMA) - Similar Regulatory Requirements
- Requires selfie verification
- Restricted document types
- Multi-step workflow

**Note**: Exact MA configuration needs verification from backend team.

## Out of Scope

### Frontend Changes
- ❌ No new components needed
- ❌ No routing changes needed
- ❌ No API service changes needed
- ❌ No jurisdiction-specific logic needed

### Dynacon Changes
- ❌ Document type configuration is NOT in Dynacon
- ❌ Only workflow routing configuration may need verification

## Dependencies

### Backend Team Coordination Required

1. **POS API Team**:
   - Identify where jurisdiction-specific KYC document type configuration is stored
   - Provide current configuration for Ontario (XON), Massachusetts (XMA), and Iowa (XIA)
   - Configure Iowa to match Ontario/MA multi-step pattern
   - Ensure `GetVerificationOptions` endpoint returns correct `stepDetails` for Iowa

2. **Workflow Configuration Team**:
   - Verify Iowa jurisdiction code (`XIA`) is properly configured
   - Ensure Iowa returns appropriate `workflowType` for KYC fail scenarios
   - Verify workflow redirect configuration in Dynacon

### Testing Dependencies

1. **Test Environment**:
   - Iowa label with `XIA` jurisdiction code
   - Test user accounts in Iowa jurisdiction
   - Access to POS API configuration

2. **Test Scenarios**:
   - Login with unverified Iowa user
   - Document upload (Driver's License, State ID)
   - Selfie capture
   - Atomic submission
   - Success/failure flows

## Success Criteria

### Definition of Done

1. ✅ Iowa users see only Driver's License and State ID options (no Passport)
2. ✅ Selfie step appears after document selection
3. ✅ Document and selfie submitted together (atomic operation)
4. ✅ Successful verification completes KYC flow
5. ✅ Failed verification shows appropriate error messages
6. ✅ No frontend code changes required
7. ✅ Configuration documented for future reference

### Testing Checklist

- [ ] Iowa user login triggers KYC workflow
- [ ] Only Driver's License and State ID options displayed
- [ ] Passport option NOT displayed
- [ ] Selfie step appears after document selection
- [ ] Document and selfie upload successfully
- [ ] Atomic submission works correctly
- [ ] Success flow completes KYC
- [ ] Failure flow shows appropriate errors
- [ ] No console errors in browser
- [ ] No backend errors in logs

## Questions for Backend Team

1. **Configuration Location**: Where is the jurisdiction-specific KYC document type configuration stored? (Database table, config file, or Jumio provider settings?)

2. **Current Configuration**: What is the current configuration for:
   - Ontario (XON)
   - Massachusetts (XMA)
   - Iowa (XIA)

3. **Workflow Types**: What `workflowType` values should Iowa return for KYC fail scenarios?

4. **Testing**: What is the process for testing POS API configuration changes in non-production environments?

5. **Deployment**: What is the deployment process for POS API configuration changes?

## Next Steps

1. **Coordinate with Backend Team**:
   - Schedule meeting with POS API team
   - Review current configuration for Ontario/MA
   - Identify Iowa configuration requirements

2. **Backend Configuration**:
   - Configure Iowa jurisdiction in POS API
   - Set document type restrictions (Driver's License, State ID only)
   - Configure multi-step workflow (Document + Selfie)
   - Test configuration in non-production environment

3. **Testing**:
   - Create test plan based on acceptance criteria
   - Execute test scenarios in test environment
   - Verify frontend renders correctly based on backend response
   - Validate atomic submission

4. **Documentation**:
   - Document backend configuration for future reference
   - Update this requirements document with findings
   - Create runbook for similar jurisdiction configurations

## Appendix

### A. File References

**Frontend**:
- `packages/myaccount/core-lib/src/lib/interceptors/jumio-kyc/jumio-kyc.component.ts` - Main KYC component (line 344: jurisdiction check)
- `packages/myaccount/core-lib/src/lib/interceptors/jumio-kyc/jumio-kyc-main-routes.ts` - Route configuration
- `packages/myaccount/core-lib/src/lib/interceptors/jumio-kyc/jumio-kyc-resource.service.ts` - API service for getVerificationOptions
- `packages/vanilla/lib/core/src/login/login-response-handler/login-response-handler.service.ts` - Handles workflow redirects

**Backend**:
- `backend/myaccount/Frontend.MyAccount.Api/Api/Controllers/JumioKycController.cs` - C# proxy to POS API
- `backend/myaccount/Frontend.MyAccount.Api/ServiceClients/Kyc/PosApiKycService.cs` - Calls POS API
- `backend/vanilla/Frontend.Vanilla.ServiceClients/Claims/PosApiClaimTypes.cs` - Claim type definitions (line 129: JurisdictionId)

### B. Jurisdiction Code Pattern

**Pattern**: US states use `X` prefix
- `XNJ` = New Jersey
- `XMA` = Massachusetts
- `XIA` = Iowa
- `XPA` = Pennsylvania
- `XMI` = Michigan
- `XON` = Ontario (Canada)

**Frontend Detection**:
```typescript
this.jurisdiction = this.user.claims.get('jurisdiction')!.toUpperCase();
this.isUsnjUser = this.jurisdiction.startsWith('X');
```

**Backend Claim**:
```csharp
// backend/vanilla/Frontend.Vanilla.ServiceClients/Claims/PosApiClaimTypes.cs:129
[Description("ID of the jurisdiction that applies for the user according to the label, hist country etc.")]
public const string JurisdictionId = "http://api.bwin.com/v3/user/jurisdiction";
```

### C. API Response Structure

**Endpoint**: `GET /Kyc.svc/Document/VerificationOptions?useCase=KYC`

**Response Type**: `PlayerVerificationStepsResponse`

**Key Fields**:
- `StatusCode` - HTTP status code (200 = success)
- `VerificationSteps` - Array of step definitions
  - `StepName` - "IDENTITY", "SELFIE", "ADDRESS", etc.
  - `StepStatus` - "PENDING", "VERIFIED", "REJECTED"
  - `AllowedDocuments` - Array of document types
    - `type` - "DRIVER_LICENSE", "STATE_ID", "PASSPORT", "SELFIE", etc.
    - `name` - Display name for document type
- `CurrentStepName` - Current step in workflow
- `VerificationType` - "Document", "Biometric", etc.
- `VerificationVendor` - "Jumio", "Onfido", etc.

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-24  
**Status**: Draft - Awaiting Backend Team Input
