# CI/CD GitHub Actions Migration - Design Document

## 1. Architecture Overview

### 1.1 Workflow Structure

The GitHub Actions CI/CD system is organized into modular, reusable workflows:

```
.github/
├── workflows/
│   ├── ci.yml                    # Main CI pipeline (PR + main branch)
│   ├── deploy-dev.yml            # Development deployment
│   ├── deploy-staging.yml        # Staging deployment
│   ├── deploy-prod.yml           # Production deployment (manual approval)
│   ├── security-scan.yml         # Security scanning (scheduled + on-demand)
│   ├── e2e-tests.yml            # E2E tests (separate from CI)
│   └── cache-warmup.yml         # Cache warming (scheduled)
├── actions/
│   ├── setup-node/              # Composite action: Node.js setup + cache
│   ├── setup-dotnet/            # Composite action: .NET setup + cache
│   ├── nx-affected/             # Composite action: Nx affected detection
│   └── notify-teams/            # Composite action: Teams notifications
└── scripts/
    ├── calculate-base-sha.js    # Dynamic base SHA calculation
    ├── check-affected.js        # Affected projects detection
    └── deploy-health-check.js   # Post-deployment smoke tests
```

### 1.2 Key Design Decisions

**Decision 1: Modular Workflows**
- **Rationale**: Separate concerns, easier maintenance, reusable components
- **Trade-off**: More files to manage vs. monolithic workflow
- **Chosen**: Modular approach for better organization

**Decision 2: Composite Actions for Common Patterns**
- **Rationale**: DRY principle, consistent setup across workflows
- **Trade-off**: Abstraction complexity vs. code duplication
- **Chosen**: Composite actions for setup steps (Node, .NET, Nx)

**Decision 3: Nx Cloud for Distributed Caching**
- **Rationale**: Faster builds, shared cache across team
- **Trade-off**: External dependency vs. local-only caching
- **Chosen**: Nx Cloud with fallback to GitHub Actions cache

**Decision 4: Matrix Strategy for Parallel Execution**
- **Rationale**: Maximize parallelism, reduce pipeline duration
- **Trade-off**: Runner cost vs. speed
- **Chosen**: Matrix builds for affected projects (max 5 parallel)

## 2. Workflow Designs

### 2.1 Main CI Workflow (ci.yml)

**Purpose**: Run on every PR and main branch push, execute affected checks

**Triggers**:
- Pull request (opened, synchronize, reopened)
- Push to main branch
- Manual dispatch with base SHA override

**Jobs**:
1. **setup**: Calculate affected projects, set up caching
2. **lint**: Run ESLint, Stylelint, Prettier on affected
3. **test-frontend**: Run Jest/Vitest on affected frontend projects
4. **test-backend**: Run .NET tests on affected backend projects
5. **build-frontend**: Build affected Angular projects
6. **build-backend**: Build affected .NET projects
7. **report**: Aggregate results, post PR comment

**Caching Strategy**:
- Node modules: Key = `${{ runner.os }}-node-${{ hashFiles('**/yarn.lock') }}`
- NuGet packages: Key = `${{ runner.os }}-nuget-${{ hashFiles('**/*.csproj') }}`
- Nx cache: Nx Cloud remote cache + local fallback

**Affected Detection**:
```javascript
// scripts/calculate-base-sha.js
// Logic: Find last successful main branch commit
// Fallback: Use main branch HEAD if no successful run found
```


### 2.2 Deployment Workflows

**Development Deployment (deploy-dev.yml)**
- **Trigger**: Push to main branch (after CI passes)
- **Environment**: development
- **Approval**: None (automatic)
- **Steps**: Build → Deploy → Smoke test → Notify

