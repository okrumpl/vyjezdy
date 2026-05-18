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

export const saveSettings = (settings: NotificationSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage may be full or unavailable
  }
};

/**
 * Determines whether a given dispatch event matches the user's notification filters.
 * - If `types` is non-empty, the event type must be in the list.
 * - If `localities` is non-empty, at least one locality must be a case-insensitive
 *   substring of the event's location.
 */
export const shouldNotify = (
  event: DispatchEvent,
  settings: NotificationSettings
): boolean => {
  if (!settings.enabled) return false;

  // Type filter
  if (settings.types.length > 0) {
    if (!settings.types.includes(event.type)) return false;
  }

  // Locality filter (contains match)
  if (settings.localities.length > 0) {
    const loc = event.location.toLowerCase();
    const matches = settings.localities.some(l => loc.includes(l.toLowerCase()));
    if (!matches) return false;
  }

  return true;
};

/**
 * Request notification permission from the browser. Returns true if granted.
 */
export const requestPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
};

/**
 * Send a local notification for a dispatch event.
 * Uses Service Worker if available (required for iOS PWAs).
 */
export const sendNotification = async (event: DispatchEvent): Promise<void> => {
  if (Notification.permission !== 'granted') return;
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(`🚒 ${event.type}`, {
          body: `📍 ${event.location}`,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: `hzs-${event.id}`,
          vibrate: [200, 100, 200]
        } as any);
        return;
      }
    }
    
    // Fallback for browsers without SW support
    new Notification(`🚒 ${event.type}`, {
      body: `📍 ${event.location}`,
      icon: '/icon-192.png',
      tag: `hzs-${event.id}`,
    });
  } catch (e) {
    console.error('Notification failed:', e);
  }
};
