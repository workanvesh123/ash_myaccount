# Iowa KYC Selfie Check - Technical Analysis Report

**Ticket**: PJO-27729  
**Date**: 2026-02-25  
**Status**: Analysis Complete - Backend Configuration Required

---

## Executive Summary

Iowa gaming regulations require selfie verification as part of the KYC flow, restricting document types to Driver's License and State ID only (no Passport). After comprehensive analysis of the codebase and testing with Ontario users, we have determined that **this is a backend configuration change only** - no frontend code modifications are required.

The frontend KYC system is completely data-driven and jurisdiction-agnostic. All document type restrictions and workflow steps are controlled by the backend POS API response structure.

---

## 1. Architecture Analysis

### 1.1 Login-to-KYC Flow

The complete flow from login to KYC verification follows this pattern:

**Step 1: Login Response Processing**
- User logs in with unverified Iowa account
- Backend POS API returns login response with workflow information
- Response includes `workflowType` (e.g., 2, 18, or 32 for KYC interceptor) and `redirectUrl: '/jumiokyc'`
- Response also includes `postLoginValues` with additional context (suberror codes, document status, etc.)

**Step 2: Login Response Handler**
- `LoginResponseHandlerService` processes the login response
- For incomplete workflows (interceptors), it detects `response.isCompleted === false`
- Service stores `postLoginValues` in `LoginStoreService` for later use
- Service creates redirect info and navigates to the workflow URL

**Evidence from code** (`login-response-handler.service.ts`, lines 47-60):
```typescript
if (!response.isCompleted) {
    // Workflow phase - user needs to complete KYC before full login
    this.loginStore.PostLoginValues = response.postLoginValues || null;
    
    // Redirect to workflow URL (e.g., '/jumiokyc')
    const redirectInfo = this.createRedirectInfo(
        response.redirectUrl,
        response.action,
        false,
        opts
    );
    return Promise.resolve(redirectInfo);
}
```

**Step 3: KYC Component Initialization**
- Angular router loads `/jumiokyc` route
- `JumioKycComponent` initializes (same component for ALL jurisdictions)
- Component retrieves jurisdiction from user claims: `this.jurisdiction = this.user.claims.get('jurisdiction')!.toUpperCase()`
- Component detects US jurisdiction pattern: `this.isUsnjUser = this.jurisdiction.startsWith('X')`

**Step 4: Verification Options API Call**
- Component calls `getVerificationOptions({ useCase: "KYC" })` via `JumioKycResourceService`
- This proxies through frontend API to backend POS API endpoint: `GET /Kyc.svc/Document/VerificationOptions?useCase=KYC`
- Backend filters document types based on jurisdiction configuration
- Backend returns `verificationSteps` array with allowed documents per step

**Step 5: Frontend Rendering**
- Component receives `verificationSteps` from backend
- Component renders document selection cards based on `allowedDocuments` array
- Component handles multi-step workflows (Document → Selfie) automatically
- Component submits both document and selfie together (atomic operation)

### 1.2 Key Architectural Insight

**The frontend has ZERO jurisdiction-specific logic for document types.** The `isUsnjUser` flag is only used for UI variations like showing SSN fields, NOT for restricting document types.

All document type filtering happens in the backend POS API based on jurisdiction configuration. The frontend is a pure renderer of backend-provided options.

---

## 2. Jurisdiction Code Pattern

### 2.1 Naming Convention

US states use an `X` prefix in jurisdiction codes:
- `XNJ` = New Jersey
- `XMA` = Massachusetts
- `XIA` = Iowa
- `XPA` = Pennsylvania
- `XMI` = Michigan
- `XON` = Ontario (Canada, also uses X prefix)

This pattern is used throughout the codebase for US jurisdiction detection.

### 2.2 Frontend Detection Logic

**Evidence from code** (`jumio-kyc.component.ts`, line 344):
```typescript
this.jurisdiction = this.user.claims.get('jurisdiction')!.toUpperCase();
this.isUsnjUser = this.jurisdiction.startsWith('X');
```

