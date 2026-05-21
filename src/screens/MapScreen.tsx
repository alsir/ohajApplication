import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
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
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.hint}>
          Start tracking on the Home tab to see your position here.
        </Text>
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
          title="Last known position"
          description={`Sent at ${record.sentAt}`}
        />
      </MapView>
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>
          {record.latitude.toFixed(5)}, {record.longitude.toFixed(5)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  hint: { marginTop: 16, textAlign: 'center', color: '#666' },
  overlay: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  overlayText: { color: '#fff', fontWeight: '600' },
});
