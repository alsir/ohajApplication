import * as Location from 'expo-location';
import axios from 'axios';

// ────────────────────────────────────────────────────────────────────────────
// Configuration
// ────────────────────────────────────────────────────────────────────────────
const SERVER_ENDPOINT = 'https://ohaj.alsirhamory.com/api/car-location';
const SEND_INTERVAL_MS = 60_000; // 1 minute

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────
export interface LocationRecord {
  id: string;
  carNumber: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
  sentAt: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Module-level state
// ────────────────────────────────────────────────────────────────────────────
let intervalId: ReturnType<typeof setInterval> | null = null;
let activeCarNumber = '';
const historyListeners: Array<(records: LocationRecord[]) => void> = [];
const statusListeners: Array<(running: boolean) => void> = [];
let locationHistory: LocationRecord[] = [];

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────
function notifyHistory() {
  historyListeners.forEach((cb) => cb([...locationHistory]));
}

function notifyStatus(running: boolean) {
  statusListeners.forEach((cb) => cb(running));
}

async function fetchAndSend(carNumber: string): Promise<LocationRecord | null> {
  try {
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const record: LocationRecord = {
      id: `${Date.now()}`,
      carNumber,
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      accuracy: loc.coords.accuracy,
      timestamp: loc.timestamp,
      sentAt: new Date().toISOString(),
    };

    axios
      .post(SERVER_ENDPOINT, {
        carNumber: record.carNumber,
        latitude: record.latitude,
        longitude: record.longitude,
      })
      .catch((err) => console.warn('[locationService] POST error', err?.message));

    locationHistory = [record, ...locationHistory].slice(0, 50);
    notifyHistory();
    return record;
  } catch (err) {
    console.warn('[locationService] fetchAndSend error', err);
    return null;
  }
}

/** Send location once with the given carNumber (triggered from modal). */
export async function sendLocationOnce(
  carNumber: string,
): Promise<LocationRecord | null> {
  const granted = await requestPermissions();
  if (!granted) return null;
  return fetchAndSend(carNumber);
}

// ────────────────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────────────────
export async function requestPermissions(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function startTracking(carNumber: string): Promise<boolean> {
  if (intervalId !== null) stopTracking();

  const granted = await requestPermissions();
  if (!granted) return false;

  activeCarNumber = carNumber;
  await fetchAndSend(carNumber);
  intervalId = setInterval(() => fetchAndSend(activeCarNumber), SEND_INTERVAL_MS);
  notifyStatus(true);
  return true;
}

export function stopTracking() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  notifyStatus(false);
}

export function isTracking(): boolean {
  return intervalId !== null;
}

export function getHistory(): LocationRecord[] {
  return [...locationHistory];
}

export function onHistoryChange(
  cb: (records: LocationRecord[]) => void,
): () => void {
  historyListeners.push(cb);
  return () => {
    const idx = historyListeners.indexOf(cb);
    if (idx !== -1) historyListeners.splice(idx, 1);
  };
}

export function onStatusChange(cb: (running: boolean) => void): () => void {
  statusListeners.push(cb);
  return () => {
    const idx = statusListeners.indexOf(cb);
    if (idx !== -1) statusListeners.splice(idx, 1);
  };
}
