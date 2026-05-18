import { DispatchEvent } from './api';

export interface NotificationSettings {
  /** Global enable/disable */
  enabled: boolean;
  /** Selected event types – empty = all types */
  types: string[];
  /** Selected localities (substring match) – empty = all localities */
  localities: string[];
}

const STORAGE_KEY = 'hzs-notification-settings';

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  types: [],
  localities: [],
};

export const loadSettings = (): NotificationSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : false,
      types: Array.isArray(parsed.types) ? parsed.types : [],
      localities: Array.isArray(parsed.localities) ? parsed.localities : [],
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
};

function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const subscribeToWebPush = async (settings: NotificationSettings) => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  
  try {
    const reg = await navigator.serviceWorker.ready;
    if (!reg) return;

    // Fetch VAPID key
    const vapidRes = await fetch('/api/vapidPublicKey');
    if (!vapidRes.ok) return;
    const { publicKey } = await vapidRes.json();
    if (!publicKey) return;

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(publicKey)
      });
    }

    // Send sub to backend
    await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub, filters: settings })
    });
    console.log('Successfully subscribed to Web Push');
  } catch (err) {
    console.error('Failed to subscribe to Web Push:', err);
  }
};

export const saveSettings = (settings: NotificationSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    subscribeToWebPush(settings); // Update filters on backend
  } catch {
    // localStorage may be full or unavailable
  }
};

export const requestPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
};

export const sendNotification = async (_event: DispatchEvent): Promise<void> => {
  // Local polling notification is now disabled in favor of Push Notifications from backend.
  // We keep this function stubbed out so existing code doesn't break.
};