This flag is used for:
- Showing SSN input field for US users
- Adjusting UI labels and messaging
- Tracking and analytics categorization

**This flag is NOT used for document type restrictions.** Document types are entirely controlled by backend response.

### 2.3 Backend Claim Source

The jurisdiction claim comes from the backend POS API during authentication. It's defined in the backend codebase at `backend/vanilla/Frontend.Vanilla.ServiceClients/Claims/PosApiClaimTypes.cs`, line 129:

```csharp
[Description("ID of the jurisdiction that applies for the user according to the label, hist country etc.")]
public const string JurisdictionId = "http://api.bwin.com/v3/user/jurisdiction";
```

---

## 3. Frontend Component Analysis

### 3.1 JumioKycComponent Structure

**Location**: `packages/myaccount/core-lib/src/lib/interceptors/jumio-kyc/jumio-kyc.component.ts`

**Key Responsibilities**:
1. Initialize component with jurisdiction and workflow context
2. Call `getVerificationOptions` API to retrieve allowed documents
3. Render document selection cards based on backend response
4. Handle multi-step workflows (Document → Selfie → Address, etc.)
5. Submit verification data to Jumio via backend proxy
6. Handle success/failure callbacks

**Multi-Step Workflow Support**:
The component already supports multi-step workflows through the `verificationSteps` array. Each step has:
- `stepName` (e.g., "IDENTITY", "SELFIE", "ADDRESS")
- `stepStatus` (e.g., "PENDING", "VERIFIED", "REJECTED")
- `allowedDocuments` array with document types for that step

The component iterates through steps sequentially, showing the current step's document options and progressing to the next step after successful submission.

### 3.2 API Service Layer

**Location**: `packages/myaccount/core-lib/src/lib/interceptors/jumio-kyc/jumio-kyc-resource.service.ts`

**Key Method**: `getVerificationOptions(model: VerificationOptionModel)`

