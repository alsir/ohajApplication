import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import { onHistoryChange, getHistory, LocationRecord } from '../services/locationService';

function HistoryItem({ item, index }: { item: LocationRecord; index: number }) {
  const date = new Date(item.timestamp);
  return (
    <View style={styles.item}>
      <Text style={styles.index}>#{index + 1}</Text>
      <View style={styles.details}>
        <Text style={styles.coords}>
          {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
        </Text>
        <Text style={styles.meta}>
          Accuracy: {item.accuracy?.toFixed(0) ?? '–'} m
        </Text>
        <Text style={styles.meta}>
          {date.toLocaleTimeString()} – {date.toLocaleDateString()}
        </Text>
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
    <View style={styles.container}>
      <Text style={styles.header}>
        {records.length === 0
          ? 'No records yet'
          : `${records.length} location${records.length === 1 ? '' : 's'} sent`}
      </Text>
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <HistoryItem item={item} index={index} />
        )}
        contentContainerStyle={records.length === 0 ? styles.empty : undefined}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Start tracking on the Home tab to see your location history here.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    padding: 16,
    fontSize: 15,
    fontWeight: '600',
    color: '#444',
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  item: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 10,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  index: { fontWeight: '700', color: '#2563eb', marginRight: 12, fontSize: 14 },
  details: { flex: 1 },
  coords: { fontWeight: '600', fontSize: 13 },
  meta: { fontSize: 12, color: '#666', marginTop: 2 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', color: '#aaa', paddingHorizontal: 32 },
});
