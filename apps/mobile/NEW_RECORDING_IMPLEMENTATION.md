# New Recording Flow Implementation

## Summary

Implemented a native-feeling "New Recording" flow that integrates seamlessly with the existing upload pipeline. Users can now create recordings directly from the Recordings list screen.

## Files Changed

### New Files
1. **`apps/mobile/screens/NewRecordingScreen.tsx`** (NEW)
   - Full-featured recording screen with:
     - Big circular Record button (mic icon) when idle
     - Red Stop button with live timer during recording
     - Upload progress and processing states
     - Auto-navigation to detail screen on completion
     - Error handling with retry options
     - App backgrounding handling (stops recording safely)

### Modified Files
1. **`apps/mobile/navigation/types.ts`**
   - Added `NewRecording: undefined` to `RootStackParamList`

2. **`apps/mobile/screens/RecordingsScreen.tsx`**
   - Added `onNewRecording` prop
   - Added `onMount` prop to expose refresh function
   - Added Record button (`+`) in header (top-right)
   - Updated header styles to accommodate button

3. **`apps/mobile/App.tsx`**
   - Added `NewRecordingScreen` import
   - Added `NewRecording` case to navigation switch
   - Implemented `handleRecordingComplete` to navigate to detail and refresh list
   - Added `recordingsRefreshRef` to trigger list refresh when returning from new recording

## Features Implemented

### 1. Navigation
- ✅ Record button in top-right of RecordingsScreen header
- ✅ Tapping opens NewRecordingScreen
- ✅ Auto-navigation to RecordingDetailScreen when recording completes
- ✅ List refresh when returning from new recording

### 2. NewRecordingScreen UI
- ✅ Header with "New Recording" title and Cancel/Back button
- ✅ Big circular Record button (mic icon) when idle
- ✅ Red Stop button during recording
- ✅ Live timer (mm:ss format)
- ✅ Upload progress states ("Uploading...", "Processing...")
- ✅ Helper text: "Audio stays private. Upload starts after you stop."

### 3. Recording Functionality
- ✅ Microphone permission request with friendly error + Settings deep link
- ✅ Records to local file using `expo-av`
- ✅ Produces Blob/File compatible with existing presigned PUT flow
- ✅ After Stop: shows "Uploading..." then "Processing..." states
- ✅ Auto-navigates to RecordingDetailScreen when status becomes complete
- ✅ Shows retry options if upload/processing fails

### 4. Existing Pipeline Integration
- ✅ Uses `createRecording()` to get presigned URL + recordingId
- ✅ Uses `uploadRecordingFile()` (direct API upload) with presigned URL fallback
- ✅ Calls `completeUpload()` when using presigned URL flow
- ✅ Polls `getRecordingStatus()` until complete
- ✅ New recording appears in Today list (via refresh callback)

### 5. Edge Cases
- ✅ Cancel during recording: Shows confirmation dialog, discards local file, no server recording
- ✅ Upload fails: Shows error with retry button (retries without re-recording if recordingId exists)
- ✅ App backgrounding: Stops recording safely and saves (stops timer, unloads recording)

## iOS Permissions

The following permissions are already configured in `app.json`:

- **iOS**: `NSMicrophoneUsageDescription` - "This app needs access to your microphone to record audio for transcription and debrief generation."
- **Android**: `android.permission.RECORD_AUDIO`
- **expo-av plugin**: Configured with microphone permission message

No additional permission keys needed.

## Manual Test Checklist

### 1. Permission Denied Flow
- [ ] Tap Record button
- [ ] Deny microphone permission
- [ ] Verify alert appears with "Open Settings" option
- [ ] Tap "Open Settings" → verify Settings app opens
- [ ] Grant permission in Settings
- [ ] Return to app → verify recording can start

### 2. Record 5s Flow
- [ ] Tap Record button
- [ ] Grant permission if prompted
- [ ] Verify Record button becomes red Stop button
- [ ] Verify timer starts counting (00:01, 00:02, ...)
- [ ] Verify "Recording..." text appears
- [ ] Tap Stop after ~5 seconds
- [ ] Verify "Uploading..." state appears
- [ ] Verify "Processing..." state appears
- [ ] Verify auto-navigation to RecordingDetailScreen when complete

### 3. Cancel During Recording
- [ ] Start recording
- [ ] Tap Cancel button
- [ ] Verify confirmation dialog appears
- [ ] Tap "Discard" → verify returns to RecordingsScreen
- [ ] Verify no recording appears in list

### 4. Upload/Processing Error
- [ ] Record and stop
- [ ] If upload fails (simulate by stopping API server), verify error message appears
- [ ] Verify "Retry Processing" button appears
- [ ] Tap retry → verify retries without re-recording

### 5. App Backgrounding
- [ ] Start recording
- [ ] Press Home button (or swipe up) to background app
- [ ] Verify recording stops safely
- [ ] Return to app → verify recording is stopped (not still recording)

### 6. List Refresh
- [ ] Create new recording
- [ ] Wait for completion and auto-navigation to detail
- [ ] Navigate back to RecordingsScreen
- [ ] Verify new recording appears in Today list (most recent first)

## Architecture Notes

- **Reuses existing upload pipeline**: All upload logic is identical to `PipeTest.tsx`
- **No heavy dependencies**: Uses existing `expo-av` and `expo-file-system`
- **Modular design**: Recording logic is self-contained in `NewRecordingScreen`
- **Type-safe navigation**: Uses existing navigation type system
- **iOS-first**: Designed for iOS simulator, but portable to Android

## Code Quality

- ✅ TypeScript types throughout
- ✅ Error handling with user-friendly messages
- ✅ Cleanup on unmount (stops recording, clears intervals)
- ✅ Consistent styling with existing screens (dark theme, cyan accents)
- ✅ Accessibility labels where appropriate

## Next Steps / Follow-ups

1. **Pause/Resume**: Consider adding pause/resume functionality if users request it (currently not implemented per "if easy" constraint)

2. **Optimistic UI**: Could add optimistic insert of "pending" recording in list immediately after `createRecording()`, but current refresh-on-return approach is simpler and works well

3. **Recording Title**: Currently uses auto-generated title based on time. Could add input field for custom title before starting recording
