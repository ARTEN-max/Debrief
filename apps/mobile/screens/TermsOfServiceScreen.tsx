/**
 * TermsOfServiceScreen
 * 
 * In-app Terms of Service page.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

interface TermsOfServiceScreenProps {
  onBack: () => void;
}

export default function TermsOfServiceScreen({ onBack }: TermsOfServiceScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Terms of Service (Twin)</Text>
        <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>

        <Text style={styles.body}>
          These Terms of Service ("Terms") govern your use of Twin (the "Service"). By using the Service, you agree to these Terms.
        </Text>

        <Text style={styles.sectionTitle}>1. Eligibility</Text>
        <Text style={styles.body}>
          You must be at least 13 years old to use Twin. If you are under the age of majority where you live, you must have permission from a parent/guardian.
        </Text>

        <Text style={styles.sectionTitle}>2. Your account</Text>
        <Text style={styles.body}>
          You are responsible for:{'\n'}
          • Maintaining the confidentiality of your login credentials{'\n'}
          • All activity on your account
        </Text>

        <Text style={styles.sectionTitle}>3. Recording and legal compliance</Text>
        <Text style={styles.body}>
          Twin provides tools to record and process audio you choose to record. You agree that you will:{'\n'}
          • Only record with permission from participants where required by law{'\n'}
          • Use Twin in compliance with applicable laws and regulations
        </Text>
        <Text style={styles.body}>
          Twin is not responsible for how you use the recording feature.
        </Text>

        <Text style={styles.sectionTitle}>4. Acceptable use</Text>
        <Text style={styles.body}>
          You agree not to:{'\n'}
          • Use Twin for unlawful, harmful, or abusive purposes{'\n'}
          • Upload content that violates others' rights (privacy, intellectual property, etc.){'\n'}
          • Attempt to reverse engineer or disrupt the Service{'\n'}
          • Use the Service to harvest data or compromise security
        </Text>

        <Text style={styles.sectionTitle}>5. AI outputs</Text>
        <Text style={styles.body}>
          Twin may generate transcripts, summaries, and suggestions using automated systems. Outputs may be inaccurate or incomplete. You are responsible for how you use any generated output.
        </Text>
        <Text style={styles.body}>
          Twin does not provide legal, medical, or professional advice.
        </Text>

        <Text style={styles.sectionTitle}>6. Content ownership</Text>
        <Text style={styles.body}>
          You retain your rights to your original content (your recordings).
        </Text>
        <Text style={styles.body}>
          You grant Twin a limited license to process your content to provide the Service (transcription, diarization, summaries, chat).
        </Text>
        <Text style={styles.body}>
          You can delete your recordings in the app. You can delete your account in the app.
        </Text>

        <Text style={styles.sectionTitle}>7. Service availability</Text>
        <Text style={styles.body}>
          We may change, suspend, or discontinue parts of the Service at any time. We aim to keep the Service available but do not guarantee uninterrupted access.
        </Text>

        <Text style={styles.sectionTitle}>8. Payments (if applicable)</Text>
        <Text style={styles.body}>
          If Twin offers paid features, pricing and billing terms will be shown at the point of purchase. Purchases made in the iOS app are handled through Apple's in-app purchase system.
        </Text>

        <Text style={styles.sectionTitle}>9. Disclaimers</Text>
        <Text style={styles.body}>
          The Service is provided "as is" without warranties of any kind. We do not guarantee that the Service will be error-free or that outputs will be accurate.
        </Text>

        <Text style={styles.sectionTitle}>10. Limitation of liability</Text>
        <Text style={styles.body}>
          To the maximum extent allowed by law, Twin will not be liable for indirect, incidental, special, or consequential damages arising from your use of the Service.
        </Text>

        <Text style={styles.sectionTitle}>11. Termination</Text>
        <Text style={styles.body}>
          You may stop using the Service at any time. You may delete your account in-app. We may suspend or terminate access if you violate these Terms.
        </Text>

        <Text style={styles.sectionTitle}>12. Changes</Text>
        <Text style={styles.body}>
          We may update these Terms from time to time. We will update the "Last updated" date when changes occur.
        </Text>

        <Text style={styles.sectionTitle}>13. Contact</Text>
        <Text style={styles.body}>
          Support: {process.env.EXPO_PUBLIC_SUPPORT_EMAIL || '[support@yourdomain.com]'}
        </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#0ff',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSpacer: {
    width: 60,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 24,
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
});