**Staging Deployment (deploy-staging.yml)**
- **Trigger**: Push to release/* branches
- **Environment**: staging
- **Approval**: None (automatic)
- **Steps**: Build → Deploy → Smoke test → Notify

**Production Deployment (deploy-prod.yml)**
- **Trigger**: Manual dispatch or tag creation
- **Environment**: production
- **Approval**: Required (2 approvers)
- **Steps**: Build → Approval gate → Deploy → Smoke test → Notify
- **Rollback**: Automatic on smoke test failure

### 2.3 Security Scanning Workflow (security-scan.yml)

**Triggers**:
- Pull request (dependency changes)
- Push to main branch
- Schedule: Daily at 2 AM UTC
- Manual dispatch

**Scans**:
1. **Dependency Scanning**: npm audit, dotnet list package --vulnerable
2. **SAST**: CodeQL for TypeScript and C#
3. **Secret Scanning**: GitHub native secret scanning
4. **License Compliance**: Check for GPL/AGPL licenses

**Reporting**:
- Create GitHub Security Advisories for findings
- Block PR merge on high/critical vulnerabilities
- Weekly summary report to team

### 2.4 E2E Testing Workflow (e2e-tests.yml)

**Triggers**:
- Manual dispatch
- Schedule: Nightly at 3 AM UTC
- After successful staging deployment

**Strategy**:
- Matrix: [chrome, firefox, webkit]
- Parallel execution across browsers
- Retry failed tests once
- Upload Playwright traces on failure

## 3. Composite Actions Design

### 3.1 Setup Node Action (.github/actions/setup-node/action.yml)

**Purpose**: Consistent Node.js setup with caching across all workflows

**Inputs**:
- `node-version`: Node.js version (default: 22.x)
- `cache-dependency-path`: Path to yarn.lock (default: yarn.lock)

**Steps**:
1. Setup Node.js with specified version
2. Restore node_modules cache
3. Install dependencies if cache miss
4. Save cache on success

**Cache Strategy**:
- Primary key: `${{ runner.os }}-node-${{ hashFiles('**/yarn.lock') }}`
- Restore keys: `${{ runner.os }}-node-`

### 3.2 Setup .NET Action (.github/actions/setup-dotnet/action.yml)

**Purpose**: Consistent .NET setup with NuGet caching

**Inputs**:
- `dotnet-version`: .NET version (default: 9.0.x)
- `cache-dependency-path`: Path to csproj files (default: backend/**/*.csproj)

**Steps**:
1. Setup .NET SDK with specified version
2. Restore NuGet packages cache
3. Restore packages if cache miss
4. Save cache on success

**Cache Strategy**:
- Primary key: `${{ runner.os }}-nuget-${{ hashFiles('backend/**/*.csproj') }}`
- Restore keys: `${{ runner.os }}-nuget-`

### 3.3 Nx Affected Action (.github/actions/nx-affected/action.yml)

**Purpose**: Calculate affected projects and set outputs for downstream jobs

**Inputs**:
- `base`: Base SHA for comparison (optional, auto-calculated if not provided)
- `head`: Head SHA for comparison (default: HEAD)

**Outputs**:
- `affected-projects`: JSON array of affected project names
- `has-frontend-changes`: Boolean indicating frontend changes
- `has-backend-changes`: Boolean indicating backend changes
- `base-sha`: Calculated base SHA used for comparison

**Logic**:
```javascript
// Pseudo-code for base SHA calculation
if (isPullRequest) {
  base = github.event.pull_request.base.sha
} else if (isMainBranch) {
  base = await getLastSuccessfulMainCommit()
} else {
  base = 'origin/main'
}
```

## 4. Caching Architecture

### 4.1 Multi-Layer Caching Strategy

**Layer 1: GitHub Actions Cache**
- **Purpose**: Fast local cache for dependencies
- **Scope**: Repository-level
- **Size Limit**: 10GB per repository
- **TTL**: 7 days for unused caches

**Cache Entries**:
```yaml
# Node modules
key: ${{ runner.os }}-node-${{ hashFiles('**/yarn.lock') }}
paths:
  - node_modules
  - .yarn/cache

# NuGet packages
key: ${{ runner.os }}-nuget-${{ hashFiles('backend/**/*.csproj') }}
paths:
  - ~/.nuget/packages

# Nx cache (local fallback)
key: ${{ runner.os }}-nx-${{ hashFiles('nx.json', 'package.json') }}
paths:
  - .nx/cache
```

**Layer 2: Nx Cloud Remote Cache**
- **Purpose**: Distributed task result caching
- **Scope**: Organization-level
- **Benefits**: Share cache across team, CI/CD, and local dev
- **Configuration**: Via NX_CLOUD_ACCESS_TOKEN secret

**Cache Hit Optimization**:
1. Use restore-keys for partial matches
2. Separate caches for different OS/Node versions
3. Prune stale caches via scheduled workflow
4. Monitor hit rates via GitHub Actions metrics

### 4.2 Cache Warming Strategy

**Scheduled Cache Warmup (cache-warmup.yml)**
- **Trigger**: Daily at 1 AM UTC
- **Purpose**: Pre-populate caches before team starts work
- **Steps**:
  1. Install all dependencies
  2. Build all projects
  3. Run all tests
  4. Cache results

