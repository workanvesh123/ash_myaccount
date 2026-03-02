# CI/CD GitHub Actions Implementation Guide

## Executive Summary

This guide provides a complete migration path from the existing GitLab CI/CD pipeline to GitHub Actions for the ash_myaccount monorepo project. The new pipeline maintains all sophisticated features from the source repository while optimizing for GitHub Actions' strengths.

### Key Improvements Over GitLab CI

1. **Better Caching**: GitHub Actions cache + Nx Cloud integration
2. **Simpler Syntax**: More intuitive YAML structure
3. **Native GitHub Integration**: PR comments, security advisories, environments
4. **Cost Efficiency**: 2000 free minutes/month (vs GitLab's 400)
5. **Marketplace Actions**: Extensive ecosystem of pre-built actions

### Performance Targets

| Metric | Current (GitLab) | Target (GitHub) | Improvement |
|--------|------------------|-----------------|-------------|
| PR Pipeline | 15-20 min | 5-10 min | 50-66% faster |
| Full Pipeline | 40-50 min | 20-30 min | 40-50% faster |
| Cache Hit Rate | ~70% | >80% | +10-15% |
| Setup Time | 3-5 min | 1-2 min | 60-66% faster |

## Phase 1: Foundation Setup (Week 1)

### Day 1-2: Repository Setup

**1. Create GitHub Repository Structure**

```bash
# Create .github directory structure
mkdir -p .github/{workflows,actions,scripts}

# Copy workflow files from spec
cp .kiro/specs/cicd-github-actions-migration/workflows/ci.yml .github/workflows/
```

**2. Configure GitHub Repository Settings**

Navigate to repository settings and configure:

```yaml
# Settings > General
- Default branch: main
- Allow squash merging: ✅
- Allow merge commits: ❌
- Allow rebase merging: ✅
- Automatically delete head branches: ✅

# Settings > Branches > Branch protection rules (main)
- Require pull request before merging: ✅
  - Require approvals: 1
  - Dismiss stale reviews: ✅
- Require status checks to pass: ✅
  - Require branches to be up to date: ✅
  - Status checks: format-check, lint-frontend, test-frontend, build-frontend, test-backend, build-backend
- Require conversation resolution: ✅
- Do not allow bypassing: ✅
```

**3. Set Up GitHub Secrets**

```bash
# Required secrets (Settings > Secrets and variables > Actions)
NX_CLOUD_ACCESS_TOKEN=<your-nx-cloud-token>
TEAMS_WEBHOOK_URL=<your-teams-webhook>

# Optional secrets (for deployment)
AZURE_CREDENTIALS=<azure-service-principal>
AWS_ACCESS_KEY_ID=<aws-key>
AWS_SECRET_ACCESS_KEY=<aws-secret>
```

**4. Set Up GitHub Environments**

```yaml
# Settings > Environments

# Development
Name: development
URL: https://dev.myaccount.example.com
Protection rules: None
Secrets:
  - DEPLOY_KEY
  - API_URL
  - DATABASE_CONNECTION

# Staging
Name: staging
URL: https://staging.myaccount.example.com
Protection rules:
  - Required reviewers: devops-team
Secrets:
  - DEPLOY_KEY
  - API_URL
  - DATABASE_CONNECTION

# Production
Name: production
URL: https://myaccount.example.com
Protection rules:
  - Required reviewers: devops-team, tech-leads
  - Wait timer: 5 minutes
Secrets:
  - DEPLOY_KEY
  - API_URL
  - DATABASE_CONNECTION
```

### Day 3-4: Nx Cloud Integration

**1. Sign Up for Nx Cloud**

```bash
# Visit https://nx.app and create account
# Connect to GitHub repository
# Copy access token
```

**2. Configure Nx Cloud in Repository**

```json
// nx.json
{
  "nxCloudAccessToken": "WILL_BE_OVERRIDDEN_BY_ENV",
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx-cloud",
      "options": {
        "cacheableOperations": ["build", "test", "lint"],
        "parallel": 3
      }
    }
  }
}
```

**3. Test Nx Cloud Locally**

```bash
# Set token
export NX_CLOUD_ACCESS_TOKEN=<your-token>

# Run affected build
yarn nx affected -t build

# Verify cache hit on second run
yarn nx affected -t build
# Should see: "Nx read the output from the cache"
```

### Day 5: First Workflow Test

**1. Create Test Branch**

```bash
git checkout -b test/ci-pipeline
```

**2. Make Small Change**

```typescript
// frontend/src/app/app.component.ts
export class AppComponent {
  title = 'Test CI Pipeline'; // Changed
}
```

**3. Push and Create PR**

```bash
git add .
git commit -m "test: verify CI pipeline"
git push origin test/ci-pipeline

# Create PR via GitHub UI
```

**4. Monitor Workflow Execution**

- Navigate to Actions tab
- Watch CI workflow run
- Verify all jobs complete successfully
- Check PR comment with results

**Expected Results**:
- ✅ Format check passes
- ✅ Lint passes (only affected projects)
- ✅ Tests pass (only affected projects)
- ✅ Build succeeds (only affected projects)
- ⏱️ Duration: 5-8 minutes

## Phase 2: Quality Gates (Week 2)

### Day 1-2: Security Scanning

**1. Create Security Workflow**

```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  pull_request:
    paths:
      - 'package.json'
      - 'yarn.lock'
      - 'backend/**/*.csproj'
  push:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC

jobs:
  dependency-scan-frontend:
    name: Scan Frontend Dependencies
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22.x'
      
      - name: Run npm audit
        run: |
          npm audit --audit-level=high --json > audit-results.json
          VULNS=$(jq '.metadata.vulnerabilities.high + .metadata.vulnerabilities.critical' audit-results.json)
          if [ $VULNS -gt 0 ]; then
            echo "Found $VULNS high/critical vulnerabilities"
            cat audit-results.json | jq '.vulnerabilities'
            exit 1
          fi
  
  dependency-scan-backend:
    name: Scan Backend Dependencies
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '9.0.x'
      
      - name: Check vulnerable packages
        run: |
          dotnet list backend/ package --vulnerable --include-transitive > vuln-report.txt
          if grep -q "has the following vulnerable packages" vuln-report.txt; then
            cat vuln-report.txt
            exit 1
          fi
  
  codeql:
    name: CodeQL Analysis
    runs-on: ubuntu-latest
    permissions:
      security-events: write
    steps:
      - uses: actions/checkout@v4
      
      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: typescript, csharp
          queries: security-extended
      
      - name: Autobuild
        uses: github/codeql-action/autobuild@v3
      
      - name: Perform Analysis
        uses: github/codeql-action/analyze@v3
```

**2. Enable GitHub Security Features**

```yaml
# Settings > Code security and analysis
- Dependency graph: ✅ Enable
- Dependabot alerts: ✅ Enable
- Dependabot security updates: ✅ Enable
- Code scanning: ✅ Enable (CodeQL)
- Secret scanning: ✅ Enable
```

**3. Test Security Workflow**

```bash
# Trigger manually
gh workflow run security-scan.yml

# Or wait for scheduled run
```

### Day 3-4: Code Quality Checks

**1. Add Code Coverage Reporting**

```yaml
# Add to ci.yml after test jobs
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    files: ./coverage/coverage-final.json
    flags: frontend
    name: frontend-coverage
```

**2. Add Bundle Size Checks**

```yaml
# .github/workflows/bundle-size.yml
name: Bundle Size Check

on:
  pull_request:
    paths:
      - 'frontend/**'

jobs:
  check-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22.x'
          cache: 'yarn'
      
      - run: yarn install --immutable
      - run: yarn nx build frontend --configuration=production
      
      - name: Check bundle size
        run: |
          SIZE=$(du -sb dist/frontend/browser | cut -f1)
          MAX_SIZE=5242880  # 5MB
          if [ $SIZE -gt $MAX_SIZE ]; then
            echo "Bundle size $SIZE exceeds maximum $MAX_SIZE"
            exit 1
          fi
```

### Day 5: E2E Testing Setup

**1. Create E2E Workflow**

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  workflow_dispatch:
  schedule:
    - cron: '0 3 * * *'  # Nightly at 3 AM UTC

jobs:
  e2e:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
      fail-fast: false
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '22.x'
          cache: 'yarn'
      
      - run: yarn install --immutable
      
      - name: Install Playwright
        run: yarn playwright install --with-deps ${{ matrix.browser }}
      
      - name: Run E2E tests
        run: yarn nx e2e frontend-e2e --browser=${{ matrix.browser }}
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-results-${{ matrix.browser }}
          path: dist/.playwright/
          retention-days: 7
```

## Phase 3: Deployment Automation (Week 3)

### Day 1-2: Development Deployment

**1. Create Deployment Workflow**

```yaml
# .github/workflows/deploy-dev.yml
name: Deploy to Development

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    name: Deploy to Dev
    runs-on: ubuntu-latest
    environment: development
    
    steps:
      - uses: actions/checkout@v4
      
      # Download artifacts from CI workflow
      - name: Download frontend artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-frontend-${{ github.sha }}
          path: dist/frontend/
      
      - name: Download backend artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-backend-${{ github.sha }}
          path: dist/backend/
      
      # Deploy to Azure (example)
      - name: Deploy frontend to Azure Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "dist/frontend/browser"
      
      - name: Deploy backend to Azure App Service
        uses: azure/webapps-deploy@v3
        with:
          app-name: myaccount-dev
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: dist/backend/
      
      # Smoke tests
      - name: Run smoke tests
        run: |
          sleep 30  # Wait for deployment
          curl -f https://dev.myaccount.example.com/health || exit 1
          curl -f https://dev.myaccount.example.com/api/status || exit 1
      
      - name: Notify Teams
        if: always()
        run: |
          STATUS="${{ job.status }}"
          COLOR=$([ "$STATUS" == "success" ] && echo "00FF00" || echo "FF0000")
          curl -H 'Content-Type: application/json' \
            -d "{
              \"title\": \"Deployment to Development $STATUS\",
              \"text\": \"Version: ${{ github.sha }}\",
              \"themeColor\": \"$COLOR\"
            }" \
            ${{ secrets.TEAMS_WEBHOOK_URL }}
