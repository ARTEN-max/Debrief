# Deployment Guide: Railway Backend + EAS iOS Testing

This guide walks through deploying the API, worker, and **diarization service** to Railway (so testers get the same functionality as on your local device), then distributing the iOS app via EAS Build.

---

## Next steps (checklist)

Do these in order so testers get full functionality (recordings, transcription, debrief, **voice profile / speaker diarization**):

1. **Railway project** — Create project, add PostgreSQL and Redis.
2. **S3 storage** — Create AWS S3 or Cloudflare R2 bucket and keys.
3. **Diarization service** — Deploy `services/diarization` (see [Part 1.5](#15-deploy-diarization-service-required-for-voice-profiles)) so voice profiles and speaker ID work.
4. **API + Worker** — Deploy API and Worker from this repo; set all env vars including `DIARIZATION_SERVICE_URL` to your diarization URL.
5. **Mobile app URL** — Set `EXPO_PUBLIC_API_BASE_URL` to your Railway API URL in `apps/mobile/.env` (or EAS secrets).
6. **EAS + Apple** — Install EAS CLI, log in, connect Apple Developer, register test devices.
7. **Build & share** — Run `pnpm build:preview` in `apps/mobile`, then share the install link with testers.

---

## Prerequisites

- GitHub repo connected (for Railway deploy)
- [Railway](https://railway.app) account
- [Expo](https://expo.dev/signup) account
- Apple Developer account ($99/year) for iOS internal distribution
- AWS or Cloudflare R2 account (for S3-compatible storage)

---

## Part 1: Deploy Backend to Railway

### 1.1 Create Railway project

1. Go to [railway.app](https://railway.app) and create a new project.
2. Add services:
   - **PostgreSQL**: New → Database → PostgreSQL. Note the `DATABASE_URL` from Variables.
   - **Redis**: New → Database → Redis. Note the `REDIS_URL` from Variables.

### 1.2 Deploy the API service

1. In the same project, **New → GitHub Repo**. Select your Twin repo.
2. Configure the service:
   - **Root Directory**: leave empty (monorepo root).
   - **Dockerfile Path**: `apps/api/Dockerfile`
   - **Watch Paths**: `apps/api/**`, `packages/shared/**`
3. Under **Settings → Deploy**, set **Start Command** to the default (Dockerfile CMD runs the API server).
4. Under **Settings → Networking**, click **Generate Domain** to get a public URL (e.g. `your-api.up.railway.app`).

### 1.3 Deploy the Worker service

1. **New → GitHub Repo** again, select the same Twin repo.
2. Use the same Dockerfile: **Dockerfile Path**: `apps/api/Dockerfile`
3. **Start Command** (override): `node apps/api/dist/worker.js`
4. No public domain needed for the worker.

### 1.4 Environment variables (API and Worker)

Set the same variables on **both** the API and Worker services in Railway:

| Variable                  | Source / Value                                                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`            | From Railway Postgres (Connect → Postgres URL)                                                                             |
| `REDIS_URL`               | From Railway Redis (Connect → Redis URL)                                                                                   |
| `NODE_ENV`                | `production`                                                                                                               |
| `API_PORT`                | `3001`                                                                                                                     |
| `API_HOST`                | `0.0.0.0`                                                                                                                  |
| `CORS_ORIGIN`             | `*` (or your app origins for production)                                                                                   |
| `OPENAI_API_KEY`          | Your OpenAI key                                                                                                            |
| `TRANSCRIPTION_PROVIDER`  | `openai`                                                                                                                   |
| `DEBRIEF_PROVIDER`        | `openai`                                                                                                                   |
| `FIREBASE_PROJECT_ID`     | `twin-cdd01`                                                                                                               |
| `S3_BUCKET`               | e.g. `komuchi`                                                                                                             |
| `S3_REGION`               | e.g. `us-east-1`                                                                                                           |
| `S3_ACCESS_KEY_ID`        | From AWS/R2                                                                                                                |
| `S3_SECRET_ACCESS_KEY`    | From AWS/R2                                                                                                                |
| `DIARIZATION_SERVICE_URL` | **Required for voice profiles.** URL of your deployed diarization service (e.g. `https://your-diarization.up.railway.app`) |
| `RATE_LIMIT_MAX`          | `100`                                                                                                                      |
| `RATE_LIMIT_WINDOW_MS`    | `60000`                                                                                                                    |
| `MAX_UPLOAD_SIZE_MB`      | `500`                                                                                                                      |

Do **not** set `S3_ENDPOINT` when using real AWS S3. Set it only for MinIO or R2 (e.g. `https://<account>.r2.cloudflarestorage.com` for R2).

### 1.5 Deploy Diarization service (required for voice profiles)

Diarization powers **voice profile enrollment** and **speaker identification** in transcripts. To give testers the same experience as on your local device, deploy it as its own service.

The service is a Python/FastAPI app that uses Coqui TTS for speaker embeddings (~2GB model download on first run). It listens on port 8001 and exposes a `/health` and diarization endpoints.

**Option A: Railway (recommended for one place to manage everything)**

1. In your Railway project: **New → GitHub Repo**, select the same Twin repo.
2. Configure the service:
   - **Root Directory**: `services/diarization` (so the build context is the diarization folder).
   - **Dockerfile Path**: `Dockerfile` (relative to root directory) or leave default if Railway infers it.
   - If Railway has a "Dockerfile path" that is project-relative, set it to `services/diarization/Dockerfile` and set **Root Directory** to empty; then set **Build context** or equivalent to `services/diarization` so `COPY main.py .` and `COPY requirements.txt .` work.
3. **Settings → Resources**: Allocate **at least 4GB RAM** (8GB is safer for the TTS model). Railway allows increasing memory in the service settings.
4. **Settings → Networking**: **Generate Domain** and note the URL (e.g. `https://your-diarization.up.railway.app`).
5. Set **Start Command** to default (`python main.py`). The Dockerfile already exposes port 8001; ensure Railway maps the public port to 8001.
6. First deploy will take several minutes (Python deps + model download). Use **Settings → Variables** to set `COQUI_TOS_AGREED=1` if needed for non-interactive build.

Then set **`DIARIZATION_SERVICE_URL`** on both the API and Worker services to this URL (e.g. `https://your-diarization.up.railway.app`). Do not add `/health` or a path—use the root URL.

**Option B: Fly.io (if Railway memory limits are an issue)**

1. Install Fly CLI: `brew install flyctl` (or see [fly.io/docs](https://fly.io/docs/hands-on/install-flyctl/)).
2. From the repo: `cd services/diarization && fly launch --no-deploy`. Name the app e.g. `twin-diarization`.
3. In `fly.toml` (or via `fly scale memory 2048`), set **memory to 2GB or 4GB**.
4. Run `fly deploy`. Note the app URL (e.g. `https://twin-diarization.fly.dev`).
5. Set **`DIARIZATION_SERVICE_URL`** on Railway API and Worker to this URL.

**Verifying diarization**

- Open `https://<your-diarization-url>/health` in a browser or with `curl`. You should get a 200 response once the service has finished starting (and, on first run, downloading the model).

---

## Part 2: S3-Compatible Storage (AWS S3 or Cloudflare R2)

### Option A: AWS S3

1. Create a bucket named `komuchi` in [AWS S3](https://console.aws.amazon.com/s3).
2. Create an IAM user with programmatic access and attach a policy that allows `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on that bucket.
3. Use the Access Key ID and Secret Access Key as `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY`. Set `S3_REGION` to your bucket region.

### Option B: Cloudflare R2 (S3-compatible, free tier)

1. In [Cloudflare Dashboard](https://dash.cloudflare.com) → R2 → Create bucket `komuchi`.
2. R2 → Manage R2 API Tokens → Create API token. Note Access Key ID and Secret Access Key.
3. Set in Railway:
   - `S3_BUCKET` = `komuchi`
   - `S3_REGION` = `auto` (R2 accepts this)
   - `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` = from the token
   - `S3_ENDPOINT` = `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` (from R2 bucket settings)

---

## Part 3: EAS Build for iOS Internal Distribution

### 3.1 Install EAS CLI and log in

```bash
npm install -g eas-cli
eas login
```

### 3.2 Configure the app for the deployed API

Set the API URL for the build (e.g. in `apps/mobile/.env` or in EAS secrets):

```
EXPO_PUBLIC_API_BASE_URL=https://your-api.up.railway.app
```

Use the same Firebase keys as local; they are safe in the client.

### 3.3 Register test devices

Each tester’s iPhone must be registered:

```bash
cd apps/mobile
eas device:create
```

Send the generated link to testers. They open it on their iPhone and follow the steps; their device UDID is then registered.

### 3.4 Apple Developer setup

- One team member needs an [Apple Developer](https://developer.apple.com) account ($99/year).
- In [Expo dashboard](https://expo.dev) → Project → Credentials, connect your Apple Developer account. EAS will create the App ID and provisioning profiles.

### 3.5 Build and distribute

From the repo root or `apps/mobile`:

```bash
cd apps/mobile
pnpm build:preview
# or: eas build --platform ios --profile preview
```

You must be logged in (`eas login`) and have linked your Apple Developer account in the Expo dashboard. When the build finishes, EAS shows a link in the terminal and on [expo.dev](https://expo.dev). Share that link with testers; they open it on their iPhone to install the app.

---

## Local development with PostgreSQL

To run the API locally against PostgreSQL (e.g. for parity with production):

1. Start Postgres (Docker): `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16-alpine`
2. Create a DB: `docker exec -it <container> psql -U postgres -c "CREATE DATABASE komuchi;"`
3. In `apps/api/.env`: `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/komuchi"`
4. Run migrations: `pnpm --filter=@komuchi/api db:push` or `prisma migrate deploy`

---

## Quick reference

| Service          | Purpose                                                      |
| ---------------- | ------------------------------------------------------------ |
| Railway API      | Backend REST API                                             |
| Railway Worker   | Background jobs (transcribe, debrief)                        |
| Railway Postgres | Database                                                     |
| Railway Redis    | Job queue                                                    |
| **Diarization**  | Voice profiles & speaker ID (required for parity with local) |
| S3 / R2          | Audio file storage                                           |
| EAS Build        | iOS app build and install link                               |
