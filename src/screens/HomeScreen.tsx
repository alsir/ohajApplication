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
} from 'react-native';
import OhajLogo from '../../assets/ohaj.svg';
import { LinearGradient } from 'expo-linear-gradient';
import {
  startTracking,
  stopTracking,
  isTracking,
  onStatusChange,
} from '../services/locationService';

export default function HomeScreen() {
  const [tracking, setTracking] = useState(isTracking());
  const [activeCarNumber, setActiveCarNumber] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [carNumber, setCarNumber] = useState('');
  const [loading, setLoading] = useState(false);

  // Elapsed seconds counter while tracking
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const unsub = onStatusChange(setTracking);
    return unsub;
  }, []);

  // Start / stop the elapsed counter when tracking changes
  useEffect(() => {
    if (tracking) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [tracking]);

  const formatElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
  };

  // Open modal to start journey
  const handleOpenModal = () => {
    setCarNumber('');
    setModalVisible(true);
  };

  // Confirm car number → start tracking
  const handleStartJourney = async () => {
    if (!carNumber.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال رقم السيارة');
      return;
    }
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

  // End journey
  const handleEndJourney = () => {
    Alert.alert('إنهاء الرحلة', 'هل تريد إنهاء الرحلة وإيقاف إرسال الموقع؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'إنهاء',
        style: 'destructive',
        onPress: () => {
          stopTracking();
          setActiveCarNumber('');
        },
      },
    ]);
  };

  return (
    <LinearGradient colors={['#e8f4fd', '#c8e6f9', '#a8d4f5']} style={styles.container}>
      {/* Logo */}
      <View style={styles.logoWrapper}>
        <OhajLogo width={72} height={72} />
        <Text style={styles.logoText}>مشروع أوهاج للنقل</Text>
      </View>

      {/* Truck illustration */}
      <View style={styles.truckWrapper}>
        <Text style={styles.truckEmoji}>🚚</Text>

        {/* Active tracking info */}
        {tracking && (
          <View style={styles.trackingCard}>
            <View style={styles.trackingDot} />
            <Text style={styles.trackingLabel}>جارٍ إرسال الموقع</Text>
            <Text style={styles.trackingCar}>رقم السيارة: {activeCarNumber}</Text>
            <Text style={styles.trackingTimer}>{formatElapsed(elapsed)}</Text>
            <Text style={styles.trackingHint}>يُرسل الموقع كل دقيقة</Text>
          </View>
        )}
      </View>

      {/* Main action button */}
      {tracking ? (
        <TouchableOpacity style={styles.btnEnd} onPress={handleEndJourney} activeOpacity={0.85}>
          <Text style={styles.btnText}>إنهاء الرحلة</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.btnStart} onPress={handleOpenModal} activeOpacity={0.85}>
          <Text style={styles.btnText}>بدء الرحلة</Text>
        </TouchableOpacity>
      )}

      {/* ─── Car number modal ─── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !loading && setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.overlay}
        >
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>إدخال رقم السيارة</Text>
            <Text style={styles.sheetSubtitle}>
              سيتم إرسال رقم السيارة مع الموقع كل دقيقة
            </Text>

            <TextInput
              style={styles.input}
              placeholder="رقم السيارة"
              placeholderTextColor="#aaa"
              value={carNumber}
              onChangeText={setCarNumber}
              textAlign="right"
              autoCapitalize="characters"
              returnKeyType="send"
              onSubmitEditing={handleStartJourney}
              autoFocus
            />

            <TouchableOpacity
              style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
              onPress={handleStartJourney}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmBtnText}>بدء الرحلة</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setModalVisible(false)}
              disabled={loading}
            >
              <Text style={styles.cancelBtnText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 60 },

  // Logo
  logoWrapper: { alignItems: 'center', gap: 8 },
  logo: { width: 72, height: 72 },
  logoText: { fontSize: 16, fontWeight: '700', color: '#c0062a', letterSpacing: 0.5 },

  // Truck
  truckWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
  truckEmoji: { fontSize: 110 },

  // Tracking info card
  trackingCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 28,
    gap: 4,
  },
  trackingDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#22c55e',
    marginBottom: 4,
  },
  trackingLabel: { fontSize: 13, color: '#166534', fontWeight: '600' },
  trackingCar: { fontSize: 15, fontWeight: '700', color: '#1e3a5f' },
  trackingTimer: { fontSize: 26, fontWeight: '800', color: '#1a6ef0', letterSpacing: 2 },
  trackingHint: { fontSize: 11, color: '#888' },

  // Buttons
  btnStart: {
    width: '80%',
    backgroundColor: '#1a6ef0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#1a6ef0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  btnEnd: {
    width: '80%',
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  // Modal overlay
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  sheetTitle: { fontSize: 20, fontWeight: '700', textAlign: 'right', marginBottom: 6 },
  sheetSubtitle: { fontSize: 13, color: '#777', textAlign: 'right', marginBottom: 20 },
  input: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    color: '#111',
    textAlign: 'right',
  },
  confirmBtn: {
    backgroundColor: '#1a6ef0',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmBtnDisabled: { backgroundColor: '#90b8f8' },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { paddingVertical: 10, alignItems: 'center' },
  cancelBtnText: { color: '#999', fontSize: 15 },
});
