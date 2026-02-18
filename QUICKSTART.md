# Quick Start Guide

Get the application running in **5 minutes** or less!

## Prerequisites (all team members)

- **Node.js** >= 20 (`node -v`)
- **pnpm** >= 9 (`npm i -g pnpm`)
- **Docker Desktop** installed and running
- **Xcode** (for iOS simulator — Mac only)

## First-Time Setup (Co-founder Onboarding)

> **Before you start:** Ask the team lead for the `.env` values (Firebase keys, OpenAI key).
> They will send you the contents for two files — do **not** commit these.

### Step 1 — Install tools (one-time)

| Tool | Install | Verify |
|------|---------|--------|
| **Node.js** ≥ 20 | [nodejs.org](https://nodejs.org) | `node -v` |
| **pnpm** ≥ 9 | `npm i -g pnpm` | `pnpm -v` |
| **Docker Desktop** | [docker.com](https://www.docker.com/products/docker-desktop/) | `docker -v` |
| **Xcode** ≥ 16 | Mac App Store | `xcode-select -p` |

After installing Xcode, open it once and accept the license, then install iOS Simulator:
```bash
xcode-select --install          # command-line tools
```

### Step 2 — Clone & install

```bash
git clone https://github.com/ARTEN-max/Twin.git
cd Twin
git checkout mobile_app
pnpm install
```

### Step 3 — Set up environment files

```bash
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
```

Now paste the keys the team lead sent you:

**`apps/mobile/.env`** — Firebase client keys:
```
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=twin-cdd01.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=twin-cdd01
EXPO_PUBLIC_FIREBASE_APP_ID=1:1034213917033:web:...
```

**`apps/api/.env`** — add these lines (keep the rest as-is):
```
FIREBASE_PROJECT_ID=twin-cdd01
OPENAI_API_KEY=sk-proj-...
```

### Step 4 — Build & prepare database

```bash
pnpm build --filter=@komuchi/shared --filter=@komuchi/ui
pnpm --filter=@komuchi/api db:generate
pnpm --filter=@komuchi/api db:push
```

### Step 5 — Start services (4 terminal tabs)

Open **4 terminal tabs** in the project root and run one command in each:

| Tab | Command | What it does |
|-----|---------|--------------|
| **1** | `docker compose up redis minio minio-init diarization -d` | Infrastructure + voice AI (wait ~2 min on first run for model download) |
| **2** | `pnpm --filter=@komuchi/api dev` | API server → http://localhost:3001 |
| **3** | `pnpm --filter=@komuchi/api dev:worker` | Background job worker |
| **4** | `cd apps/mobile && npx expo run:ios` | Builds native app + launches iOS Simulator |

> **First run of Tab 4** takes 3-5 minutes (Xcode compiles native code).
> Subsequent runs are fast (~15 seconds).

### Step 6 — Use the app

1. The **iOS Simulator** opens with a **Sign In** screen.
2. Tap **Create Account** → enter email + password → you're in!
3. Try **recording** a voice memo → it uploads, transcribes, and generates a debrief.
4. Try **Voice Profile** → record 10-30 seconds → enrolls your voice for speaker identification.

### If you need to rebuild native code (after `pnpm install` or Xcode update)

```bash
cd apps/mobile
npx expo prebuild --clean
npx expo run:ios
```

### Quick reference — what's running

| Service | URL | Purpose |
|---------|-----|---------|
| API | http://localhost:3001 | Backend REST API |
| Redis | localhost:6379 | Job queue |
| MinIO | http://localhost:9001 | Audio file storage (login: minioadmin/minioadmin) |
| Diarization | http://localhost:8001 | Voice AI / speaker identification |
| Metro | http://localhost:8081 | React Native JS bundler |

---

## Option 1: Docker (Recommended - Easiest)

Perfect for getting started quickly. Everything runs in containers.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Steps

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd Twin-main

# 2. Copy environment file (optional - defaults work)
cp apps/api/.env.example apps/api/.env

# 3. Start everything
docker compose up --build
```

That's it! 🎉

The app will be available at:
- **Web App**: http://localhost:3000
- **API**: http://localhost:3001
- **MinIO Console**: http://localhost:9001 (login: `minioadmin` / `minioadmin`)
- **Diarization Service**: http://localhost:8001

### What's Running?

- ✅ Web app (Next.js)
- ✅ API server (Fastify)
- ✅ Worker process (job queue)
- ✅ Redis (job queue backend)
- ✅ MinIO (S3-compatible storage)
- ✅ Diarization service (Python FastAPI for speaker identification)

All services use **mock AI providers** by default, so no API keys needed!

**Note**: The diarization service will download a ~2GB model on first run (takes a few minutes). This is cached for future runs.

---

## Option 2: Local Development (For Active Development)

Better for active development with hot reloading.

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Redis (or use Docker for Redis only)
- MinIO (or use Docker for MinIO only)

### Steps

```bash
# 1. Clone and install
git clone <your-repo-url>
cd Twin-main
pnpm install

# 2. Set up environment
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env if needed (defaults work for local dev)

# 3. Start infrastructure services (using Docker)
docker compose up redis minio minio-init diarization -d

# 4. Set up database
pnpm --filter=@komuchi/api db:generate
pnpm --filter=@komuchi/api db:push

# 5. Build shared packages
pnpm build --filter=@komuchi/shared --filter=@komuchi/ui

# 6. Start services (in separate terminals)
# Terminal 1: API
pnpm --filter=@komuchi/api dev

# Terminal 2: Worker
pnpm --filter=@komuchi/api dev:worker

# Terminal 3: Web App
pnpm --filter=@komuchi/web dev
```

---

## Setting Up Firebase Authentication

The mobile app requires Firebase for user login. Follow these steps:

### 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/) → **Add project**.
2. In **Authentication** → **Get Started** → enable **Email/Password**.

### 2. Configure the mobile app

1. In Firebase Console → **Project Settings** → **Your apps** → **Add app** → **Web**.
2. Copy the config values.
3. Create `apps/mobile/.env` from the template:

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

4. Fill in your Firebase values:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 3. Configure the API backend

1. In Firebase Console → **Project Settings** → **Service accounts** → **Generate new private key**.
2. Add to `apps/api/.env`:

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_JSON=<paste full JSON on one line>
```

### 4. Test it

- Start the app → you'll see a Sign In screen.
- Create an account → you're in!
- API calls without a valid token return `401 Unauthorized`.

---

## Using Real AI Providers

To use OpenAI or Deepgram instead of mocks:

1. Edit `apps/api/.env`:
   ```bash
   TRANSCRIPTION_PROVIDER=openai
   DEBRIEF_PROVIDER=openai
   OPENAI_API_KEY=sk-your-key-here
   ```

2. Restart the services

---

## Troubleshooting

### Port Already in Use

If ports 3000, 3001, 6379, or 9000 are already in use:

- **Docker**: Stop other containers using those ports
- **Local**: Change ports in `.env` or stop other services

### Database Errors

```bash
# Reset the database
pnpm --filter=@komuchi/api db:reset
pnpm --filter=@komuchi/api db:push
```

### Redis Connection Issues

Make sure Redis is running:
```bash
# Check if Redis is running
docker ps | grep redis

# Or start Redis manually
docker run -p 6379:6379 redis:7-alpine
```

### MinIO Connection Issues

Make sure MinIO is running:
```bash
# Check if MinIO is running
docker ps | grep minio

# Or start MinIO manually
docker run -p 9000:9000 -p 9001:9001 \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  minio/minio server /data --console-address ":9001"
```

---

## Running the Mobile App (iOS Simulator)

```bash
# 1. Make sure you've set up Firebase (see above)
# 2. Install dependencies
pnpm install

# 3. Build shared packages
pnpm build --filter=@komuchi/shared --filter=@komuchi/ui

# 4. Start infrastructure + backend
docker compose up redis minio minio-init diarization -d
pnpm --filter=@komuchi/api dev          # Terminal 1
pnpm --filter=@komuchi/api dev:worker   # Terminal 2

# 5. Run the mobile app
cd apps/mobile
npx expo run:ios                        # Terminal 3
```

The app will open in the iOS simulator with a Sign In screen.

---

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Check [TESTING.md](./TESTING.md) for testing guidelines
- Explore the API endpoints at http://localhost:3001/api/health

Happy coding!