```

**2. Test Development Deployment**

```bash
# Merge PR to main
git checkout main
git pull
git merge test/ci-pipeline
git push

# Watch deployment
gh run watch
```

### Day 3-4: Staging & Production Deployments

**1. Create Staging Deployment**

```yaml
# .github/workflows/deploy-staging.yml
# Similar to deploy-dev.yml but:
# - Trigger: push to release/* branches
# - Environment: staging
# - Requires manual approval (configured in environment settings)
```

**2. Create Production Deployment**

```yaml
# .github/workflows/deploy-prod.yml
# Similar to deploy-staging.yml but:
# - Trigger: workflow_dispatch only
# - Environment: production
# - Requires 2 approvals
# - Includes rollback capability
```

**3. Add Rollback Workflow**

```yaml
# .github/workflows/rollback.yml
name: Rollback Deployment

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to rollback'
        required: true
        type: choice
        options:
          - development
          - staging
          - production
      version:
        description: 'Version SHA to rollback to'
        required: true
        type: string

jobs:
  rollback:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ inputs.version }}
      
      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-frontend-${{ inputs.version }}
          path: dist/frontend/
      
      - name: Deploy previous version
        # ... deployment steps ...
      
      - name: Verify rollback
        run: |
          # Smoke tests
          curl -f https://${{ inputs.environment }}.myaccount.example.com/health
