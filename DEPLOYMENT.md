# Deployment Guide: Backend on Vercel & Frontend on Netlify

This project is fully configured for zero-friction cloud deployment:
- **Backend (Express API)**: Configured for **Vercel Serverless Functions** with MongoDB connection caching.
- **Frontend (Vite React SPA)**: Configured for **Netlify** with SPA redirect rules (`/* -> /index.html 200`) and configurable API base URL.

---

## METHOD 1: Deploy via GitHub (Recommended — Continuous Deployment)

Pushing your repository to GitHub allows both Vercel and Netlify to auto-deploy whenever you push new changes.

### Step 1: Push Code to GitHub
Run these commands in the project root (`Placement-Mangement`):
```bash
git init
git add .
git commit -m "feat: complete placement management system with Vercel and Netlify configurations"
git branch -M main
# Add your GitHub repository remote (replace with your repo URL):
# git remote add origin https://github.com/YOUR_USERNAME/Placement-Management.git
# git push -u origin main
```

---

### Step 2: Deploy Backend to Vercel
1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **"Add New..."** > **"Project"**.
3. Import your GitHub repository (`Placement-Management`).
4. In the **Configure Project** screen:
   - **Framework Preset**: Other
   - **Root Directory**: Click `Edit` and select `Backend`.
5. Under **Environment Variables**, add the following keys:
   | Key | Recommended Value |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `MONGO_URI` | `mongodb+srv://placement_admin:Yash1234@cluster0.cqnmloc.mongodb.net/placement_management?appName=Cluster0` |
   | `JWT_SECRET` | `placement_secret_key_jwt_2026_secure` |
   | `FRONTEND_URL` | *(Leave blank initially, or add your Netlify URL after deploying frontend)* |
### Live Backend Deployment Details
- **Live Vercel Production URL**: `https://backend-chi-taupe-31.vercel.app`
- **Live API Health Endpoint**: `https://backend-chi-taupe-31.vercel.app/api/health`
- **Live API Base URL for Netlify**: `https://backend-chi-taupe-31.vercel.app/api`
- **Status**: Verified ✅ (Connected to MongoDB Atlas, JWT authentication active)

---

### Step 3: Deploy Frontend to Netlify
1. Go to [netlify.com](https://netlify.com) and log in.
2. Click **"Add new site"** > **"Import an existing project"** > **"GitHub"** (or drag & drop the `Frontend/dist` folder via Netlify Drop at [app.netlify.com/drop](https://app.netlify.com/drop)!).
3. If connecting via GitHub:
   - **Base directory**: `Frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist` (or `Frontend/dist`)
4. Under **Environment variables**, add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://backend-chi-taupe-31.vercel.app/api` |
5. Click **"Deploy site"**.
6. Your frontend will be live on `https://<your-site-name>.netlify.app`!

---

## METHOD 2: Deploy via Command Line Interface (CLI)

### Deploy Backend using Vercel CLI
Open a terminal in `Placement-Mangement/Backend`:
```bash
# 1. Log in to Vercel
vercel login

# 2. Deploy to production
vercel --prod
```
During the prompt:
- Link to existing project? **No**
- What's your project's name? `placement-backend`
- In which directory is your code located? `./`
- Want to modify settings? **No**

After the deployment URL is generated, set your environment variables:
```bash
vercel env add MONGO_URI production
# Paste: mongodb+srv://placement_admin:Yash1234@cluster0.cqnmloc.mongodb.net/placement_management?appName=Cluster0

vercel env add JWT_SECRET production
# Paste: placement_secret_key_jwt_2026_secure

vercel env add NODE_ENV production
# Paste: production

# Redeploy to apply variables:
vercel --prod
```

---

### Deploy Frontend using Netlify CLI
Open a terminal in `Placement-Mangement/Frontend`:
```bash
# 1. Set backend API URL in .env.production
echo VITE_API_BASE_URL=https://<YOUR-VERCEL-BACKEND-URL>.vercel.app/api > .env.production

# 2. Build the production bundle
npm run build

# 3. Log in & Deploy using Netlify CLI
npx netlify login
npx netlify deploy --prod --dir=dist
```

---

## Verification Checklist

- [x] **Vercel Serverless Ready**: `Backend/vercel.json` rewrites `/(.*)` to `api/index.js`.
- [x] **Cold-Start Connection Caching**: `Backend/config/db.js` reuses `mongoose.connection.readyState >= 1`.
- [x] **Express Handler Exported**: `Backend/server.js` exports `module.exports = app;` and only binds to port when `!process.env.VERCEL`.
- [x] **CORS Support**: `Backend/server.js` allows Localhost, Netlify domains, and custom origins.
- [x] **Netlify SPA Redirects**: `Frontend/public/_redirects` and `Frontend/netlify.toml` ensure client routes (`/admin/dashboard`, `/login`) do not 404 on page refresh.
- [x] **Dynamic API URL**: `Frontend/src/api/axiosInstance.js` automatically reads `import.meta.env.VITE_API_BASE_URL`.
- [x] **Production Build**: `Frontend` compiled with exit code 0; `dist/_redirects` verified.
