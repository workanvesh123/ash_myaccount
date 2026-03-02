# Iowa KYC Selfie Implementation - Technical Analysis

## JIRA: PJO-27729

## Executive Summary

Iowa (IA) regulations require a selfie check as part of the KYC/Authentication flow, similar to Massachusetts (MA) and Ontario (ON). This is **primarily a backend configuration change** with **NO frontend code changes required**.

---

## Jurisdiction Code Pattern

### US State Jurisdiction Codes

US states use an `X` prefix in jurisdiction codes:

| State | Jurisdiction Code | Evidence |
|-------|-----------------