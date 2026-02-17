# MinIO Setup for Mobile App Development

## Problem
The mobile app uses presigned URLs to upload audio files directly to MinIO (S3-compatible storage). If MinIO isn't running, the uploads will fail with "Network request failed".

## Solution: Start MinIO

### Option 1: Using Docker Compose (Recommended)

```bash
# Start just MinIO (and required services)
cd /Users/abdulrahman/Desktop/Twin-main/Desktop/Twin-main
docker compose up minio minio-init -d

# Verify MinIO is running
curl http://localhost:9000/minio/health/live
```

### Option 2: Install MinIO Locally

1. Download MinIO: https://min.io/download
2. Start MinIO:
   ```bash
   minio server ~/minio-data --console-address ":9001"
   ```
3. Create bucket:
   ```bash
   mc alias set local http://localhost:9000 minioadmin minioadmin
   mc mb local/komuchi
   ```

## Update API Configuration

After starting MinIO, ensure your `apps/api/.env` has:

```bash
S3_ENDPOINT=http://172.20.10.10:9000  # Use your machine IP for mobile simulator
S3_BUCKET=komuchi
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
```

Then restart the API server:

```bash
pnpm --filter=@komuchi/api dev
```

## Verify Setup

1. MinIO should be accessible at `http://172.20.10.10:9000`
2. API should be running at `http://172.20.10.10:3001`
3. Try the mobile app upload again
