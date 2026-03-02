# CI/CD GitHub Actions Migration - Requirements

## 1. Overview

Migrate the existing GitLab CI/CD pipeline patterns to GitHub Actions for a new monorepo project while maintaining the sophisticated build optimization, caching, and deployment strategies from the source repository.

### 1.1 Source Repository Analysis

**Current Setup (GitLab CI):**
- **Platform**: GitLab CI with Nx Cloud integration
- **Monorepo Tool**: Nx 22.x with distributed task execution
- **Frontend**: Angular 20.x with SSR, Module Federation
- **Backend**: .NET 10.0 (note: source uses net10.0, target uses .NET 9)
- **Package Manager**: Yarn 4.11.0
- **Node Version**: 22.x

**Key Pipeline Features:**
1. **Affected Detection**: Uses Nx affected commands with dynamic base SHA calculation
2. **Distributed Execution**: Nx Cloud with custom distribution config
3. **Parallel Execution**: Multiple jobs run in parallel with dependency management
4. **Caching Strategy**: 
   - Node modules cache (pull-push policy)
   - Nx Cloud remote caching
   - Build artifacts caching
5. **Multi-Stage Pipeline**:
   - `.pre` stage: Cache refresh
   - `trigger` stage: Main builds, tests, child pipeline triggers
   - `report` stage: Quality reports, regression checks
6. **Child Pipelines**: Separate pipelines for deploy, e2e, security, load testing
7. **Quality Gates**:
   - Code formatting checks
   - Linting (ESLint, Stylelint)
   - Unit tests (Jest/Vitest)
   - E2E tests (Playwright)
   - Code coverage
   - Design system regression detection
   - Code Pushup quality metrics
8. **Branch-Specific Workflows**:
   - Main branch: Full pipeline + auto-deploy
   - Release branches: Production deployment pipeline
   - Develop branches: Development deployment
   - MR/PR: Affected checks only
9. **Notifications**: Teams webhook integration for failures

### 1.2 Target Repository Requirements

**New Project Setup:**
- **Platform**: GitHub Actions
- **Repository**: https://github.com/workanvesh123/ash_myaccount
- **Location**: C:\monorepos\newmonorepomyaccount\ash_myaccount
- **Backend**: .NET 9 Minimal APIs (backend/MyAccount.Api/)
- **Frontend**: Angular 20 with SSR, Nx workspace (frontend/)
- **Current CI/CD**: Basic GitHub Actions workflows (to be enhanced)

## 2. User Stories

### 2.1 As a Developer

**US-1**: As a developer, I want affected detection so that only changed projects are built and tested, reducing CI time.

**Acceptance Criteria:**
- AC-1.1: When I push changes to a feature branch, only affected projects are built
- AC-1.2: Nx affected commands use proper base SHA calculation
- AC-1.3: Git depth is dynamically adjusted if needed for accurate affected detection
- AC-1.4: Affected detection works for both frontend (Nx) and backend (.NET) projects

**US-2**: As a developer, I want fast feedback so that I can iterate quickly on my changes.

**Acceptance Criteria:**
- AC-2.1: PR checks complete in under 10 minutes for typical changes
- AC-2.2: Build artifacts are cached between runs
- AC-2.3: Node modules are cached and only reinstalled when yarn.lock changes
- AC-2.4: Nx Cloud remote caching is enabled for task results

**US-3**: As a developer, I want comprehensive quality checks so that issues are caught before merge.

**Acceptance Criteria:**
- AC-3.1: Code formatting is validated (Prettier)
- AC-3.2: Linting runs on affected projects (ESLint, Stylelint)
- AC-3.3: Unit tests run on affected projects with coverage reports
- AC-3.4: Build succeeds for affected projects
- AC-3.5: Type checking passes for TypeScript projects

### 2.2 As a DevOps Engineer

**US-4**: As a DevOps engineer, I want environment-specific deployments so that changes are promoted through environments safely.

