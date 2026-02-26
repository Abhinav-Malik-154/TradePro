# 🚀 TradePro Deployment Guide

Complete guide to deploy TradePro to production using **Vercel** (Frontend) and **Render** (Backend + ML).

---

## 📋 Prerequisites

Before deploying, ensure you have:

- [x] GitHub repository with all code pushed
- [x] MongoDB Atlas cluster (already configured)
- [x] Polygon Amoy RPC URL (e.g., from Alchemy/Infura)
- [x] Deployed smart contract address
- [x] WalletConnect Project ID (from [cloud.walletconnect.com](https://cloud.walletconnect.com))

---

## 🌐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRODUCTION                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────┐    ┌─────────────────────────────────┐   │
│   │    Vercel       │    │           Render                │   │
│   │   (Frontend)    │    │                                 │   │
│   │                 │    │  ┌───────────┐  ┌───────────┐  │   │
│   │   Next.js 16    │───▶│  │ Backend   │  │ ML Backend│  │   │
│   │   React 19      │    │  │ Express.js│  │ FastAPI   │  │   │
│   │                 │◀───│  │ Socket.IO │  │ LightGBM  │  │   │
│   └─────────────────┘    │  └───────────┘  └───────────┘  │   │
│           │              │        │                        │   │
│           │              └────────┼────────────────────────┘   │
│           │                       │                             │
│           ▼                       ▼                             │
│   ┌─────────────────┐    ┌─────────────────┐                   │
│   │ Polygon Amoy    │    │ MongoDB Atlas   │                   │
│   │ (Blockchain)    │    │ (Database)      │                   │
│   └─────────────────┘    └─────────────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ Deploy Backend to Render

### Step 1: Create New Web Service

1. Go to [render.com](https://render.com) → Dashboard → **New +** → **Web Service**
2. Connect your GitHub repository
3. Select the `trading-platform` repo

### Step 2: Configure Service

| Setting | Value |
|---------|-------|
| **Name** | `tradepro-api` |
| **Region** | Oregon (US West) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | Free |

### Step 3: Set Environment Variables

Click **Environment** → Add the following:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | |
| `PORT` | `10000` | Render default |
| `RPC_URL` | `https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY` | Get from Alchemy |
| `PRIVATE_KEY` | `0x...` | ⚠️ Use a dedicated hot wallet |
| `CONTRACT_ADDRESS` | `0xf24dbc76bcda7188734aa472932199c5bd07c640` | Your TradeVerifier |
| `MONGODB_URI` | `mongodb+srv://...` | From MongoDB Atlas |
| `JWT_SECRET` | `your-secure-random-string` | Generate with `openssl rand -hex 32` |
| `FRONTEND_URL` | `https://your-app.vercel.app` | Update after frontend deploy |

### Step 4: Deploy

Click **Create Web Service** → Wait for build (~3-5 min)

✅ **Your backend URL:** `https://tradepro-api.onrender.com`

---

## 2️⃣ Deploy ML Backend to Render

### Step 1: Create New Web Service

1. Dashboard → **New +** → **Web Service**
2. Connect same repository

### Step 2: Configure Service

| Setting | Value |
|---------|-------|
| **Name** | `tradepro-ml` |
| **Region** | Oregon (US West) |
| **Branch** | `main` |
| **Root Directory** | `ml_backend` |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Plan** | Free |

### Step 3: Set Environment Variables

| Variable | Value |
|----------|-------|
| `PYTHON_VERSION` | `3.11.0` |
| `FRONTEND_URL` | `https://your-app.vercel.app` |

### Step 4: Deploy

Click **Create Web Service** → Wait for build (~5-7 min)

✅ **Your ML API URL:** `https://tradepro-ml.onrender.com`

---

## 3️⃣ Deploy Frontend to Vercel

### Step 1: Import Project

1. Go to [vercel.com](https://vercel.com) → **Add New...** → **Project**
2. Import from GitHub → Select `trading-platform`

### Step 2: Configure Project

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` |

### Step 3: Set Environment Variables

Click **Environment Variables** → Add:

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_API_URL` | `https://tradepro-api.onrender.com` | Your Render backend |
| `NEXT_PUBLIC_ML_API_URL` | `https://tradepro-ml.onrender.com` | Your Render ML API |
| `NEXT_PUBLIC_EXPECTED_CHAIN_ID` | `80002` | Polygon Amoy |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | `your-project-id` | From WalletConnect Cloud |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Your Vercel domain |

### Step 4: Deploy

Click **Deploy** → Wait for build (~2-3 min)

✅ **Your frontend URL:** `https://mini-zerodha.vercel.app` (or `tradepro.vercel.app` after renaming)

---

## 4️⃣ Post-Deployment Configuration

### Update CORS Origins

After frontend is deployed, update the `FRONTEND_URL` environment variable in both Render services:

1. **Backend:** Render Dashboard → `tradepro-api` → Environment → Update `FRONTEND_URL`
2. **ML Backend:** Render Dashboard → `tradepro-ml` → Environment → Update `FRONTEND_URL`

### Verify Health Endpoints

```bash
# Check Backend
curl https://tradepro-api.onrender.com/health

# Check ML Backend
curl https://tradepro-ml.onrender.com/health

# Check Frontend
curl -I https://your-app.vercel.app
```

---

## 🔧 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **WebSocket not connecting** | Ensure `FRONTEND_URL` is set correctly for CORS |
| **ML API timeout** | First request takes ~30s on free tier (cold start) |
| **Blockchain txns failing** | Check `RPC_URL` and `PRIVATE_KEY` are correct |
| **MongoDB connection error** | Whitelist `0.0.0.0/0` in MongoDB Atlas Network Access |
| **Build fails** | Check logs in Render/Vercel dashboard |

### Render Free Tier Limitations

- Services spin down after 15 minutes of inactivity
- First request after idle takes ~30-60 seconds (cold start)
- Solution: Use [cron-job.org](https://cron-job.org) to ping `/health` every 14 minutes

### Vercel Limitations

- Serverless functions timeout at 10s (Hobby) or 60s (Pro)
- No WebSocket support in serverless (use Render for Socket.IO)

---

## 📊 Monitoring

### Render Logs
```bash
# View live logs
Render Dashboard → Service → Logs
```

### Vercel Logs
```bash
# View function logs
Vercel Dashboard → Project → Functions → View Logs
```

---

## 🔐 Security Checklist

- [ ] Never commit `.env` files
- [ ] Use environment variables for all secrets
- [ ] Enable 2FA on Vercel, Render, GitHub
- [ ] Use a dedicated hot wallet for `PRIVATE_KEY` (not your main wallet)
- [ ] Set MongoDB Atlas IP whitelist (or `0.0.0.0/0` for Render)
- [ ] Keep `JWT_SECRET` secure and unique

---

## 📦 Quick Reference

| Service | URL | Health Check |
|---------|-----|--------------|
| Frontend | `https://mini-zerodha.vercel.app` | `GET /` |
| Backend | `https://tradepro-api.onrender.com` | `GET /health` |
| ML API | `https://tradepro-ml.onrender.com` | `GET /health` |
| Contract | `0xf24dbc76bcda7188734aa472932199c5bd07c640` | [PolygonScan](https://amoy.polygonscan.com/address/0xf24dbc76bcda7188734aa472932199c5bd07c640) |

---

## 🎉 You're Live!

Once all services are deployed:

1. Visit [mini-zerodha.vercel.app](https://mini-zerodha.vercel.app)
2. Connect your wallet (MetaMask with Polygon Amoy)
3. Execute a test trade
4. Verify on [PolygonScan](https://amoy.polygonscan.com)

**Need help?** Open an issue on GitHub.
