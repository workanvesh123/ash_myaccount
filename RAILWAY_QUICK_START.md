# 🚂 Railway Quick Start - 10 Minute Deployment

Deploy your app to Railway in 10 minutes. Follow these exact steps.

---

## ✅ Pre-Flight Checklist

Before starting, ensure:
- [ ] Code is committed and pushed to GitHub
- [ ] You have a GitHub account
- [ ] You're ready to create a Railway account

---

## 🚀 Deployment Steps

### 1. Create Railway Account (1 minute)

1. Go to: https://railway.app/
2. Click "Login with GitHub"
3. Authorize Railway

✅ Done! You now have $5 free credit.

---

### 2. Deploy Backend (3 minutes)

#### Create Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose: `workanvesh123/ash_myaccount`
4. Railway scans your repo

#### Configure Backend
1. Click "Add variables"
2. Add these:
   ```
   ASPNETCORE_ENVIRONMENT=Production
   ASPNETCORE_URLS=http://0.0.0.0:$PORT
   ```
3. In Settings → Set Root Directory: `backend/MyAccount.Api`
4. Click "Deploy"

#### Get Backend URL
1. Go to Settings → Domains
2. Click "Generate Domain"
3. Copy URL (e.g., `https://myaccount-api-production.up.railway.app`)

✅ Backend is live!

---

### 3. Deploy Frontend (3 minutes)

#### Create Frontend Service
1. In same project, click "New"
2. Select "GitHub Repo" → Same repo
3. This creates a second service

#### Configure Frontend
1. Click "Add variables"
2. Add:
   ```
   NODE_ENV=production
   API_URL=https://your-backend-url.railway.app
   ```
   (Use your actual backend URL from step 2)

3. In Settings → Set Root Directory: `frontend`
4. In Settings → Build Command: `npm run build`
5. In Settings → Start Command: `npx serve dist/browser -s -p $PORT`
6. Click "Deploy"

#### Get Frontend URL
1. Go to Settings → Domains
2. Click "Generate Domain"
3. Copy URL (e.g., `https://myaccount-frontend-production.up.railway.app`)

✅ Frontend is live!

---

### 4. Update CORS (2 minutes)

#### Update Backend Code
1. Open `backend/MyAccount.Api/appsettings.json`
2. Add your frontend URL to AllowedOrigins:
   ```json
   "AllowedOrigins": [
     "http://localhost:4200",
     "https://your-frontend-url.railway.app"
   ]
   ```

3. Commit and push:
   ```bash
   git add .
   git commit -m "feat: Add Railway frontend URL to CORS"
   git push origin main
   ```

✅ Railway auto-deploys the update!

---

### 5. Test Your App (1 minute)

1. Open your frontend URL
2. Try to login
3. Play a game
4. Check if everything works

✅ You're live! 🎉

---

## 🎯 Your URLs

After deployment, you'll have:

- **Backend**: `https://[your-backend].railway.app`
- **Frontend**: `https://[your-frontend].railway.app`
- **Health Check**: `https://[your-backend].railway.app/health`

---

## 🔧 Optional: Add Database (5 minutes)

### Add PostgreSQL

1. In Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway creates database instantly
4. Click database → Connect → Copy connection string

### Update Backend

Add to backend variables:
```
ConnectionStrings__DefaultConnection=postgresql://[connection-string]
```

✅ Database connected!

---

## 📊 Monitor Your App

### View Logs
1. Click on service (backend or frontend)
2. Go to "Logs" tab
3. See real-time logs

### Check Metrics
1. Click on service
2. Go to "Metrics" tab
3. See CPU, Memory, Network usage

### View Deployments
1. Click on service
2. Go to "Deployments" tab
3. See deployment history

---

## 🚨 Troubleshooting

### Backend Won't Start

**Check logs:**
1. Railway dashboard → Backend → Logs
2. Look for errors

**Common fix:**
Ensure environment variables are set correctly.

### Frontend Shows API Error

**Check:**
1. Is backend URL correct in frontend variables?
2. Is CORS configured with frontend URL?
3. Are both services running?

**Fix:**
Update API_URL in frontend variables and redeploy.

### Can't Login

**Check:**
1. Backend logs for errors
2. Browser console for CORS errors
3. Network tab for failed requests

**Fix:**
Add frontend URL to backend CORS configuration.

---

## 💰 Cost Estimate

With $5 free credit:
- Backend: ~$3-4/month
- Frontend: ~$1-2/month
- **Total**: ~$4-6/month

First month is free! 🎉

---

## 🎯 Next Steps

### 1. Custom Domain (Optional)
- Buy domain
- Add to Railway
- Update DNS

### 2. Enable Auto-Deploy
Already enabled! Every push to `main` auto-deploys.

### 3. Add Staging Environment
- Create new Railway project
- Connect to `develop` branch
- Test before production

### 4. Monitor Usage
- Check Railway dashboard
- Set spending alerts
- Optimize if needed

---

## ✅ Success Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Can login to application
- [ ] Games are playable
- [ ] No CORS errors
- [ ] Logs show no errors
- [ ] Auto-deploy works (test with a push)

---

## 📚 Resources

- Full Guide: See `RAILWAY_DEPLOYMENT_GUIDE.md`
- Railway Docs: https://docs.railway.app/
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.app/

---

## 🎉 Congratulations!

Your app is now live on Railway! 🚀

**Share your app:**
- Frontend: `https://your-frontend.railway.app`
- Show it to friends and family!
- Add to your portfolio!

**Total time**: 10 minutes ⏱️

---

**Need help?** Check `RAILWAY_DEPLOYMENT_GUIDE.md` for detailed instructions.
