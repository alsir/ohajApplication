import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { onHistoryChange, getHistory, LocationRecord } from '../services/locationService';

function HistoryItem({ item, index }: { item: LocationRecord; index: number }) {
  const date = new Date(item.timestamp);
  return (
    <View style={styles.item}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>#{index + 1}</Text>
      </View>
      <View style={styles.details}>
        <Text style={styles.coords}>
          {item.latitude.toFixed(5)},  {item.longitude.toFixed(5)}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaChip}>🎯 {item.accuracy?.toFixed(0) ?? '–'} م</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaTime}>{date.toLocaleTimeString('ar')}</Text>
        </View>
        <Text style={styles.metaDate}>{date.toLocaleDateString('ar')}</Text>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const [records, setRecords] = useState<LocationRecord[]>(getHistory);

  useEffect(() => {
    const unsub = onHistoryChange(setRecords);
    return unsub;
  }, []);

  return (
    <LinearGradient colors={['#0d1b2a', '#1b3a6b']} style={styles.container}>
      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryCount}>{records.length}</Text>
        <Text style={styles.summaryLabel}>سجل المواقع المرسلة</Text>
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <HistoryItem item={item} index={index} />}
        contentContainerStyle={records.length === 0 ? styles.empty : styles.list}
        ListEmptyComponent={
          <View style={styles.emptyInner}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>لا توجد سجلات بعد</Text>
            <Text style={styles.emptyBody}>ابدأ رحلة من الصفحة الرئيسية لرؤية الموقع هنا.</Text>
          </View>
        }
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.10)',
  },
  summaryCount: { fontSize: 26, fontWeight: '800', color: '#38bdf8' },
  summaryLabel: { fontSize: 14, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 },
  item: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    marginBottom: 10,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    alignItems: 'center',
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(56,189,248,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontWeight: '800', color: '#38bdf8', fontSize: 13 },
  details: { flex: 1 },
  coords: { fontWeight: '700', fontSize: 13, color: '#fff', textAlign: 'right', marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'flex-end' },
  metaChip: { fontSize: 12, color: 'rgba(255,255,255,0.50)' },
  metaDot: { color: 'rgba(255,255,255,0.25)', fontSize: 12 },
  metaTime: { fontSize: 12, color: 'rgba(255,255,255,0.50)' },
  metaDate: { fontSize: 11, color: 'rgba(255,255,255,0.30)', textAlign: 'right', marginTop: 2 },
  empty: { flex: 1 },
  emptyInner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  emptyBody: { color: 'rgba(255,255,255,0.40)', fontSize: 13, textAlign: 'center', paddingHorizontal: 32 },
});
