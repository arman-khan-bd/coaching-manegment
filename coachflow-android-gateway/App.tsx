import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import {
  SmsGateway,
  SimCardInfo,
  BatteryStatus,
} from './src/native/SmsGateway';

interface LogItem {
  id: string;
  time: string;
  to: string;
  message: string;
  status: 'sent' | 'failed' | 'processing';
  simSlot: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'webview' | 'gateway' | 'api'>('webview');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [webLoading, setWebLoading] = useState(true);

  // Gateway status
  const [simCards, setSimCards] = useState<SimCardInfo[]>([]);
  const [battery, setBattery] = useState<BatteryStatus>({ level: 94, isCharging: true });
  const [dailySent, setDailySent] = useState(284);
  const dailyLimit = 1500;
  const [serverRunning, setServerRunning] = useState(true);
  const [serverIp, setServerIp] = useState('192.168.0.105');
  const serverPort = 8080;
  const apiKey = 'gw_apk_live_gp_9f82d02c81e9bca23';

  // Live Logs
  const [logs, setLogs] = useState<LogItem[]>([
    {
      id: '1',
      time: '17:31:04',
      to: '+880 1711-456789',
      message: 'সম্মানিত অভিভাবক, ফারহান শাকিল আজ ক্লাসে অনুপস্থিত ছিল।',
      status: 'sent',
      simSlot: 1,
    },
    {
      id: '2',
      time: '17:28:19',
      to: '+880 1819-234567',
      message: 'সম্মানিত অভিভাবক, নাফিসা আনজুম গণিত পরীক্ষায় প্রাপ্ত নম্বর: ৯৪/১০০ (A+)।',
      status: 'sent',
      simSlot: 1,
    },
  ]);

  // Test SMS Form state
  const [testRecipient, setTestRecipient] = useState('+880 1711-456789');
  const [testMessage, setTestMessage] = useState('টেস্ট বার্তা: CoachFlow Android SMS Gateway SIM 1 সফলভাবে সংযুক্ত হয়েছে।');
  const [isSendingTest, setIsSendingTest] = useState(false);

  const webViewRef = useRef<WebView>(null);
  const dashboardUrl = 'https://coaching-bd.netlify.app/';

  useEffect(() => {
    initGateway();
  }, []);

  async function initGateway() {
    await SmsGateway.requestPermissions();
    const sims = await SmsGateway.getSimCards();
    setSimCards(sims);
    const batt = await SmsGateway.getBatteryStatus();
    setBattery(batt);

    const srv = await SmsGateway.startHttpServer(serverPort, apiKey);
    if (srv && srv.ipAddress) {
      setServerIp(srv.ipAddress);
    }
  }

