# Komuchi Mobile App

React Native mobile app built with Expo for recording audio and generating transcripts/debriefs.

## Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Expo CLI (installed globally or via npx)
- iOS Simulator (for iOS development) or Android Emulator
- Backend API running (see main README)

## Setup

1. **Install dependencies** (from monorepo root):
   ```bash
   pnpm install
   ```

2. **Build shared package**:
   ```bash
   pnpm build --filter=@komuchi/shared
   ```

3. **Configure environment**:
   Create `.env` file in `apps/mobile/`:
   ```bash
   # For iOS Simulator
   EXPO_PUBLIC_API_BASE_URL=http://localhost:3001
   
   # For physical device, use your computer's IP address
   # EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:3001
   ```

## Running

### iOS Simulator

```bash
cd apps/mobile
pnpm ios
```

Or from monorepo root:
```bash
pnpm --filter=@komuchi/mobile ios
```

This will:
1. Start the Expo development server
2. Open iOS Simulator
3. Install and launch the app

**Note**: iOS Simulator may not have microphone access. If recording fails, use a physical device.

### Physical iOS Device

1. Ensure your device and computer are on the same network
2. Find your computer's IP address:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Or use
   ipconfig getifaddr en0
   ```
3. Update `.env` with your IP:
   ```
   EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:3001
   ```
4. Run:
   ```bash
   pnpm ios
   ```
5. Scan the QR code with your iPhone camera to open in Expo Go app

### Android

```bash
cd apps/mobile
pnpm android
```

## Screens

### RecordingsScreen (Default)
- Lists recordings for the selected date (defaults to today)
- Shows time, duration, status, and badges for transcript/debrief
- Pull-to-refresh support
- Empty state when no recordings
- Tap a recording to view details

### RecordingDetailScreen
- Full recording details with status
- Collapsible transcript section
- Segments list with speaker labels and timestamps
- Debrief markdown display
- Auto-polling when recording is processing

### PipeTest Screen
- End-to-end test flow:
  1. **Record 5s + Process** button
  2. Requests microphone permission
  3. Records audio for ~5 seconds
  4. Creates recording via API
  5. Uploads audio bytes to presigned S3 URL
  6. Completes upload
  7. Polls for processing completion
  8. Displays transcript and debrief

## Architecture

- **Shared Package**: `@komuchi/shared` contains:
  - TypeScript types (Recording, Transcript, Debrief, etc.)
  - Zod schemas for validation
  - API client functions (createRecording, completeUpload, etc.)

- **Mobile App**: Uses Expo with:
  - `expo-av` for audio recording
  - `expo-file-system` for reading recorded files
  - `expo-constants` for environment variables

## Troubleshooting

### "Network request failed" on iOS Simulator

- Ensure backend API is running on `http://localhost:3001`
- For physical devices, use your computer's IP address in `.env`

### Microphone permission denied

- iOS: Check Settings > Privacy & Security > Microphone
- Android: Check app permissions in Settings

### Recording format issues

- iOS typically records as `.m4a` or `.caf`
- Backend accepts: `audio/m4a`, `audio/x-caf`, `audio/mpeg`, `audio/wav`, etc.
- The app automatically detects format from file extension

### Presigned URL upload fails

- Ensure `Content-Type` header matches exactly what the backend expects
- Do NOT add `Authorization` header to the PUT request
- Do NOT use `multipart/form-data`

## Development

### Project Structure

```
apps/mobile/
├── App.tsx                      # Main app entry with navigation
├── screens/
│   ├── RecordingsScreen.tsx    # Recording library (list view)
│   ├── RecordingDetailScreen.tsx # Recording detail view
│   └── PipeTest.tsx            # PipeTest screen
├── navigation/
│   └── types.ts                # Type-safe navigation types
├── app.json                    # Expo configuration
├── package.json                # Dependencies
└── tsconfig.json               # TypeScript config
```

## API Endpoints

The mobile app uses the following API endpoints:

- `GET /api/recordings?date=YYYY-MM-DD` - List recordings for a date
- `GET /api/recordings/:id?include=all` - Get recording with transcript and debrief
- `POST /api/recordings` - Create new recording
- `POST /api/recordings/:id/upload` - Upload audio file (direct upload)
- `POST /api/recordings/:id/complete-upload` - Complete upload and start processing

### Date Filtering

The API supports server-side date filtering:
- `date` parameter: `YYYY-MM-DD` format (e.g., `2026-02-15`)
- Filters recordings by `createdAt` within that day (00:00-23:59 UTC)
- If no date provided, returns all recordings (paginated)

### Response Format

**List Recordings:**
```json
{
  "data": [/* Recording objects */],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  },
  "success": true
}
```

**Get Recording:**
```json
{
  "data": {
    "id": "...",
    "title": "...",
    "status": "complete",
    "transcript": {
      "text": "...",
      "segments": [/* ... */],
      "language": "en"
    },
    "debrief": {
      "markdown": "...",
      "sections": [/* ... */]
    }
  },
  "success": true
}
```

## Testing

### Unit Tests

Run tests for data model parsing:
```bash
cd apps/mobile
pnpm test
```

### Manual Testing Checklist

1. **RecordingsScreen:**
   - [ ] Displays recordings for today
   - [ ] Shows correct time, duration, status
   - [ ] Pull-to-refresh works
   - [ ] Empty state displays when no recordings
   - [ ] Tap navigates to detail screen

2. **RecordingDetailScreen:**
   - [ ] Displays all recording information
   - [ ] Transcript section is collapsible
   - [ ] Segments show correct timestamps and speakers
   - [ ] Debrief renders correctly
   - [ ] Auto-polling works for processing recordings

3. **API Integration:**
   - [ ] Date filtering works correctly
   - [ ] Retry logic handles network failures
   - [ ] Error messages are user-friendly
