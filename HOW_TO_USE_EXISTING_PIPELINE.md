# 🎯 How to Adapt Existing Monorepo's CI/CD Pipeline

## Quick Guide

You have an existing large monorepo with a working CI/CD pipeline. Here's how to analyze and adapt it to your new project.

---

## 📝 Step-by-Step Process

### Step 1: Locate CI/CD Files in Existing Monorepo

Navigate to the existing monorepo and find pipeline files:

```powershell
# Navigate to existing monorepo
cd C:\path\to\existing-monorepo

# Find all workflow files
Get-ChildItem -Recurse -Include "*.yml","*.yaml" | Where-Object { $_.FullName -match "workflow|pipeline|ci|cd" } | Select-Object FullName
```

Common locations:
- `.github/workflows/*.yml` (GitHub Actions)
- `.gitlab-ci.yml` (GitLab)
- `azure-pipelines.yml` (Azure DevOps)
- `.circleci/config.yml` (CircleCI)
- `Jenkinsfile` (Jenkins)

### Step 2: Copy Files to Analyze

Create a temporary folder and copy relevant files:

```powershell
# Create analysis folder
New-Item -ItemType Directory -Path "C:\temp\pipeline-analysis" -Force

# Copy workflow files
Copy-Item "C:\path\to\existing-monorepo\.github\workflows\*" -Destination "C:\temp\pipeline-analysis\" -Recurse

# Copy configuration files
Copy-Item "C:\path\to\existing-monorepo\nx.json" -Destination "C:\temp\pipeline-analysis\" -ErrorAction SilentlyContinue
Copy-Item "C:\path\to\existing-monorepo\package.json" -Destination "C:\temp\pipeline-analysis\" -ErrorAction SilentlyContinue
Copy-Item "C:\path\to\existing-monorepo\turbo.json" -Destination "C:\temp\pipeline-analysis\" -ErrorAction SilentlyContinue
```

### Step 3: Use the Prompt

1. Open `COPY_THIS_PROMPT.txt` in this repository
2. Fill in the required information:
   - Path to existing monorepo
   - CI/CD files location
3. Attach the copied files
4. Share with your AI assistant (ChatGPT, Claude, etc.)

### Step 4: Review and Implement

The AI will provide:
1. ✅ Analysis of existing pipeline
2. ✅ Comparison with your current setup
3. ✅ Adapted workflow files
4. ✅ Implementation checklist

---

## 🔍 What to Look For

### In Existing Pipeline Files

#### 1. Change Detection
Look for patterns like:
```yaml
- name: Get changed files
  id: changed-files
  run: |
    git diff --name-only ${{ github.event.before }} ${{ github.sha }}
```

#### 2. Caching
Look for:
```yaml
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

#### 3. Matrix Builds
Look for:
```yaml
strategy:
  matrix:
    environment: [dev, staging, prod]
