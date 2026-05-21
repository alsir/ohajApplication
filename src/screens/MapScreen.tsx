import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { onHistoryChange, getHistory, LocationRecord } from '../services/locationService';

const DEFAULT_DELTA = 0.01;

export default function MapScreen() {
  const [record, setRecord] = useState<LocationRecord | null>(
    () => getHistory()[0] ?? null,
  );

  useEffect(() => {
    const unsub = onHistoryChange((records) => setRecord(records[0] ?? null));
    return unsub;
  }, []);

  if (!record) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>🗺️</Text>
        <Text style={styles.emptyTitle}>لا يوجد موقع بعد</Text>
        <Text style={styles.hint}>ابدأ رحلة من الصفحة الرئيسية لعرض موقعك هنا.</Text>
      </View>
    );
  }

  const region: Region = {
    latitude: record.latitude,
    longitude: record.longitude,
    latitudeDelta: DEFAULT_DELTA,
    longitudeDelta: DEFAULT_DELTA,
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={region} showsUserLocation>
        <Marker
          coordinate={{ latitude: record.latitude, longitude: record.longitude }}
          title="الموقع الأخير"
          description={`أُرسل في ${record.sentAt}`}
        />
      </MapView>
      <View style={styles.overlay}>
        <Text style={styles.overlayLabel}>📍 الموقع الأخير</Text>
        <Text style={styles.overlayCoords}>
          {record.latitude.toFixed(5)},  {record.longitude.toFixed(5)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#0d1b2a',
    gap: 12,
  },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  hint: { textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 22 },
  overlay: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    backgroundColor: 'rgba(13,27,42,0.88)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    gap: 4,
  },
  overlayLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '600', letterSpacing: 0.8 },
  overlayCoords: { color: '#38bdf8', fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
});