**Benefits**:
- First PR of the day has warm caches
- Reduces cold start time from 10min to 2min
- Improves developer experience

## 5. Affected Detection Algorithm

### 5.1 Base SHA Calculation

**Algorithm** (.github/scripts/calculate-base-sha.js):

```javascript
async function calculateBaseSha(context) {
  // Case 1: Pull Request
  if (context.eventName === 'pull_request') {
    return context.payload.pull_request.base.sha;
  }
  
  // Case 2: Main branch - find last successful commit
  if (context.ref === 'refs/heads/main') {
    const lastSuccessful = await findLastSuccessfulCommit(context);
    return lastSuccessful || 'HEAD~1';
  }
  
  // Case 3: Feature branch - compare to main
  return 'origin/main';
}

async function findLastSuccessfulCommit(context) {
  const runs = await github.rest.actions.listWorkflowRuns({
    owner: context.repo.owner,
    repo: context.repo.repo,
    workflow_id: 'ci.yml',
    branch: 'main',
    status: 'success',
    per_page: 1
  });
  
  return runs.data.workflow_runs[0]?.head_sha;
}
```

**Edge Cases**:
- First commit: Use `HEAD~1` or skip affected detection
- Force push: Fetch additional history if needed
- Merge commit: Use merge base for accurate comparison

### 5.2 Affected Projects Detection

**Command**:
```bash
yarn nx affected:apps --base=$BASE_SHA --head=$HEAD_SHA --plain
yarn nx affected:libs --base=$BASE_SHA --head=$HEAD_SHA --plain
```

**Output Processing**:
```javascript
// Parse Nx output into structured data
const affectedProjects = {
  frontend: [],
  backend: [],
  shared: []
};

// Categorize by project type
for (const project of projects) {
  if (project.startsWith('backend/')) {
    affectedProjects.backend.push(project);
  } else if (project.startsWith('frontend/')) {
    affectedProjects.frontend.push(project);
  } else {
    affectedProjects.shared.push(project);
  }
}
```

## 6. Parallel Execution Strategy

### 6.1 Matrix Build Configuration

**Frontend Matrix**:
```yaml
strategy:
  matrix:
    project: ${{ fromJson(needs.setup.outputs.affected-frontend) }}
  max-parallel: 5
  fail-fast: false
```

**Backend Matrix**:
```yaml
strategy:
  matrix:
    project: ${{ fromJson(needs.setup.outputs.affected-backend) }}
  max-parallel: 3
  fail-fast: false
```

**Rationale**:
- Frontend: More projects, higher parallelism
- Backend: Fewer projects, lower parallelism
- fail-fast: false to see all failures

### 6.2 Job Dependencies

**Dependency Graph**:
```
setup (calculate affected)
  ├─> lint (parallel)
  ├─> test-frontend (parallel, matrix)
  ├─> test-backend (parallel, matrix)
  ├─> build-frontend (parallel, matrix, depends on test-frontend)
  └─> build-backend (parallel, matrix, depends on test-backend)
       └─> report (aggregates all results)
```

**Benefits**:
- Tests run before builds (fail fast)
- Lint runs independently (fastest feedback)
- Report waits for all jobs (complete picture)

## 7. Security Scanning Design

### 7.1 Dependency Scanning

**Frontend (npm audit)**:
```yaml
- name: Audit npm dependencies
  run: |
    npm audit --audit-level=high --json > audit-results.json
    if [ $(jq '.metadata.vulnerabilities.high + .metadata.vulnerabilities.critical' audit-results.json) -gt 0 ]; then
      echo "High/Critical vulnerabilities found"
      exit 1
    fi
```

**Backend (dotnet list package)**:
```yaml
- name: Check .NET vulnerabilities
  run: |
    dotnet list package --vulnerable --include-transitive > vuln-report.txt
    if grep -q "has the following vulnerable packages" vuln-report.txt; then
      echo "Vulnerable packages found"
      exit 1
    fi
```

### 7.2 SAST with CodeQL

**Configuration** (.github/workflows/codeql.yml):
```yaml
- name: Initialize CodeQL
  uses: github/codeql-action/init@v3
  with:
    languages: typescript, csharp
    queries: security-extended

- name: Autobuild
  uses: github/codeql-action/autobuild@v3

- name: Perform CodeQL Analysis
  uses: github/codeql-action/analyze@v3
```

