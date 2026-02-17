import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import PipeTestScreen from './screens/PipeTest';
import RecordingsScreen from './screens/RecordingsScreen';
import RecordingDetailScreen from './screens/RecordingDetailScreen';
import NewRecordingScreen from './screens/NewRecordingScreen';
import ChatScreen from './screens/ChatScreen';
import VoiceProfileScreen from './screens/VoiceProfileScreen';
import TabBar, { type Tab } from './components/TabBar';
import type { RootStackParamList } from './navigation/types';

type Screen = keyof RootStackParamList;
type ScreenParams = RootStackParamList[Screen];

export default function App() {
  const [currentTab, setCurrentTab] = useState<Tab>('Today');
  const [currentScreen, setCurrentScreen] = useState<Screen>('Recordings');
  const [screenParams, setScreenParams] = useState<ScreenParams>(undefined);
  const recordingsRefreshRef = useRef<(() => void) | null>(null);

  const navigate = (screen: Screen, params?: ScreenParams) => {
    setCurrentScreen(screen);
    setScreenParams(params);
  };

  const handleTabChange = (tab: Tab) => {
    setCurrentTab(tab);
    if (tab === 'Today') {
      setCurrentScreen('Recordings');
      setScreenParams(undefined);
    } else if (tab === 'Chat') {
      setCurrentScreen('Chat');
      setScreenParams(undefined);
    }
  };

  const handleRecordingComplete = (recordingId: string) => {
    // Navigate to detail screen
    navigate('RecordingDetail', { recordingId });
    // Refresh recordings list when we return
    if (recordingsRefreshRef.current) {
      setTimeout(() => {
        recordingsRefreshRef.current?.();
      }, 1000);
    }
  };

  // Show tab bar only for main screens (Recordings, Chat), not for detail screens
  const showTabBar = currentScreen === 'Recordings' || currentScreen === 'Chat';

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Recordings':
        return (
          <RecordingsScreen
            onSelectRecording={(recordingId) => {
              navigate('RecordingDetail', { recordingId });
            }}
            onNewRecording={() => navigate('NewRecording')}
            onVoiceProfile={() => navigate('VoiceProfile')}
            onMount={(refreshFn) => {
              recordingsRefreshRef.current = refreshFn;
            }}
          />
        );
      case 'Chat':
        return <ChatScreen />;
      case 'RecordingDetail':
        if (screenParams && 'recordingId' in screenParams) {
          return (
            <RecordingDetailScreen
              recordingId={screenParams.recordingId}
              onBack={() => {
                navigate('Recordings');
                setCurrentTab('Today');
              }}
            />
          );
        }
        return null;
      case 'NewRecording':
        return (
          <NewRecordingScreen
            onComplete={handleRecordingComplete}
            onCancel={() => {
              navigate('Recordings');
              setCurrentTab('Today');
            }}
          />
        );
      case 'VoiceProfile':
        return (
          <VoiceProfileScreen
            onBack={() => {
              navigate('Recordings');
              setCurrentTab('Today');
            }}
          />
        );
      case 'PipeTest':
        return <PipeTestScreen />;
      default:
        return (
          <RecordingsScreen
            onSelectRecording={(id) => navigate('RecordingDetail', { recordingId: id })}
            onNewRecording={() => navigate('NewRecording')}
            onVoiceProfile={() => navigate('VoiceProfile')}
            onMount={(refreshFn) => {
              recordingsRefreshRef.current = refreshFn;
            }}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>{renderScreen()}</View>
      {showTabBar && <TabBar activeTab={currentTab} onTabChange={handleTabChange} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
  },
});
