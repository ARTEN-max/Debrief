# Recording Library Implementation Summary

## Overview

Implemented Recording Library + Detail Screens feature for the mobile app, providing a solid foundation for the core loop: Recordings list (by day) + Recording detail view.

## Files Changed

### API Layer (Backend)

1. **`apps/api/src/routes/recordings.ts`**
   - Added `date` and `cursor` parameters to `listRecordingsQuerySchema`
   - Updated route handler to pass date/cursor to service

2. **`apps/api/src/services/recordings.service.ts`**
   - Updated `ListRecordingsOptions` interface to include `date?: string` and `cursor?: string`
   - Enhanced `listRecordingsByUser` function to filter by date (YYYY-MM-DD format)
   - Date filtering creates UTC date range for the specified day (00:00-23:59)
   - Cursor-based pagination support (for future use)

### Shared Package (Data Models & API Client)

3. **`packages/shared/src/models/recording.ts`** (NEW)
   - Created `RecordingSummary` model: id, createdAt, durationSec, status, title?, hasDebrief, hasTranscript
   - Created `RecordingDetail` model: extends summary + transcript, segments, debriefMarkdown, speakers
   - Created `TranscriptSegmentDetail` with milliseconds (startMs, endMs, speaker, label?, text)
   - Helper functions: `toRecordingSummary()` and `toRecordingDetail()` for API response parsing
   - Handles missing fields gracefully

4. **`packages/shared/src/apiClient.ts`**
   - Added `listRecordings()` function with date filtering and retry logic (exponential backoff)
   - Added `getRecording()` function with retry logic
   - Both functions include retry on 5xx errors, skip retry on 4xx errors
   - Updated `listRecordingsByDay()` to be deprecated (kept for backward compatibility)

5. **`packages/shared/src/index.ts`**
   - Exported recording models

6. **`packages/shared/tsup.config.ts`**
   - Added `src/models/recording.ts` to build entries

### Mobile App (Screens & Navigation)

7. **`apps/mobile/screens/RecordingsScreen.tsx`** (NEW)
   - Lists recordings for selected date (defaults to today)
   - Shows time, duration, status pill, transcript/debrief badges
   - Pull-to-refresh support
   - Empty state when no recordings
   - Navigation to detail screen on tap
   - Date formatting (Today/Yesterday/Full date)

8. **`apps/mobile/screens/RecordingDetailScreen.tsx`** (NEW)
   - Full recording details with status card
   - Collapsible transcript section
   - Segments list with speaker labels and timestamps (formatted as MM:SS)
   - Debrief markdown display (plain text rendering)
   - Auto-polling when recording is processing (3-second intervals)
   - Back navigation

9. **`apps/mobile/App.tsx`**
   - Added simple state-based navigation
   - Routes: Recordings (default), RecordingDetail, PipeTest
   - Type-safe navigation with `RootStackParamList`

10. **`apps/mobile/navigation/types.ts`** (NEW)
    - Type-safe navigation route definitions

### Testing & Documentation

11. **`apps/mobile/__tests__/recording-models.test.ts`** (NEW)
    - Unit tests for `toRecordingSummary()` and `toRecordingDetail()`
    - Tests handle null values, missing relations, timestamp conversion
    - Uses Jest (already in dependencies)

12. **`apps/mobile/jest.config.js`** (NEW)
    - Jest configuration for Expo/React Native

13. **`apps/mobile/package.json`**
    - Added `test` script

14. **`apps/mobile/README.md`**
    - Updated with new screens documentation
    - Added API endpoints documentation
    - Added testing section with manual checklist

## Architecture Decisions

### Separation of Concerns
- **Data Models** (`packages/shared/src/models/recording.ts`): Domain models with conversion helpers
- **API Layer** (`packages/shared/src/apiClient.ts`): Network requests with retry logic
- **View Models**: Screens handle their own state (could be extracted to hooks later)
- **Screens**: Pure presentation components

### Date Filtering
- Server-side filtering by `createdAt` in UTC day range
- Format: `YYYY-MM-DD` (e.g., `2026-02-15`)
- If no date provided, returns all recordings (existing behavior preserved)

### Retry Logic
- Exponential backoff: 1s, 2s, 4s (max 3 retries)
- Only retries on 5xx errors or network failures
- Skips retry on 4xx client errors

### Navigation
- Simple state-based navigation (no heavy dependencies)
- Type-safe with TypeScript
- Easy to migrate to Expo Router later

## API Endpoints Used

1. **GET /api/recordings?date=YYYY-MM-DD**
   - Lists recordings for a specific date
   - Returns paginated response with `data` and `pagination`

2. **GET /api/recordings/:id?include=all**
   - Gets full recording with transcript and debrief
   - Returns `RecordingWithRelations` structure

## Testing

### Unit Tests
```bash
cd apps/mobile
pnpm test
```

Tests cover:
- API response parsing to `RecordingSummary`
- API response parsing to `RecordingDetail`
- Timestamp conversion (seconds → milliseconds)
- Handling of null/missing fields

### Manual Testing Checklist
See `apps/mobile/README.md` for full checklist.

## Follow-up Tasks for "Chat about Today"

1. **Add date picker UI**
   - Replace "Today" header with interactive date picker
   - Allow navigation between dates (previous/next day buttons)
   - Store selected date in navigation state

2. **Implement chat interface**
   - Create `ChatScreen` component
   - Add chat input with message composer
   - Display chat messages with timestamps
   - Integrate with backend chat API (when available)

3. **Add recording context to chat**
   - Pass selected recording ID to chat screen
   - Show recording summary in chat header
   - Allow referencing specific transcript segments in chat
   - Link chat messages to recording timeline

## Notes

- The date picker UI is stubbed (TODO comment in RecordingsScreen)
- Debrief markdown is rendered as plain text (no markdown renderer added)
- Navigation is simple state-based (can be upgraded to Expo Router later)
- All API calls use the shared API client with proper error handling
- Recording models handle missing fields gracefully (defensive programming)
