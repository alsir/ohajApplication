import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  Easing,
} from 'react-native';
import OhajLogo from '../../assets/ohaj.svg';
import { LinearGradient } from 'expo-linear-gradient';
import {
  startTracking,
  stopTracking,
  isTracking,
  onStatusChange,
  loadPersistedHistory,
} from '../services/locationService';

export default function HomeScreen() {
  const [tracking, setTracking] = useState(false);
  const [activeCarNumber, setActiveCarNumber] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [carNumber, setCarNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pulse animation for the live dot
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.7, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    if (tracking) loop.start();
    else { loop.stop(); pulse.setValue(1); }
    return () => loop.stop();
  }, [tracking]);

  useEffect(() => {
    // Check if tracking was already running (e.g. after app restart)
    isTracking().then(setTracking);
    loadPersistedHistory();
    const unsub = onStatusChange(setTracking);
    return unsub;
  }, []);

  useEffect(() => {
    if (tracking) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [tracking]);

  const formatElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
  };

  const handleOpenModal = () => { setCarNumber(''); setModalVisible(true); };

  const handleStartJourney = async () => {
    if (!carNumber.trim()) { Alert.alert('خطأ', 'يرجى إدخال رقم السيارة'); return; }
    setLoading(true);
    try {
      const ok = await startTracking(carNumber.trim());
      if (!ok) {
        Alert.alert('خطأ', 'تعذّر الحصول على الموقع. تحقق من صلاحيات الموقع.');
      } else {
        setActiveCarNumber(carNumber.trim());
        setModalVisible(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEndJourney = () => {
    Alert.alert('إنهاء الرحلة', 'هل تريد إنهاء الرحلة وإيقاف إرسال الموقع؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'إنهاء', style: 'destructive', onPress: () => { stopTracking().then(() => setActiveCarNumber('')); } },
    ]);
  };

  return (
    <LinearGradient colors={['#0d1b2a', '#1b3a6b', '#1a6ef0']} style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.logoRing}>
          <OhajLogo width={52} height={52} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.appName}>مشروع أوهاج للنقل</Text>
          <Text style={styles.appSub}>نظام تتبع المركبات</Text>
        </View>
      </View>

      {/* ── Hero ── */}
      <View style={styles.hero}>
        <Text style={styles.truckEmoji}>🚚</Text>

        {tracking && (
          <View style={styles.trackingCard}>
            <View style={styles.liveRow}>
              <Animated.View style={[styles.pulseDot, { transform: [{ scale: pulse }] }]} />
              <Text style={styles.liveText}>بث مباشر</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.carLabel}>رقم المركبة</Text>
            <Text style={styles.carNumber}>{activeCarNumber}</Text>
            <View style={styles.timerBox}>
              <Text style={styles.timerValue}>{formatElapsed(elapsed)}</Text>
              <Text style={styles.timerUnit}>مدة الرحلة</Text>
            </View>
            <View style={styles.hintRow}>
              <Text style={styles.hintIcon}>📡</Text>
              <Text style={styles.hintText}>يُرسل الموقع كل 60 ثانية</Text>
            </View>
          </View>
        )}

        {!tracking && (
          <View style={styles.idleCard}>
            <Text style={styles.idleTitle}>مرحباً بك</Text>
            <Text style={styles.idleBody}>
              اضغط على «بدء الرحلة» لتفعيل إرسال الموقع الجغرافي تلقائياً كل دقيقة.
            </Text>
          </View>
        )}
      </View>

      {/* ── Action button ── */}
      {tracking ? (
        <TouchableOpacity onPress={handleEndJourney} activeOpacity={0.88} style={styles.btnWrap}>
          <LinearGradient colors={['#ef4444', '#b91c1c']} style={styles.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.btnText}>⏹  إنهاء الرحلة</Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={handleOpenModal} activeOpacity={0.88} style={styles.btnWrap}>
          <LinearGradient colors={['#38bdf8', '#1d4ed8']} style={styles.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.btnText}>▶  بدء الرحلة</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* ── Modal ── */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => !loading && setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>رقم المركبة</Text>
            <Text style={styles.sheetSubtitle}>سيتم إرفاق رقم المركبة مع كل إرسال موقع</Text>

            <TextInput
              style={styles.input}
              placeholder="أدخل رقم السيارة…"
              placeholderTextColor="#6b7a99"
              value={carNumber}
              onChangeText={setCarNumber}
              textAlign="right"
              autoCapitalize="characters"
              returnKeyType="send"
              onSubmitEditing={handleStartJourney}
              autoFocus
            />

            <TouchableOpacity onPress={handleStartJourney} disabled={loading} activeOpacity={0.88} style={styles.confirmWrap}>
              <LinearGradient colors={loading ? ['#93c5fd', '#93c5fd'] : ['#38bdf8', '#1d4ed8']} style={styles.confirmBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>بدء الرحلة</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)} disabled={loading}>
              <Text style={styles.cancelText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 58,
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 14,
  },
  logoRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  appName: { fontSize: 17, fontWeight: '800', color: '#fff', textAlign: 'right' },
  appSub: { fontSize: 12, color: 'rgba(255,255,255,0.50)', textAlign: 'right', marginTop: 3 },

  // Hero
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, gap: 28 },
  truckEmoji: {
    fontSize: 100,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 8 },
    textShadowRadius: 16,
  },

  // Tracking card
  trackingCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    paddingVertical: 22,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 6,
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e' },
  liveText: { color: '#4ade80', fontWeight: '700', fontSize: 12, letterSpacing: 1.5 },
  divider: { width: '85%', height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.18)', marginVertical: 10 },
  carLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  carNumber: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: 2, marginTop: 2 },
  timerBox: { alignItems: 'center', marginVertical: 8 },
  timerValue: { color: '#38bdf8', fontSize: 44, fontWeight: '800', letterSpacing: 5 },
  timerUnit: { color: 'rgba(255,255,255,0.40)', fontSize: 11, marginTop: 3 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  hintIcon: { fontSize: 13 },
  hintText: { color: 'rgba(255,255,255,0.40)', fontSize: 12 },

  // Idle card
  idleCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 28,
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 12,
  },
  idleTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  idleBody: { color: 'rgba(255,255,255,0.50)', fontSize: 13, textAlign: 'center', lineHeight: 22 },

  // Buttons
  btnWrap: { marginHorizontal: 24, marginBottom: 46, borderRadius: 16, overflow: 'hidden' },
  btn: {
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.8 },

  // Modal
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.60)' },
  sheet: {
    backgroundColor: '#0d1b2a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'center',
    marginBottom: 22,
  },
  sheetTitle: { fontSize: 22, fontWeight: '800', textAlign: 'right', color: '#fff', marginBottom: 6 },
  sheetSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.40)', textAlign: 'right', marginBottom: 26 },
  input: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 18,
    color: '#fff',
    textAlign: 'right',
  },
  confirmWrap: { borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  confirmBtn: { paddingVertical: 16, alignItems: 'center' },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  cancelBtn: { paddingVertical: 10, alignItems: 'center' },
  cancelText: { color: 'rgba(255,255,255,0.30)', fontSize: 15 },
});
