# 🔍 Prompt: Analyze and Adapt Existing Monorepo CI/CD Pipeline

Use this prompt with your AI assistant to analyze the existing monorepo's pipeline and adapt it to your project.

---

## 📋 Prompt to Use

```
I have an existing large monorepo with a working CI/CD pipeline that I want to analyze and adapt for my new project.

CONTEXT ABOUT MY NEW PROJECT:
- Repository: https://github.com/workanvesh123/ash_myaccount
- Structure: Monorepo with backend (.NET 9) and frontend (Angular 20)
- Current location: C:\monorepos\newmonorepomyaccount\ash_myaccount
- Backend: backend/MyAccount.Api/ (.NET 9 Minimal APIs)
- Frontend: frontend/ (Angular 20 with SSR, Nx workspace)
- Current CI/CD: Basic GitHub Actions workflows already created

EXISTING MONOREPO TO ANALYZE:
- Location: [PROVIDE PATH TO EXISTING MONOREPO]
- CI/CD files location: [e.g., .github/workflows/, .gitlab-ci.yml, azure-pipelines.yml]

WHAT I NEED YOU TO DO:

1. ANALYZE the existing monorepo's CI/CD strategy:
   - Read all pipeline configuration files (.github/workflows/, .gitlab-ci.yml, etc.)
   - Identify the pipeline structure (stages, jobs, dependencies)
   - Note deployment strategies (environments, approval gates, rollback)
   - Document build optimization techniques (caching, parallelization, matrix builds)
   - Identify monorepo-specific patterns (affected detection, selective builds)
   - Note security practices (secret management, scanning, SAST/DAST)
   - Document testing strategies (unit, integration, e2e, performance)
   - Identify deployment targets and infrastructure

2. COMPARE with my current setup:
   - Review my existing workflows in .github/workflows/
   - Identify gaps and improvements
   - Note what's already implemented vs what's missing

3. ADAPT the best practices to my project:
   - Modify pipeline strategies to fit my .NET 9 + Angular 20 stack
   - Adapt monorepo patterns (if they use Nx, Turborepo, Lerna, etc.)
   - Implement affected/changed file detection for selective builds
   - Add appropriate caching strategies
   - Implement proper environment management (dev, staging, prod)
   - Add security scanning if present in original
   - Adapt deployment strategies

4. PROVIDE specific recommendations:
   - Which patterns to adopt immediately
   - Which patterns to adapt/modify
   - Which patterns to skip (and why)
   - Step-by-step implementation plan
   - Updated workflow files with inline comments explaining changes

5. CREATE updated workflow files that:
   - Maintain compatibility with my current structure
   - Implement best practices from the existing monorepo
   - Are optimized for .NET 9 and Angular 20
   - Include proper error handling and notifications
   - Have clear documentation

SPECIFIC AREAS TO FOCUS ON:
- [ ] Monorepo change detection (only build what changed)
- [ ] Caching strategies (dependencies, build artifacts)
- [ ] Parallel job execution
- [ ] Environment-specific deployments
- [ ] Approval workflows for production
- [ ] Rollback strategies
- [ ] Security scanning (SAST, dependency scanning)
- [ ] Performance testing
- [ ] Deployment notifications (Slack, Teams, email)
- [ ] Infrastructure as Code (if applicable)

OUTPUT FORMAT:
1. Analysis summary of existing pipeline
2. Comparison with my current setup
3. Recommended adaptations with rationale
4. Updated workflow files (complete, ready to use)
5. Implementation checklist with priorities
6. Documentation updates needed

CONSTRAINTS:
- Must work with GitHub Actions (my current platform)
- Must support .NET 9 and Angular 20
- Should be production-ready
- Should follow security best practices
- Should be maintainable and well-documented

Please analyze the existing monorepo's CI/CD pipeline and provide adapted workflows for my project.
```

---

## 🎯 How to Use This Prompt

### Step 1: Gather Information
Before using the prompt, collect:

1. **Path to existing monorepo**
   ```powershell
   # Example
   C:\monorepos\existing-large-monorepo
   ```

2. **CI/CD files location**
   ```powershell
   # Find pipeline files
   Get-ChildItem -Path "C:\monorepos\existing-large-monorepo" -Recurse -Include "*.yml","*.yaml" | Where-Object { $_.FullName -match "workflow|pipeline|ci|cd" }
   ```

3. **Key files to analyze**
   - `.github/workflows/*.yml`
   - `.gitlab-ci.yml`
   - `azure-pipelines.yml`
   - `bitbucket-pipelines.yml`
   - `Jenkinsfile`
   - `.circleci/config.yml`

### Step 2: Prepare Context
Create a summary of the existing monorepo:

```powershell
# Navigate to existing monorepo
cd C:\monorepos\existing-large-monorepo

# List all workflow files
Get-ChildItem -Path .github/workflows -Filter "*.yml" | Select-Object Name

# Check for monorepo tools
Get-Content package.json | Select-String "nx|lerna|turborepo|rush"

# Check project structure
tree /F /A > structure.txt
```

### Step 3: Use the Prompt
Copy the prompt above and fill in:
- `[PROVIDE PATH TO EXISTING MONOREPO]` - Full path
- Add any specific requirements or constraints

### Step 4: Provide Files to AI
Share these files from the existing monorepo:
1. All `.github/workflows/*.yml` files
2. `package.json` (root and workspace packages)
3. `nx.json` or `turbo.json` (if present)
4. `tsconfig.json` or similar config files
5. Any deployment scripts

---

## 📝 Example Usage