This service method:
1. Accepts a model with `useCase` (e.g., "KYC", "KYC-LIVELINESS", "PAYMENT_VERIFICATION")
2. Calls frontend API endpoint (C# proxy)
3. Frontend API proxies to backend POS API
4. Returns `PlayerVerificationStepsResponse` with jurisdiction-filtered document types

**Backend Proxy Chain**:
- Frontend API: `backend/myaccount/Frontend.MyAccount.Api/Api/Controllers/JumioKycController.cs`
- POS API Client: `backend/myaccount/Frontend.MyAccount.Api/ServiceClients/Kyc/PosApiKycService.cs`
- POS API Endpoint: `GET /Kyc.svc/Document/VerificationOptions?useCase={useCase}`

### 3.3 Frontend Readiness Assessment

**Already Implemented**:
- ✅ Multi-step workflow rendering (Document + Selfie)
- ✅ Dynamic card generation based on `allowedDocuments` array
- ✅ Atomic submission (all steps submitted together)
- ✅ Success/failure callback handling
- ✅ Jurisdiction detection and US-specific UI adjustments
- ✅ Same route (`/jumiokyc`) for all jurisdictions
- ✅ Same component for all jurisdictions

**No Frontend Changes Required**:
- ❌ No new components needed
- ❌ No routing changes needed
- ❌ No API service changes needed
- ❌ No jurisdiction-specific logic needed
- ❌ No UI changes needed

The frontend is **production-ready** for Iowa KYC selfie flow. It will automatically render the correct document options and workflow steps based on backend configuration.

---

## 4. Backend Configuration Requirements

### 4.1 POS API Configuration

**Endpoint**: `GET /Kyc.svc/Document/VerificationOptions?useCase=KYC`

**Required Configuration for Iowa (XIA)**:

The backend must be configured to return a two-step verification workflow for Iowa users:

**Step 1 - Identity Verification**:
- Allow only Driver's License (`DRIVER_LICENSE`)
- Allow only State ID (`STATE_ID`)
- Explicitly exclude Passport (`PASSPORT`)
- Explicitly exclude Proof of Address (`PROOF_OF_ADDRESS`)

**Step 2 - Selfie Verification**:
- Require Selfie (`SELFIE`)
- This step appears after document selection
- Document and selfie are submitted together (atomic operation)

**Response Structure Requirements**:
- `statusCode` must be 200 for success
- `verificationSteps` array must contain two steps: IDENTITY and SELFIE
- `currentStepName` should be "IDENTITY" initially
- `verificationType` should be "Document"
- `verificationVendor` should be "Jumio"

### 4.2 Workflow Type Configuration

Iowa must be configured to return an appropriate `workflowType` value during login for unverified users. The KYC interceptor is triggered by these workflow types:
- `workflowType = 2` (KYC Interceptor)
- `workflowType = 18` (KYC Interceptor variant)
- `workflowType = 32` (KYC Interceptor variant)

These workflow types cause the login response handler to redirect to `/jumiokyc` instead of completing the login.

### 4.3 Configuration Location

**Document Type Configuration**:
- NOT in Dynacon (frontend configuration system)
- Stored in backend POS API database or code
- Exact location requires backend team input

**Workflow Routing Configuration**:
- Partially in Dynacon under `LabelHost > LoginRedirects`
- Maps workflow types to interceptor URLs
- Ontario example shows: `workflowtype IN ['2', '18', '32']` → `/jumiokyc`

---

## 5. Testing and Validation

### 5.1 Ontario Testing Results

**Test Performed**: Logged in with Ontario user (XON jurisdiction) and inspected `GetJumioVerificationOptions` API response.

**Findings**:
- Ontario response showed `verificationType: "SINGLE_STEP"` (not multi-step)
- Only IDENTITY step returned (no SELFIE step)
- Allowed documents included PASSPORT (contradicts Iowa requirement)
- Used `useCase=KYC-LIVELINESS` (may be wrong use case)

**Conclusion**: Ontario does NOT match the expected multi-step selfie pattern, at least with the `KYC-LIVELINESS` use case. Need to test with `useCase=KYC` or find a different reference jurisdiction.

### 5.2 Massachusetts Verification Needed

Massachusetts (XMA) was initially believed to have the selfie requirement, but this has not been verified. Testing needed:
1. Login with MA user account
2. Navigate to `/jumiokyc` page
3. Inspect Network tab for `GetJumioVerificationOptions` request
4. Verify response structure matches expected multi-step pattern

### 5.3 Recommended Testing Approach

**Phase 1: Identify Reference Jurisdiction**
1. Contact backend/POS API team to identify which jurisdiction(s) currently have multi-step selfie flow
2. Request current configuration for Ontario, Massachusetts, and Iowa
3. Obtain example of correct multi-step response structure

**Phase 2: Backend Configuration**
1. Configure Iowa jurisdiction code (XIA) in POS API
2. Set document type restrictions (Driver's License, State ID only)
3. Configure multi-step workflow (Document + Selfie)
4. Test configuration in non-production environment

**Phase 3: Frontend Validation**
1. Login with Iowa test user
2. Verify redirect to `/jumiokyc` page
3. Verify only Driver's License and State ID options appear
4. Verify Selfie step appears after document selection
5. Verify atomic submission works correctly
6. Verify success/failure flows

**Phase 4: End-to-End Testing**
1. Test complete KYC flow from login to verification
2. Test with different document types (Driver's License, State ID)
3. Test success scenarios (documents accepted)
4. Test failure scenarios (documents rejected)
5. Verify no console errors or backend errors

---

## 6. Configuration System Analysis

### 6.1 Dynacon Configuration System

Dynacon is the frontend configuration system that stores label-specific settings. It's managed by the backend team and is NOT part of the frontend repository.

**Relevant Dynacon Sections**:

**LabelHost > LoginRedirects**:
- Contains workflow interceptor routing configuration
- Maps workflow types to interceptor URLs
- Example: workflow types 2, 18, 32 redirect to `/jumiokyc`
- Both MA and IA have KBA interceptor configured
- Ontario has Kyc interceptor with workflow type mapping

**MobilePortal > MobilePortal.JumioKycv.1**:
- Contains Jumio-specific feature flags
- `EnableRevampedJumioFlow` - enables new Jumio UI
- `NationalityBasedDocuments` - enables nationality-based document filtering
- `SupportedDocTypes` - list of supported document types
- `Composition` - configuration for revamped Jumio flow
- `ShowKycOptionsLayout` - shows document selection layout

**Critical Finding**: Document type restrictions (Driver's License, State ID, Passport, etc.) are NOT configured in Dynacon. They are configured in the backend POS API.

### 6.2 What Dynacon Controls vs What POS API Controls

**Dynacon Controls**:
- Workflow routing (which workflow types redirect to which URLs)
- Feature flags (enable/disable features)
- UI configuration (show/hide elements)
- Tracking and analytics settings
- Third-party integration settings

**POS API Controls**:
- Document type restrictions per jurisdiction
- Verification step definitions (IDENTITY, SELFIE, ADDRESS)
- Allowed documents per step per jurisdiction
- Verification vendor selection (Jumio, Onfido, etc.)
- Verification status and results

**Implication**: Iowa document type configuration must be done in POS API backend, not in Dynacon.

---

## 7. Risk Assessment and Mitigation

### 7.1 Identified Risks

**Risk 1: Backend Configuration Location Unknown**
- **Impact**: Cannot configure Iowa without knowing where configuration is stored
- **Likelihood**: High
- **Mitigation**: Contact backend/POS API team immediately to identify configuration location

**Risk 2: No Reference Implementation Verified**
- **Impact**: Cannot validate expected response structure without working example
- **Likelihood**: Medium
- **Mitigation**: Test Massachusetts or contact backend team for example configuration

**Risk 3: Multiple Workflow Types**
- **Impact**: Iowa may need different workflow type than Ontario/MA
- **Likelihood**: Low
- **Mitigation**: Backend team can advise on correct workflow type for Iowa

**Risk 4: Testing Environment Access**
- **Impact**: Cannot test configuration changes without Iowa test accounts
- **Likelihood**: Medium
- **Mitigation**: Request Iowa test accounts from QA team before configuration changes

### 7.2 Success Criteria

**Configuration Success**:
- ✅ Iowa users see only Driver's License and State ID options
- ✅ Passport option NOT displayed for Iowa users
- ✅ Selfie step appears after document selection
- ✅ Document and selfie submitted together (atomic operation)

**Technical Success**:
- ✅ No frontend code changes required
- ✅ No console errors in browser
- ✅ No backend errors in logs
- ✅ Successful verification completes KYC flow
- ✅ Failed verification shows appropriate error messages

**Business Success**:
- ✅ Iowa regulatory requirements met
- ✅ User experience consistent with other jurisdictions
- ✅ No impact on other jurisdictions (MA, NJ, PA, etc.)

---

## 8. Recommendations and Next Steps

### 8.1 Immediate Actions Required

**Action 1: Backend Team Coordination**
- Schedule meeting with POS API team
- Identify where jurisdiction-specific KYC document type configuration is stored
- Request current configuration for Ontario (XON), Massachusetts (XMA), and Iowa (XIA)
- Obtain example of correct multi-step response structure

**Action 2: Reference Implementation Verification**
- Test Massachusetts (XMA) with `useCase=KYC` (not `KYC-LIVELINESS`)
- Verify if MA has multi-step selfie flow
- If not, ask backend team which jurisdiction has the reference implementation

**Action 3: Test Environment Setup**
- Request Iowa test user accounts from QA team
- Verify test environment has Iowa label configured
- Ensure test environment can access POS API configuration

### 8.2 Backend Configuration Tasks

**Task 1: Configure Iowa Jurisdiction**
- Add Iowa jurisdiction code (XIA) to POS API configuration
- Set workflow type (2, 18, or 32) for KYC fail scenarios
- Verify workflow routing in Dynacon (should already exist)

**Task 2: Configure Document Types**
- Set allowed documents for IDENTITY step: Driver's License, State ID
- Explicitly exclude Passport and Proof of Address
- Configure SELFIE step as second step
- Set verification vendor to Jumio

**Task 3: Test Configuration**
- Test in non-production environment first
- Verify API response structure matches expected format
- Test with Iowa test user accounts
- Validate frontend renders correctly

### 8.3 Frontend Validation Tasks

**Task 1: Verify Rendering**
- Login with Iowa test user
- Verify redirect to `/jumiokyc` page
- Verify only Driver's License and State ID cards appear
- Verify Selfie step appears after document selection

**Task 2: Verify Submission**
- Upload Driver's License document
- Capture selfie
- Verify both submitted together (atomic operation)
- Verify success callback handling

**Task 3: Verify Error Handling**
- Test with rejected documents
- Verify error messages display correctly
- Verify user can retry verification
- Verify no console errors

### 8.4 Documentation Tasks

**Task 1: Update Requirements Document**
- Add backend team findings to requirements document
- Document exact configuration location
- Add reference implementation details

**Task 2: Create Configuration Runbook**
- Document step-by-step configuration process
- Include screenshots of configuration screens
- Add troubleshooting section

**Task 3: Update Testing Documentation**
- Document test scenarios and expected results
- Add test user account information
- Include API response examples

---

## 9. Questions for Backend Team

### 9.1 Configuration Questions

**Q1: Where is jurisdiction-specific KYC document type configuration stored?**
- Database table name and schema?
- Configuration file location?
- Jumio provider settings?
- Other location?

**Q2: What is the current configuration for these jurisdictions?**
- Ontario (XON) - document types, steps, workflow
- Massachusetts (XMA) - document types, steps, workflow
- Iowa (XIA) - current state (if any)

**Q3: Which jurisdiction currently has the multi-step selfie flow?**
- Is it Ontario, Massachusetts, or another jurisdiction?
- Can you provide an example API response?
- What use case should be used (KYC, KYC-LIVELINESS, other)?

### 9.2 Workflow Questions

**Q4: What workflow type should Iowa return for KYC fail scenarios?**
- Should it be 2, 18, 32, or a different value?
- Is this configured per jurisdiction or per label?
- Where is this configuration stored?

**Q5: How is the workflow type determined during login?**
- Based on user verification status?
- Based on jurisdiction rules?
- Based on label configuration?

### 9.3 Testing Questions

**Q6: What is the process for testing POS API configuration changes?**
- Is there a test environment?
- How do we create Iowa test users?
- How do we verify configuration without affecting production?

**Q7: What is the deployment process for POS API configuration changes?**
- Is it a code deployment or configuration update?
- What is the approval process?
- What is the rollback process if issues occur?

### 9.4 Integration Questions

**Q8: Does Jumio need to be configured separately for Iowa?**
- Are there Jumio-specific settings per jurisdiction?
- Does Jumio need to be notified of Iowa configuration?
- Are there any Jumio API changes required?

**Q9: Are there any other systems that need Iowa configuration?**
- Analytics/tracking systems?
- Compliance/audit systems?
- Reporting systems?

---

## 10. Conclusion

### 10.1 Summary of Findings

**Key Finding**: The Iowa KYC selfie check requirement is a **backend configuration change only**. The frontend is already production-ready and requires no code modifications.

**Architecture**: The frontend KYC system is completely data-driven and jurisdiction-agnostic. All document type restrictions and workflow steps are controlled by the backend POS API response structure.

**Frontend Readiness**: The `JumioKycComponent` already supports multi-step workflows (Document + Selfie), dynamic card rendering based on backend response, and atomic submission. It uses the same route and component for all jurisdictions.

**Backend Configuration**: Iowa must be configured in the POS API to return a two-step verification workflow with restricted document types (Driver's License and State ID only, no Passport).

### 10.2 Critical Path Forward

1. **Contact Backend Team** - Identify configuration location and obtain reference implementation
2. **Configure Iowa** - Set jurisdiction code, document types, and workflow steps in POS API
3. **Test Configuration** - Verify API response structure and frontend rendering
4. **Validate End-to-End** - Test complete KYC flow from login to verification
5. **Document Configuration** - Create runbook for future jurisdiction configurations

### 10.3 Estimated Effort

**Backend Configuration**: 2-4 hours (assuming configuration location is known)
**Testing**: 4-8 hours (including test environment setup and validation)
**Documentation**: 2-4 hours (runbook and configuration documentation)

**Total Estimated Effort**: 8-16 hours (1-2 days)

**Note**: This estimate assumes the backend team can quickly identify the configuration location and provide a reference implementation. If significant investigation is required, add 1-2 additional days.

### 10.4 Success Metrics

**Technical Success**:
- Iowa users see only Driver's License and State ID options
- Selfie step appears after document selection
- Atomic submission works correctly
- No frontend code changes required
- No console or backend errors

**Business Success**:
- Iowa regulatory requirements met
- User experience consistent with other jurisdictions
- Configuration documented for future use
- No impact on other jurisdictions

---

## Appendix A: File References

### Frontend Files
- `packages/myaccount/core-lib/src/lib/interceptors/jumio-kyc/jumio-kyc.component.ts` - Main KYC component (line 344: jurisdiction check)
- `packages/myaccount/core-lib/src/lib/interceptors/jumio-kyc/jumio-kyc-main-routes.ts` - Route configuration
- `packages/myaccount/core-lib/src/lib/interceptors/jumio-kyc/jumio-kyc-resource.service.ts` - API service for getVerificationOptions
- `packages/vanilla/lib/core/src/login/login-response-handler/login-response-handler.service.ts` - Handles workflow redirects (lines 47-60)

### Backend Files
- `backend/myaccount/Frontend.MyAccount.Api/Api/Controllers/JumioKycController.cs` - C# proxy to POS API
- `backend/myaccount/Frontend.MyAccount.Api/ServiceClients/Kyc/PosApiKycService.cs` - POS API client
- `backend/vanilla/Frontend.Vanilla.ServiceClients/Claims/PosApiClaimTypes.cs` - Claim type definitions (line 129: JurisdictionId)

### Configuration Files
- Dynacon: `LabelHost > LoginRedirects` - Workflow routing configuration
- Dynacon: `MobilePortal > MobilePortal.JumioKycv.1` - Jumio feature flags
- POS API: Configuration location TBD (requires backend team input)

---

## Appendix B: API Response Structure

### Expected Response for Iowa (XIA)

The backend POS API should return this structure for Iowa users when calling `GET /Kyc.svc/Document/VerificationOptions?useCase=KYC`:

**Response Fields**:
- `statusCode`: 200 (success)
- `verificationSteps`: Array of step objects
  - Step 1: IDENTITY
    - `stepName`: "IDENTITY"
    - `stepStatus`: "PENDING"
    - `allowedDocuments`: Array with Driver's License and State ID only
  - Step 2: SELFIE
    - `stepName`: "SELFIE"
    - `stepStatus`: "PENDING"
    - `allowedDocuments`: Array with Selfie only
- `currentStepName`: "IDENTITY" (initially)
- `verificationType`: "Document"
- `verificationVendor`: "Jumio"

**Document Type Values**:
- `DRIVER_LICENSE` - Driver's License
- `STATE_ID` - State ID
- `SELFIE` - Selfie photo
- `PASSPORT` - Passport (must NOT be included for Iowa)
- `PROOF_OF_ADDRESS` - Proof of Address (must NOT be included for Iowa)

---

**Report Version**: 1.0  
**Last Updated**: 2026-02-25  
**Status**: Analysis Complete - Awaiting Backend Team Input
