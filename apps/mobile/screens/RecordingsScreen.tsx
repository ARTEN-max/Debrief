/**
 * RecordingsScreen
 * 
 * Displays a list of recordings for a selected date.
 * Features:
 * - Date picker (defaults to today)
 * - List of recordings (most recent first)
 * - Pull-to-refresh
 * - Empty state
 * - Navigation to detail screen
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { listRecordings, type RecordingSummary, toRecordingSummary, ApiClientError } from '@komuchi/shared';

// Mock user ID - in production, get from auth
const MOCK_USER_ID = '91b4d85d-1b51-4a7b-8470-818b75979913';

interface RecordingsScreenProps {
  onSelectRecording: (recordingId: string) => void;
  onNewRecording: () => void;
  onVoiceProfile?: () => void;
  onMount?: (refreshFn: () => void) => void;
}

export default function RecordingsScreen({ onSelectRecording, onNewRecording, onVoiceProfile, onMount }: RecordingsScreenProps) {
  const [recordings, setRecordings] = useState<RecordingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to today in YYYY-MM-DD format
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const loadRecordings = useCallback(async (date: string, showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await listRecordings(MOCK_USER_ID, {
        date,
        limit: 50, // Load enough for a day
      });

      // Convert API response to RecordingSummary
      // Response structure: { data: Recording[], pagination: {...} }
      // handleResponse now returns the full PaginatedResponse for paginated endpoints
      const recordingsArray = response?.data || [];
      if (!Array.isArray(recordingsArray)) {
        console.error('Unexpected response format:', response);
        throw new Error('Invalid response format: expected array in data field');
      }
      const summaries = recordingsArray.map((recording: any) => toRecordingSummary(recording));
      setRecordings(summaries);
    } catch (err) {
      console.error('Error loading recordings:', err);
      const errorMessage = err instanceof ApiClientError
        ? `API Error: ${err.message} (${err.statusCode})`
        : err instanceof Error
        ? err.message
        : 'Failed to load recordings';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRecordings(selectedDate);
  }, [selectedDate, loadRecordings]);

  // Expose refresh function to parent (for when returning from NewRecording)
  useEffect(() => {
    if (onMount) {
      onMount(() => {
        loadRecordings(selectedDate, false);
      });
    }
  }, [onMount, loadRecordings, selectedDate]);

  const onRefresh = useCallback(() => {
    loadRecordings(selectedDate, true);
  }, [selectedDate, loadRecordings]);

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateStr === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
    }
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
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

  const renderRecordingItem = ({ item }: { item: RecordingSummary }) => (
    <TouchableOpacity
      style={styles.recordingItem}
      onPress={() => onSelectRecording(item.id)}
    >
      <View style={styles.recordingItemContent}>
        <View style={styles.recordingItemHeader}>
          <Text style={styles.recordingTime}>{formatTime(item.createdAt)}</Text>
          <View style={[styles.statusPill, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <View style={styles.recordingItemMeta}>
          <Text style={styles.recordingDuration}>{formatDuration(item.durationSec)}</Text>
          {item.title && (
            <Text style={styles.recordingTitle} numberOfLines={1}>
              {item.title}
            </Text>
          )}
          <View style={styles.recordingBadges}>
            {item.hasTranscript && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Transcript</Text>
              </View>
            )}
            {item.hasDebrief && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Debrief</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No recordings yet</Text>
      <Text style={styles.emptyStateText}>
        Recordings for {formatDate(selectedDate)} will appear here
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{formatDate(selectedDate)}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ff" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{formatDate(selectedDate)}</Text>
        <View style={styles.headerButtons}>
          {onVoiceProfile && (
            <TouchableOpacity
              style={styles.voiceProfileButton}
              onPress={onVoiceProfile}
              accessibilityLabel="Voice Profile"
            >
              <Text style={styles.voiceProfileButtonText}>🎤</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.recordButton}
            onPress={onNewRecording}
            accessibilityLabel="New Recording"
          >
            <Text style={styles.recordButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={recordings}
          renderItem={renderRecordingItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={recordings.length === 0 ? styles.emptyList : undefined}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0ff"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  voiceProfileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  voiceProfileButtonText: {
    fontSize: 20,
  },
  recordButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonText: {
    fontSize: 28,
    color: '#000',
    fontWeight: 'bold',
    lineHeight: 28,
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
  emptyList: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  recordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    backgroundColor: '#1a1a1a',
  },
  recordingItemContent: {
    flex: 1,
  },
  recordingItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordingTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000',
    textTransform: 'uppercase',
  },
  recordingItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recordingDuration: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'monospace',
  },
  recordingTitle: {
    fontSize: 14,
    color: '#aaa',
    flex: 1,
  },
  recordingBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    color: '#0ff',
    textTransform: 'uppercase',
  },
  chevron: {
    fontSize: 24,
    color: '#666',
    marginLeft: 12,
  },
});