**Custom Queries**:
- SQL injection detection
- XSS vulnerability detection
- Insecure deserialization
- Hardcoded credentials

### 7.3 License Compliance

**Allowed Licenses**:
- MIT, Apache-2.0, BSD-3-Clause, ISC

**Blocked Licenses**:
- GPL-3.0, AGPL-3.0 (copyleft)
- Commercial licenses without approval

**Check Script**:
```bash
yarn license-checker --production --failOn 'GPL-3.0;AGPL-3.0'
```

## 8. Deployment Architecture

### 8.1 Environment Configuration

**GitHub Environments**:
```yaml
environments:
  development:
    url: https://dev.myaccount.example.com
    protection_rules: []
    
  staging:
    url: https://staging.myaccount.example.com
    protection_rules:
      - reviewers: [team:devops]
    
  production:
    url: https://myaccount.example.com
    protection_rules:
      - reviewers: [team:devops, team:leads]
      - wait_timer: 300  # 5 minute wait
```

**Environment Secrets**:
- `DEPLOY_KEY`: SSH key for deployment
- `API_URL`: Backend API endpoint
- `DATABASE_CONNECTION`: Connection string
- `CDN_URL`: Static asset CDN

### 8.2 Deployment Steps

**Build Artifacts**:
```yaml
- name: Build frontend
  run: yarn nx build frontend --configuration=production
  
- name: Build backend
  run: dotnet publish backend/MyAccount.Api -c Release -o dist/backend

- name: Upload artifacts
  uses: actions/upload-artifact@v4
  with:
    name: build-artifacts-${{ github.sha }}
    path: |
      dist/frontend
      dist/backend
    retention-days: 30
```

**Deployment**:
```yaml
- name: Download artifacts
  uses: actions/download-artifact@v4
  with:
    name: build-artifacts-${{ github.sha }}

- name: Deploy to Azure
  uses: azure/webapps-deploy@v3
  with:
    app-name: myaccount-${{ env.ENVIRONMENT }}
    package: dist
```

### 8.3 Smoke Tests

**Health Check**:
```javascript
// .github/scripts/deploy-health-check.js
async function runSmokeTests(baseUrl) {
  const tests = [
    { name: 'Health endpoint', url: `${baseUrl}/health` },
    { name: 'API status', url: `${baseUrl}/api/status` },
    { name: 'Frontend loads', url: baseUrl }
  ];
  
  for (const test of tests) {
    const response = await fetch(test.url);
    if (!response.ok) {
      throw new Error(`${test.name} failed: ${response.status}`);
    }
  }
}
```

**Rollback on Failure**:
```yaml
- name: Run smoke tests
  id: smoke-tests
  run: node .github/scripts/deploy-health-check.js
  continue-on-error: true

- name: Rollback on failure
  if: steps.smoke-tests.outcome == 'failure'
  run: |
    echo "Smoke tests failed, rolling back"
    # Redeploy previous version
    az webapp deployment slot swap --slot staging --name myaccount-prod
```

## 9. Monitoring & Notifications

### 9.1 Pipeline Metrics

**Tracked Metrics**:
- Pipeline duration (p50, p95, p99)
- Cache hit rates (node_modules, NuGet, Nx)
- Test execution time per project
- Deployment frequency
- Deployment success rate
- Mean time to recovery (MTTR)

**Collection**:
```yaml
- name: Record metrics
  run: |
    echo "pipeline_duration_seconds ${{ job.duration }}" >> metrics.txt
    echo "cache_hit_rate ${{ steps.cache.outputs.cache-hit }}" >> metrics.txt
```

### 9.2 Notification System

**Teams Notification Action** (.github/actions/notify-teams/action.yml):
```yaml
inputs:
  webhook-url:
    required: true
  status:
    required: true
  message:
    required: true

runs:
  using: composite
  steps:
    - name: Send Teams notification
      shell: bash
      run: |
        curl -H 'Content-Type: application/json' \
          -d '{
            "title": "Pipeline ${{ inputs.status }}",
            "text": "${{ inputs.message }}",
            "themeColor": "${{ inputs.status == 'success' && '00FF00' || 'FF0000' }}"
          }' \
          ${{ inputs.webhook-url }}
```

