import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'ohaj_device_id';

let cachedId: string | null = null;

/**
 * Returns a stable, unique device identifier.
 * - Android: uses AndroidId (survives reinstalls, resets on factory reset)
 * - iOS: uses identifierForVendor (resets on full app removal)
 * - Fallback: generates and persists a random UUID in SecureStore
 * The value is read once and cached in memory for the app's lifetime.
 */
export async function getDeviceId(): Promise<string> {
  if (cachedId) return cachedId;

  // Return cached value from SecureStore if already generated before
  try {
    const stored = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (stored) {
      cachedId = stored;
      return cachedId;
    }
  } catch {}

  let id: string | null = null;

  try {
    if (Platform.OS === 'android') {
      id = Application.getAndroidId();
    } else if (Platform.OS === 'ios') {
      id = await Application.getIosIdForVendorAsync();
    }
  } catch {}

  if (!id) {
    // Fallback: generate a UUID-like string
    id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  cachedId = id;

  try {
    await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
  } catch {}

  return cachedId;
}