```

### Day 5: Deployment Testing

**1. Test Full Deployment Flow**

```bash
# 1. Create release branch
git checkout -b release/v1.0.0

# 2. Push to trigger staging deployment
git push origin release/v1.0.0

# 3. Approve staging deployment in GitHub UI
# 4. Verify staging environment
# 5. Trigger production deployment manually
gh workflow run deploy-prod.yml

# 6. Approve production deployment (2 approvers)
# 7. Verify production environment
```

## Phase 4: Optimization & Monitoring (Week 4)

### Day 1-2: Performance Optimization

**1. Implement Cache Warming**

```yaml
# .github/workflows/cache-warmup.yml
name: Cache Warmup

on:
  schedule:
    - cron: '0 1 * * *'  # Daily at 1 AM UTC

jobs:
  warmup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '22.x'
          cache: 'yarn'
      
      - run: yarn install --immutable
      
      - name: Build all projects
        run: yarn nx run-many -t build --all
      
      - name: Test all projects
        run: yarn nx run-many -t test --all
```

**2. Optimize Nx Configuration**

```json
// nx.json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx-cloud",
      "options": {
        "cacheableOperations": ["build", "test", "lint", "e2e"],
        "parallel": 5,  // Increased from 3
        "maxParallel": 10,
        "runtimeCacheInputs": ["node -v"]
      }
    }
  },
  "targetDefaults": {
    "build": {
      "cache": true,
      "dependsOn": ["^build"]
    },
    "test": {
      "cache": true,
      "inputs": ["default", "^production"]
    }
  }
}
```

**3. Add Sparse Checkout for Large Repos**

```yaml
# In workflows, replace checkout with:
- uses: actions/checkout@v4
  with:
    sparse-checkout: |
      frontend
      backend
      .github
    sparse-checkout-cone-mode: false