**Usage**:
```yaml
- name: Notify on failure
  if: failure()
  uses: ./.github/actions/notify-teams
  with:
    webhook-url: ${{ secrets.TEAMS_WEBHOOK_URL }}
    status: failure
    message: "CI pipeline failed on ${{ github.ref }}"
```

## 10. Migration from GitLab CI

### 10.1 Feature Parity Matrix

| GitLab CI Feature | GitHub Actions Equivalent | Status |
|-------------------|---------------------------|--------|
| `stages` | `jobs.<job_id>.needs` | ✅ Equivalent |
| `extends` | Composite actions | ✅ Better |
| `include` | Reusable workflows | ✅ Equivalent |
| `artifacts` | `actions/upload-artifact` | ✅ Equivalent |
| `cache` | `actions/cache` | ✅ Equivalent |
| `rules` | `if` conditions | ✅ Equivalent |
| `trigger` | `workflow_dispatch` | ✅ Equivalent |
| `needs` | `jobs.<job_id>.needs` | ✅ Equivalent |
| Nx Cloud | Nx Cloud | ✅ Same |
| GitLab Runner | GitHub-hosted runners | ✅ Equivalent |

### 10.2 Key Differences

**1. Workflow Syntax**:
- GitLab: YAML with `stages`, `extends`, `rules`
- GitHub: YAML with `jobs`, `needs`, `if`

**2. Caching**:
- GitLab: Built-in cache with `cache:` key
- GitHub: Explicit `actions/cache` action

**3. Artifacts**:
- GitLab: Built-in `artifacts:` key
- GitHub: Explicit `actions/upload-artifact` action

**4. Reusability**:
- GitLab: `extends`, `include`
- GitHub: Composite actions, reusable workflows

**5. Environments**:
- GitLab: Environment variables + protected environments
- GitHub: GitHub Environments with protection rules

### 10.3 Migration Checklist

**Pre-Migration**:
- [ ] Audit existing GitLab CI pipelines
- [ ] Document custom scripts and tools
- [ ] Identify external dependencies (Nx Cloud, deployment targets)
- [ ] Set up GitHub repository with admin access
- [ ] Configure GitHub Environments (dev, staging, prod)
- [ ] Migrate secrets to GitHub Secrets

**Migration**:
- [ ] Create composite actions for common patterns
- [ ] Implement main CI workflow (ci.yml)
- [ ] Implement deployment workflows
- [ ] Implement security scanning workflow
- [ ] Set up Nx Cloud integration
- [ ] Configure branch protection rules
- [ ] Test workflows on feature branch

**Post-Migration**:
- [ ] Run parallel pipelines (GitLab + GitHub) for 1 week
- [ ] Compare pipeline duration and success rates
- [ ] Train team on GitHub Actions
- [ ] Update documentation
- [ ] Decommission GitLab CI

## 11. Performance Optimization

### 11.1 Optimization Techniques

**1. Conditional Job Execution**:
```yaml
jobs:
  test-frontend:
    if: needs.setup.outputs.has-frontend-changes == 'true'
```

**2. Sparse Checkout**:
```yaml
- uses: actions/checkout@v4
  with:
    sparse-checkout: |
      frontend
      .github
```

**3. Incremental Builds**:
```yaml
- name: Build affected
  run: yarn nx affected -t build --base=$BASE_SHA
```

**4. Parallel Test Execution**:
```yaml
- name: Run tests
  run: yarn nx affected -t test --parallel=3
```

**5. Cache Warming**:
- Scheduled workflow to pre-populate caches
- Reduces cold start time

### 11.2 Expected Performance

**Baseline (No Optimization)**:
- PR pipeline: 20-30 minutes
- Full pipeline: 45-60 minutes

**Optimized (With All Techniques)**:
- PR pipeline: 5-10 minutes (affected only)
- Full pipeline: 20-30 minutes (parallel + caching)

**Improvement**: 60-70% reduction in pipeline duration

## 12. Security Best Practices

### 12.1 Secrets Management

**GitHub Secrets**:
- Store all credentials in GitHub Secrets
- Use Environment secrets for deployment credentials
- Rotate secrets every 90 days
- Never log secrets in workflow output

**OIDC Authentication**:
```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsRole
    aws-region: us-east-1
```

### 12.2 Action Security

**Pin Actions to SHA**:
```yaml
# ❌ Bad: Tag can be moved
- uses: actions/checkout@v4

# ✅ Good: SHA is immutable
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11  # v4.1.1
```

**Limit Permissions**:
```yaml
permissions:
  contents: read
  pull-requests: write
  security-events: write
```

