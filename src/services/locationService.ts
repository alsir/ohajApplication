import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const SERVER_ENDPOINT = 'https://ohaj.alsirhamory.com/api/car-location';
const LOCATION_TASK   = 'ohaj-bg-location';
const CAR_KEY         = 'ohaj_car';
const HISTORY_KEY     = 'ohaj_history';
const SEND_INTERVAL   = 60_000;

export interface LocationRecord {
  id: string;
  carNumber: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
  sentAt: string;
}

const historyListeners: Array<(records: LocationRecord[]) => void> = [];
const statusListeners:  Array<(running: boolean) => void>          = [];
let locationHistory: LocationRecord[] = [];

function notifyHistory() { historyListeners.forEach(cb => cb([...locationHistory])); }
function notifyStatus(r: boolean) { statusListeners.forEach(cb => cb(r)); }

// Background task — must be defined at module level before the app renders
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error) { console.warn('[bg-task]', (error as any).message); return; }
  const loc = (data as any)?.locations?.[0] as Location.LocationObject | undefined;
  if (!loc) return;

  const carNumber = await SecureStore.getItemAsync(CAR_KEY).catch(() => null);
  if (!carNumber) return;

  const record: LocationRecord = {
    id:        `${Date.now()}`,
    carNumber,
    latitude:  loc.coords.latitude,
    longitude: loc.coords.longitude,
    accuracy:  loc.coords.accuracy,
    timestamp: loc.timestamp,
    sentAt:    new Date().toISOString(),
  };

  try {
    await axios.post(SERVER_ENDPOINT, {
      carNumber: record.carNumber,
      latitude:  record.latitude,
      longitude: record.longitude,
    });
  } catch (err: any) {
    console.warn('[bg-task] POST error', err?.message);
  }

  try {
    const raw = await SecureStore.getItemAsync(HISTORY_KEY);
    const hist: LocationRecord[] = raw ? JSON.parse(raw) : [];
    const updated = [record, ...hist].slice(0, 50);
    await SecureStore.setItemAsync(HISTORY_KEY, JSON.stringify(updated));
    locationHistory = updated;
    notifyHistory();
  } catch {}
});

export async function requestPermissions(): Promise<boolean> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') return false;
  const bg = await Location.requestBackgroundPermissionsAsync();
  return bg.status === 'granted';
}

export async function startTracking(carNumber: string): Promise<boolean> {
  const granted = await requestPermissions();
  if (!granted) return false;

  await SecureStore.setItemAsync(CAR_KEY, carNumber);

  try {
    const raw = await SecureStore.getItemAsync(HISTORY_KEY);
    if (raw) locationHistory = JSON.parse(raw);
  } catch {}

  const alreadyRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
  if (!alreadyRunning) {
    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy:                         Location.Accuracy.Balanced,
      timeInterval:                     SEND_INTERVAL,
      distanceInterval:                 0,
      pausesUpdatesAutomatically:       false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: '\u0623\u0648\u0647\u0627\u062c - \u062a\u062a\u0628\u0639 \u0627\u0644\u0645\u0631\u0643\u0628\u0629',
        notificationBody:  '\u064a\u064f\u0631\u0633\u0644 \u0627\u0644\u0645\u0648\u0642\u0639 \u0643\u0644 \u062f\u0642\u064a\u0642\u0629',
        notificationColor: '#1a6ef0',
      },
    });
  }

  notifyStatus(true);
  return true;
}

export async function stopTracking(): Promise<void> {
  const running = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
  if (running) await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  await SecureStore.deleteItemAsync(CAR_KEY).catch(() => {});
  notifyStatus(false);
}

export async function isTracking(): Promise<boolean> {
  return Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
}

export function getHistory(): LocationRecord[] {
  return [...locationHistory];
}

export async function loadPersistedHistory(): Promise<void> {
  try {
    const raw = await SecureStore.getItemAsync(HISTORY_KEY);
    if (raw) { locationHistory = JSON.parse(raw); notifyHistory(); }
  } catch {}
}

export function onHistoryChange(cb: (records: LocationRecord[]) => void): () => void {
  historyListeners.push(cb);
  return () => { const i = historyListeners.indexOf(cb); if (i !== -1) historyListeners.splice(i, 1); };
}

export function onStatusChange(cb: (running: boolean) => void): () => void {
  statusListeners.push(cb);
  return () => { const i = statusListeners.indexOf(cb); if (i !== -1) statusListeners.splice(i, 1); };
}