```

### Day 3-4: Monitoring Setup

**1. Create Metrics Collection Script**

```javascript
// .github/scripts/collect-metrics.js
const fs = require('fs');

async function collectMetrics() {
  const metrics = {
    timestamp: new Date().toISOString(),
    workflow: process.env.GITHUB_WORKFLOW,
    duration: process.env.GITHUB_RUN_DURATION,
    status: process.env.GITHUB_RUN_STATUS,
    cacheHit: process.env.CACHE_HIT === 'true',
    affectedProjects: JSON.parse(process.env.AFFECTED_PROJECTS || '[]').length
  };
  
  fs.appendFileSync('metrics.jsonl', JSON.stringify(metrics) + '\n');
}

collectMetrics();
```

**2. Add Metrics to Workflows**

```yaml
# Add to end of ci.yml
- name: Collect metrics
  if: always()
  run: node .github/scripts/collect-metrics.js
  env:
    GITHUB_RUN_DURATION: ${{ job.duration }}
    GITHUB_RUN_STATUS: ${{ job.status }}
    CACHE_HIT: ${{ steps.cache.outputs.cache-hit }}
    AFFECTED_PROJECTS: ${{ needs.setup.outputs.affected-frontend }}
```

**3. Set Up Alerts**

```yaml
# .github/workflows/alerts.yml
name: Pipeline Alerts

on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]
    branches: [main]

jobs:
  alert-on-failure:
    if: ${{ github.event.workflow_run.conclusion == 'failure' }}
    runs-on: ubuntu-latest
    steps:
      - name: Send alert
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
            -H 'Content-Type: application/json' \
            -d '{
              "text": "🚨 Main branch CI failed!",
              "blocks": [{
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": "*CI Pipeline Failed on Main*\n<${{ github.event.workflow_run.html_url }}|View Run>"
                }
              }]
            }'
```

### Day 5: Documentation & Training

**1. Create Runbook**

```markdown
# CI/CD Runbook

## Common Tasks

### Trigger Manual Deployment
```bash
gh workflow run deploy-prod.yml
```

### Rollback Deployment
```bash
gh workflow run rollback.yml -f environment=production -f version=abc123
```

### Debug Failed Workflow
1. Navigate to Actions tab
2. Click failed workflow run
3. Click failed job
4. Expand failed step
5. Check logs for error message

