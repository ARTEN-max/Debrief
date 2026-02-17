/**
 * Navigation Types
 * 
 * Type-safe navigation routes for the mobile app.
 */

export type RootStackParamList = {
  Recordings: undefined;
  RecordingDetail: { recordingId: string };
  NewRecording: undefined;
  Chat: undefined;
  VoiceProfile: undefined;
  PipeTest: undefined;
};
