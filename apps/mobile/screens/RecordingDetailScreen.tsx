/**
 * RecordingDetailScreen
 * 
 * Displays full details of a recording including:
 * - Status card
 * - Transcript (collapsible)
 * - Segments list (speaker + timestamp + text)
 * - Debrief (markdown or plain text)
 * - Auto-polling if still processing
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  getRecording,
  toRecordingDetail,
  type RecordingDetail,
  ApiClientError,
  deleteRecordingApi,
} from '@komuchi/shared';
import { useAuth } from '../contexts/AuthContext';

interface RecordingDetailScreenProps {
  recordingId: string;
  onBack: () => void;
  /** Called after a recording is successfully deleted so the parent can refresh */
  onDeleted?: () => void;
}

export default function RecordingDetailScreen({
  recordingId,
  onBack,
  onDeleted,
}: RecordingDetailScreenProps) {
  const { user } = useAuth();
  const userId = user!.uid;
  const [recording, setRecording] = useState<RecordingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transcriptExpanded, setTranscriptExpanded] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadRecording = useCallback(async (showPolling = false) => {
    try {
      if (!showPolling) {
        setLoading(true);
      } else {
        setIsPolling(true);
      }
      setError(null);

      const response = await getRecording(userId, recordingId, true);
      const detail = toRecordingDetail(response);
      setRecording(detail);

      // If still processing, schedule next poll
      if (detail.status === 'processing' || detail.status === 'pending' || detail.status === 'uploaded') {
        setTimeout(() => {
          loadRecording(true);
        }, 3000); // Poll every 3 seconds
      } else {
        setIsPolling(false);
      }
    } catch (err) {
      console.error('Error loading recording:', err);
      const errorMessage = err instanceof ApiClientError
        ? `API Error: ${err.message} (${err.statusCode})`
        : err instanceof Error
        ? err.message
        : 'Failed to load recording';
      setError(errorMessage);
      setIsPolling(false);
    } finally {
      setLoading(false);
    }
  }, [recordingId]);

  useEffect(() => {
    loadRecording();
  }, [loadRecording]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Recording',
      'Delete this recording? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteRecordingApi(userId, recordingId);
              onDeleted?.();
              onBack();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete recording.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'complete':
        return '#0f0';
      case 'processing':
        return '#ff0';
      case 'failed':
        return '#f00';
      case 'pending':
      case 'uploaded':
        return '#888';
      default:
        return '#888';
    }
  };

  if (loading && !recording) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹ Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ff" />
        </View>
      </View>
    );
  }

  if (error && !recording) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹ Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  if (!recording) {
    return null;
  }

  const isProcessing = recording.status === 'processing' || recording.status === 'pending' || recording.status === 'uploaded';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        {isProcessing && isPolling && (
          <View style={styles.pollingIndicator}>
            <ActivityIndicator size="small" color="#0ff" />
            <Text style={styles.pollingText}>Updating...</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Status Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusPill, { backgroundColor: getStatusColor(recording.status) }]}>
              <Text style={styles.statusText}>{recording.status}</Text>
            </View>
            {recording.durationSec && (
              <Text style={styles.duration}>{formatDuration(recording.durationSec)}</Text>
            )}
          </View>
          {recording.title && (
            <Text style={styles.title}>{recording.title}</Text>
          )}
          {recording.speakers && recording.speakers.length > 0 && (
            <Text style={styles.metaText}>
              Speakers: {recording.speakers.join(', ')}
            </Text>
          )}
        </View>

        {/* Transcript Section */}
        {recording.transcript && (
          <View style={styles.section}>
            <TouchableOpacity
              onPress={() => setTranscriptExpanded(!transcriptExpanded)}
              style={styles.sectionHeader}
            >
              <Text style={styles.sectionTitle}>Transcript</Text>
              <Text style={styles.expandIcon}>{transcriptExpanded ? '▼' : '▶'}</Text>
            </TouchableOpacity>
            {transcriptExpanded && (
              <>
                <Text style={styles.transcriptText}>{recording.transcript.text}</Text>
                {recording.transcript.language && (
                  <Text style={styles.metaText}>Language: {recording.transcript.language}</Text>
                )}
              </>
            )}
          </View>
        )}

        {/* Segments List */}
        {recording.transcript && recording.transcript.segments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Segments</Text>
            {recording.transcript.segments.map((segment, index) => (
              <View key={index} style={styles.segment}>
                <View style={styles.segmentHeader}>
                  <Text style={styles.segmentTime}>
                    {formatTimestamp(segment.startMs)} - {formatTimestamp(segment.endMs)}
                  </Text>
                  <View style={styles.speakerBadge}>
                    <Text style={styles.speakerText}>
                      {segment.label || segment.speaker}
                    </Text>
                  </View>
                </View>
                <Text style={styles.segmentText}>{segment.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Debrief Section */}
        {recording.debriefMarkdown && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Debrief</Text>
            <Text style={styles.debriefText}>{recording.debriefMarkdown}</Text>
          </View>
        )}

        {/* Processing State */}
        {isProcessing && (
          <View style={styles.section}>
            <View style={styles.processingContainer}>
              <ActivityIndicator size="small" color="#ff0" />
              <Text style={styles.processingText}>
                Recording is being processed. This screen will update automatically.
              </Text>
            </View>
          </View>
        )}

        {/* Delete Recording */}
        <View style={[styles.section, { marginTop: 12 }]}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator color="#f44" size="small" />
            ) : (
              <Text style={styles.deleteButtonText}>Delete Recording</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 18,
    color: '#0ff',
  },
  pollingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pollingText: {
    fontSize: 12,
    color: '#888',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 20,
    backgroundColor: '#2a1a1a',
    margin: 20,
    borderRadius: 8,
  },
  errorText: {
    color: '#f88',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  expandIcon: {
    fontSize: 12,
    color: '#888',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    textTransform: 'uppercase',
  },
  duration: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'monospace',
  },
  title: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
  transcriptText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 22,
  },
  segment: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
  },
  segmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  segmentTime: {
    fontSize: 11,
    color: '#888',
    fontFamily: 'monospace',
  },
  speakerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#0ff',
    borderRadius: 4,
  },
  speakerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000',
  },
  segmentText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  debriefText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 22,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  processingText: {
    fontSize: 14,
    color: '#ff0',
    flex: 1,
  },
  deleteButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f44',
  },
  deleteButtonText: {
    color: '#f44',
    fontSize: 16,
    fontWeight: '600',
  },
});
