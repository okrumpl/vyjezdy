import webpush from 'web-push';
import { getDb } from './db.js';

export function initPush() {
  const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
  const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
  const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@hzs-dashboard.local';

  if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    console.log('Web Push VAPID keys configured.');
  }
}

export async function sendPushNotification(dispatch: any) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn('VAPID keys not set, cannot send push notifications.');
    return;
  }

  const db = getDb();
  const subs = await db.all('SELECT * FROM subscriptions');
  
  if (subs.length === 0) return;

  const payload = JSON.stringify({
    title: `🚒 Nový výjezd: ${dispatch.type}`,
    body: `📍 ${dispatch.location}`,
    url: '/',
    id: dispatch.id
  });

  const promises = subs.map(async (sub: any) => {
    // Check filters
    try {
      const filters = JSON.parse(sub.filters);
      let match = false;
      
      if (!filters.enabled) return; // User disabled push temporarily

      const typeMatch = filters.types.length === 0 || filters.types.includes(dispatch.type);
      
      let locMatch = true;
      if (filters.localities.length > 0) {
        const dLoc = dispatch.location.toLowerCase();
        locMatch = filters.localities.some((l: string) => dLoc.includes(l.toLowerCase()));
      }

      match = typeMatch && locMatch;

      if (!match) return;

      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      await webpush.sendNotification(pushSubscription, payload);
    } catch (err: any) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        console.log('Subscription expired or deleted, removing from DB', sub.endpoint);
        await db.run('DELETE FROM subscriptions WHERE endpoint = ?', sub.endpoint);
      } else {
        console.error('Push notification failed:', err);
      }
    }
  });

  await Promise.allSettled(promises);
}
