import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../services/apiClient';
import { getDeviceId } from '../services/deviceId';
const POLL_INTERVAL = 6000;   // check every 3 s
const POLL_TIMEOUT  = 60000;  // give up after 60 s

interface CarInfo {
  number: string;
  chassis_number: string;
  driver_name: string;
}

export default function CarScreen() {
  const [modalVisible, setModalVisible]   = useState(false);
  const [carNumber, setCarNumber]         = useState('');
  const [macAddress, setMacAddress]       = useState('');
  const [connecting, setConnecting]       = useState(false);
  const [carInfo, setCarInfo]             = useState<CarInfo | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load device ID once on mount — not editable by the user
  useEffect(() => {
    getDeviceId().then(setMacAddress);
  }, []);

  function stopPolling() {
    if (pollRef.current)   { clearInterval(pollRef.current);  pollRef.current   = null; }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  }

  async function handleConnect() {
    const trimmedCar = carNumber.trim();
    if (!trimmedCar) {
      Alert.alert('خطأ', 'الرجاء إدخال رقم السيارة');
      return;
    }

    try {
      setConnecting(true);

      // 1. Send connect request — mac_address is added automatically by apiClient interceptor
      await apiClient.post('/api/connect-to-car', { car_number: trimmedCar });

      // 2. Poll is-connect until true or timeout
      let resolved = false;

      timeoutRef.current = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          stopPolling();
          setConnecting(false);
          Alert.alert('انتهت المهلة', 'لم يتم الاتصال بالسيارة، حاول مرة أخرى.');
        }
      }, POLL_TIMEOUT);

      pollRef.current = setInterval(async () => {
        if (resolved) return;
        try {
          const res = await apiClient.get('/api/is-connect', {
            params: { car_number: trimmedCar },
            timeout: 10000,
          });
          const isConnected: boolean =
            res.data === true ||
            res.data?.connected === true ||
            res.data?.is_connect === true ||
            res.data?.status === true;

          if (isConnected) {
            resolved = true;
            stopPolling();

            // 3. Fetch car info — mac_address added automatically
            const infoRes = await apiClient.get('/api/car-info', {
              params: { car_number: trimmedCar },
              timeout: 10000,
            });
            setCarInfo(infoRes.data);
            setConnecting(false);
            setModalVisible(false);
          }
        } catch (err: any) {
          console.warn('[is-connect poll]', err?.message);
        }
      }, POLL_INTERVAL);
    } catch (err: any) {
      stopPolling();
      setConnecting(false);
      Alert.alert('فشل الاتصال', err?.response?.data?.message ?? err?.message ?? 'حدث خطأ غير متوقع');
    }
  }

  function handleDisconnect() {
    stopPolling();
    setCarInfo(null);
    setCarNumber('');
    // macAddress (device ID) is kept — it never changes
  }

  return (
    <LinearGradient colors={['#0d1b2a', '#0a3d62']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* ─── Connected state ─── */}
        {carInfo ? (
          <View style={styles.card}>
            <Text style={styles.greeting}>مرحبا {carInfo.driver_name} 👋</Text>

            <View style={styles.divider} />

            <InfoRow label="رقم السيارة"    value={carInfo.number} />
            <InfoRow label="رقم الهيكل"     value={carInfo.chassis_number} />
            <InfoRow label="اسم السائق"     value={carInfo.driver_name} />

            <TouchableOpacity style={styles.disconnectBtn} onPress={handleDisconnect}>
              <Text style={styles.disconnectText}>قطع الاتصال</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ─── Idle state ─── */
          <View style={styles.idleWrap}>
            <Text style={styles.idleIcon}>🚗</Text>
            <Text style={styles.idleTitle}>ربط السيارة</Text>
            <Text style={styles.idleSubtitle}>اضغط الزر للاتصال بسيارتك</Text>

            <TouchableOpacity
              style={styles.connectBtn}
              activeOpacity={0.82}
              onPress={() => setModalVisible(true)}
            >
              <LinearGradient
                colors={['#1a6ef0', '#38bdf8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.connectBtnGradient}
              >
                <Text style={styles.connectBtnText}>اتصال بالسيارة</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ─── Modal ─── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => { if (!connecting) setModalVisible(false); }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>بيانات السيارة</Text>

            <Text style={styles.fieldLabel}>رقم السيارة</Text>
            <TextInput
              style={styles.input}
              placeholder="أدخل رقم السيارة"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={carNumber}
              onChangeText={setCarNumber}
              editable={!connecting}
            />

            <Text style={styles.fieldLabel}>معرّف الجهاز (MAC)</Text>
            <View style={[styles.input, styles.inputReadOnly]}>
              <Text style={styles.readOnlyText} numberOfLines={1}>
                {macAddress || 'جارٍ التحميل…'}
              </Text>
            </View>

            {connecting ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#38bdf8" size="small" />
                <Text style={styles.loadingText}>جارٍ الاتصال بالسيارة…</Text>
              </View>
            ) : (
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelText}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.submitBtn]}
                  onPress={handleConnect}
                >
                  <Text style={styles.submitText}>اتصال</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </LinearGradient>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },

  /* Idle */
  idleWrap:     { alignItems: 'center', gap: 12 },
  idleIcon:     { fontSize: 64, marginBottom: 8 },
  idleTitle:    { color: '#fff', fontSize: 24, fontWeight: '800' },
  idleSubtitle: { color: 'rgba(255,255,255,0.55)', fontSize: 14, marginBottom: 16 },

  connectBtn: { width: '80%', borderRadius: 14, overflow: 'hidden' },
  connectBtnGradient: { paddingVertical: 16, alignItems: 'center', borderRadius: 14 },
  connectBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  /* Card */
  card: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  greeting: { color: '#38bdf8', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 16 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.10)', marginBottom: 16 },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  infoLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 14 },
  infoValue: { color: '#fff', fontSize: 15, fontWeight: '700', flexShrink: 1, textAlign: 'right' },

  disconnectBtn: {
    marginTop: 22,
    backgroundColor: 'rgba(239,68,68,0.18)',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
  },
  disconnectText: { color: '#f87171', fontSize: 15, fontWeight: '700' },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#0d2137',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 24 },
  fieldLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    marginBottom: 14,
    textAlign: 'right',
  },
  inputReadOnly: {
    opacity: 0.55,
    justifyContent: 'center',
  },
  readOnlyText: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'right',
    letterSpacing: 0.5,
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12 },
  loadingText: { color: '#38bdf8', fontSize: 14 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelBtn: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  cancelText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '600' },
  submitBtn: { backgroundColor: '#1a6ef0' },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