### 12.3 Supply Chain Security

**Dependency Pinning**:
- Pin all npm dependencies to exact versions
- Use `yarn.lock` for reproducible builds
- Audit dependencies on every PR

**SBOM Generation**:
```yaml
- name: Generate SBOM
  uses: anchore/sbom-action@v0
  with:
    format: cyclonedx-json
    output-file: sbom.json
```

## 13. Correctness Properties

### Property 1: Affected Detection Accuracy
**Statement**: For any commit C, the set of affected projects A must include all projects that transitively depend on changed files.

**Validation**:
```typescript
// Test: Change a shared library, verify all consumers are affected
const changedFiles = ['packages/shared/utils.ts'];
const affected = await getAffectedProjects(changedFiles);
const expected = ['frontend', 'backend', 'shared'];
assert(affected.includes(...expected));
```

### Property 2: Cache Consistency
**Statement**: For identical inputs (lock files, source files), cache hits must produce identical outputs.

**Validation**:
```typescript
// Test: Run build twice with same inputs, verify cache hit
const run1 = await runBuild();
const run2 = await runBuild();
assert(run2.cacheHit === true);
assert(run1.output === run2.output);
```

### Property 3: Deployment Idempotency
**Statement**: Deploying the same artifact multiple times must produce the same result.

**Validation**:
```typescript
// Test: Deploy same artifact twice, verify identical state
const artifact = buildArtifact();
const deploy1 = await deploy(artifact);
const deploy2 = await deploy(artifact);
assert(deploy1.state === deploy2.state);
```

### Property 4: Rollback Safety
**Statement**: Rolling back to version V must restore the exact state of version V.

**Validation**:
```typescript
// Test: Deploy V2, rollback to V1, verify V1 state
await deploy('v2');
await rollback('v1');
const state = await getDeploymentState();
assert(state.version === 'v1');
```

## 14. Testing Strategy

### 14.1 Workflow Testing

**Local Testing with act**:
```bash
# Install act
brew install act

# Test CI workflow locally
act pull_request -W .github/workflows/ci.yml

# Test with secrets
act -s GITHUB_TOKEN=xxx -s NX_CLOUD_ACCESS_TOKEN=yyy
```

**Integration Testing**:
- Create test repository
- Run workflows on test branches
- Verify outputs and artifacts
- Test failure scenarios

### 14.2 Smoke Testing

**Post-Deployment Checks**:
1. Health endpoint returns 200
2. API responds within 2 seconds
3. Frontend loads without errors
4. Database connection succeeds
5. Cache is warm

**Automated Rollback**:
- If any smoke test fails, trigger rollback
- Notify team of rollback
- Create incident ticket

## 15. Documentation Requirements

### 15.1 Workflow Documentation

**Each workflow must include**:
- Purpose and triggers
- Required secrets and variables
- Expected duration
- Failure troubleshooting guide
- Contact for support

**Example**:
```yaml
# .github/workflows/ci.yml
# Purpose: Run CI checks on PRs and main branch
# Triggers: pull_request, push to main
# Duration: 5-10 minutes (affected), 20-30 minutes (full)
# Secrets: NX_CLOUD_ACCESS_TOKEN, TEAMS_WEBHOOK_URL
# Support: #devops-support
```

### 15.2 Runbook

**CI/CD Runbook** (docs/runbook-cicd.md):
- How to trigger manual deployments
- How to rollback deployments
- How to debug failed workflows
- How to update secrets
- How to add new environments
- Emergency contacts

## 16. Success Metrics

### 16.1 Performance Metrics

**Target**:
- PR pipeline: < 10 minutes (p95)
- Full pipeline: < 30 minutes (p95)
- Cache hit rate: > 80%
- Deployment frequency: > 10/day

**Measurement**:
- GitHub Actions insights
- Custom metrics collection
- Weekly performance reports

### 16.2 Quality Metrics

**Target**:
- Pipeline success rate: > 95%
- Test flakiness: < 2%
- Security scan false positives: < 5%
- Deployment success rate: > 98%

**Measurement**:
- GitHub Actions logs
- Test result analysis
- Security scan reports
- Deployment logs

### 16.3 Developer Experience Metrics

**Target**:
- Time to first feedback: < 2 minutes
- Time to merge: < 4 hours
- Developer satisfaction: > 4/5

**Measurement**:
- Developer surveys
- PR metrics
- Feedback sessions