**Acceptance Criteria:**
- AC-4.1: Development environment deploys automatically from main branch
- AC-4.2: Staging environment deploys from release branches
- AC-4.3: Production deployments require manual approval
- AC-4.4: Rollback capability is available for all environments

**US-5**: As a DevOps engineer, I want security scanning so that vulnerabilities are detected early.

**Acceptance Criteria:**
- AC-5.1: Dependency scanning runs on all PRs (npm audit, dotnet list package --vulnerable)
- AC-5.2: SAST scanning runs on main branch merges
- AC-5.3: Security scan results are reported as GitHub Security Advisories
- AC-5.4: High/Critical vulnerabilities block deployment

**US-6**: As a DevOps engineer, I want parallel job execution so that pipeline duration is minimized.

**Acceptance Criteria:**
- AC-6.1: Frontend and backend builds run in parallel
- AC-6.2: Test jobs run in parallel across multiple projects
- AC-6.3: Job dependencies are properly configured to avoid race conditions
- AC-6.4: Matrix builds are used for multi-environment testing

### 2.3 As a Team Lead

**US-7**: As a team lead, I want visibility into pipeline status so that I can track delivery progress.

**Acceptance Criteria:**
- AC-7.1: Pipeline status is visible in GitHub PR checks
- AC-7.2: Failed jobs provide clear error messages
- AC-7.3: Build duration metrics are tracked
- AC-7.4: Notifications are sent to Slack/Teams on main branch failures

**US-8**: As a team lead, I want branch protection so that code quality standards are enforced.

**Acceptance Criteria:**
- AC-8.1: Main branch requires passing checks before merge
- AC-8.2: At least one approval is required for PRs
- AC-8.3: Status checks are required: build, test, lint
- AC-8.4: Force push is disabled on protected branches

## 3. Technical Requirements

### 3.1 Workflow Structure

**REQ-1**: Implement modular workflow files following GitHub Actions best practices

**Details:**
- Separate workflows for different concerns (CI, CD, security, quality)
- Reusable workflows for common patterns
- Composite actions for repeated steps
- Clear naming convention: `{purpose}-{trigger}.yml`

**REQ-2**: Support multiple trigger types

