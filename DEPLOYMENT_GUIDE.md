# 🚀 CI/CD & Deployment Guide

Complete guide for setting up CI/CD pipelines and deploying the MyAccount platform.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [CI/CD Pipelines](#cicd-pipelines)
3. [Deployment Options](#deployment-options)
4. [Setup Instructions](#setup-instructions)
5. [Environment Variables](#environment-variables)
6. [Monitoring & Maintenance](#monitoring--maintenance)

---

## 🎯 Prerequisites

### Required
- ✅ GitHub account (you have this)
- ✅ Git repository (you have this)

### Choose Your Deployment Platform

#### Option 1: Azure (Recommended for .NET)
**Cost:** Free tier available
**Best for:** Production-ready .NET apps

**What you need:**
1. Azure account (free tier: https://azure.microsoft.com/free/)
2. Azure App Service (Backend)
3. Azure Static Web Apps (Frontend)

**Pros:**
- Native .NET support
- Excellent performance
- Built-in monitoring
- Easy scaling

**Cons:**
- More complex setup
- Requires Azure knowledge

---

#### Option 2: Railway (Easiest Full-Stack)
**Cost:** $5/month free credit
**Best for:** Quick deployment, both backend and frontend

**What you need:**
1. Railway account (https://railway.app/)
2. Connect GitHub repository

**Pros:**
- Easiest setup (5 minutes)
- Automatic HTTPS
- Zero configuration
- Great for prototypes

**Cons:**
- Limited free tier
- Less control

---

#### Option 3: Split Deployment (Free)
**Cost:** Free
**Best for:** Maximum free tier usage

**Backend Options:**
- Railway (https://railway.app/)
- Render (https://render.com/)
- Fly.io (https://fly.io/)

**Frontend Options:**
- Vercel (https://vercel.com/) - Recommended
- Netlify (https://netlify.com/)
- Cloudflare Pages (https://pages.cloudflare.com/)

**Pros:**
- Completely free
- Best performance for frontend
- Separate scaling

**Cons:**
- Need to manage CORS
- Two separate deployments

---

#### Option 4: Docker + VPS
**Cost:** $5-10/month
**Best for:** Full control, learning Docker

**What you need:**
1. VPS (DigitalOcean, Linode, Vultr)
2. Docker & Docker Compose installed

**Pros:**
- Full control
- Learn Docker
- Can host multiple apps

**Cons:**
- Manual setup
- Need to manage server

---

## 🔧 CI/CD Pipelines

We've created 4 GitHub Actions workflows:

### 1. `ci-build.yml` - Continuous Integration
**Triggers:** Every push and PR
**What it does:**
- ✅ Builds backend (.NET 9)
- ✅ Builds frontend (Angular 20)
- ✅ Runs tests
- ✅ Linting
- ✅ Creates artifacts

**Status:** ✅ Ready to use (no secrets needed)

---

### 2. `deploy-azure.yml` - Azure Deployment
**Triggers:** Push to main branch
**What it does:**
- Deploys backend to Azure App Service
- Deploys frontend to Azure Static Web Apps

**Required Secrets:**
- `AZURE_WEBAPP_PUBLISH_PROFILE`
- `AZURE_STATIC_WEB_APPS_API_TOKEN`

---

### 3. `deploy-railway.yml` - Railway Deployment
**Triggers:** Push to main branch
**What it does:**
- Deploys both backend and frontend to Railway

**Required Secrets:**
- `RAILWAY_TOKEN`

---

### 4. `deploy-vercel-netlify.yml` - Frontend Only
**Triggers:** Push to main branch
**What it does:**
- Deploys frontend to Vercel or Netlify

**Required Secrets:**
- For Vercel: `VERCEL_TOKEN`
- For Netlify: `NETLIFY_SITE_ID`, `NETLIFY_AUTH_TOKEN`

---

## 🚀 Setup Instructions

### Option 1: Deploy to Azure

#### Step 1: Create Azure Resources

```bash
# Install Azure CLI
# Windows: winget install Microsoft.AzureCLI
# Mac: brew install azure-cli

# Login to Azure
az login

# Create resource group
az group create --name myaccount-rg --location eastus

# Create App Service Plan
az appservice plan create \
  --name myaccount-plan \
  --resource-group myaccount-rg \
  --sku F1 \
  --is-linux

# Create Web App for Backend
az webapp create \
  --name myaccount-api \
  --resource-group myaccount-rg \
  --plan myaccount-plan \
  --runtime "DOTNETCORE:9.0"

# Create Static Web App for Frontend
az staticwebapp create \
  --name myaccount-frontend \
  --resource-group myaccount-rg \
  --location eastus
```

#### Step 2: Get Publish Profile

```bash
# Get backend publish profile
az webapp deployment list-publishing-profiles \
  --name myaccount-api \
  --resource-group myaccount-rg \
  --xml
```

Copy the output and save as GitHub secret: `AZURE_WEBAPP_PUBLISH_PROFILE`

#### Step 3: Get Static Web App Token

```bash
# Get frontend deployment token
az staticwebapp secrets list \
  --name myaccount-frontend \
  --resource-group myaccount-rg
```

Copy the token and save as GitHub secret: `AZURE_STATIC_WEB_APPS_API_TOKEN`

#### Step 4: Configure GitHub Secrets

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add:
   - `AZURE_WEBAPP_PUBLISH_PROFILE` (from Step 2)
   - `AZURE_STATIC_WEB_APPS_API_TOKEN` (from Step 3)

#### Step 5: Deploy

```bash
git push origin main
```

Your app will automatically deploy! 🎉

**URLs:**
- Backend: `https://myaccount-api.azurewebsites.net`
- Frontend: `https://myaccount-frontend.azurestaticapps.net`

---

### Option 2: Deploy to Railway (Easiest)

#### Step 1: Create Railway Account
1. Go to https://railway.app/
2. Sign up with GitHub
3. Connect your repository

#### Step 2: Create Projects

**Backend:**
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository
4. Set root directory: `/backend`
5. Railway auto-detects .NET

**Frontend:**
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository
4. Set root directory: `/frontend`
5. Add build command: `npm run build`
6. Add start command: `npx serve dist/browser`

#### Step 3: Get Railway Token

1. Go to Account Settings
2. Tokens → Create new token
3. Copy token

#### Step 4: Add GitHub Secret

1. GitHub repo → Settings → Secrets
2. Add `RAILWAY_TOKEN`

#### Step 5: Deploy

```bash
git push origin main
```

Done! Railway provides URLs automatically. 🚀

---

### Option 3: Deploy Frontend to Vercel

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login and Link

```bash
cd frontend
vercel login
vercel link
```

#### Step 3: Get Token

```bash
vercel token create
```

Copy the token.

#### Step 4: Add GitHub Secret

1. GitHub repo → Settings → Secrets
2. Add `VERCEL_TOKEN`

#### Step 5: Set Deploy Target

1. GitHub repo → Settings → Variables
2. Add variable: `DEPLOY_TARGET` = `vercel`

#### Step 6: Deploy

```bash
git push origin main
```

Frontend deployed! 🎉

---

### Option 4: Docker Deployment

#### Step 1: Install Docker

```bash
# Windows: Download Docker Desktop
# Mac: brew install --cask docker
# Linux: curl -fsSL https://get.docker.com | sh
```

#### Step 2: Build and Run Locally

```bash
# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

**Access:**
- Frontend: http://localhost:4200
- Backend: http://localhost:5000
- Database: localhost:1433

#### Step 3: Deploy to VPS

```bash
# SSH to your VPS
ssh user@your-server-ip

# Clone repository
git clone https://github.com/workanvesh123/ash_myaccount.git
cd ash_myaccount

# Run with Docker Compose
docker-compose up -d

# Setup reverse proxy (Nginx)
# See NGINX_SETUP.md for details
```

---

## 🔐 Environment Variables

### Backend (.NET)

Create `appsettings.Production.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information"
    }
  },
  "AllowedHosts": "*",
  "Jwt": {
    "Secret": "your-super-secret-key-change-this-in-production",
    "Issuer": "MyAccountApi",
    "Audience": "MyAccountClient",
    "ExpirationMinutes": 60
  },
  "Email": {
    "SendGridApiKey": "your-sendgrid-api-key",
    "FromEmail": "noreply@yourdomain.com",
    "FromName": "MyAccount"
  },
  "ConnectionStrings": {
    "DefaultConnection": "your-database-connection-string"
  },
  "Cors": {
    "AllowedOrigins": [
      "https://your-frontend-domain.com"
    ]
  }
}
```

### Frontend (Angular)

Create `frontend/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-backend-domain.com/api/v1',
  signalRUrl: 'https://your-backend-domain.com/hubs'
};
```

---

## 📊 GitHub Secrets Reference

### For Azure:
- `AZURE_WEBAPP_PUBLISH_PROFILE` - Backend deployment
- `AZURE_STATIC_WEB_APPS_API_TOKEN` - Frontend deployment

### For Railway:
- `RAILWAY_TOKEN` - Full deployment

### For Vercel:
- `VERCEL_TOKEN` - Frontend deployment

### For Netlify:
- `NETLIFY_SITE_ID` - Site identifier
- `NETLIFY_AUTH_TOKEN` - Authentication token

### Optional:
- `DOCKER_USERNAME` - Docker Hub username
- `DOCKER_PASSWORD` - Docker Hub password

---

## 🎯 Recommended Setup for You

Based on your project, I recommend:

### For Learning/Development:
**Railway** - Easiest, fastest, $5/month free credit

### For Production:
**Azure** - Best for .NET, professional, scalable

### For Free Hosting:
**Split:**
- Backend: Railway or Render
- Frontend: Vercel

---

## 📝 Next Steps

1. **Choose your deployment platform** (I recommend Railway for easiest start)
2. **Create account** on chosen platform
3. **Get API tokens/secrets**
4. **Add secrets to GitHub**
5. **Push to main branch**
6. **Watch it deploy automatically!** 🚀

---

## 🐛 Troubleshooting

### Build Fails
- Check Node.js version (should be 20.x)
- Check .NET version (should be 9.0.x)
- Clear npm cache: `npm cache clean --force`

### Deployment Fails
- Verify all secrets are set correctly
- Check workflow logs in GitHub Actions
- Ensure environment variables are configured

### App Not Working After Deploy
- Check CORS settings in backend
- Verify API URL in frontend environment
- Check application logs

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Azure App Service Docs](https://docs.microsoft.com/en-us/azure/app-service/)
- [Railway Documentation](https://docs.railway.app/)
- [Vercel Documentation](https://vercel.com/docs)
- [Docker Documentation](https://docs.docker.com/)

---

## 🎉 Success!

Once deployed, your app will:
- ✅ Auto-deploy on every push to main
- ✅ Run tests before deployment
- ✅ Have HTTPS enabled
- ✅ Be accessible worldwide
- ✅ Scale automatically

**Your CI/CD pipeline is production-ready!** 🚀

---

**Need help?** Check the troubleshooting section or create an issue on GitHub.