### If the existing monorepo uses Nx:

```
ADDITIONAL CONTEXT:
The existing monorepo uses Nx for build orchestration.

Key files to analyze:
- .github/workflows/ci.yml
- .github/workflows/deploy.yml
- nx.json
- workspace.json

They use:
- Nx affected commands for selective builds
- Distributed task execution
- Build caching with Nx Cloud
- Matrix builds for multiple environments

Please adapt these Nx patterns to my project which also uses Nx.
```

### If the existing monorepo uses custom scripts:

```
ADDITIONAL CONTEXT:
The existing monorepo uses custom bash/PowerShell scripts for CI/CD.

Key files to analyze:
- .github/workflows/*.yml
- scripts/build.sh
- scripts/deploy.sh
- scripts/test.sh

They use:
- Custom change detection logic
- Manual caching strategies
- Environment-specific deployment scripts

Please adapt these patterns and convert scripts to work with my Windows environment.
```

---

## 🔍 What to Look For in Existing Pipeline

### 1. Change Detection
```yaml
# Example pattern to look for
- name: Detect changes
  run: |
    git diff --name-only HEAD~1 HEAD > changed_files.txt
    if grep -q "backend/" changed_files.txt; then
      echo "backend_changed=true" >> $GITHUB_OUTPUT
    fi
```

### 2. Caching Strategies
```yaml
# Example pattern
- uses: actions/cache@v3
  with:
    path: |
      ~/.npm
      ~/.nuget/packages
    key: ${{ runner.os }}-deps-${{ hashFiles('**/package-lock.json', '**/*.csproj') }}
```

### 3. Matrix Builds
```yaml
# Example pattern
strategy:
  matrix:
    environment: [dev, staging, prod]
    node-version: [18, 20]
```

### 4. Deployment Strategies
```yaml
# Example pattern
- name: Deploy with Blue-Green
  run: |
    # Deploy to green slot
    # Run smoke tests
    # Swap slots
    # Rollback if needed
```

### 5. Security Scanning
```yaml
# Example pattern
- name: Security scan
  uses: snyk/actions/node@master
  with:
    command: test
```

---

## 📊 Analysis Checklist

Use this checklist when analyzing the existing pipeline:

### Pipeline Structure
- [ ] Number of workflows/pipelines
- [ ] Trigger conditions (push, PR, schedule, manual)
- [ ] Job dependencies and order
- [ ] Parallel vs sequential execution
- [ ] Reusable workflows or templates

### Build Optimization
- [ ] Caching strategy (dependencies, build outputs)
- [ ] Incremental builds
- [ ] Affected/changed detection
- [ ] Build matrix usage
- [ ] Artifact management

### Testing Strategy
- [ ] Unit tests execution
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance tests
- [ ] Test result reporting
- [ ] Code coverage

### Deployment
- [ ] Environment strategy (dev, staging, prod)
- [ ] Approval gates
- [ ] Deployment methods (rolling, blue-green, canary)
- [ ] Rollback procedures
- [ ] Health checks
- [ ] Smoke tests

### Security
- [ ] Secret management
- [ ] Dependency scanning
- [ ] SAST (Static Application Security Testing)
- [ ] DAST (Dynamic Application Security Testing)
- [ ] Container scanning
- [ ] License compliance

### Monitoring & Notifications
- [ ] Build status notifications
- [ ] Deployment notifications
- [ ] Failure alerts
- [ ] Performance metrics
- [ ] Log aggregation

---

## 🎯 Expected Output

After using the prompt, you should receive:

### 1. Analysis Document
```markdown
# Existing Pipeline Analysis

## Overview
- Platform: GitHub Actions
- Monorepo tool: Nx
- Key features: Affected builds, distributed caching, matrix deployments

## Strengths
- Efficient change detection
- Excellent caching strategy
- Comprehensive testing

## Adaptations Needed
- Convert Lerna to Nx patterns
- Adapt AWS deployment to Azure
- Simplify for smaller scale
```

### 2. Updated Workflow Files
```yaml
# .github/workflows/ci-optimized.yml
# Based on existing monorepo patterns
# Adapted for .NET 9 + Angular 20
```

### 3. Implementation Plan
```markdown
## Phase 1: Immediate (Week 1)
- [ ] Implement change detection
- [ ] Add caching strategies
- [ ] Update build matrix

## Phase 2: Short-term (Week 2-3)
- [ ] Add security scanning
- [ ] Implement deployment gates
- [ ] Add notifications

## Phase 3: Long-term (Month 2)
- [ ] Optimize for scale
- [ ] Add advanced monitoring
- [ ] Implement A/B testing
```

---

## 💡 Tips for Best Results

1. **Be Specific**: Provide exact file paths and content
2. **Share Context**: Explain what works well in the existing setup
3. **State Constraints**: Mention any limitations (budget, tools, team size)
4. **Ask Questions**: Request clarification on complex patterns
5. **Iterate**: Start with core features, then add advanced ones

---

## 🚀 Quick Start

1. Copy the main prompt above
2. Fill in your specific details
3. Attach relevant files from existing monorepo
4. Share with your AI assistant
5. Review and implement recommendations

---

## 📚 Additional Resources

- [GitHub Actions Best Practices](https://docs.github.com/en/actions/learn-github-actions/best-practices-for-github-actions)
- [Nx CI/CD Guide](https://nx.dev/ci/intro/ci-with-nx)
- [Monorepo CI/CD Patterns](https://monorepo.tools/)

---

**Ready to analyze?** Use the prompt above with your existing monorepo's CI/CD files!