### Update Secrets
1. Settings > Secrets and variables > Actions
2. Click "Update" on secret
3. Enter new value
4. Save

## Emergency Contacts
- DevOps Team: #devops-support
- On-Call: +1-555-0100
```

**2. Create Migration Checklist**

```markdown
# Migration Checklist

## Pre-Migration
- [ ] GitHub repository created
- [ ] Admin access granted
- [ ] Nx Cloud account set up
- [ ] Secrets configured
- [ ] Environments configured
- [ ] Branch protection rules set

## Migration
- [ ] CI workflow tested on feature branch
- [ ] Security scanning enabled
- [ ] Deployment workflows created
- [ ] Rollback workflow tested
- [ ] Team trained on GitHub Actions

## Post-Migration
- [ ] Parallel pipelines running (GitLab + GitHub)
- [ ] Performance metrics collected
- [ ] Team feedback gathered
- [ ] Documentation updated
- [ ] GitLab CI decommissioned
```

## Troubleshooting Guide

### Issue: Workflow Not Triggering

**Symptoms**: Push to branch doesn't trigger workflow

**Solutions**:
1. Check workflow file syntax: `gh workflow view ci.yml`
2. Verify trigger conditions match branch name
3. Check if workflow is disabled: Settings > Actions
4. Verify branch protection rules don't block workflows

### Issue: Cache Miss Every Time

**Symptoms**: Cache never hits, always installing dependencies

**Solutions**:
1. Check cache key includes correct hash: `${{ hashFiles('**/yarn.lock') }}`
2. Verify cache path is correct: `node_modules`, `.yarn/cache`
3. Check cache size doesn't exceed 10GB limit
4. Verify restore-keys are set for partial matches

### Issue: Affected Detection Not Working

**Symptoms**: All projects build on every PR

**Solutions**:
1. Verify base SHA calculation is correct
2. Check git fetch depth is sufficient (fetch-depth: 0)
3. Verify Nx configuration has correct base branch
4. Test locally: `yarn nx affected:apps --base=main`

### Issue: Deployment Fails

**Symptoms**: Deployment job fails with authentication error

**Solutions**:
1. Verify secrets are set in environment
2. Check secret names match workflow file
3. Verify deployment credentials haven't expired
4. Test deployment locally with same credentials

### Issue: Tests Flaky

**Symptoms**: Tests pass locally but fail in CI

**Solutions**:
1. Check for timing issues (add waits)
2. Verify test isolation (no shared state)
3. Check for environment-specific issues (timezone, locale)
4. Run tests multiple times locally: `yarn nx test --repeat=10`

## Success Metrics Dashboard

Track these metrics weekly:

```markdown
# Week of [DATE]

## Performance
- PR Pipeline Duration (p95): X minutes (target: <10)
- Full Pipeline Duration (p95): X minutes (target: <30)
- Cache Hit Rate: X% (target: >80%)

## Quality
- Pipeline Success Rate: X% (target: >95%)
- Test Flakiness: X% (target: <2%)
- Security Scan False Positives: X (target: <5)

## Deployment
- Deployment Frequency: X/day (target: >10)
- Deployment Success Rate: X% (target: >98%)
- Mean Time to Recovery: X minutes (target: <30)

## Developer Experience
- Time to First Feedback: X minutes (target: <2)
- Time to Merge: X hours (target: <4)
- Developer Satisfaction: X/5 (target: >4)
```

## Next Steps

After completing all phases:

1. **Week 5**: Run parallel pipelines (GitLab + GitHub) to compare
2. **Week 6**: Gather team feedback and iterate
3. **Week 7**: Full cutover to GitHub Actions
4. **Week 8**: Decommission GitLab CI, celebrate! 🎉

## Support

For questions or issues:
- GitHub Discussions: [Link to repo discussions]
- Slack: #devops-support
- Email: devops@example.com
- On-call: +1-555-0100