```

#### 4. Deployment Strategies
Look for:
- Blue-green deployments
- Canary releases
- Rolling updates
- Approval gates

#### 5. Security Scanning
Look for:
- Snyk
- SonarQube
- Dependabot
- CodeQL

---

## 📋 Files to Collect from Existing Monorepo

### Essential Files:
- [ ] All `.github/workflows/*.yml` files
- [ ] `package.json` (root)
- [ ] `nx.json` or `turbo.json` or `lerna.json`
- [ ] Any deployment scripts (`.sh`, `.ps1`)

### Optional but Helpful:
- [ ] `README.md` (CI/CD section)
- [ ] `CONTRIBUTING.md` (deployment process)
- [ ] `.env.example` (environment variables)
- [ ] `docker-compose.yml` (if using Docker)

---

## 🎯 Key Questions to Answer

When analyzing the existing pipeline, answer these:

### Build Strategy:
1. How do they detect which projects changed?
2. Do they build everything or only affected projects?
3. What caching strategies do they use?
4. How long does a typical build take?

### Testing Strategy:
1. What types of tests do they run? (unit, integration, e2e)
2. When do tests run? (on PR, on push, scheduled)
3. Do they run all tests or only affected tests?
4. How do they handle test failures?

### Deployment Strategy:
1. How many environments do they have?
2. What's the deployment flow? (dev → staging → prod)
3. Are there approval gates?
4. How do they handle rollbacks?
5. What deployment method do they use?

### Security:
1. What security scanning tools do they use?
2. When does security scanning run?
3. How do they manage secrets?
4. Do they scan dependencies?

---

## 💡 Common Patterns to Adapt

### Pattern 1: Nx Affected Commands
**If they use:**
```yaml
- run: npx nx affected:build --base=origin/main
```

**Adapt to your project:**
```yaml
- run: npx nx affected --target=build --base=origin/main --head=HEAD
```

### Pattern 2: Custom Change Detection
**If they use:**
```bash
git diff --name-only HEAD~1 HEAD | grep "backend/"
```

**Adapt to your project:**
```yaml
- name: Check backend changes
  id: backend-changes
  run: |
    if git diff --name-only ${{ github.event.before }} ${{ github.sha }} | grep -q "^backend/"; then
      echo "changed=true" >> $GITHUB_OUTPUT
    fi
```

### Pattern 3: Matrix Deployments
**If they use:**
```yaml
strategy:
  matrix:
    environment: [dev, staging, prod]
    region: [us-east, eu-west]
```

**Adapt to your project:**
```yaml
strategy:
  matrix:
    environment: [dev, prod]
    # Start simple, add regions later
```

---

## 🚀 Implementation Priority

### Phase 1: Core Improvements (Week 1)
1. ✅ Change detection (build only what changed)
2. ✅ Improved caching (dependencies + build outputs)
3. ✅ Parallel job execution

### Phase 2: Testing & Quality (Week 2)
4. ✅ Affected tests only
5. ✅ Code coverage reporting
6. ✅ Linting and formatting checks

### Phase 3: Security (Week 3)
7. ✅ Dependency scanning
8. ✅ SAST (Static Analysis)
9. ✅ Secret scanning

### Phase 4: Deployment (Week 4)
10. ✅ Environment-specific deployments
11. ✅ Approval gates for production
12. ✅ Rollback procedures

### Phase 5: Monitoring (Week 5)
13. ✅ Build notifications
14. ✅ Deployment notifications
15. ✅ Performance monitoring

---

## 📊 Comparison Template

Use this to compare pipelines:

| Feature | Existing Monorepo | Your Current Setup | Action Needed |
|---------|-------------------|-------------------|---------------|
| Change Detection | ✅ Nx affected | ❌ Build all | Implement Nx affected |
| Caching | ✅ Multi-layer | ⚠️ Basic | Improve caching |
| Parallel Jobs | ✅ Yes | ⚠️ Partial | Add more parallelization |
| Security Scan | ✅ Snyk + CodeQL | ❌ None | Add security scanning |
| Environments | ✅ Dev/Staging/Prod | ⚠️ Prod only | Add staging |
| Approval Gates | ✅ Yes | ❌ No | Add for production |
| Rollback | ✅ Automated | ❌ Manual | Implement rollback |
| Notifications | ✅ Slack | ❌ None | Add notifications |

---

## 🎓 Learning Resources

### Understanding Monorepo CI/CD:
- [Nx CI/CD Guide](https://nx.dev/ci/intro/ci-with-nx)
- [Turborepo CI/CD](https://turbo.build/repo/docs/ci)
- [GitHub Actions for Monorepos](https://github.blog/2021-11-18-monorepo-ci-cd-with-github-actions/)

### Advanced Patterns:
- [Distributed Task Execution](https://nx.dev/ci/features/distribute-task-execution)
- [Remote Caching](https://nx.dev/ci/features/remote-cache)
- [Deployment Strategies](https://martinfowler.com/bliki/BlueGreenDeployment.html)

---

## ✅ Success Checklist

After adapting the pipeline, verify:

- [ ] Builds are faster (only affected projects)
- [ ] Caching works (check cache hit rates)
- [ ] Tests run selectively (only affected tests)
- [ ] Security scanning is enabled
- [ ] Deployments are automated
- [ ] Rollback procedure is documented
- [ ] Notifications are working
- [ ] Documentation is updated

---

## 🆘 Troubleshooting

### Issue: Can't find pipeline files
**Solution:** Check these locations:
- `.github/workflows/`
- `.gitlab/`
- `.circleci/`
- Root directory for `*pipeline*.yml`

### Issue: Pipeline uses different CI platform
**Solution:** Focus on the strategy, not the syntax:
- Identify stages and jobs
- Note the logic and flow
- Adapt to GitHub Actions syntax

### Issue: Too complex to understand
**Solution:** Start simple:
1. Identify the main workflow
2. Extract core patterns
3. Implement incrementally
4. Test each change

---

## 📞 Need Help?

1. Use `COPY_THIS_PROMPT.txt` with your AI assistant
2. Share the existing pipeline files
3. Ask specific questions about patterns
4. Request step-by-step implementation

---

**Ready to start?** 

1. Locate existing monorepo's CI/CD files
2. Copy `COPY_THIS_PROMPT.txt`
3. Fill in the details
4. Share with AI assistant
5. Implement recommendations

Good luck! 🚀
