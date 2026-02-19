/**
 * ConsentScreen
 *
 * Shown automatically when the user has not yet accepted consent
 * (or has revoked it). All three checkboxes must be checked before
 * the Continue button becomes active.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
} from 'react-native';
import { useConsent } from '../contexts/ConsentContext';

const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL || '';
const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL || '';

function openUrl(url: string, label: string) {
  if (!url) {
    Alert.alert('Not Available', `${label} URL has not been configured yet.`);
    return;
  }
  Linking.openURL(url).catch(() =>
    Alert.alert('Error', `Could not open ${label}.`),
  );
}

export default function ConsentScreen() {
  const { accept } = useConsent();
  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);
  const [check3, setCheck3] = useState(false);
  const [loading, setLoading] = useState(false);

  const allChecked = check1 && check2 && check3;

  const handleAgree = async () => {
    if (!allChecked) return;
    setLoading(true);
    try {
      await accept();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to record consent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Before you record</Text>
        <Text style={styles.subtitle}>
          Please review and acknowledge the following before using Twin.
        </Text>

        {/* Checkbox 1 */}
        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => setCheck1(!check1)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, check1 && styles.checkboxChecked]}>
            {check1 && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkLabel}>
            I have permission to record participants where required.
          </Text>
        </TouchableOpacity>

        {/* Checkbox 2 */}
        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => setCheck2(!check2)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, check2 && styles.checkboxChecked]}>
            {check2 && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkLabel}>
            I understand my audio may be uploaded and processed to generate
            transcripts and insights.
          </Text>
        </TouchableOpacity>

        {/* Checkbox 3 */}
        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => setCheck3(!check3)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, check3 && styles.checkboxChecked]}>
            {check3 && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkLabel}>
            I understand third-party processors may handle this data as
            described in the Privacy Policy.
          </Text>
        </TouchableOpacity>

        {/* Links */}
        <View style={styles.linkRow}>
          <TouchableOpacity onPress={() => openUrl(PRIVACY_URL, 'Privacy Policy')}>
            <Text style={styles.linkText}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.linkSeparator}>·</Text>
          <TouchableOpacity onPress={() => openUrl(TERMS_URL, 'Terms of Service')}>
            <Text style={styles.linkText}>Terms of Service</Text>
          </TouchableOpacity>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.cta, !allChecked && styles.ctaDisabled]}
          onPress={handleAgree}
          disabled={!allChecked || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={[styles.ctaText, !allChecked && styles.ctaTextDisabled]}>
              I Agree
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 24,
    paddingTop: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#999',
    marginBottom: 32,
    lineHeight: 22,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#555',
    marginRight: 14,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0ff',
    borderColor: '#0ff',
  },
  checkmark: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  checkLabel: {
    flex: 1,
    fontSize: 15,
    color: '#ddd',
    lineHeight: 22,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 36,
  },
  linkText: {
    fontSize: 14,
    color: '#0ff',
    textDecorationLine: 'underline',
  },
  linkSeparator: {
    fontSize: 14,
    color: '#555',
    marginHorizontal: 12,
  },
  cta: {
    backgroundColor: '#0ff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaDisabled: {
    backgroundColor: '#333',
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
  },
  ctaTextDisabled: {
    color: '#666',
  },
});
