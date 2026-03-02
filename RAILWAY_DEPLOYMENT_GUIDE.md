# 🚂 Railway Deployment Guide - Complete Setup

Deploy your MyAccount platform to Railway in 10 minutes!

## 🎯 Why Railway?

- ✅ Easiest deployment (5-10 minutes)
- ✅ $5/month free credit
- ✅ Automatic HTTPS
- ✅ Zero configuration needed
- ✅ Deploy both backend and frontend
- ✅ Built-in database support
- ✅ Automatic deployments from GitHub

---

## 📋 Prerequisites

- ✅ GitHub account (you have this)
- ✅ Code pushed to GitHub (you have this)
- ⏳ Railway account (we'll create this)

---

## 🚀 Step-by-Step Deployment

### Step 1: Create Railway Account (2 minutes)

1. Go to https://railway.app/
2. Click "Login" or "Start a New Project"
3. Sign in with GitHub
4. Authorize Railway to access your repositories

**That's it!** Railway is now connected to your GitHub.

---

### Step 2: Deploy Backend (.NET API) (3 minutes)

#### 2.1 Create Backend Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository: `workanvesh123/ash_myaccount`
4. Railway will scan your repo

#### 2.2 Configure Backend Service

Railway should auto-detect .NET, but let's configure it:

1. **Root Directory**: Set to `backend/MyAccount.Api`
2. **Build Command**: (Leave empty - Railway auto-detects)
3. **Start Command**: (Leave empty - Railway auto-detects)

#### 2.3 Add Environment Variables

Click on your backend service → Variables → Add variables:

```env
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:$PORT
```

Railway automatically provides `$PORT` variable.

#### 2.4 Deploy

Click "Deploy" - Railway will:
- ✅ Build your .NET 9 app
- ✅ Deploy to a container
- ✅ Provide a public URL

**Your backend URL**: `https://your-backend.railway.app`

---

### Step 3: Deploy Frontend (Angular) (3 minutes)

#### 3.1 Create Frontend Project

1. In Railway dashboard, click "New"
2. Select "Deploy from GitHub repo"
3. Choose the same repository
4. This time, configure for frontend

#### 3.2 Configure Frontend Service

1. **Root Directory**: Set to `frontend`
2. **Build Command**: `npm run build`
3. **Start Command**: `npx serve dist/browser -s -p $PORT`

#### 3.3 Add Environment Variables

Click on frontend service → Variables:

```env
NODE_ENV=production
API_URL=https://your-backend.railway.app
```

Replace `your-backend.railway.app` with your actual backend URL from Step 2.

#### 3.4 Deploy

Click "Deploy" - Railway will:
- ✅ Install dependencies
- ✅ Build Angular app
- ✅ Serve with production server
- ✅ Provide a public URL

**Your frontend URL**: `https://your-frontend.railway.app`

---

### Step 4: Configure CORS (2 minutes)

Update your backend to allow frontend domain:

1. Go to your backend code
2. Update `Program.cs` CORS configuration:

```csharp
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
            "http://localhost:4200",
            "https://your-frontend.railway.app"  // Add this
        )
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials();
    });
});
```

3. Commit and push:
```bash
git add .
git commit -m "feat: Add Railway frontend URL to CORS"
git push origin main
```

Railway will automatically redeploy!

---

### Step 5: Update Frontend API URL (2 minutes)

Update frontend to use Railway backend:

1. Create `frontend/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-backend.railway.app/api/v1',
  signalRUrl: 'https://your-backend.railway.app/hubs'
};
```

2. Commit and push:
```bash
git add .
git commit -m "feat: Configure production API URL for Railway"
git push origin main
```

Frontend will automatically redeploy!

---

## ✅ Verification

### Test Backend
```bash
curl https://your-backend.railway.app/api/v1/health
```

Should return: `200 OK`

### Test Frontend
Open: `https://your-frontend.railway.app`

Should see your login page!

---

## 🔐 Add Database (Optional - 5 minutes)

### Option 1: PostgreSQL (Recommended)

1. In Railway dashboard, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway creates a database instantly
4. Copy the connection string

Add to backend environment variables:
```env
ConnectionStrings__DefaultConnection=postgresql://user:pass@host:port/db
```

### Option 2: MySQL

1. Click "New" → "Database" → "MySQL"
2. Copy connection string
3. Add to backend variables

### Option 3: MongoDB

1. Click "New" → "Database" → "MongoDB"
2. Copy connection string
3. Add to backend variables

---

## 🎯 GitHub Actions Integration

### Get Railway Token

1. Go to Railway dashboard
2. Click your profile → Account Settings
3. Tokens → Create new token
4. Copy the token

### Add to GitHub Secrets

1. Go to your GitHub repo
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `RAILWAY_TOKEN`
5. Value: Paste your token

### Enable Auto-Deploy

Your `.github/workflows/deploy-railway.yml` is already configured!

Now every push to `main` will:
1. ✅ Build and test
2. ✅ Deploy to Railway automatically

---

## 📊 Railway Dashboard Features

### Metrics
- View CPU, Memory, Network usage
- Monitor request rates
- Check error rates

### Logs
- Real-time logs
- Filter by service
- Search logs

### Deployments
- View deployment history
- Rollback to previous versions
- See build logs

### Settings
- Custom domains
- Environment variables
- Service settings
- Restart service

---

## 💰 Pricing

### Free Tier
- $5 credit per month
- Enough for small apps
- No credit card required initially

### Usage
- Backend: ~$3-4/month
- Frontend: ~$1-2/month
- Database: ~$2-3/month

**Total**: ~$6-9/month (first month free with $5 credit)

### Upgrade Options
- Hobby: $5/month + usage
- Pro: $20/month + usage
- Team: Custom pricing

---

## 🔧 Advanced Configuration

### Custom Domain

1. Go to service settings
2. Click "Domains"
3. Add custom domain
4. Update DNS records
5. Railway handles SSL automatically

### Environment-Specific Deployments

Create separate services for:
- `main` branch → Production
- `develop` branch → Staging

### Health Checks

Railway automatically monitors your app. Add a health endpoint:

```csharp
app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));
```

### Scaling

Railway auto-scales based on traffic. Configure in service settings:
- Min instances: 1
- Max instances: 10
- Auto-scale threshold

---

## 🐛 Troubleshooting

### Backend Not Starting

**Check logs:**
1. Railway dashboard → Backend service → Logs
2. Look for errors

**Common issues:**
- Port binding: Use `$PORT` environment variable
- Missing dependencies: Check `.csproj` file
- Environment variables: Verify all are set

**Solution:**
```csharp
// In Program.cs
var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
```

### Frontend Not Loading

**Check logs:**
1. Railway dashboard → Frontend service → Logs

**Common issues:**
- Build failed: Check Node.js version
- API URL wrong: Verify environment variables
- Serve command: Ensure `serve` package is installed

**Solution:**
Add to `frontend/package.json`:
```json
{
  "dependencies": {
    "serve": "^14.2.0"
  }
}
```

### CORS Errors

**Symptoms:**
- Frontend can't connect to backend
- Console shows CORS errors

**Solution:**
1. Add frontend URL to backend CORS
2. Ensure credentials are allowed
3. Redeploy backend

### Database Connection Failed

**Check:**
1. Connection string is correct
2. Database service is running
3. Network policies allow connection

**Solution:**
Railway databases are in the same network. Use internal URLs.

---

## 📝 Configuration Files

### Backend: railway.json (Optional)

Create `backend/railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "dotnet publish -c Release -o out"
  },
  "deploy": {
    "startCommand": "dotnet out/MyAccount.Api.dll",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Frontend: railway.json (Optional)

Create `frontend/railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm ci && npm run build"
  },
  "deploy": {
    "startCommand": "npx serve dist/browser -s -p $PORT",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100
  }
}
```

---

## 🎉 Success Checklist

After deployment, verify:

- [ ] Backend is accessible at Railway URL
- [ ] Frontend is accessible at Railway URL
- [ ] Can login to the application
- [ ] API calls work (check Network tab)
- [ ] No CORS errors
- [ ] Games are playable
- [ ] Profile features work
- [ ] Logs show no errors
- [ ] Auto-deployment works (push to test)

---

## 🚀 Next Steps

### 1. Custom Domain (Optional)
- Buy domain (Namecheap, GoDaddy, etc.)
- Add to Railway
- Update DNS records

### 2. Add Database
- Choose PostgreSQL, MySQL, or MongoDB
- Update connection strings
- Migrate data

### 3. Monitoring
- Set up alerts
- Monitor usage
- Check logs regularly

### 4. Optimize
- Enable caching
- Optimize images
- Minify assets

### 5. Scale
- Monitor traffic
- Adjust instance count
- Upgrade plan if needed

---

## 📚 Resources

- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)
- [Railway Blog](https://blog.railway.app/)
- [Railway Status](https://status.railway.app/)

---

## 💡 Pro Tips

### 1. Use Railway CLI
```bash
npm install -g @railway/cli
railway login
railway link
railway logs
```

### 2. Environment Variables
Store all secrets in Railway, not in code:
- API keys
- Database passwords
- JWT secrets

### 3. Preview Deployments
Railway creates preview deployments for PRs automatically!

### 4. Rollback
If something breaks, rollback instantly:
1. Go to Deployments
2. Click previous deployment
3. Click "Redeploy"

### 5. Cost Optimization
- Use sleep mode for dev environments
- Monitor usage in dashboard
- Set spending limits

---

## 🎯 Quick Commands

### View Logs
```bash
railway logs --service backend
railway logs --service frontend
```

### Deploy Manually
```bash
railway up --service backend
railway up --service frontend
```

### Check Status
```bash
railway status
```

### Open in Browser
```bash
railway open
```

---

## ✅ You're Live!

Your app is now deployed to Railway! 🎉

**Backend**: `https://your-backend.railway.app`
**Frontend**: `https://your-frontend.railway.app`

Share your app with the world! 🌍

---

**Need help?** Check Railway docs or their Discord community.

**Total time**: 10-15 minutes from start to deployed app! 🚀