**Details:**
- Pull request: Run affected checks only
- Push to main: Run full pipeline + deploy to dev
- Push to release/*: Run full pipeline + deploy to staging
- Manual dispatch: Allow manual workflow runs with parameters
- Schedule: Nightly full builds, weekly security scans

### 3.2 Caching Strategy

**REQ-3**: Implement multi-layer caching

**Details:**
- **Layer 1 - Dependencies**: Cache node_modules, NuGet packages
- **Layer 2 - Build Outputs**: Cache Nx build artifacts
- **Layer 3 - Remote Cache**: Nx Cloud for distributed caching
- Cache keys based on lock files and source file hashes
- Fallback cache keys for partial matches

**REQ-4**: Optimize cache hit rates

**Details:**
- Use `actions/cache@v4` with proper key strategies
- Implement cache warming for common scenarios
- Monitor cache hit rates via GitHub Actions metrics
- Prune stale caches automatically

### 3.3 Build Optimization

**REQ-5**: Implement Nx affected detection

**Details:**
- Calculate base SHA dynamically (last successful main build)
- Use `nx affected` for all build/test/lint commands
- Support manual base SHA override via workflow inputs
- Handle first commit edge case (no base SHA available)

**REQ-6**: Enable parallel execution

**Details:**
- Use GitHub Actions matrix strategy for parallel jobs
- Configure Nx parallel execution (`--parallel=3`)
- Distribute tasks across multiple runners
- Respect job dependencies to avoid race conditions

### 3.4 Testing Strategy

**REQ-7**: Implement comprehensive testing

**Details:**
- **Unit Tests**: Jest/Vitest with coverage reporting
- **Integration Tests**: .NET integration tests
- **E2E Tests**: Playwright tests (separate workflow)
- **Visual Regression**: Chromatic for Storybook (if applicable)
- Coverage thresholds: 80% for new code

**REQ-8**: Optimize test execution

**Details:**
- Run only affected tests on PRs
- Run full test suite on main branch
- Parallelize test execution across projects
- Upload test results and coverage reports as artifacts

### 3.5 Security & Compliance

**REQ-9**: Implement security scanning

**Details:**
- **Dependency Scanning**: npm audit, dotnet list package --vulnerable
- **SAST**: CodeQL for TypeScript/C#
- **Secret Scanning**: GitHub secret scanning enabled
- **License Compliance**: Check for incompatible licenses
- Scan frequency: Every PR + nightly on main

**REQ-10**: Implement security policies

**Details:**
- Block merges with high/critical vulnerabilities
- Auto-create security advisories for findings
- Require security review for dependency updates
- Maintain SBOM (Software Bill of Materials)

### 3.6 Deployment Strategy

**REQ-11**: Implement environment-based deployments

**Details:**
- **Development**: Auto-deploy from main branch
- **Staging**: Auto-deploy from release/* branches
- **Production**: Manual approval required
- Blue-green deployment strategy
- Automated smoke tests post-deployment

**REQ-12**: Implement rollback capability

**Details:**
- Tag successful deployments with version
- Store deployment artifacts for 30 days
- One-click rollback to previous version
- Automated rollback on smoke test failure

### 3.7 Monitoring & Notifications

**REQ-13**: Implement pipeline monitoring

**Details:**
- Track pipeline duration metrics
- Monitor cache hit rates
- Track test flakiness
- Alert on pipeline failures

**REQ-14**: Implement notification system

**Details:**
- Slack/Teams notifications for main branch failures
- GitHub PR comments with build status
- Email notifications for deployment approvals
- Summary reports for nightly builds

## 4. Non-Functional Requirements

### 4.1 Performance

**NFR-1**: PR pipeline completes in under 10 minutes for typical changes (< 5 affected projects)

**NFR-2**: Full pipeline (main branch) completes in under 30 minutes

**NFR-3**: Cache hit rate > 80% for node_modules

**NFR-4**: Nx Cloud cache hit rate > 60% for build tasks

### 4.2 Reliability

**NFR-5**: Pipeline success rate > 95% (excluding legitimate failures)

**NFR-6**: Test flakiness rate < 2%

**NFR-7**: Zero false positives in security scanning

### 4.3 Maintainability

**NFR-8**: Workflow files are modular and reusable

**NFR-9**: Inline documentation explains complex logic

**NFR-10**: Secrets are managed via GitHub Secrets, never hardcoded

### 4.4 Scalability

**NFR-11**: Pipeline supports up to 50 projects in monorepo

**NFR-12**: Parallel job execution scales with project count

**NFR-13**: Cache storage stays under GitHub limits (10GB per repo)

## 5. Constraints

### 5.1 Technical Constraints

**CON-1**: Must use GitHub Actions (no third-party CI platforms)

**CON-2**: Must support .NET 9 and Angular 20

**CON-3**: Must work on GitHub-hosted runners (ubuntu-latest, windows-latest)

**CON-4**: Must respect GitHub Actions usage limits (2000 minutes/month for free tier)

### 5.2 Security Constraints

**CON-5**: No secrets in workflow files or code

**CON-6**: All external actions must be pinned to SHA (not tags)

**CON-7**: Deployment credentials stored in GitHub Environments

**CON-8**: OIDC authentication preferred over long-lived credentials

### 5.3 Compatibility Constraints

**CON-9**: Must support Windows development environments

**CON-10**: Must work with existing Nx configuration

**CON-11**: Must integrate with existing .NET build process

**CON-12**: Must support existing package.json scripts

## 6. Migration Strategy

### 6.1 Phase 1: Foundation (Week 1)

**TASK-1**: Set up basic CI workflow
- Create `.github/workflows/ci.yml`
- Implement affected detection
- Add caching for node_modules and NuGet packages
- Run build and test on PRs

**TASK-2**: Set up Nx Cloud integration
- Configure Nx Cloud access token
- Enable distributed task execution
- Verify remote caching works

### 6.2 Phase 2: Quality Gates (Week 2)

**TASK-3**: Add linting and formatting checks
- ESLint for TypeScript
- Stylelint for SCSS
- Prettier formatting validation
- .NET code analysis

**TASK-4**: Add security scanning
- npm audit for frontend dependencies
- dotnet list package --vulnerable for backend
- CodeQL for SAST
- Secret scanning

### 6.3 Phase 3: Deployment (Week 3)

**TASK-5**: Set up deployment workflows
- Development environment auto-deploy
- Staging environment deploy from release branches
- Production deploy with manual approval
- Rollback workflow

**TASK-6**: Add smoke tests
- Health check endpoints
- Critical path E2E tests
- Performance benchmarks

### 6.4 Phase 4: Optimization (Week 4)

**TASK-7**: Optimize pipeline performance
- Tune parallel execution
- Optimize cache strategies
- Reduce job startup time
- Implement job result caching

**TASK-8**: Add monitoring and alerts
- Pipeline duration tracking
- Failure notifications
- Cache hit rate monitoring
- Test flakiness tracking

## 7. Success Criteria

### 7.1 Functional Success

**SC-1**: All PRs run affected checks successfully

**SC-2**: Main branch deploys to development automatically

**SC-3**: Production deployments require and respect manual approval

**SC-4**: Security vulnerabilities are detected and reported

### 7.2 Performance Success

**SC-5**: PR pipeline duration < 10 minutes (p95)

**SC-6**: Full pipeline duration < 30 minutes (p95)

**SC-7**: Cache hit rate > 80% for dependencies

### 7.3 Quality Success

**SC-8**: Zero false positive security alerts

**SC-9**: Test flakiness < 2%

**SC-10**: Pipeline success rate > 95%

## 8. Out of Scope

**OOS-1**: Migration of existing GitLab CI history

**OOS-2**: Custom GitHub Actions development (use existing actions)

**OOS-3**: Infrastructure as Code (Terraform/CloudFormation)

**OOS-4**: Container orchestration (Kubernetes/ECS)

**OOS-5**: Advanced deployment strategies (canary, feature flags)

## 9. Assumptions

**ASM-1**: GitHub repository is already created and accessible

**ASM-2**: Nx Cloud account is available or will be created

**ASM-3**: Deployment targets (dev/staging/prod) are already provisioned

**ASM-4**: Team has GitHub Actions experience or will be trained

**ASM-5**: Existing .NET and Angular build processes work locally

## 10. Dependencies

**DEP-1**: GitHub repository access with admin permissions

**DEP-2**: Nx Cloud access token

**DEP-3**: Deployment credentials for target environments

**DEP-4**: Slack/Teams webhook URLs for notifications

**DEP-5**: Code signing certificates (if required for .NET)

## 11. Risks

**RISK-1**: GitHub Actions usage limits exceeded
- **Mitigation**: Monitor usage, optimize pipeline, consider self-hosted runners

**RISK-2**: Nx Cloud cache misses reduce performance
- **Mitigation**: Tune cache keys, monitor hit rates, implement fallback strategies

**RISK-3**: Security scanning produces too many false positives
- **Mitigation**: Tune scanning rules, implement suppression mechanism

**RISK-4**: Parallel execution causes race conditions
- **Mitigation**: Careful job dependency configuration, use Nx task orchestration

**RISK-5**: Migration disrupts existing development workflow
- **Mitigation**: Phased rollout, maintain GitLab CI during transition, thorough testing
