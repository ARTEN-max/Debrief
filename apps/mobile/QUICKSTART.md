# Mobile App Quick Start

## Phase 1: PipeTest Screen (Current)

### Prerequisites

1. **Backend API running**:
   ```bash
   # From monorepo root
   pnpm --filter=@komuchi/api dev
   ```

2. **Build shared package**:
   ```bash
   pnpm build --filter=@komuchi/shared
   ```

### Setup

1. **Create `.env` file** in `apps/mobile/`:
   ```bash
   EXPO_PUBLIC_API_BASE_URL=http://localhost:3001
   ```

2. **Install dependencies** (if not already done):
   ```bash
   pnpm install
   ```

### Run on iOS Simulator

```bash
cd apps/mobile
pnpm ios
```

**Note**: iOS Simulator may not have microphone access. If recording fails:
- Use a physical iOS device, OR
- Test the upload flow with a pre-recorded file (modify PipeTest to skip recording)

### Run on Physical iOS Device

1. **Find your computer's IP**:
   ```bash
   ipconfig getifaddr en0
   # Or: ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. **Update `.env`**:
   ```
   EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:3001
   ```
   (Replace with your actual IP)

3. **Run**:
   ```bash
   pnpm ios
   ```

4. **Scan QR code** with iPhone camera to open in Expo Go

### Test Flow

1. Tap **"Record 5s + Process"**
2. Grant microphone permission
3. Wait for 5-second recording
4. Watch status updates:
   - Creating recording
   - Uploading
   - Completing upload
   - Polling for completion
5. View transcript and debrief JSON when complete

### Troubleshooting

**"Network request failed"**:
- Ensure backend is running on correct port
- For physical device, use computer's IP (not localhost)
- Check firewall settings

**"Upload failed: 403"**:
- Presigned URL expired (shouldn't happen with 1hr expiry)
- Content-Type header mismatch
- Check backend logs

**"Recording processing failed"**:
- Check backend worker logs
- Verify OpenAI API key is configured
- Check Redis connection

## Phase 2: Navigation (Future)

After PipeTest works, add:
- Expo Router
- `/record` screen
- `/history` screen
- `/recordings/[id]` screen
