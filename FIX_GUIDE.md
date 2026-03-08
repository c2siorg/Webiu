# Webiu Project - Fix Guide

## Problem
The Webiu project uses Gatsby v2 (from 2020) which is incompatible with Node 18. The main issues are:
- `node-sass` v4 doesn't work with Node 18+
- Gatsby v2 CLI is missing with newer Node versions
- Multiple deprecated dependencies

## Solution: Use Node Version Manager (Recommended)

### Step 1: Install nvm-windows
Download and install nvm-windows from: https://github.com/coreybutler/nvm-windows/releases

### Step 2: Install Node 16
```bash
nvm install 16
nvm use 16
```

### Step 3: Clean and Reinstall
```bash
cd Webiu
rm -rf node_modules package-lock.json
npm install
npm run develop
```

## Alternative Solutions

### Option A: Force Install (Quick Fix)
```bash
cd Webiu
rm -rf node_modules package-lock.json
npm install --force
npm run develop
```

### Option B: Use Docker
Create a `Dockerfile`:
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8000
CMD ["npm", "run", "develop"]
```

Then run:
```bash
docker build -t webiu .
docker run -p 8000:8000 webiu
```

### Option C: Use yarn instead of npm
```bash
cd Webiu
rm -rf node_modules package-lock.json
npm install -g yarn
yarn install
yarn develop
```

## Already Applied Fixes
✅ Replaced `node-sass` with `sass` in package.json

## Next Steps
1. Install nvm-windows from the link above
2. Run: `nvm install 16 && nvm use 16`
3. Delete node_modules: `rm -rf node_modules package-lock.json`
4. Reinstall: `npm install`
5. Start dev server: `npm run develop`

Your site should be available at: http://localhost:8000

## Troubleshooting
If you still get errors:
- Make sure you're using Node 16: `node -v` (should show v16.x.x)
- Clear npm cache: `npm cache clean --force`
- Try deleting `.cache` folder: `rm -rf .cache public`