  // Handle messages received from Web Dashboard
  async function handleWebViewMessage(event: any) {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SEND_SMS') {
        const { to, message, recipientName } = data;
        appendLog(to, message, 'processing');

        const result = await SmsGateway.sendSms(to, message);
        if (result.success) {
          setDailySent((prev) => prev + 1);
          updateLatestLogStatus('sent');

          // Send confirmation back to webview
          webViewRef.current?.postMessage(
            JSON.stringify({
              type: 'SMS_SENT_CONFIRMATION',
              messageId: result.messageId,
              to,
              simSlot: result.simSlot,
              carrier: result.carrier,
            })
          );
        } else {
          updateLatestLogStatus('failed');
        }
      }
    } catch (e) {
      console.warn('Error processing webview message:', e);
    }
  }

  function appendLog(to: string, message: string, status: 'sent' | 'failed' | 'processing') {
    const newLog: LogItem = {
      id: Date.now().toString(),
      time: new Date().toTimeString().split(' ')[0],
      to,
      message,
      status,
      simSlot: 1,
    };
    setLogs((prev) => [newLog, ...prev]);
  }

  function updateLatestLogStatus(status: 'sent' | 'failed') {
    setLogs((prev) => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      copy[0] = { ...copy[0], status };
      return copy;
    });
  }

  async function handleSendTestSms() {
    if (!testRecipient.trim() || !testMessage.trim()) {
      Alert.alert('ভুল তথ্য', 'প্রাপকের নম্বর এবং বার্তা দিন।');
      return;
    }

    setIsSendingTest(true);
    appendLog(testRecipient, testMessage, 'processing');

    try {
      const res = await SmsGateway.sendSms(testRecipient, testMessage);
      if (res.success) {
        setDailySent((prev) => prev + 1);
        updateLatestLogStatus('sent');
        Alert.alert(
          'সফল',
          `SIM 1 (${res.carrier || 'Primary SIM'}) দিয়ে SMS সফলভাবে পাঠানো হয়েছে!`
        );
      } else {
        updateLatestLogStatus('failed');
        Alert.alert('ব্যর্থ', 'SMS পাঠানো সম্ভব হয়নি।');
      }
    } catch (err: any) {
      updateLatestLogStatus('failed');
      Alert.alert('ত্রুটি', err.message || 'অপ্রত্যাশিত ত্রুটি ঘটেছে।');
    } finally {
      setIsSendingTest(false);
    }
  }

  // Identify SIM 1
  const sim1 = simCards.find((s) => s.isFirstSim) || simCards[0];
  const sim2 = simCards.find((s) => !s.isFirstSim && s.slotIndex === 1);

  // Injected JS to notify website about native Android gateway presence
  const injectedJavascript = `
    (function() {
      window.__IS_COACHFLOW_ANDROID_APP__ = true;
      window.__ANDROID_GATEWAY_SIM1__ = {
        carrier: '${sim1?.carrierName || 'Grameenphone'}',
        connected: true,
        slot: 1
      };
      console.log('CoachFlow Native Android Gateway Connected (SIM 1 Active)');
    })();
    true;
  `;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />

      {/* Top App Header & Quick Status */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appTitle}>CoachFlow</Text>
          <Text style={styles.appSubtitle}>Android Gateway & Admin</Text>
        </View>

        <View style={styles.statusPill}>
          <View style={[styles.statusDot, serverRunning ? styles.dotGreen : styles.dotRed]} />
          <Text style={styles.statusText}>
            SIM 1: {sim1 ? sim1.carrierName.split(' ')[0] : 'Online'}
          </Text>
          <Text style={styles.batteryText}>⚡ {battery.level}%</Text>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'webview' && styles.tabButtonActive]}
          onPress={() => setActiveTab('webview')}
        >
          <Text style={[styles.tabText, activeTab === 'webview' && styles.tabTextActive]}>
            🌐 Web Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'gateway' && styles.tabButtonActive]}
          onPress={() => setActiveTab('gateway')}
        >
          <Text style={[styles.tabText, activeTab === 'gateway' && styles.tabTextActive]}>
            📡 SMS Gateway
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'api' && styles.tabButtonActive]}
          onPress={() => setActiveTab('api')}
        >
          <Text style={[styles.tabText, activeTab === 'api' && styles.tabTextActive]}>
            ⚡ REST API
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: WEBVIEW DASHBOARD */}
      {activeTab === 'webview' && (
        <View style={styles.contentFlex}>
          {/* WebView Navigation Controls */}
          <View style={styles.webNavControls}>
            <View style={styles.webNavButtons}>
              <TouchableOpacity
                style={[styles.navIconBtn, !canGoBack && styles.btnDisabled]}
                disabled={!canGoBack}
                onPress={() => webViewRef.current?.goBack()}
              >
                <Text style={styles.navIconText}>◀</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navIconBtn, !canGoForward && styles.btnDisabled]}
                disabled={!canGoForward}
                onPress={() => webViewRef.current?.goForward()}
              >
                <Text style={styles.navIconText}>▶</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navIconBtn}
                onPress={() => webViewRef.current?.reload()}
              >
                <Text style={styles.navIconText}>🔄</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.webUrlText} numberOfLines={1}>
              {dashboardUrl}
            </Text>
          </View>

          {webLoading && (
            <View style={styles.loadingBar}>
              <ActivityIndicator size="small" color="#6366f1" />
            </View>
          )}

          <WebView
            ref={webViewRef}
            source={{ uri: dashboardUrl }}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            injectedJavaScript={injectedJavascript}
            onMessage={handleWebViewMessage}
            onNavigationStateChange={(navState) => {
              setCanGoBack(navState.canGoBack);
              setCanGoForward(navState.canGoForward);
            }}
            onLoadStart={() => setWebLoading(true)}
            onLoadEnd={() => setWebLoading(false)}
          />
        </View>
      )}

      {/* TAB 2: SMS GATEWAY NODE MONITOR */}
      {activeTab === 'gateway' && (
        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner}>
          {/* Dual SIM Status Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📱 Dual-SIM Telephony Status</Text>
            <Text style={styles.cardSubtitle}>
              Two SIMs detected on device. All platform SMS are routed via SIM 1.
            </Text>

            {/* SIM 1 (Primary / Active Sender) */}
            <View style={[styles.simBox, styles.simBoxActive]}>
              <View style={styles.simBadgeRow}>
                <View style={styles.primaryTag}>
                  <Text style={styles.primaryTagText}>ACTIVE SENDER (SIM 1)</Text>
                </View>
                <Text style={styles.simSignal}>📶 4G LTE Online</Text>
              </View>
              <Text style={styles.simName}>{sim1?.carrierName || 'Grameenphone 4G'}</Text>
              <Text style={styles.simMeta}>
                Slot 0 • Subscription ID: {sim1?.subscriptionId || 1} • Auto-prioritized
              </Text>
            </View>

            {/* SIM 2 (Secondary / Standby) */}
            {sim2 && (
              <View style={[styles.simBox, styles.simBoxSecondary]}>
                <View style={styles.simBadgeRow}>
                  <View style={styles.standbyTag}>
                    <Text style={styles.standbyTagText}>STANDBY (SIM 2)</Text>
                  </View>
                  <Text style={styles.simSignal}>📶 Ready</Text>
                </View>
                <Text style={styles.simNameSecondary}>{sim2.carrierName}</Text>
                <Text style={styles.simMeta}>
                  Slot 1 • Not used (Preserved for personal calls)
                </Text>
              </View>
            )}
          </View>

          {/* Daily Quota Counter Card */}
          <View style={styles.card}>
            <View style={styles.quotaHeader}>
              <Text style={styles.cardTitle}>📊 Today's SMS Quota (SIM 1)</Text>
              <Text style={styles.quotaCount}>
                {dailySent} / {dailyLimit}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min((dailySent / dailyLimit) * 100, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.quotaFooter}>
              Anti-spam protection active. Recharges automatically at midnight.
            </Text>
          </View>

          {/* Quick Manual Test SMS Sender */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>✉️ Send Test SMS via SIM 1</Text>
            <Text style={styles.inputLabel}>Recipient Phone Number:</Text>
            <TextInput
              style={styles.input}
              value={testRecipient}
              onChangeText={setTestRecipient}
              placeholder="+880 1711-xxxxxx"
              placeholderTextColor="#64748b"
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Message Content (Unicode/Bangla):</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={testMessage}
              onChangeText={setTestMessage}
              placeholder="বার্তা লিখুন..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[styles.actionBtn, isSendingTest && styles.btnDisabled]}
              disabled={isSendingTest}
              onPress={handleSendTestSms}
            >
              {isSendingTest ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.actionBtnText}>SIM 1 দিয়ে SMS পাঠান</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Live Activity Log */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📋 Live Transmission Logs</Text>
            {logs.map((log) => (
              <View key={log.id} style={styles.logItem}>
                <View style={styles.logHeader}>
                  <Text style={styles.logPhone}>{log.to}</Text>
                  <Text
                    style={[
                      styles.logStatus,
                      log.status === 'sent'
                        ? styles.logStatusSuccess
                        : log.status === 'failed'
                        ? styles.logStatusFailed
                        : styles.logStatusProcessing,
                    ]}
                  >
                    {log.status.toUpperCase()} (SIM 1)
                  </Text>
                </View>
                <Text style={styles.logMessage}>{log.message}</Text>
                <Text style={styles.logTime}>{log.time}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* TAB 3: REST API SERVER CONFIG */}
      {activeTab === 'api' && (
        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🌐 Local HTTP Gateway REST API</Text>
            <Text style={styles.cardSubtitle}>
              Send SMS from your PC, netlify server, or external scripts by making HTTP requests to this phone!
            </Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Server Endpoint:</Text>
              <Text style={styles.infoValue}>http://{serverIp}:{serverPort}/api/sms/send</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Server Status:</Text>
              <Text style={[styles.infoValue, { color: '#10b981' }]}>
                ● Listening on port {serverPort}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Gateway API Key:</Text>
              <Text style={styles.infoMono}>{apiKey}</Text>
            </View>
          </View>

          {/* cURL Example */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💻 cURL / API Request Example</Text>
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>
                {`curl -X POST http://${serverIp}:${serverPort}/api/sms/send \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -d '{
    "to": "+8801711456789",
    "message": "সম্মানিত অভিভাবক, রেজাল্ট দেখুন।"
  }'`}
              </Text>
            </View>
          </View>

          {/* Instructions Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💡 How It Works</Text>
            <Text style={styles.bulletPoint}>
              1. Ensure this Android phone and your computer/server are on the same Wi-Fi network, or use a local port forwarder (like ngrok).
            </Text>
            <Text style={styles.bulletPoint}>
              2. When a request hits `/api/sms/send`, the native Android engine dispatches the SMS via SIM 1 with ৳0.00 internet SMS cost.
            </Text>
            <Text style={styles.bulletPoint}>
              3. You can check gateway status anytime via `GET http://${serverIp}:${serverPort}/api/sms/status`.
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  appSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotGreen: {
    backgroundColor: '#10b981',
  },
  dotRed: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '600',
  },
  batteryText: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#818cf8',
    fontWeight: 'bold',
  },
  contentFlex: {
    flex: 1,
  },
  webNavControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#020617',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    gap: 10,
  },
  webNavButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  navIconBtn: {
    padding: 6,
    backgroundColor: '#1e293b',
    borderRadius: 8,
  },
  navIconText: {
    color: '#ffffff',
    fontSize: 12,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  webUrlText: {
    flex: 1,
    color: '#94a3b8',
    fontSize: 11,
  },
  loadingBar: {
    paddingVertical: 4,
    backgroundColor: '#020617',
  },
  webview: {
    flex: 1,
    backgroundColor: '#020617',
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginBottom: 12,
  },
  simBox: {
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  simBoxActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  simBoxSecondary: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  simBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  primaryTag: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  primaryTagText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  standbyTag: {
    backgroundColor: '#475569',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  standbyTagText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  simSignal: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '600',
  },
  simName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  simNameSecondary: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
  },
  simMeta: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  quotaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quotaCount: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 13,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#1e293b',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  quotaFooter: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 6,
  },
  inputLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  actionBtn: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  logItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingVertical: 8,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  logPhone: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logStatus: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  logStatusSuccess: {
    color: '#10b981',
  },
  logStatusFailed: {
    color: '#ef4444',
  },
  logStatusProcessing: {
    color: '#f59e0b',
  },
  logMessage: {
    color: '#cbd5e1',
    fontSize: 11,
  },
  logTime: {
    color: '#64748b',
    fontSize: 9,
    marginTop: 2,
  },
  infoRow: {
    marginBottom: 8,
  },
  infoLabel: {
    color: '#94a3b8',
    fontSize: 11,
  },
  infoValue: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  infoMono: {
    color: '#38bdf8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    marginTop: 2,
  },
  codeBlock: {
    backgroundColor: '#020617',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  codeText: {
    color: '#a5f3fc',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
  bulletPoint: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6,
  },
});
